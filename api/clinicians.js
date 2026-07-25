import { getUser, kvGet, kvSet } from "./_auth.js";

// GET  /api/clinicians                 -> verified clinicians a supplier can shortlist
// GET  /api/clinicians?shortlist=1     -> this supplier's shortlist
// POST /api/clinicians {clinicianId}   -> add/remove from shortlist (toggle)
// Curated directory (privacy-safe: no contact details until an introduction is made).
const DIRECTORY = [
  { id: "cl_1", handle: "Radiographer, MRI", profession: "Radiographer", spec: "MRI", country: "United Kingdom", region: "London", experience: "6 to 10 years", regBody: "HCPC", verified: true, fit: 96 },
  { id: "cl_2", handle: "Sonographer, MSK", profession: "Sonographer", spec: "MSK", country: "United Kingdom", region: "Manchester", experience: "3 to 5 years", regBody: "HCPC", verified: true, fit: 91 },
  { id: "cl_3", handle: "ICU Nurse", profession: "Nurse", spec: "Critical care", country: "United Arab Emirates", region: "Dubai", experience: "6 to 10 years", regBody: "NMC", verified: true, fit: 88 },
  { id: "cl_4", handle: "Biomedical Scientist", profession: "Biomedical Scientist", spec: "Blood sciences", country: "United Kingdom", region: "Birmingham", experience: "More than 10 years", regBody: "HCPC", verified: true, fit: 84 },
  { id: "cl_5", handle: "Echocardiographer", profession: "Echocardiographer", spec: "Cardiac", country: "United Kingdom", region: "Leeds", experience: "3 to 5 years", regBody: "HCPC", verified: true, fit: 82 },
];
const KEY = "supplier_shortlist";

export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Sign in required" });

  if (req.method === "GET") {
    const shortlist = (await kvGet(user.id, KEY)) || [];
    const ids = Array.isArray(shortlist) ? shortlist : [];
    if (req.query && req.query.shortlist) {
      return res.status(200).json({ items: DIRECTORY.filter((c) => ids.includes(c.id)), shortlistIds: ids });
    }
    const { profession, country } = req.query || {};
    let items = DIRECTORY.slice();
    if (profession && profession !== "All") items = items.filter((c) => c.profession === profession);
    if (country && country !== "All") items = items.filter((c) => c.country === country);
    return res.status(200).json({ items, shortlistIds: ids });
  }

  if (req.method === "POST") {
    const { clinicianId } = req.body || {};
    if (!clinicianId) return res.status(400).json({ error: "clinicianId required" });
    const shortlist = (await kvGet(user.id, KEY)) || [];
    const ids = Array.isArray(shortlist) ? shortlist : [];
    const next = ids.includes(clinicianId) ? ids.filter((x) => x !== clinicianId) : [clinicianId, ...ids];
    await kvSet(user.id, KEY, next);
    return res.status(200).json({ shortlistIds: next, shortlisted: next.includes(clinicianId) });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
