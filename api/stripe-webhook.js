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
      await setPlan(s.client_reference_id || s.metadata?.userId, s.metadata?.plan);
    } else if (event.type === "customer.subscription.updated") {
      const sub = event.data.object;
      if (sub.status === "active" || sub.status === "trialing") await setPlan(sub.metadata?.userId, sub.metadata?.plan);
    } else if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object;
      await setPlan(sub.metadata?.userId, null); // subscription ended -> free tier
    }
  } catch (e) { /* return 200 anyway so Stripe does not retry on our internal error */ }

  res.status(200).json({ received: true });
}
