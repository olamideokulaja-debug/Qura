import Stripe from "stripe";

const priceFor = (plan, annual) => {
  const period = annual ? "ANNUAL" : "MONTHLY";
  const parts = String(plan || "").split(":");
  const group = parts.length > 1 ? parts[0].toUpperCase() : "";
  const key = (parts.length > 1 ? parts[1] : parts[0]).toUpperCase();
  const specific = group ? process.env["STRIPE_PRICE_" + group + "_" + key + "_" + period] : null;
  const generic = process.env["STRIPE_PRICE_" + key + "_" + period];
  return specific || generic || null;
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return res.status(500).json({ error: "Stripe is not configured" });
  const { plan, annual, userId, email } = req.body || {};
  const price = priceFor(plan, annual);
  if (!price) return res.status(400).json({ error: "No Stripe price configured for plan: " + plan });
  try {
    const stripe = new Stripe(key);
    const origin = req.headers.origin || ("https://" + req.headers.host);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],
      customer_email: email || undefined,
      client_reference_id: userId || undefined,
      metadata: { userId: userId || "", plan },
      subscription_data: { metadata: { userId: userId || "", plan } },
      success_url: origin + "/?billing=success",
      cancel_url: origin + "/?billing=cancelled",
    });
    res.status(200).json({ url: session.url });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
}
