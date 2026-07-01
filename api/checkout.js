import Stripe from "stripe";

const priceFor = (plan, annual) => ({
  starter: annual ? process.env.STRIPE_PRICE_STARTER_ANNUAL : process.env.STRIPE_PRICE_STARTER_MONTHLY,
  growth: annual ? process.env.STRIPE_PRICE_GROWTH_ANNUAL : process.env.STRIPE_PRICE_GROWTH_MONTHLY,
}[plan]);

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
