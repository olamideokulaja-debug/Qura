import { kvGet, kvSet } from "./_auth.js";

// Shared server-side AI helper. Keeps prompts grounded in verified data only,
// never invents credentials, and caps tokens to control cost. Results are CACHED
// by a hash of the prompt so identical requests never pay for the model twice.

function hash(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return "ai_" + (h >>> 0).toString(36);
}

export async function askAI(system, user, maxTokens = 400) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { ok: false, error: "AI not configured" };

  // Check cache first (shared across users — the prompts contain no personal identifiers,
  // only role/credential attributes).
  const cacheKey = hash(system + "||" + user + "||" + maxTokens);
  try {
    const cached = await kvGet("shared", cacheKey);
    if (cached && cached.text) return { ok: true, text: cached.text, cached: true };
  } catch (e) {}

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });
    const data = await r.json();
    if (!r.ok) return { ok: false, error: data.error?.message || "AI request failed" };
    const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("").trim();
    // store in cache (best-effort)
    try { await kvSet("shared", cacheKey, { text, at: new Date().toISOString() }); } catch (e) {}
    return { ok: true, text };
  } catch (e) {
    return { ok: false, error: String(e.message || e) };
  }
}
