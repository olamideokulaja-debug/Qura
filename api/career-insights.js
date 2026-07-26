import { getUser, kvGet } from "./_auth.js";
import { ENTITLEMENTS, upgradeBlock } from "./_entitlements.js";

// GET /api/career-insights?profession=..&country=..
// Career+ clinician benefit: salary & tariff insights plus career planning prompts.
// Grounded, indicative benchmarks (not a live market feed). Gated to Career+.

// Indicative day-rate / band guidance by profession (UK-focused; extend per corridor later).
const BENCHMARKS = {
  "Radiologist":        { nhs: "Consultant £84k–£114k (basic)", locum: "£100–£150/hr locum", trend: "High demand, cross-sectional imaging" },
  "General Practitioner": { nhs: "Salaried GP £70k–£100k", locum: "£80–£110/hr sessional", trend: "Steady demand, flexible sessions" },
  "Radiographer":       { nhs: "Band 6–7 (£37k–£51k)", locum: "£28–£45/hr", trend: "Insourcing driving demand" },
  "Nurse":              { nhs: "Band 5–6 (£29k–£43k)", locum: "£22–£40/hr", trend: "Consistent national demand" },
  "Sonographer":        { nhs: "Band 7 (£46k–£52k)", locum: "£40–£60/hr", trend: "Shortage speciality, strong rates" },
  "Anaesthetist":       { nhs: "Consultant £93k–£126k", locum: "£110–£160/hr", trend: "Premium locum rates" },
};

const GENERIC = { nhs: "Varies by band and region", locum: "Ask for current locum rates", trend: "Demand varies by speciality" };

const PLANNING = [
  "Keep your registration and revalidation current — it's the first thing employers check.",
  "A short, factual professional summary lifts your profile in search results.",
  "Broadening to an in-demand speciality or a second corridor widens your options.",
  "Track your applications here so you never lose visibility on where you stand.",
];

export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Sign in required" });

  const plan = await kvGet(user.id, "qura_plan");
  if (!ENTITLEMENTS.careerPlus(plan)) return upgradeBlock(res, "salary & tariff insights", "Career+");

  const { profession } = req.query || {};
  const b = BENCHMARKS[profession] || GENERIC;
  return res.status(200).json({
    profession: profession || "Your profession",
    salary: b, planning: PLANNING,
    note: "Indicative guidance to support your planning, not a formal offer or live market rate.",
  });
}
