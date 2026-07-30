import { seedActive } from "./_seed.js";
import { getUser, kvGet, kvSet } from "./_auth.js";
import { planOf, ENTITLEMENTS } from "./_entitlements.js";

// GET  /api/demand           -> live demand (roles/tenders) suppliers can pursue
// POST /api/demand {..}      -> a supplier posts a new demand item
// Curated seed demand + any supplier-posted items (stored under "shared"/demand_posted).
const SEED = [
  { id: "dm_1", title: "MRI Radiographers x3", buyer: "Community Diagnostic Centre", region: "London", market: "NHS", profession: "Radiographer", rate: "Band 7 equiv", need: "3 contractors", start: "ASAP", closes: "6 days", note: "Insourcing programme across three imaging sites." },
  { id: "dm_2", title: "ICU Nurses x8", buyer: "Private hospital group", region: "Dubai", market: "International", profession: "Nurse", rate: "Tax-free package", need: "8 placements", start: "Q4", closes: "30 days", note: "International relocation, full support provided." },
  { id: "dm_3", title: "Sonographers (MSK)", buyer: "Private provider", region: "Manchester", market: "Private", profession: "Sonographer", rate: "£320/day", need: "2 contractors", start: "1 Sep", closes: "12 days", note: "12-month contract, modern equipment." },
  { id: "dm_4", title: "Biomedical Scientists", buyer: "NHS trust", region: "Birmingham", market: "NHS", profession: "Biomedical Scientist", rate: "Band 6", need: "4 posts", start: "ASAP", closes: "9 days", note: "Blood sciences rotation, pathology network." },
];

export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Sign in required" });

  if (req.method === "GET") {
    const posted = (await kvGet("shared", "demand_posted")) || [];
    const { market, profession } = req.query || {};
    // Real posted demand always shows. The illustrative set only fills the gap
    // before launch, and is flagged so it can be labelled.
    const filler = seedActive() ? SEED.map((d) => ({ ...d, seeded: true })) : [];
    let items = [...(Array.isArray(posted) ? posted : []), ...filler];
    // Plan gate: only Growth/Intelligence and above see International markets.
    const plan = await planOf(user.id);
    const canInternational = ENTITLEMENTS.internationalMarkets(plan);
    if (!canInternational) items = items.filter((d) => d.market !== "International");
    if (market && market !== "All") items = items.filter((d) => d.market === market);
    if (profession && profession !== "All") items = items.filter((d) => d.profession === profession);
    res.setHeader("Cache-Control", "private, max-age=30");
    return res.status(200).json({ items, total: items.length, internationalLocked: !canInternational });
  }

  if (req.method === "POST") {
    const b = req.body || {};
    if (!b.title || !b.profession) return res.status(400).json({ error: "title and profession required" });
    const posted = (await kvGet("shared", "demand_posted")) || [];
    const arr = Array.isArray(posted) ? posted : [];
    const entry = {
      id: "dm_" + Date.now(),
      title: b.title, buyer: b.buyer || "Your organisation", region: b.region || "",
      market: b.market || "NHS", profession: b.profession, rate: b.rate || "",
      need: b.need || "", start: b.start || "", closes: b.closes || "30 days",
      note: b.note || "", postedBy: user.id, at: new Date().toISOString(),
    };
    await kvSet("shared", "demand_posted", [entry, ...arr]);
    return res.status(200).json({ created: entry, items: [entry, ...arr] });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
