import { getUser, kvGet, kvSet } from "./_auth.js";

// GET  /api/applications          -> the clinician's applications
// POST /api/applications {opportunityId, role, employer} -> apply / express interest
const KEY = "clinician_applications";

export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Sign in required" });

  if (req.method === "GET") {
    const list = (await kvGet(user.id, KEY)) || [];
    return res.status(200).json({ applications: Array.isArray(list) ? list : [] });
  }

  if (req.method === "POST") {
    const { opportunityId, role, employer } = req.body || {};
    if (!opportunityId) return res.status(400).json({ error: "opportunityId required" });
    const list = (await kvGet(user.id, KEY)) || [];
    const arr = Array.isArray(list) ? list : [];
    if (arr.some((a) => a.opportunityId === opportunityId)) {
      return res.status(200).json({ applications: arr, already: true });
    }
    const entry = { id: "app_" + Date.now(), opportunityId, role: role || "", employer: employer || "",
      status: "Interest sent", at: new Date().toISOString() };
    const next = [entry, ...arr];
    await kvSet(user.id, KEY, next);
    return res.status(200).json({ applications: next, created: entry });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
