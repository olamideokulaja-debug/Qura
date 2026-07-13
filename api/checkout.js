import Stripe from "stripe";

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

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return res.status(500).json({ error: "Stripe is not configured" });
  const { plan, annual, userId, email } = req.body || {};
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
      success_url: origin + "/?billing=success",
      cancel_url: origin + "/?billing=cancelled",
    };
    if (mode === "subscription") params.subscription_data = { metadata: { userId: userId || "", plan } };
    const session = await stripe.checkout.sessions.create(params);
    res.status(200).json({ url: session.url });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
}
