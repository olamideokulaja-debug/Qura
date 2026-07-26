import { getUser, kvGet, kvSet } from "./_auth.js";

// GET  /api/saved            -> this user's saved opportunity IDs
// POST /api/saved {id}       -> toggle save
const KEY = "saved_opportunities";

export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Sign in required" });

  if (req.method === "GET") {
    const list = (await kvGet(user.id, KEY)) || [];
    return res.status(200).json({ ids: Array.isArray(list) ? list : [] });
  }
  if (req.method === "POST") {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: "id required" });
    const list = (await kvGet(user.id, KEY)) || [];
    const arr = Array.isArray(list) ? list : [];
    const next = arr.includes(id) ? arr.filter((x) => x !== id) : [id, ...arr];
    await kvSet(user.id, KEY, next);
    return res.status(200).json({ ids: next, saved: next.includes(id) });
  }
  return res.status(405).json({ error: "Method not allowed" });
}
