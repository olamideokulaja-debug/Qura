import { getUser } from "./_auth.js";
import { limited } from "./_ratelimit.js";

// Vercel serverless function. Keeps your Anthropic API key server-side.
// Set ANTHROPIC_API_KEY in your Vercel project (Settings > Environment Variables).
//
// This route was previously open to anyone who found the address, which meant
// anyone could spend the Anthropic budget. It now requires a signed-in user and
// is rate limited per user.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Sign in required" });
  if (await limited(req, res, user, { bucket: "anthropic", limit: 30, windowSec: 3600 })) return;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    res.status(500).json({ error: "ANTHROPIC_API_KEY is not set" });
    return;
  }
  try {
    const body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body,
    });
    const data = await r.json();
    res.status(r.status).json(data);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}
