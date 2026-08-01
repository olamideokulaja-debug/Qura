import { getUser, kvGet, kvSet } from "./_auth.js";

// POST /api/push-register {token, platform, prefs}
// Stores the device's Expo push token and notification preferences for this user.
//
// prefs now also carries: tenders (saved-alert pushes), general (founder
// broadcasts), quiet (true/false), quietFrom and quietTo ("HH:MM", 24h, UK
// time). Senders check these via shouldPush() below.

// Is this user accepting this kind of push right now?
export function shouldPush(reg, kind) {
  if (!reg || !reg.token) return false;
  const prefs = reg.prefs || {};
  if (kind && prefs[kind] === false) return false;
  if (prefs.quiet) {
    const from = prefs.quietFrom || "22:00";
    const to = prefs.quietTo || "07:00";
    const now = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Europe/London" });
    // window may wrap midnight
    const inWindow = from <= to ? (now >= from && now < to) : (now >= from || now < to);
    if (inWindow) return false;
  }
  return true;
}
const KEY = "push_registration";

export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Sign in required" });

  if (req.method === "GET") {
    const reg = (await kvGet(user.id, KEY)) || { prefs: { matches: true, introductions: true, interviews: true } };
    return res.status(200).json({ registration: reg });
  }

  if (req.method === "POST") {
    const { token, platform, prefs } = req.body || {};
    const current = (await kvGet(user.id, KEY)) || {};
    const merged = {
      ...current,
      ...(token ? { token, platform } : {}),
      ...(prefs ? { prefs: { ...(current.prefs || {}), ...prefs } } : {}),
      email: user.email,
      updatedAt: new Date().toISOString(),
    };
    await kvSet(user.id, KEY, merged);
    return res.status(200).json({ registration: merged });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
