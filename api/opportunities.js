import { seedActive } from "./_seed.js";
import { getUser, kvGet } from "./_auth.js";

// GET /api/opportunities?country=&profession=&market=
//
// Roles a clinician can pursue. These are the real requirements posted by
// suppliers, hospitals and GP practices through /api/demand, reshaped into the
// clinician's language: a demand post says "MRI Radiographers x3", a clinician
// sees a role they can apply to.
//
// The illustrative set below fills the page before launch and switches itself
// off at 09:00 on 22 September, the same moment as everything else seeded. It
// is deliberately NOT extended past that date: illustrative content labelled
// as illustrative is honest, and the same content after launch, when people
// are signing up on the strength of it, is not.
//
// After that date this page shows what has genuinely been posted, which on day
// one may be very little. The client is told which it is looking at via
// `seeded` on each item and `live`/`awaitingPosts` on the response, so it can
// ask a clinician to complete their profile and set an alert rather than
// showing them an empty list with no explanation.
const SEED = [
  { id: "op_1", role: "MRI Radiographer", employer: "Community Diagnostic Centre", country: "United Kingdom", region: "London", market: "NHS", profession: "Radiographer", spec: "MRI", rate: "Band 7", start: "ASAP", fit: 96, closes: "6 days", summary: "Insourcing programme across three imaging sites. Immediate starts available." },
  { id: "op_2", role: "Sonographer (MSK)", employer: "Private provider", country: "United Kingdom", region: "Manchester", market: "Private", profession: "Sonographer", spec: "MSK", rate: "£320/day", start: "1 Sep", fit: 91, closes: "12 days", summary: "12-month contract, MSK and general lists, modern equipment." },
  { id: "op_3", role: "Echocardiographer", employer: "NHS trust", country: "United Kingdom", region: "Leeds", market: "NHS", profession: "Echocardiographer", spec: "Cardiac", rate: "Band 7", start: "Flexible", fit: 88, closes: "21 days", summary: "Backlog-clearance role, stress and TOE experience welcome." },
  { id: "op_4", role: "ICU Nurse", employer: "Private hospital group", country: "United Arab Emirates", region: "Dubai", market: "International", profession: "Nurse", spec: "Critical care", rate: "Tax-free package", start: "Q4", fit: 84, closes: "30 days", summary: "International relocation with full support. 2+ years ICU required." },
  { id: "op_5", role: "Biomedical Scientist", employer: "NHS trust", country: "United Kingdom", region: "Birmingham", market: "NHS", profession: "Biomedical Scientist", spec: "Blood sciences", rate: "Band 6", start: "ASAP", fit: 80, closes: "9 days", summary: "HCPC-registered, blood sciences rotation, pathology network." },
  { id: "op_6", role: "Diagnostic Radiographer", employer: "Mobile imaging partner", country: "United Kingdom", region: "South East", market: "NHS", profession: "Radiographer", spec: "General", rate: "£38/hr", start: "ASAP", fit: 78, closes: "5 days", summary: "Mobile unit sessions across the region, flexible shifts." },
];

// A posted requirement, seen from the clinician's side.
function asRole(d) {
  return {
    id: d.id,
    role: d.profession || d.title || "Healthcare role",
    employer: d.buyer || "Healthcare organisation",
    country: /international/i.test(String(d.market || "")) ? "International" : "United Kingdom",
    region: d.region || "",
    market: d.market || "NHS",
    profession: d.profession || "",
    rate: d.rate || "Rate on application",
    need: d.need || "",
    start: d.start || "",
    closes: d.closes || "",
    note: d.note || d.title || "",
    postedAt: d.at || null,
    seeded: false,
  };
}

export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Sign in required" });
  const { country, profession, market } = req.query || {};

  // Real posts first, newest first. These are requirements someone has
  // actually put up, so they lead whatever else is on the page.
  const posted = (await kvGet("shared", "demand_posted")) || [];
  const real = (Array.isArray(posted) ? posted : [])
    .map(asRole)
    .sort((a, b) => String(b.postedAt || "").localeCompare(String(a.postedAt || "")));

  const filler = seedActive() ? SEED.map((o) => ({ ...o, seeded: true })) : [];
  let items = [...real, ...filler];

  if (country && country !== "All") items = items.filter((o) => o.country === country);
  if (profession && profession !== "All") items = items.filter((o) => o.profession === profession);
  if (market && market !== "All") items = items.filter((o) => o.market === market);

  res.setHeader("Cache-Control", "private, max-age=30");
  return res.status(200).json({
    items,
    total: items.length,
    live: real.length,
    // True when there is genuinely nothing posted yet, so the client can show
    // a page that recruits rather than a page that apologises.
    awaitingPosts: real.length === 0 && !seedActive(),
  });
}
