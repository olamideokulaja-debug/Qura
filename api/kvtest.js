export default async function handler(req, res) {
  const base = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
  const out = {};

  // 1. Try INSERT a test row
  const ins = await fetch(base + "/rest/v1/kv", {
    method: "POST",
    headers: { apikey: svc, Authorization: "Bearer " + svc, "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify([{ owner: "kvtest_owner", key: "kvtest_key", value: { n: 1 } }]),
  });
  out.insertStatus = ins.status;
  out.insertBody = (await ins.text()).slice(0, 300);

  // 2. Try to READ it back
  const get = await fetch(base + "/rest/v1/kv?owner=eq.kvtest_owner&key=eq.kvtest_key&select=value", {
    headers: { apikey: svc, Authorization: "Bearer " + svc },
  });
  out.readStatus = get.status;
  out.readBody = (await get.text()).slice(0, 300);

  // 3. Try PATCH (update)
  const pat = await fetch(base + "/rest/v1/kv?owner=eq.kvtest_owner&key=eq.kvtest_key", {
    method: "PATCH",
    headers: { apikey: svc, Authorization: "Bearer " + svc, "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify({ value: { n: 2 } }),
  });
  out.patchStatus = pat.status;
  out.patchBody = (await pat.text()).slice(0, 300);

  // 4. Clean up
  await fetch(base + "/rest/v1/kv?owner=eq.kvtest_owner&key=eq.kvtest_key", {
    method: "DELETE", headers: { apikey: svc, Authorization: "Bearer " + svc },
  });

  res.status(200).json(out);
}
