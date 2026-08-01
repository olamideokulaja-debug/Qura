import { getUser, kvGet, kvSet } from "./_auth.js";
import { limited } from "./_ratelimit.js";

// Outcome capture: did the introduction lead anywhere?
//
// This is the seed data for every real number the dashboards will one day
// show. Fill rate, time to place, introduction quality: none of it can be
// computed until someone records what happened, so the ask has to be one tap
// and it has to arrive at the right moment, a while after completion, when the
// answer is actually known.
//
// Design: the supplier is asked, because they know. One question at a time,
// never a form. "Still in progress" snoozes the question rather than closing
// it, so slow placements are not recorded as failures.

const ASK_AFTER_DAYS = Number(process.env.OUTCOME_ASK_DAYS || 14);
const SNOOZE_DAYS = 14;
const OUTCOMES = ["placed", "in_progress", "none"];

export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Sign in required" });
  if (await limited(req, res, user, { bucket: "outcomes", limit: 60, windowSec: 3600 })) return;

  const queue = (await kvGet("shared", "intro_queue")) || [];
  const list = Array.isArray(queue) ? queue : [];

  if (req.method === "GET") {
    // The next introduction worth asking this supplier about, oldest first.
    const now = Date.now();
    const due = list
      .filter((q) => q.supplier === user.id
        && String(q.status || "").toLowerCase() === "completed"
        && !q.outcome
        && now - Date.parse(q.updatedAt || q.at || 0) > ASK_AFTER_DAYS * 86400000
        && (!q.outcomeSnoozedAt || now - Date.parse(q.outcomeSnoozedAt) > SNOOZE_DAYS * 86400000))
      .sort((a, b) => String(a.updatedAt || a.at || "").localeCompare(String(b.updatedAt || b.at || "")));
    const ask = due[0] || null;
    return res.status(200).json({
      ask: ask ? { introId: ask.id, handle: ask.handle || "a clinician", completedAt: ask.updatedAt || ask.at } : null,
      remaining: due.length,
    });
  }

  if (req.method === "POST") {
    const { introId, outcome } = req.body || {};
    if (!introId || !OUTCOMES.includes(outcome)) {
      return res.status(400).json({ error: "introId and an outcome of placed, in_progress or none are required." });
    }
    const item = list.find((q) => q.id === introId);
    if (!item) return res.status(404).json({ error: "Introduction not found" });
    if (item.supplier !== user.id) return res.status(403).json({ error: "Only the supplier on the introduction can record its outcome." });

    if (outcome === "in_progress") {
      // Not an outcome yet: ask again later rather than forcing an answer.
      item.outcomeSnoozedAt = new Date().toISOString();
    } else {
      item.outcome = outcome; // "placed" | "none"
      item.outcomeAt = new Date().toISOString();
    }
    const ok = await kvSet("shared", "intro_queue", list);
    if (!ok) return res.status(500).json({ error: "Could not save. Try again." });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
