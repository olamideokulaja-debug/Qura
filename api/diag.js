// Safe diagnostic: reports whether server-side Supabase env vars are present and
// whether the server can reach Supabase. Exposes NO secret values, only booleans
// and the project ref (which is public, it's in the URL). Delete after debugging.
export default async function handler(req, res) {
  const url = process.env.SUPABASE_URL || "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const anonFallback = process.env.VITE_SUPABASE_ANON_KEY || "";
  const key = serviceKey || anonFallback;

  // project ref from the URL (public info)
  const ref = (url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/) || [])[1] || null;

  let supabaseReachable = null;
  let userEndpointStatus = null;
  if (url && key) {
    try {
      const r = await fetch(url.replace(/\/$/, "") + "/auth/v1/user", {
        headers: { Authorization: "Bearer " + key, apikey: key },
      });
      supabaseReachable = true;
      userEndpointStatus = r.status; // 403 = reached & rejected anon-as-user (GOOD, means config works)
    } catch (e) {
      supabaseReachable = false;
    }
  }

  res.status(200).json({
    hasSupabaseUrl: Boolean(url),
    projectRef: ref,
    hasServiceRoleKey: Boolean(serviceKey),
    hasAnonFallback: Boolean(anonFallback),
    keyUsedLength: key ? key.length : 0,
    supabaseReachable,
    userEndpointStatus,
    expectedRef: "jggvouhtmzciptqltjum",
    refMatches: ref === "jggvouhtmzciptqltjum",
  });
}
