import { getUser, kvGet, kvListByKey } from "./_auth.js";

// POST /api/send-push {toUserId?, title, body, data?}
// Sends an Expo push notification. If toUserId is given, notifies that user;
// otherwise broadcasts to all registered users. Requires the caller to be signed in
// (in production you'd restrict this to admin — kept simple here).
async function sendExpo(messages) {
  if (messages.length === 0) return { sent: 0 };
  const r = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(messages),
  });
  const out = await r.json().catch(() => ({}));
  return { sent: messages.length, result: out };
}

const FOUNDERS = ["olamideokulaja@qurahealth.org", "olafolawiyo@qurahealth.org"];

export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Sign in required" });
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  // Only founders may send/broadcast notifications.
  if (!FOUNDERS.includes((user.email || "").toLowerCase())) {
    return res.status(403).json({ error: "Not permitted" });
  }

  const { toUserId, title, body, data } = req.body || {};
  if (!title || !body) return res.status(400).json({ error: "title and body required" });

  const tokens = [];
  if (toUserId) {
    const reg = await kvGet(toUserId, "push_registration");
    if (reg && reg.token) tokens.push(reg.token);
  } else {
    const rows = await kvListByKey("push_registration");
    for (const { value } of rows) if (value && value.token) tokens.push(value.token);
  }

  const messages = tokens.map((to) => ({
    to, sound: "default", title, body, data: data || {},
    channelId: "default",
  }));
  const result = await sendExpo(messages);
  return res.status(200).json({ ok: true, recipients: tokens.length, ...result });
}
