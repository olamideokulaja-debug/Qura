// Agency introduction fees, charged automatically (1 October 2026).
//
// An agency saves a card once, through Stripe. When a hospital asks to meet
// one of its clinicians, Qura's introduction fee is charged to that card there
// and then, and the request goes straight to the agency. Stripe emails the
// receipt. Nobody raises an invoice.
//
// If the charge cannot go through (no card yet, card declined, or the bank
// wants the cardholder to approve it), the agency is emailed a payment link
// instead, and the requester's details are sent the moment it is paid
// (api/stripe-webhook.js). Paying through the link also saves the card, so
// the next one is automatic.
//
// Storage: kv(owner = agency id, key = "agency_billing")
//   { customerId, pm, brand, last4, exp, setAt, failedAt, failReason }
// Card numbers never touch Qura: Stripe holds them.

import Stripe from "stripe";
import { kvGet, kvSet } from "./_auth.js";
import { sign, verify } from "./_waitlist.js";

export const BILL_KEY = "agency_billing";
const SITE = "https://www.qurahealth.org";

export const stripeClient = () => (process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null);

export async function getBilling(agencyId) {
  const b = await kvGet(agencyId, BILL_KEY);
  return b && typeof b === "object" && !Array.isArray(b) ? b : {};
}
export const cardOf = (b) => (b && b.pm ? { brand: b.brand || "card", last4: b.last4 || "", exp: b.exp || "" } : null);
export const cardLabel = (c) => (c ? String(c.brand || "card").replace(/^./, (x) => x.toUpperCase()) + " ending " + c.last4 : "");

// Signed links, so an emailed link works without signing in and cannot be
// pointed at another agency or introduction.
export const cardLink = (agencyId) => SITE + "/api/agency-pay?a=" + encodeURIComponent(agencyId) + "&t=" + sign("agencycard:" + agencyId, "card");
export const checkCardLink = (agencyId, t) => verify("agencycard:" + agencyId, "card", String(t || ""));
export const payLink = (introId) => SITE + "/api/agency-pay?i=" + encodeURIComponent(introId) + "&t=" + sign("agencypay:" + introId, "pay");
export const checkPayLink = (introId, t) => verify("agencypay:" + introId, "pay", String(t || ""));

export async function ensureCustomer(s, agencyId, ag) {
  const b = await getBilling(agencyId);
  if (b.customerId) return b.customerId;
  const c = await s.customers.create({
    email: ag.email || undefined, name: ag.name || undefined,
    metadata: { agencyId, purpose: "Qura agency introduction fees" },
  });
  await kvSet(agencyId, BILL_KEY, { ...b, customerId: c.id });
  return c.id;
}

// A Stripe page where the agency saves a card. Nothing is charged.
export async function cardSetupSession(agencyId, ag) {
  const s = stripeClient();
  if (!s) throw new Error("Payments are not configured.");
  const customer = await ensureCustomer(s, agencyId, ag);
  const meta = { kind: "agency_card", agencyId };
  const session = await s.checkout.sessions.create({
    mode: "setup", currency: "gbp", customer, payment_method_types: ["card"],
    metadata: meta, setup_intent_data: { metadata: meta },
    success_url: SITE + "/api/agency-pay?done=card", cancel_url: SITE + "/api/agency-pay?done=cancelled",
  });
  return session.url;
}

// A Stripe page where the agency pays for one introduction. The card is kept
// for next time.
export async function introPaySession(agencyId, ag, intro, amountGbp) {
  const s = stripeClient();
  if (!s) throw new Error("Payments are not configured.");
  const customer = await ensureCustomer(s, agencyId, ag);
  const meta = { kind: "agency_intro", agencyId, agencyIntroId: intro.id };
  const session = await s.checkout.sessions.create({
    mode: "payment", customer, payment_method_types: ["card"],
    line_items: [{
      price_data: { currency: "gbp", unit_amount: Math.round(amountGbp * 100),
        product_data: { name: "Qura introduction fee", description: "Introduction request for " + (intro.clinicianProfession || "a clinician you represent") } },
      quantity: 1,
    }],
    payment_intent_data: { setup_future_usage: "off_session", metadata: meta, description: "Qura introduction fee " + intro.id },
    metadata: meta,
    success_url: SITE + "/api/agency-pay?done=paid", cancel_url: SITE + "/api/agency-pay?done=cancelled",
  });
  return session.url;
}

async function storeCard(s, agencyId, customer, pmId) {
  if (!pmId) return null;
  const pm = await s.paymentMethods.retrieve(pmId);
  try { await s.customers.update(customer, { invoice_settings: { default_payment_method: pmId } }); } catch (e) {}
  const b = await getBilling(agencyId);
  const card = pm.card || {};
  const next = {
    ...b, customerId: customer, pm: pmId, brand: card.brand || "card", last4: card.last4 || "",
    exp: card.exp_month ? String(card.exp_month).padStart(2, "0") + "/" + String(card.exp_year).slice(-2) : "",
    setAt: new Date().toISOString(), failedAt: null, failReason: null,
  };
  await kvSet(agencyId, BILL_KEY, next);
  return next;
}

// From the webhook: a card saved through the setup page.
export async function saveCardFromSetup(session) {
  const s = stripeClient();
  if (!s || !session.setup_intent) return null;
  const si = await s.setupIntents.retrieve(session.setup_intent);
  return storeCard(s, session.metadata.agencyId, session.customer || si.customer, si.payment_method);
}

// From the webhook: the card used on a payment page, kept for next time.
export async function saveCardFromPayment(session) {
  const s = stripeClient();
  if (!s || !session.payment_intent) return null;
  const pi = await s.paymentIntents.retrieve(session.payment_intent);
  return storeCard(s, session.metadata.agencyId, session.customer || pi.customer, pi.payment_method);
}

// Charge the saved card now. Never throws. The idempotency key means a retry
// of the same introduction can never charge twice.
export async function chargeIntro(agencyId, ag, intro, amountGbp) {
  const s = stripeClient();
  if (!s) return { ok: false, reason: "payments not configured" };
  const b = await getBilling(agencyId);
  if (!b.customerId || !b.pm) return { ok: false, reason: "no card saved" };
  try {
    const pi = await s.paymentIntents.create({
      amount: Math.round(amountGbp * 100), currency: "gbp", customer: b.customerId, payment_method: b.pm,
      off_session: true, confirm: true, receipt_email: ag.email || undefined,
      description: "Qura introduction fee " + intro.id,
      metadata: { kind: "agency_intro", agencyId, agencyIntroId: intro.id },
    }, { idempotencyKey: "agency-intro-" + intro.id });
    if (pi.status === "succeeded") return { ok: true, id: pi.id, card: cardOf(b) };
    return { ok: false, reason: "payment " + pi.status };
  } catch (e) {
    const reason = (e && (e.decline_code || e.code)) || String((e && e.message) || e);
    try { await kvSet(agencyId, BILL_KEY, { ...b, failedAt: new Date().toISOString(), failReason: String(reason).slice(0, 120) }); } catch (x) {}
    return { ok: false, reason };
  }
}

// Account deletion: remove the Stripe customer and its saved card. Payment
// records stay in Stripe, as UK tax law requires.
export async function deleteBilling(agencyId) {
  const b = await getBilling(agencyId);
  const s = stripeClient();
  if (!s || !b.customerId) return;
  try { await s.customers.del(b.customerId); } catch (e) {}
}
