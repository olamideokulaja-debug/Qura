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
    "&key=eq." + encodeURIComponent(key) + "&select=value&order=value->>updatedAt.desc.nullslast&limit=1";
  const r = await fetch(u, { headers: { apikey: svc(), Authorization: "Bearer " + svc() } });
  if (!r.ok) return null;
  const rows = await r.json();
  if (!rows || !rows[0]) return null;
  let v = rows[0].value;
  // The column may return the value as a JSON string (double-encoded) or as an object.
  // Normalise to a real object so callers can read fields off it.
  if (typeof v === "string") {
    try { v = JSON.parse(v); } catch (e) { /* leave as string if not JSON */ }
  }
  return v;
}

export async function kvSet(owner, key, value) {
  if (!base() || !svc()) return false;
  // Try to UPDATE an existing row first (does not depend on a unique constraint).
  const patchUrl = base() + "/rest/v1/kv?owner=eq." + encodeURIComponent(owner) +
    "&key=eq." + encodeURIComponent(key);
  const patch = await fetch(patchUrl, {
    method: "PATCH",
    headers: {
      apikey: svc(), Authorization: "Bearer " + svc(),
      "Content-Type": "application/json", Prefer: "return=representation",
    },
    body: JSON.stringify({ value }),
  });
  if (patch.ok) {
    const rows = await patch.json().catch(() => []);
    if (Array.isArray(rows) && rows.length > 0) return true; // updated an existing row
  }
  // No existing row — INSERT one.
  const post = await fetch(base() + "/rest/v1/kv", {
    method: "POST",
    headers: {
      apikey: svc(), Authorization: "Bearer " + svc(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify([{ owner, key, value }]),
  });
  return post.ok;
}
