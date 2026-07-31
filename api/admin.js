import { createClient } from "@supabase/supabase-js";

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
