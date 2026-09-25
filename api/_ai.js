import crypto from "node:crypto";
import { kvGet, kvSet } from "./_auth.js";

// Shared server-side AI helper. Keeps prompts grounded in verified data only,
// never invents credentials, and caps tokens to control cost. Results are CACHED
// by a hash of the prompt so identical requests never pay for the model twice.

// A full SHA-256 of the prompt. It used to be a 32-bit hash, which is easy to
// collide deliberately, so a crafted prompt could plant an answer that other
// people would then be shown (25 September security review).
function hash(str) {
  return "ai2_" + crypto.createHash("sha256").update(str).digest("hex").slice(0, 40);
}

// opts.noCache: for prompts built from one person's own material (a CV),
// which should neither be stored in the shared cache nor served to anyone else.
export async function askAI(system, user, maxTokens = 400, opts = {}) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { ok: false, error: "AI not configured" };

  // Check cache first (shared across users — the prompts contain no personal identifiers,
  // only role/credential attributes).
  const cacheKey = hash(system + "||" + user + "||" + maxTokens);
  if (!opts.noCache) try {
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
    if (!opts.noCache) { try { await kvSet("shared", cacheKey, { text, at: new Date().toISOString() }); } catch (e) {} }
    return { ok: true, text };
  } catch (e) {
    return { ok: false, error: String(e.message || e) };
  }
}
