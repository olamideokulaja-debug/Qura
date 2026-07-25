// Shared Supabase auth helper for Qura API routes.
// Returns the authenticated user object, or null if the caller is not signed in.
export async function getUser(req) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return { id: "preview-user", email: "preview@qura.local", _preview: true };
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return null;
  try {
    const r = await fetch(url.replace(/\/$/, "") + "/auth/v1/user", {
      headers: { Authorization: "Bearer " + token, apikey: key },
    });
    if (!r.ok) return null;
    return await r.json();
  } catch (e) {
    return null;
  }
}

// Minimal REST helpers for the Supabase kv table (owner-scoped rows).
const base = () => (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const svc = () => process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

export async function kvGet(owner, key) {
  if (!base() || !svc()) return null;
  const u = base() + "/rest/v1/kv?owner=eq." + encodeURIComponent(owner) +
    "&key=eq." + encodeURIComponent(key) + "&select=value";
  const r = await fetch(u, { headers: { apikey: svc(), Authorization: "Bearer " + svc() } });
  if (!r.ok) return null;
  const rows = await r.json();
  return rows && rows[0] ? rows[0].value : null;
}

export async function kvSet(owner, key, value) {
  if (!base() || !svc()) return false;
  const u = base() + "/rest/v1/kv?on_conflict=owner,key";
  const r = await fetch(u, {
    method: "POST",
    headers: {
      apikey: svc(), Authorization: "Bearer " + svc(),
      "Content-Type": "application/json", Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify([{ owner, key, value }]),
  });
  return r.ok;
}
