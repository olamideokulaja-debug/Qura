import { getUser, kvGet, kvSet } from "./_auth.js";

// GET  /api/profile        -> the signed-in clinician's profile
// POST /api/profile {..}   -> save/merge the profile
const KEY = "clinician_profile";

function completeness(p) {
  const req = ["category", "profession", "regBody", "regNumber", "country", "experienceYears", "cvUploaded"];
  const done = req.filter((k) => {
    const v = p ? p[k] : undefined;
    return v !== undefined && v !== null && v !== "" && v !== false;
  });
  return { done: done.length, total: req.length, verified: done.length === req.length, missing: req.filter((k) => !done.includes(k)) };
}

export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Sign in required" });

  if (req.method === "GET") {
    const p = (await kvGet(user.id, KEY)) || { email: user.email };
    return res.status(200).json({ profile: p, status: completeness(p) });
  }

  if (req.method === "POST") {
    const incoming = req.body || {};
    const current = (await kvGet(user.id, KEY)) || {};
    const merged = { ...current, ...incoming, email: user.email, updatedAt: new Date().toISOString() };
    const ok = await kvSet(user.id, KEY, merged);
    if (!ok && !user._preview) return res.status(500).json({ error: "Could not save profile" });
    return res.status(200).json({ profile: merged, status: completeness(merged) });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
