import { isSeededId, refuseSeeded } from "./_seed.js";
import { getUser, kvGet, kvSet } from "./_auth.js";

// GET  /api/introductions        -> this supplier's introduction requests
// POST /api/introductions {clinicianId, handle} -> request an introduction
// Stored per-supplier; also appended to a shared queue for admin (you) to approve.
const KEY = "supplier_introductions";

export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Sign in required" });

  if (req.method === "GET") {
    const list = (await kvGet(user.id, KEY)) || [];
    return res.status(200).json({ items: Array.isArray(list) ? list : [] });
  }

  if (req.method === "POST") {
    const { clinicianId, handle } = req.body || {};
    if (!clinicianId) return res.status(400).json({ error: "clinicianId required" });
    if (isSeededId(clinicianId)) return refuseSeeded(res);
    const list = (await kvGet(user.id, KEY)) || [];
    const arr = Array.isArray(list) ? list : [];
    if (arr.some((i) => i.clinicianId === clinicianId)) {
      return res.status(200).json({ items: arr, already: true });
    }
    const entry = {
      id: "intro_" + Date.now(), clinicianId, handle: handle || "",
      status: "Requested", at: new Date().toISOString(),
    };
    const next = [entry, ...arr];
    await kvSet(user.id, KEY, next);

    // Append to a shared admin queue for approval.
    const queue = (await kvGet("shared", "intro_queue")) || [];
    const q = Array.isArray(queue) ? queue : [];
    await kvSet("shared", "intro_queue", [{ ...entry, supplier: user.id, supplierEmail: user.email }, ...q]);

    return res.status(200).json({ items: next, created: entry });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
