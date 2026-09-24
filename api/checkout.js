import { limited } from "./_ratelimit.js";
import Stripe from "stripe";
import { getUser } from "./_auth.js";
import { foundingState } from "./founding.js";
import { bump } from "./_metrics.js";

const ONE_OFF_GROUPS = ["SESSION", "WORKSHOP"];

const priceFor = (plan, annual) => {
  const period = annual ? "ANNUAL" : "MONTHLY";
  const parts = String(plan || "").split(":");
  const group = parts.length > 1 ? parts[0].toUpperCase() : "";
  const key = (parts.length > 1 ? parts[1] : parts[0]).toUpperCase();
  const tries = [];
  if (group) { tries.push("STRIPE_PRICE_" + group + "_" + key + "_" + period); tries.push("STRIPE_PRICE_" + group + "_" + key); }
  tries.push("STRIPE_PRICE_" + key + "_" + period);
  tries.push("STRIPE_PRICE_" + key);
  for (const t of tries) { if (process.env[t]) return process.env[t]; }
  return null;
};

const modeFor = (plan) => {
  const group = String(plan || "").split(":")[0].toUpperCase();
  return ONE_OFF_GROUPS.includes(group) ? "payment" : "subscription";
};

// Free, trial and custom tiers never reach Stripe. Before 24 September a
// clinician's "Join free" button sent the bare key "starter" here and opened a
// checkout for the £450 supplier plan.
const NOT_SOLD = ["free", "trial", "pilot", "enterprise", "network"];

export default async function handler(req, res) {
  // Limited by network address, since checkout can be reached before sign-in.
  if (await limited(req, res, null, { bucket: "checkout", limit: 20, windowSec: 3600 })) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return res.status(500).json({ error: "Stripe is not configured" });

  const body = req.body || {};
  const plan = String(body.plan || "");
  const annual = !!body.annual;
  const tier = plan.split(":").pop().toLowerCase();
  if (NOT_SOLD.includes(tier)) return res.status(400).json({ error: "That plan is not bought online." });
  if (plan.startsWith("clinician:") && tier !== "growth") return res.status(400).json({ error: "Clinician accounts are free." });
  // Every paid button names its group ("agency:growth"). A bare key could only
  // come from an old page and could charge the wrong group's price.
  if (!plan.includes(":")) return res.status(400).json({ error: "Please choose your plan from the Pricing page." });

  // The signed-in account wins over anything the browser claims, so a payment
  // is always attached to the person who made it.
  const user = await getUser(req);
  const signedIn = user && !user._preview ? user : null;
  const userId = (signedIn && signedIn.id) || String(body.userId || "");
  const email = (signedIn && signedIn.email) || String(body.email || "");

  const price = priceFor(plan, annual);
  if (!price) return res.status(400).json({ error: "No Stripe price configured for plan: " + plan });
  const mode = modeFor(plan);

  try {
    const stripe = new Stripe(key);
    const origin = req.headers.origin || ("https://" + req.headers.host);
    const params = {
      mode,
      line_items: [{ price, quantity: 1 }],
      customer_email: email || undefined,
      client_reference_id: userId || undefined,
      metadata: { userId: userId || "", plan },
      billing_address_collection: "required",
      success_url: origin + "/?billing=success",
      cancel_url: origin + "/?billing=cancelled",
    };

    // Founding offer: the first 10 workforce suppliers on Growth pay the
    // Starter price for 12 months. Applied automatically; otherwise a customer
    // can type a promotion code the founders have given them.
    let founding = false;
    if (plan === "agency:growth" && mode === "subscription") {
      const f = await foundingState();
      const coupon = annual ? process.env.STRIPE_COUPON_FOUNDING_ANNUAL : process.env.STRIPE_COUPON_FOUNDING_MONTHLY;
      if (f.active && f.left > 0 && coupon) {
        params.discounts = [{ coupon }];
        params.metadata.founding = "1";
        founding = true;
      }
    }
    if (!founding) params.allow_promotion_codes = true;

    if (mode === "subscription") {
      params.subscription_data = { metadata: { userId: userId || "", plan, founding: founding ? "1" : "" } };
    }
    const session = await stripe.checkout.sessions.create(params);
    await bump("checkout_started");
    res.status(200).json({ url: session.url, founding });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
}
