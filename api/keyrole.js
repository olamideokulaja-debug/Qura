export default async function handler(req, res) {
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const anon = process.env.VITE_SUPABASE_ANON_KEY || "";
  function roleOf(jwt) {
    try {
      const payload = JSON.parse(Buffer.from(jwt.split(".")[1], "base64").toString());
      return payload.role || "unknown";
    } catch (e) { return "unparseable"; }
  }
  res.status(200).json({
    serviceRoleKey_actualRole: svc ? roleOf(svc) : "NOT SET",
    anonKey_actualRole: anon ? roleOf(anon) : "NOT SET",
    // if serviceRoleKey_actualRole is 'anon', that's the bug
  });
}
