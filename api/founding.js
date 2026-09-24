import { kvGet } from "./_auth.js";

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
  const active = !!(process.env.STRIPE_COUPON_FOUNDING_MONTHLY && process.env.STRIPE_COUPON_FOUNDING_ANNUAL);
  return { total: FOUNDING_TOTAL, taken: n, left: Math.max(0, FOUNDING_TOTAL - n), active };
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
  return res.status(200).json(await foundingState());
}
