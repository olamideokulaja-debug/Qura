import crypto from "node:crypto";
import { kvGet, kvSet } from "./_auth.js";

// Rate limiting for the API routes, using the kv table that already exists in
// Supabase. No new table and no new service to sign up for.
//
// Honest limitation: read-then-write is not atomic, so two requests landing in
// the same instant can both pass. That is fine for what this is here to do,
// which is stop one person hammering an endpoint hundreds of times, not enforce
// an exact quota to the request.
//
// IP ADDRESSES ARE NOT STORED. They used to be, as keys like
// "cron-tenders:ip:102.88.108.229", which sat in the database indefinitely. An
// IP is personal data under UK GDPR, so that was a retention question with no
// answer and nothing in the privacy policy to cover it.
//
// A salted hash does the identical job — the same visitor produces the same key
// — while not being readily identifiable. Setting a retention period on raw IPs
// would have been the weaker fix: this way there is nothing to retain.

const WINDOW_OWNER = "ratelimit";

// Set RATELIMIT_SALT in the environment. Without it the salt is derived from
// another server-side secret, so the hash is still not reversible by anyone
// reading the database — but a dedicated salt is better, and rotating it simply
// resets everyone's window, which is harmless.
const SALT = process.env.RATELIMIT_SALT
  || (process.env.SUPABASE_SERVICE_ROLE_KEY || "qura").slice(-24);

function identify(req, user) {
  // A signed-in person is identified by their account, which we already hold
  // and which is far more accurate than an IP behind a shared network.
  if (user && user.id) return "u:" + user.id;
  const fwd = req.headers["x-forwarded-for"] || "";
  const ip = String(fwd).split(",")[0].trim() || req.socket?.remoteAddress || "unknown";
  // 16 hex characters is ample to avoid collisions across the number of
  // visitors this will ever see, and short enough to keep keys tidy.
  const hash = crypto.createHmac("sha256", SALT).update(ip).digest("hex").slice(0, 16);
  return "anon:" + hash;
}

/**
 * Returns { ok: true } or { ok: false, retryAfter } (seconds).
 * bucket: a short name for the endpoint, e.g. "ai".
 */
export async function checkRate(req, user, { bucket, limit, windowSec }) {
  try {
    const key = bucket + ":" + identify(req, user);
    const now = Date.now();
    const prev = (await kvGet(WINDOW_OWNER, key)) || null;
    const startedAt = prev && typeof prev.startedAt === "number" ? prev.startedAt : 0;
    const count = prev && typeof prev.count === "number" ? prev.count : 0;

    if (!startedAt || now - startedAt > windowSec * 1000) {
      await kvSet(WINDOW_OWNER, key, { startedAt: now, count: 1, updatedAt: new Date().toISOString() });
      return { ok: true };
    }
    if (count >= limit) {
      return { ok: false, retryAfter: Math.max(1, Math.ceil((startedAt + windowSec * 1000 - now) / 1000)) };
    }
    await kvSet(WINDOW_OWNER, key, { startedAt, count: count + 1, updatedAt: new Date().toISOString() });
    return { ok: true };
  } catch (e) {
    // If the limiter itself fails, let the request through rather than taking
    // the product down. Availability matters more than a perfect count here.
    return { ok: true };
  }
}

/** Convenience wrapper: responds with 429 and returns true if the caller was blocked. */
export async function limited(req, res, user, opts) {
  const r = await checkRate(req, user, opts);
  if (r.ok) return false;
  res.setHeader("Retry-After", String(r.retryAfter));
  res.status(429).json({
    error: "rate_limited",
    message: "Too many requests just now. Please wait a moment and try again.",
    retryAfter: r.retryAfter,
  });
  return true;
}
