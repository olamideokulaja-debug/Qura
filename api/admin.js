import { createClient } from "@supabase/supabase-js";
import { categorise, orgTypeOf, initialsOf } from "./_categorise.js";

export default async function handler(req, res) {
  const sbUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const owners = (process.env.OWNER_EMAILS || process.env.VITE_OWNER_EMAILS || "")
    .split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);

  if (!sbUrl || !service) return res.status(500).json({ error: "Admin not configured: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY." });

  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ error: "Not signed in." });

  const admin = createClient(sbUrl, service);
  const { data: who, error: whoErr } = await admin.auth.getUser(token);
  const caller = who && who.user;
  if (whoErr || !caller) return res.status(401).json({ error: "Invalid session." });

  const email = (caller.email || "").toLowerCase();
  const isOwner = owners.length === 0 || owners.includes(email);
  if (!isOwner) return res.status(403).json({ error: "Not authorised. Set VITE_OWNER_EMAILS to your email to grant admin access." });

  const kvRead = async (owner, key) => {
    const { data } = await admin.from("kv").select("value").eq("owner", owner).eq("key", key).maybeSingle();
    if (!data) return null;
    try { return JSON.parse(data.value); } catch { return data.value; }
  };
  const kvWrite = (owner, key, value) =>
    admin.from("kv").upsert({ owner, key, value: JSON.stringify(value) }, { onConflict: "owner,key" });

  try {
    if (req.method === "POST") {
      const { action } = req.body || {};

      // ---- introduction queue: the register check lives here now, not in email ----
      if (action === "intro-update") {
        const { introId, status } = req.body || {};
        if (!introId || !["verified", "completed", "declined"].includes(status)) {
          return res.status(400).json({ error: "introId and a valid status are required." });
        }
        const queue = (await kvRead("shared", "intro_queue")) || [];
        const item = (Array.isArray(queue) ? queue : []).find((q) => q.id === introId);
        if (!item) return res.status(404).json({ error: "Introduction not found." });
        item.status = status;
        item.updatedAt = new Date().toISOString();
        item.updatedBy = email;
        await kvWrite("shared", "intro_queue", queue);
        return res.status(200).json({ ok: true, item });
      }

      // ---- early access: approve or deny a request from the landing page ----
      // Approving is four steps in order: create the account, generate a
      // set-password link, email it, then write the role they chose. If the
      // email fails we still return the link so nothing is stranded.
      if (action === "waitlist-approve" || action === "waitlist-deny") {
        const addr = String((req.body || {}).email || "").trim().toLowerCase();
        if (!addr) return res.status(400).json({ error: "An email address is required." });

        const list = (await kvRead("shared", "qura_waitlist_v2")) || [];
        const queue = Array.isArray(list) ? list : [];
        const entry = queue.find((e) => e && e.email === addr);
        if (!entry) return res.status(404).json({ error: "That request is not in the queue." });
        if (entry.status && entry.status !== "pending") {
          return res.status(409).json({ error: "That request was already " + entry.status + "." });
        }

        if (action === "waitlist-deny") {
          entry.status = "denied";
          entry.decidedAt = new Date().toISOString();
          entry.decidedBy = email;
          await kvWrite("shared", "qura_waitlist_v2", queue);
          return res.status(200).json({ ok: true, status: "denied" });
        }

        const role = entry.role === "supplier" ? "supplier" : "clinician";
        const site = "https://www.qurahealth.org";

        // 1. the account. If it already exists, carry on and reset instead.
        let userId = null;
        const made = await admin.auth.admin.createUser({ email: addr, email_confirm: true });
        if (made && made.data && made.data.user) userId = made.data.user.id;
        if (!userId) {
          const { data: found } = await admin.auth.admin.listUsers();
          const hit = ((found && found.users) || []).find((u) => (u.email || "").toLowerCase() === addr);
          if (hit) userId = hit.id;
        }
        if (!userId) return res.status(500).json({ error: "Could not create or find that account." });

        // 2. the link. recovery works for a user that already exists, which
        //    invite does not, so it is the safer of the two here.
        const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
          type: "recovery",
          email: addr,
          options: { redirectTo: site + "/reset-password.html" },
        });
        if (linkErr) return res.status(500).json({ error: "Could not generate the link: " + linkErr.message });
        const actionLink = link && link.properties && link.properties.action_link;

        // 3. the role, before the email, so the account is never live without one
        await kvWrite(userId, "qura_role", role);

        // 4. the email. No qura_plan row is written: absence of one is the free plan.
        let emailed = false, mailError = "";
        try {
          const key = process.env.RESEND_API_KEY;
          const from = process.env.MAIL_FROM || "noreply@qurahealth.org";
          if (key && actionLink) {
            const r = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: { authorization: "Bearer " + key, "content-type": "application/json" },
              body: JSON.stringify({
                from: "Qura <" + from + ">",
                to: [addr],
                subject: "Your Qura early access is approved",
                html:
                  '<div style="font-family:Inter,Arial,sans-serif;color:#0A1730;line-height:1.6">' +
                  "<p>Your request for early access to Qura has been approved.</p>" +
                  "<p>Set your password and sign in as a " + role + ":</p>" +
                  '<p><a href="' + actionLink + '" style="background:#00C2B8;color:#04231F;font-weight:700;padding:12px 22px;border-radius:999px;text-decoration:none;display:inline-block">Set your password</a></p>' +
                  "<p style=\"font-size:13px;color:#5A6783\">If the button does not work, paste this into your browser:<br>" + actionLink + "</p>" +
                  "</div>",
              }),
            });
            emailed = r.ok;
            if (!r.ok) mailError = "Resend returned " + r.status;
          } else {
            mailError = key ? "No link was generated." : "RESEND_API_KEY is not set.";
          }
        } catch (e) { mailError = String(e.message || e); }

        entry.status = "approved";
        entry.decidedAt = new Date().toISOString();
        entry.decidedBy = email;
        entry.userId = userId;
        entry.emailed = emailed;
        await kvWrite("shared", "qura_waitlist_v2", queue);

        return res.status(200).json({ ok: true, status: "approved", role, userId, emailed, mailError, link: emailed ? undefined : actionLink });
      }

      // ---- add a contact, categorised automatically from the job title ----
      // Added contacts live in storage, not in the register file, so growing
      // the directory no longer needs a deploy. The reading endpoint merges
      // the two.
      if (action === "contact-add") {
        const { name, org, role, email, phone } = req.body || {};
        if (!name || !String(name).trim()) return res.status(400).json({ error: "A name is required." });
        if (!org || !String(org).trim()) return res.status(400).json({ error: "An organisation is required, or the contact cannot be categorised or filtered." });
        const clean = (v, n) => String(v || "").replace(/\s+/g, " ").trim().slice(0, n);
        const nm = clean(name, 60), og = clean(org, 120), rl = clean(role, 120) || "Decision Maker";
        const em = clean(email, 120).toLowerCase();
        if (em && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) return res.status(400).json({ error: "That email address does not look right." });

        const added = (await kvRead("shared", "contact_additions")) || [];
        const list = Array.isArray(added) ? added : [];
        if (list.some((c) => c.name.toLowerCase() === nm.toLowerCase() && c.org.toLowerCase() === og.toLowerCase())) {
          return res.status(409).json({ error: "That person is already in the directory at that organisation." });
        }
        const cat = categorise(rl, og);
        const rec = {
          name: nm, org: og, role: rl, email: em, phone: clean(phone, 40),
          spec: cat.category, group: cat.group, orgType: orgTypeOf(og),
          initials: initialsOf(nm), addedAt: new Date().toISOString().slice(0, 10),
          addedBy: email,
        };
        await kvWrite("shared", "contact_additions", [rec, ...list]);
        return res.status(200).json({ ok: true, contact: rec, reason: cat.reason });
      }

      // ---- directory removals, with the log that makes them stick ----
      // A removal without a log is undone by the next import. The log is the
      // record that keeps a removed person removed, and the audit trail if
      // anyone ever asks.
      if (action === "contact-remove") {
        const { name, org, reason } = req.body || {};
        if (!name) return res.status(400).json({ error: "name is required." });
        const log = (await kvRead("shared", "contact_removals")) || [];
        log.unshift({ name, org: org || "", reason: reason || "founder removal", at: new Date().toISOString(), by: email });
        await kvWrite("shared", "contact_removals", log);
        return res.status(200).json({ ok: true, removed: name, logSize: log.length });
      }

      // ---- original role override ----
      const { userId, role } = req.body || {};
      if (!userId || !role) return res.status(400).json({ error: "userId and role are required." });
      await admin.from("kv").upsert({ owner: userId, key: "qura_role", value: JSON.stringify(role) }, { onConflict: "owner,key" });
      return res.status(200).json({ ok: true });
    }

    if (req.query && req.query.view === "intros") {
      const queue = (await kvRead("shared", "intro_queue")) || [];
      return res.status(200).json({ queue: Array.isArray(queue) ? queue : [] });
    }
    if (req.query && req.query.view === "waitlist") {
      const list = (await kvRead("shared", "qura_waitlist_v2")) || [];
      const rows = Array.isArray(list) ? list : [];
      const order = { pending: 0, approved: 1, denied: 2 };
      rows.sort((a, b) => (order[a.status] ?? 0) - (order[b.status] ?? 0) || String(b.ts || "").localeCompare(String(a.ts || "")));
      return res.status(200).json({ waitlist: rows });
    }
    if (req.query && req.query.view === "removals") {
      const log = (await kvRead("shared", "contact_removals")) || [];
      return res.status(200).json({ removals: Array.isArray(log) ? log : [] });
    }
    const { data: list, error } = await admin.auth.admin.listUsers();
    if (error) return res.status(500).json({ error: error.message });
    const users = (list && list.users) || [];
    const ids = users.map((u) => u.id);
    const roles = {};
    if (ids.length) {
      const { data: kv } = await admin.from("kv").select("owner,value").eq("key", "qura_role").in("owner", ids);
      (kv || []).forEach((r) => { try { roles[r.owner] = JSON.parse(r.value); } catch { roles[r.owner] = r.value; } });
    }
    return res.status(200).json({ users: users.map((u) => ({ id: u.id, email: u.email, created_at: u.created_at, role: roles[u.id] || null })) });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
