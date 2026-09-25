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
    // The request is rebuilt here rather than passed through: the model is
    // fixed, output and input are capped, and tools are never allowed, so an
    // account cannot run up the Anthropic bill (25 September security review).
    let b = req.body;
    if (typeof b === "string") { try { b = JSON.parse(b); } catch (e) { b = {}; } }
    b = b || {};
    const clip = (v, n) => String(v == null ? "" : v).slice(0, n);
    const content = (c) => Array.isArray(c)
      ? c.filter((x) => x && x.type === "text").map((x) => ({ type: "text", text: clip(x.text, 12000) }))
      : clip(c, 12000);
    const messages = (Array.isArray(b.messages) ? b.messages : []).slice(-12)
      .filter((m) => m && (m.role === "user" || m.role === "assistant"))
      .map((m) => ({ role: m.role, content: content(m.content) }));
    if (!messages.length) return res.status(400).json({ error: "messages required" });
    const safe = { model: "claude-sonnet-4-6", max_tokens: Math.min(1200, Math.max(1, Number(b.max_tokens) || 800)), messages };
    if (typeof b.system === "string") safe.system = clip(b.system, 6000);
    const body = JSON.stringify(safe);
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
