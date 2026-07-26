import { getUser, kvGet } from "./_auth.js";
import { askAI } from "./_ai.js";
import { planOf, ENTITLEMENTS, upgradeBlock } from "./_entitlements.js";

// POST /api/ai-introduction { clinicianId, handle, profession, regBody, country, experience, roleContext }
// Returns a professional, grounded introduction draft. Uses ONLY the supplied verified
// attributes — never invents credentials or names.
export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Sign in required" });
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // The AI assistant is a Growth-tier feature.
  const plan = await planOf(user.id);
  if (!ENTITLEMENTS.aiAssistant(plan)) return upgradeBlock(res, "the AI assistant", "Growth");

  const { handle, profession, regBody, country, experience, roleContext } = req.body || {};
  if (!profession) return res.status(400).json({ error: "profession required" });

  const system =
    "You draft short, professional introduction notes for a healthcare staffing marketplace. " +
    "Use ONLY the verified facts provided. Never invent names, registration numbers, employers, or qualifications. " +
    "Never claim the person is available or guarantee suitability. Keep it to 3-4 sentences, warm and businesslike. " +
    "Refer to the clinician by their professional role, not a personal name.";

  const facts = [
    "Role/profession: " + profession,
    regBody ? "Registration body: " + regBody : null,
    country ? "Country: " + country : null,
    experience ? "Experience: " + experience : null,
    roleContext ? "The supplier is hiring for: " + roleContext : null,
  ].filter(Boolean).join("\n");

  const r = await askAI(system, "Draft an introduction note connecting a supplier with this verified clinician.\n\n" + facts, 300);
  if (!r.ok) return res.status(200).json({ ok: false, error: r.error, fallback: true });
  return res.status(200).json({ ok: true, draft: r.text });
}
