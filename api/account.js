import { getUser, kvGet, kvSet } from "./_auth.js";

// GET  /api/account        -> { role: "clinician" | "supplier" | null, org }
// POST /api/account {role, org} -> sets the account role (chosen at sign-up)
const KEY = "account";
const FOUNDERS = ["olamideokulaja@qurahealth.org", "olafolawiyo@qurahealth.org"];
const isFounder = (email) => FOUNDERS.includes((email || "").toLowerCase());

export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Sign in required" });

  if (req.method === "GET") {
    const a = (await kvGet(user.id, KEY)) || {};
    return res.status(200).json({ role: a.role || null, org: a.org || null, firstName: a.firstName || null, lastName: a.lastName || null, email: user.email, isFounder: isFounder(user.email) });
  }

  if (req.method === "POST") {
    const { role, org, firstName, lastName } = req.body || {};
    if (role && !["clinician", "supplier"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }
    const current = (await kvGet(user.id, KEY)) || {};
    // Once a role is set, only founders may change it (prevents self-switching by real users).
    if (role && current.role && role !== current.role && !isFounder(user.email)) {
      return res.status(403).json({ error: "Role change not permitted" });
    }
    const merged = {
      ...current,
      ...(role ? { role } : {}),
      ...(org !== undefined ? { org } : {}),
      ...(firstName !== undefined ? { firstName } : {}),
      ...(lastName !== undefined ? { lastName } : {}),
      email: user.email,
      updatedAt: new Date().toISOString(),
    };
    const wrote = await kvSet(user.id, KEY, merged);
    // Read it back. This endpoint used to return the object it INTENDED to save
    // regardless of whether the save worked, so a failed write looked like a
    // success and the caller was told the role had changed when it had not.
    const after = (await kvGet(user.id, KEY)) || {};
    if (!wrote || (role && after.role !== role)) {
      return res.status(500).json({
        error: "save_failed",
        message: "We could not save that change. Please try again.",
        attempted: role || null,
        stored: after.role || null,
      });
    }
    return res.status(200).json({ role: after.role || null, org: after.org || null, firstName: after.firstName || null, lastName: after.lastName || null, isFounder: isFounder(user.email) });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
