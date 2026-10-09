import { sendAccess, sbAdmin } from "./_send.js";
import { getUser, kvGet, kvSet } from "./_auth.js";
import { SEND_PRICES, salesState, FOUNDING_PLACES } from "./_sendbilling.js";

// SEND Intelligence offer (week 6).
//   GET  /api/send-offer   signed in: whether this account has SEND, prices, whether sales are open,
//                          Founding SEND Partner places left, and whether Stripe is set up.
//   POST /api/send-offer   founders only: { open, opensNote, foundingActive, foundingPlaces }
// Sales are closed by default, so Social Personnel's 3-month head start holds until a founder
// opens them.

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const user = await getUser(req);
  if (!user || user._preview) return res.status(401).json({ error: "Sign in required" });
  const access = await sendAccess(req);

  if (req.method === "POST") {
    if (!access.founder) return res.status(403).json({ error: "Founders only" });
    const b = req.body || {};
    const cur = (await kvGet("shared", "send_sales")) || {};
    const next = {
      ...cur,
      open: b.open === undefined ? cur.open === true : b.open === true,
      opensNote: b.opensNote === undefined ? cur.opensNote || null : String(b.opensNote || "").slice(0, 160) || null,
      foundingActive: b.foundingActive === undefined ? cur.foundingActive !== false : b.foundingActive !== false,
      foundingPlaces: b.foundingPlaces === undefined ? cur.foundingPlaces || FOUNDING_PLACES : Math.max(0, Math.min(50, Number(b.foundingPlaces) || 0)),
      updatedAt: new Date().toISOString(), updatedBy: user.email || null,
    };
    await kvSet("shared", "send_sales", next);
    return res.status(200).json({ ok: true, sales: await salesState() });
  }
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  let plan = null;
  try { const sb = sbAdmin(); if (sb) { const { data } = await sb.from("supplier_sector_entitlements").select("plan_code,status").eq("user_id", user.id).eq("sector_code", "SEND").maybeSingle(); plan = data || null; } } catch (e) {}
  const stripeReady = ["STRIPE_PRICE_SEND_ADDON_MONTHLY", "STRIPE_PRICE_SEND_ADDON_ANNUAL", "STRIPE_PRICE_SEND_BUNDLE_MONTHLY", "STRIPE_PRICE_SEND_BUNDLE_ANNUAL"].every((k) => Boolean(process.env[k]));
  return res.status(200).json({
    hasAccess: access.ok, founder: Boolean(access.founder), entitlement: plan,
    sales: await salesState(), prices: SEND_PRICES, stripeReady,
    foundingCoupon: Boolean(process.env.STRIPE_COUPON_SEND_FOUNDING),
  });
}
