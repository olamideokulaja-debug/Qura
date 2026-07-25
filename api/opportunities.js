import { getUser } from "./_auth.js";

// GET /api/opportunities?country=&profession=&market=
// Live roles for clinicians. Currently served from a curated set; swap the SOURCE
// array for a real data source (employer feeds / kv) without changing the client.
const SOURCE = [
  { id: "op_1", role: "MRI Radiographer", employer: "Community Diagnostic Centre", country: "United Kingdom", region: "London", market: "NHS", profession: "Radiographer", spec: "MRI", rate: "Band 7", start: "ASAP", fit: 96, closes: "6 days", summary: "Insourcing programme across three imaging sites. Immediate starts available." },
  { id: "op_2", role: "Sonographer (MSK)", employer: "Private provider", country: "United Kingdom", region: "Manchester", market: "Private", profession: "Sonographer", spec: "MSK", rate: "£320/day", start: "1 Sep", fit: 91, closes: "12 days", summary: "12-month contract, MSK and general lists, modern equipment." },
  { id: "op_3", role: "Echocardiographer", employer: "NHS trust", country: "United Kingdom", region: "Leeds", market: "NHS", profession: "Echocardiographer", spec: "Cardiac", rate: "Band 7", start: "Flexible", fit: 88, closes: "21 days", summary: "Backlog-clearance role, stress and TOE experience welcome." },
  { id: "op_4", role: "ICU Nurse", employer: "Private hospital group", country: "United Arab Emirates", region: "Dubai", market: "International", profession: "Nurse", spec: "Critical care", rate: "Tax-free package", start: "Q4", fit: 84, closes: "30 days", summary: "International relocation with full support. 2+ years ICU required." },
  { id: "op_5", role: "Biomedical Scientist", employer: "NHS trust", country: "United Kingdom", region: "Birmingham", market: "NHS", profession: "Biomedical Scientist", spec: "Blood sciences", rate: "Band 6", start: "ASAP", fit: 80, closes: "9 days", summary: "HCPC-registered, blood sciences rotation, pathology network." },
  { id: "op_6", role: "Diagnostic Radiographer", employer: "Mobile imaging partner", country: "United Kingdom", region: "South East", market: "NHS", profession: "Radiographer", spec: "General", rate: "£38/hr", start: "ASAP", fit: 78, closes: "5 days", summary: "Mobile unit sessions across the region, flexible shifts." },
];

export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Sign in required" });
  const { country, profession, market } = req.query || {};
  let items = SOURCE.slice();
  if (country && country !== "All") items = items.filter((o) => o.country === country);
  if (profession && profession !== "All") items = items.filter((o) => o.profession === profession);
  if (market && market !== "All") items = items.filter((o) => o.market === market);
  res.setHeader("Cache-Control", "private, max-age=30");
  return res.status(200).json({ items, total: items.length });
}
