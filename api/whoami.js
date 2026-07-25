// Debug endpoint: takes whatever Authorization token the app sends and reports EXACTLY
// what Supabase says about it. Reveals no secrets. Delete after debugging.
export default async function handler(req, res) {
  const url = process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";

  const out = {
    receivedAuthHeader: Boolean(auth),
    tokenPresent: Boolean(token),
    tokenLength: token.length,
    serverHasConfig: Boolean(url && key),
  };

  if (!token) { out.result = "NO_TOKEN_SENT"; return res.status(200).json(out); }
  if (!url || !key) { out.result = "SERVER_MISSING_CONFIG"; return res.status(200).json(out); }

  try {
    const r = await fetch(url.replace(/\/$/, "") + "/auth/v1/user", {
      headers: { Authorization: "Bearer " + token, apikey: key },
    });
    out.supabaseStatus = r.status;
    const body = await r.json().catch(() => ({}));
    if (r.ok) {
      out.result = "VALID_USER";
      out.userId = body.id || null;
      out.email = body.email || null;
    } else {
      out.result = "SUPABASE_REJECTED_TOKEN";
      out.supabaseError = body.msg || body.error_description || body.error || "unknown";
    }
  } catch (e) {
    out.result = "FETCH_FAILED";
    out.detail = String(e.message || e);
  }
  return res.status(200).json(out);
}
