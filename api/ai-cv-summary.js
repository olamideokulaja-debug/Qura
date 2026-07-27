import { getUser, kvGet, kvSet } from "./_auth.js";
import { limited } from "./_ratelimit.js";
import { askAI } from "./_ai.js";

// POST /api/ai-cv-summary { text }  -> AI-polished professional highlights, saved to profile
// GET  /api/ai-cv-summary           -> returns the saved summary
// Takes a short professional description the clinician provides (reliable, no PDF parsing)
// and turns it into clean, factual highlights. Never fabricates.
const KEY = "cv_summary";

export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Sign in required" });

  if (req.method === "GET") {
    const saved = (await kvGet(user.id, KEY)) || {};
    return res.status(200).json({ summary: saved.summary || null });
  }

  if (req.method === "POST") {
    if (await limited(req, res, user, { bucket: "ai", limit: 20, windowSec: 3600 })) return;
    const { text } = req.body || {};
    if (!text || text.length < 20) return res.status(400).json({ error: "Please add a bit more detail." });

    const system =
      "You turn a healthcare professional's own description of their background into 3-5 clean, factual " +
      "highlight bullets for their marketplace profile. Use ONLY what they state. Never invent registrations, " +
      "employers, dates, or qualifications. Keep each bullet short and professional. Output plain bullets, one per line, starting with '- '.";

    const r = await askAI(system, "Their description:\n\n" + String(text).slice(0, 3000) + "\n\nWrite the highlights.", 350);
    if (!r.ok) return res.status(200).json({ ok: false, error: r.error });

    await kvSet(user.id, KEY, { summary: r.text, at: new Date().toISOString() });
    return res.status(200).json({ ok: true, summary: r.text });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
