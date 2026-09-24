import { getUser } from "./_auth.js";
import { limited } from "./_ratelimit.js";
import { owners } from "./_waitlist.js";
import { bump, funnel, EVENTS } from "./_metrics.js";

// POST /api/track { event }  -> counts one step of the paying journey
// GET  /api/track?days=30     -> the funnel, founders only
//
// Only the events the browser can honestly report are accepted here. Sign-ups
// are counted by api/signup-alerts.js and payments by the Stripe webhook, so
// those two cannot be inflated from a browser.

const FROM_BROWSER = ["role_picked", "pricing_viewed", "locked_viewed"];

export default async function handler(req, res) {
  const user = await getUser(req);
  if (req.method === "POST") {
    if (!user) return res.status(401).json({ error: "Sign in required" });
    if (await limited(req, res, user, { bucket: "track", limit: 120, windowSec: 3600 })) return;
    const { event } = req.body || {};
    if (!FROM_BROWSER.includes(event)) return res.status(400).json({ error: "Unknown event" });
    await bump(event);
    return res.status(200).json({ ok: true });
  }
  if (req.method === "GET") {
    const email = String((user && user.email) || "").toLowerCase();
    if (!user || !owners().includes(email)) return res.status(403).json({ error: "Founders only" });
    const days = Math.min(366, Math.max(1, Number((req.query || {}).days) || 30));
    return res.status(200).json({ ...(await funnel(days)), order: EVENTS });
  }
  return res.status(405).json({ error: "Method not allowed" });
}
