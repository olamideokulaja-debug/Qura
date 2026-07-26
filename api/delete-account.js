import { getUser, kvSet } from "./_auth.js";

// POST /api/delete-account -> clears the signed-in user's stored data.
// Removes profile, applications, push registration, account role, shortlist.
export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Sign in required" });
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const keys = ["clinician_profile", "clinician_applications", "push_registration", "account", "supplier_shortlist"];
  for (const k of keys) {
    try { await kvSet(user.id, k, {}); } catch (e) {}
  }
  return res.status(200).json({ ok: true });
}
