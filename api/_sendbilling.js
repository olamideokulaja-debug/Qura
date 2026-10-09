// SEND Intelligence billing (week 6): the add-on, the Growth + SEND bundle and the Founding SEND
// Partner offer. Decided by Olamide on 9 October 2026:
//   SEND add-on   £1,200 a month, or £999 a month billed annually (the Supplier Growth price)
//   Bundle        Supplier Growth + SEND, £1,999 a month, or £1,665 a month billed annually
//   Founding SEND Partner: the first 5 SEND customers after Social Personnel's 3-month head start
//   get 50% off for 12 months, with no setup fee.
// Prices and the coupon live in Stripe; their ids are Vercel settings:
//   STRIPE_PRICE_SEND_ADDON_MONTHLY, STRIPE_PRICE_SEND_ADDON_ANNUAL,
//   STRIPE_PRICE_SEND_BUNDLE_MONTHLY, STRIPE_PRICE_SEND_BUNDLE_ANNUAL,
//   STRIPE_COUPON_SEND_FOUNDING (50% off, repeating for 12 months).
// Sales stay closed until a founder opens them (kv shared/send_sales), so Social Personnel's
// head start is honoured without anyone remembering a date.
import { kvGet, kvSet } from "./_auth.js";

export const SEND_PLANS = { "send:addon": "addon", "send:bundle": "bundle" };
export const SEND_PRICES = {
  addon: { monthly: 1200, annualMonthly: 999 },
  bundle: { monthly: 1999, annualMonthly: 1665 },
};
export const FOUNDING_PLACES = 5;

export async function salesState() {
  const s = (await kvGet("shared", "send_sales")) || {};
  const taken = (await kvGet("metrics", "send_founding_taken")) || [];
  const places = Number(s.foundingPlaces) > 0 ? Number(s.foundingPlaces) : FOUNDING_PLACES;
  const used = Array.isArray(taken) ? taken.length : 0;
  return {
    open: s.open === true,
    opensNote: s.opensNote || null,
    founding: { places, used, left: Math.max(0, places - used), active: s.foundingActive !== false },
  };
}

export async function recordFounding(session, uid) {
  const taken = (await kvGet("metrics", "send_founding_taken")) || [];
  const list = Array.isArray(taken) ? taken : [];
  if (!list.some((t) => t.session === session)) {
    list.push({ session, uid: uid || null, at: new Date().toISOString() });
    await kvSet("metrics", "send_founding_taken", list);
  }
}

// Write or update the SEND entitlement. Never touches the healthcare plan (qura_plan).
export async function setSendEntitlement(sb, uid, plan, status, note) {
  if (!sb || !uid) return;
  await sb.from("supplier_sector_entitlements").upsert({
    user_id: String(uid), sector_code: "SEND", plan_code: SEND_PLANS[plan] || plan || "addon",
    status, starts_at: new Date().toISOString(), expires_at: null, granted_by: "stripe", note: String(note || "").slice(0, 200),
  }, { onConflict: "user_id,sector_code" });
}
