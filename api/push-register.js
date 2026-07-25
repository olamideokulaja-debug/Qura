import { getUser, kvGet, kvSet } from "./_auth.js";

// POST /api/push-register {token, platform, prefs}
// Stores the device's Expo push token and notification preferences for this user.
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
