import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const config = { api: { bodyParser: false } };

function rawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

import { alertFounders } from "./_alert.js";
import { sendMailEach, owners, adminClient } from "./_waitlist.js";
import { bump } from "./_metrics.js";
import { kvGet, kvSet } from "./_auth.js";

// When a customer paid without being signed in, the payment carries no account
// id and the plan was never applied. Fall back to the account with the same
// email address.
async function userIdForEmail(email) {
  try {
    const admin = adminClient();
    if (!admin || !email) return null;
    const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const u = ((data && data.users) || []).find((x) => String(x.email || "").toLowerCase() === String(email).toLowerCase());
    return u ? u.id : null;
  } catch (e) { return null; }
}

// Money in or out is something the founders should hear about the moment it
// happens, not when they next open Stripe. Never throws.
const money = (amount, currency) =>
  amount == null ? "" : (String(currency || "gbp").toUpperCase() === "GBP" ? "£" : String(currency).toUpperCase() + " ") + (amount / 100).toFixed(2);
async function tellFounders(subject, lines) {
  try {
    const to = owners();
    if (!to.length) return;
    const esc = (v) => String(v == null ? "" : v).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
    const html = '<div style="font-family:Inter,Arial,sans-serif;color:#0A1730;line-height:1.6">' +
      lines.filter(Boolean).map((l) => "<p style=\"margin:0 0 8px\">" + esc(l) + "</p>").join("") +
      '<p style="font-size:13px;color:#5A6783;margin-top:16px">Full details are in your Stripe dashboard.</p></div>';
    await sendMailEach(to, subject, html);
  } catch (e) {}
}

export default async function handler(req, res) {
  const key = process.env.STRIPE_SECRET_KEY;
  const whsec = process.env.STRIPE_WEBHOOK_SECRET;
  const sbUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const sbService = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key || !whsec) return res.status(500).json({ error: "Stripe not configured" });

  const stripe = new Stripe(key);
  let event;
  try {
    const raw = await rawBody(req);
    event = stripe.webhooks.constructEvent(raw, req.headers["stripe-signature"], whsec);
  } catch (e) {
    await alertFounders("stripe-signature", "Stripe webhook signature rejected",
      "A call to /api/stripe-webhook failed signature verification. If this is not a probe, STRIPE_WEBHOOK_SECRET may be wrong or out of date, and payments will not be applied to accounts.\n\n" + String(e.message || e));
    return res.status(400).send("Webhook signature error: " + e.message);
  }

  const setPlan = async (userId, plan) => {
    if (!sbUrl || !sbService || !userId) return;
    const sb = createClient(sbUrl, sbService);
    await sb.from("kv").upsert(
      { owner: userId, key: "qura_plan", value: JSON.stringify(plan) },
      { onConflict: "owner,key" }
    );
  };

  try {
    if (event.type === "checkout.session.completed") {
      const s = event.data.object;
      const who = (s.customer_details && s.customer_details.email) || s.customer_email || "unknown email";
      const paid = money(s.amount_total, s.currency);
      if (s.metadata && s.metadata.introId) {
        // An introduction fee. This used to fall through to setPlan with no
        // plan, which could wipe the buyer's plan, and nothing recorded that
        // the introduction had been paid for.
        const sb = sbUrl && sbService ? createClient(sbUrl, sbService) : null;
        if (sb) {
          const { data } = await sb.from("kv").select("value").eq("owner", "shared").eq("key", "intro_queue").maybeSingle();
          let queue = [];
          try { queue = JSON.parse((data && data.value) || "[]"); } catch (e) { queue = []; }
          const item = (Array.isArray(queue) ? queue : []).find((q) => q.id === s.metadata.introId);
          if (item) {
            item.status = "Paid, awaiting register check";
            item.paidAt = new Date().toISOString();
            item.paid = paid;
            item.stripeSession = s.id;
            await sb.from("kv").upsert({ owner: "shared", key: "intro_queue", value: JSON.stringify(queue) }, { onConflict: "owner,key" });
          }
        }
        await tellFounders("Payment received: introduction fee " + paid, [
          who + " paid " + paid + " for an introduction.",
          "Introduction " + s.metadata.introId + " is now marked paid. Check the clinician's registration in Admin before the introduction is made.",
        ]);
        await bump("paid");
      } else {
        const plan = (s.metadata && s.metadata.plan) || null;
        const uid = s.client_reference_id || (s.metadata && s.metadata.userId) || (await userIdForEmail(who));
        if (plan && uid) await setPlan(uid, plan);
        await bump("paid");
        if (s.metadata && s.metadata.founding === "1") {
          const taken = (await kvGet("metrics", "founding_taken")) || [];
          const list = Array.isArray(taken) ? taken : [];
          if (!list.some((t) => t.session === s.id)) {
            list.push({ session: s.id, uid: uid || null, at: new Date().toISOString() });
            await kvSet("metrics", "founding_taken", list);
          }
        }
        if (plan && !uid) {
          await alertFounders("stripe-no-account", "Payment with no matching Qura account", {
            email: who, plan, session: s.id,
            action: "Ask them which email they use for Qura, then set the plan in Admin.",
          });
        }
        await tellFounders("New subscription: " + (plan || "plan not recorded") + (paid ? " (" + paid + ")" : "") + (s.metadata && s.metadata.founding === "1" ? ", founding customer" : ""), [
          who + " has started a paid subscription." + (s.metadata && s.metadata.founding === "1" ? " They took a founding-customer place." : ""),
          "Plan: " + (plan || "not recorded on the payment. Set it by hand in Admin."),
          paid ? "First payment: " + paid + (s.mode === "subscription" ? ", then recurring." : ".") : "",
        ]);
      }
    } else if (event.type === "customer.subscription.updated") {
      const sub = event.data.object;
      if (sub.status === "active" || sub.status === "trialing") await setPlan(sub.metadata?.userId, sub.metadata?.plan);
      const prev = (event.data.previous_attributes || {});
      if (sub.cancel_at_period_end && prev.cancel_at_period_end === false) {
        await tellFounders("Subscription set to cancel: " + (sub.metadata?.plan || "plan"), [
          "A customer has cancelled their " + (sub.metadata?.plan || "") + " subscription." +
            (sub.current_period_end ? " It stays active until " + new Date(sub.current_period_end * 1000).toLocaleDateString("en-GB") + "." : " It stays active until the end of the period already paid for."),
        ]);
      }
    } else if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object;
      await setPlan(sub.metadata?.userId, null); // subscription ended -> free tier
      await tellFounders("Subscription ended: " + (sub.metadata?.plan || "plan"), [
        "A " + (sub.metadata?.plan || "") + " subscription has ended and the account is back on the free plan.",
      ]);
    } else if (event.type === "invoice.payment_failed") {
      const inv = event.data.object;
      await tellFounders("Payment failed: " + money(inv.amount_due, inv.currency), [
        "A subscription payment of " + money(inv.amount_due, inv.currency) + " from " + (inv.customer_email || "a customer") + " failed. Stripe will retry automatically.",
      ]);
    }
  } catch (e) {
    // Still return 200 so Stripe does not retry forever, but do not let it pass
    // unnoticed: at this point the customer has paid and their plan may not have
    // been written.
    await alertFounders("stripe-webhook", "Stripe payment received but not applied", {
      eventType: event && event.type,
      eventId: event && event.id,
      error: String(e.message || e),
      action: "Check the customer in Stripe and set their plan by hand if needed.",
    });
  }

  res.status(200).json({ received: true });
}
