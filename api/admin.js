import { createClient } from "@supabase/supabase-js";
import { categorise, orgTypeOf, initialsOf } from "./_categorise.js";
import { getQueue, approve, deny } from "./_waitlist.js";
import { kvListByKey } from "./_auth.js";

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

      // ---- early access: approve or deny (same logic as the email links) ----
      if (action === "waitlist-approve" || action === "waitlist-deny") {
        const addr = String((req.body || {}).email || "").trim().toLowerCase();
        if (!addr) return res.status(400).json({ error: "An email address is required." });
        const queue = await getQueue(admin);
        const entry = queue.find((e) => e && e.email === addr);
        if (!entry) return res.status(404).json({ error: "That request is not in the queue." });
        if (entry.status && entry.status !== "pending") {
          return res.status(409).json({ error: "That request was already " + entry.status + "." });
        }
        const out = action === "waitlist-approve" ? await approve(admin, entry, email) : deny(entry, email);
        if (!out.ok) return res.status(500).json({ error: out.error });
        await kvWrite("shared", "qura_waitlist_v2", queue);
        return res.status(200).json(out);
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

      // ---- clinician verification: the register check, done once, per person ----
      // Previously the only "Mark verified" in the product sat on an introduction
      // request, so a clinician nobody had asked for could never be verified at
      // all, and the profile record was never touched either way.
      if (action === "clinician-verify" || action === "clinician-unverify") {
        const { owner } = req.body || {};
        if (!owner) return res.status(400).json({ error: "owner is required." });
        const profile = await kvRead(owner, "clinician_profile");
        if (!profile) return res.status(404).json({ error: "No clinician profile for that account." });

        if (action === "clinician-verify") {
          const req7 = ["category", "profession", "regBody", "regNumber", "country", "experienceYears", "cvUploaded"];
          const missing = req7.filter((k) => { const v = profile[k]; return v === undefined || v === null || v === "" || v === false; });
          if (missing.length) return res.status(400).json({ error: "Profile is incomplete.", missing });
          profile.verifiedAt = new Date().toISOString();
          profile.verifiedBy = email;
        } else {
          // Kept as an explicit undo rather than a delete, because withdrawing a
          // verification is exactly the moment you want to know who did it.
          profile.verifiedAt = null;
          profile.verifiedBy = null;
          profile.unverifiedAt = new Date().toISOString();
          profile.unverifiedBy = email;
        }
        profile.updatedAt = new Date().toISOString();
        await kvWrite(owner, "clinician_profile", profile);
        return res.status(200).json({ ok: true, owner, verifiedAt: profile.verifiedAt || null });
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
      const rows = await getQueue(admin);
      const order = { pending: 0, approved: 1, denied: 2 };
      rows.sort((a, b) => (order[a.status] ?? 0) - (order[b.status] ?? 0) || String(b.ts || "").localeCompare(String(a.ts || "")));
      return res.status(200).json({ waitlist: rows });
    }
    if (req.query && req.query.view === "clinicians") {
      // Everyone who has started a clinician profile, with the details a founder
      // needs in front of them to open the right public register and check.
      const rows = await kvListByKey("clinician_profile");
      const REGISTER_URL = {
        NMC: "https://www.nmc.org.uk/registration/search-the-register/",
        HCPC: "https://www.hcpc-uk.org/check-the-register/",
        GMC: "https://www.gmc-uk.org/registration-and-licensing/the-medical-register",
        "GPhC / HCPC": "https://www.pharmacyregulation.org/registers",
      };
      const list = (rows || []).map(({ owner, value }) => {
        const p = value || {};
        const req7 = ["category", "profession", "regBody", "regNumber", "country", "experienceYears", "cvUploaded"];
        const missing = req7.filter((k) => { const v = p[k]; return v === undefined || v === null || v === "" || v === false; });
        return {
          owner,
          email: p.email || "",
          category: p.category || "", profession: p.profession || "",
          regBody: p.regBody || "", regNumber: p.regNumber || "",
          country: p.country || "", experienceYears: p.experienceYears || "",
          sector: p.sector || "",
          cvUploaded: p.cvUploaded || false,
          registeredAt: p.registeredAt || null,
          verifiedAt: p.verifiedAt || null, verifiedBy: p.verifiedBy || null,
          missing,
          registerUrl: REGISTER_URL[p.regBody] || "",
        };
      });
      // Anyone waiting on a check comes first: submitted, complete, not yet verified.
      const rank = (c) => (c.verifiedAt ? 2 : (c.registeredAt && !c.missing.length ? 0 : 1));
      list.sort((a, b) => rank(a) - rank(b) || String(b.registeredAt || "").localeCompare(String(a.registeredAt || "")));
      return res.status(200).json({ clinicians: list });
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
