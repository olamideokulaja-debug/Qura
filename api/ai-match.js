import { getUser } from "./_auth.js";
import { limited } from "./_ratelimit.js";
import { askAI } from "./_ai.js";

// POST /api/ai-match { role, market, region, profession, experience, country }
// Returns a one or two sentence, grounded match rationale. Never overstates.
export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Sign in required" });
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (await limited(req, res, user, { bucket: "ai", limit: 60, windowSec: 3600 })) return;

  const { role, market, region, profession, experience, country } = req.body || {};
  if (!role || !profession) return res.status(400).json({ error: "role and profession required" });

  const system =
    "You explain, in one or two grounded sentences, why a healthcare professional's verified profile fits a role. " +
    "Use ONLY the facts given. Do not invent skills or claim guaranteed suitability. Be specific and factual, not salesy. " +
    "If a gap is obvious from the facts, you may note it briefly and neutrally.";

  const facts =
    "Role: " + role + (market ? " (" + market + ")" : "") + (region ? ", " + region : "") + "\n" +
    "Professional profile: " + profession + (experience ? ", " + experience : "") + (country ? ", based in " + country : "");

  const r = await askAI(system, facts + "\n\nWhy is this a strong match?", 160);
  if (!r.ok) return res.status(200).json({ ok: false, error: r.error });
  return res.status(200).json({ ok: true, reason: r.text });
}
