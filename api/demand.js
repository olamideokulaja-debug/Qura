import { seedActive } from "./_seed.js";
import { getUser, kvGet, kvSet } from "./_auth.js";
import { limited } from "./_ratelimit.js";
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

// Founders see the whole product, including the markets a free plan cannot.
// Note the deliberate difference from admin.js: there, an empty OWNER_EMAILS
// treats everyone as an owner, which is a reasonable fallback for a panel
// nobody can reach without a password. Here it would silently unlock paid
// markets for every user, so an empty list grants nothing.
function isOwner(user) {
  const owners = (process.env.OWNER_EMAILS || process.env.VITE_OWNER_EMAILS || "")
    .split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (!owners.length) return false;
  return owners.includes(String((user && user.email) || "").toLowerCase());
}

export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Sign in required" });

  if (req.method === "GET") {
    const posted = (await kvGet("shared", "demand_posted")) || [];
    const { market, profession } = req.query || {};
    // Real public procurement notices, refreshed daily by api/refresh-tenders.js
    // from Find a Tender and Contracts Finder. These are genuinely live and
    // carry a link back to the original notice.
    const tenders = (await kvGet("shared", "tenders")) || {};
    const live = Array.isArray(tenders.items) ? tenders.items : [];
    // Order: supplier-posted demand, then real public notices, then the
    // illustrative set, which only fills the gap before launch.
    const filler = seedActive() ? SEED.map((d) => ({ ...d, seeded: true })) : [];
    // postedBy (an account id) is kept on the record but never sent out.
    const postedPublic = (Array.isArray(posted) ? posted : []).map(({ postedBy, ...rest }) => rest);
    let items = [...postedPublic, ...live, ...filler];
    // Plan gate: only Growth/Intelligence and above see International markets.
    const plan = await planOf(user.id);
    const canInternational = isOwner(user) || ENTITLEMENTS.internationalMarkets(plan);
    if (!canInternational) items = items.filter((d) => d.market !== "International");
    if (market && market !== "All") items = items.filter((d) => d.market === market);
    if (profession && profession !== "All") items = items.filter((d) => d.profession === profession);
    res.setHeader("Cache-Control", "private, max-age=30");
    return res.status(200).json({ items, total: items.length, internationalLocked: !canInternational });
  }

  if (req.method === "POST") {
    // Only organisations post roles: a supplier or healthcare provider account,
    // or a founder. The account record is written by the server, never by the
    // browser (25 September security review: any account, including a
    // clinician, could post a role under any organisation's name).
    const acc = (await kvGet(user.id, "account")) || {};
    const lens = acc.lens || ({ agency: "supplier", supplier: "supplier", hospital: "healthcare_provider", gp: "healthcare_provider", care: "healthcare_provider" })[acc.role] || "";
    if (!isOwner(user) && lens !== "supplier" && lens !== "healthcare_provider") {
      return res.status(403).json({ error: "Only organisation accounts can post roles." });
    }
    if (await limited(req, res, user, { bucket: "demand-post", limit: 20, windowSec: 86400 })) return;
    const raw = req.body || {};
    const clip = (v, n) => String(v == null ? "" : v).replace(/[<>]/g, "").trim().slice(0, n);
    const b = {
      title: clip(raw.title, 120), buyer: clip(raw.buyer, 120), region: clip(raw.region, 80),
      market: ["NHS", "Private", "International", "Public"].includes(raw.market) ? raw.market : "NHS",
      profession: clip(raw.profession, 80), rate: clip(raw.rate, 60), need: clip(raw.need, 80),
      start: clip(raw.start, 40), closes: clip(raw.closes, 40), note: clip(raw.note, 1000),
    };
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
    const { postedBy, ...createdPublic } = entry;
    return res.status(200).json({ created: createdPublic });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
