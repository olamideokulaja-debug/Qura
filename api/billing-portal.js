import Stripe from "stripe";
import { getUser } from "./_auth.js";
import { bump } from "./_metrics.js";

// POST /api/billing-portal -> { url }
//
// Opens Stripe's own billing page, where a customer can change card, download
// invoices, switch plan or cancel. There was no way to do any of that before,
// which is exactly the thing that makes a buyer hesitate at checkout.
//
// Needs the customer portal switched on once in the Stripe dashboard
// (Settings > Billing > Customer portal > Activate).

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const user = await getUser(req);
  if (!user || user._preview) return res.status(401).json({ error: "Sign in required" });
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return res.status(500).json({ error: "Billing is not configured." });

  try {
    const stripe = new Stripe(key);
    const found = await stripe.customers.list({ email: user.email, limit: 5 });
    const customer = (found.data || []).find((c) => !c.deleted);
    if (!customer) {
      return res.status(404).json({ error: "We could not find a billing account for " + user.email + ". If you paid with a different email, contact support@qurahealth.org." });
    }
    const origin = req.headers.origin || ("https://" + req.headers.host);
    const session = await stripe.billingPortal.sessions.create({ customer: customer.id, return_url: origin + "/" });
    await bump("billing_portal");
    return res.status(200).json({ url: session.url });
  } catch (e) {
    const msg = String((e && e.message) || e);
    if (/configuration|portal/i.test(msg)) {
      return res.status(503).json({ error: "Online billing management is being switched on. Email support@qurahealth.org and we will make the change for you today." });
    }
    return res.status(500).json({ error: "Could not open billing just now. Please try again." });
  }
}
