import { getUser, kvGet, kvSet } from "./_auth.js";

// GET  /api/account        -> { role: "clinician" | "supplier" | null, org }
// POST /api/account {role, org} -> sets the account role (chosen at sign-up)
const KEY = "account";

export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Sign in required" });

  if (req.method === "GET") {
    const a = (await kvGet(user.id, KEY)) || {};
    return res.status(200).json({ role: a.role || null, org: a.org || null, firstName: a.firstName || null, email: user.email });
  }

  if (req.method === "POST") {
    const { role, org, firstName } = req.body || {};
    if (role && !["clinician", "supplier"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }
    const current = (await kvGet(user.id, KEY)) || {};
    const merged = {
      ...current,
      ...(role ? { role } : {}),
      ...(org !== undefined ? { org } : {}),
      ...(firstName !== undefined ? { firstName } : {}),
      email: user.email,
      updatedAt: new Date().toISOString(),
    };
    await kvSet(user.id, KEY, merged);
    return res.status(200).json({ role: merged.role || null, org: merged.org || null, firstName: merged.firstName || null });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
