import { kvGet, getUser } from "./_auth.js";
import { FP_DEADLINE, offerOpen, foundingOf, isRunning, planName } from "./_founding.js";
import { orgCheckOf, roleOf } from "./_orgcheck.js";

// GET /api/founding -> { total, taken, left, active }
//
// The founding-customer offer: the first 10 workforce suppliers get Growth at
// the Starter price, locked for 12 months. It is applied at checkout by a
// Stripe coupon (api/checkout.js), and each paid founding place is recorded by
// the Stripe webhook, so this count is of real payments only.
//
// active is false until the coupons exist in Stripe and their ids are set as
// STRIPE_COUPON_FOUNDING_MONTHLY and STRIPE_COUPON_FOUNDING_ANNUAL. Until then
// the pricing page does not show the offer.

export const FOUNDING_TOTAL = 10;

export async function foundingState() {
  const taken = (await kvGet("metrics", "founding_taken")) || [];
  const n = Array.isArray(taken) ? taken.length : 0;
  // Retired 30 September 2026: replaced by the Founding Partner offer
  // (api/_founding.js). Kept so the counts of anyone who took a place stay
  // readable. The pricing page, checkout and emails all check active.
  const active = false;
  return { total: FOUNDING_TOTAL, taken: n, left: Math.max(0, FOUNDING_TOTAL - n), active };
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const base = { ...(await foundingState()), offer: { open: offerOpen(), deadline: new Date(FP_DEADLINE - 1).toISOString() } };
  // Signed in: this account's own Founding Partner status, for the banner.
  if ((req.headers.authorization || "").startsWith("Bearer ")) {
    res.setHeader("Cache-Control", "private, no-store");
    const user = await getUser(req);
    if (!user || !user.id) return res.status(200).json(base);
    const rec = await foundingOf(user.id);
    const running = isRunning(rec);
    let pendingCheck = false;
    if (!rec) {
      const role = await roleOf(user.id);
      if (role && role !== "clinician") { const chk = await orgCheckOf(user.id); pendingCheck = !chk || chk.status === "pending"; }
    }
    return res.status(200).json({ ...base, me: {
      status: rec ? rec.status : null, running, until: rec && rec.until ? rec.until : null,
      plan: rec ? rec.plan : null, planName: rec ? planName(rec.plan) : null, pendingCheck,
    } });
  }
  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
  return res.status(200).json(base);
}
