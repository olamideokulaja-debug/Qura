import Stripe from "stripe";
import { getUser, kvGet, kvSet } from "./_auth.js";

// POST /api/introduction-checkout { clinicianId, handle, profession, country }
// Creates a Stripe Checkout session for the introduction fee and records a pending
// introduction. On success (via redirect), the intro is marked paid. Also notifies founders.
const FOUNDERS = ["olamideokulaja@qurahealth.org", "olafolawiyo@qurahealth.org"];
const INTRO_FEE_GBP = Number(process.env.INTRO_FEE_GBP || 49); // set INTRO_FEE_GBP in Vercel to change

async function notifyFounders(subject, text) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  const from = process.env.MAIL_FROM || "Qura <noreply@qurahealth.org>";
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: FOUNDERS, subject, text }),
    });
  } catch (e) {}
}

export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Sign in required" });
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { clinicianId, handle, profession, country } = req.body || {};
  if (!clinicianId) return res.status(400).json({ error: "clinicianId required" });

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return res.status(500).json({ error: "Payments not configured" });

  // record a pending introduction
  const entry = {
    id: "intro_" + Date.now(), clinicianId, handle: handle || "", profession: profession || "",
    country: country || "", status: "Pending payment", supplier: user.id, supplierEmail: user.email,
    fee: INTRO_FEE_GBP, at: new Date().toISOString(),
  };
  const queue = (await kvGet("shared", "intro_queue")) || [];
  await kvSet("shared", "intro_queue", [entry, ...(Array.isArray(queue) ? queue : [])]);

  // notify founders that a paid introduction was initiated
  await notifyFounders(
    "New introduction request (£" + INTRO_FEE_GBP + ")",
    "Supplier: " + user.email + "\nClinician: " + (handle || clinicianId) + " (" + profession + ", " + country + ")\nStatus: checkout started.\nReview in the admin queue."
  );

  try {
    const stripe = new Stripe(key);
    const origin = req.headers.origin || ("https://" + req.headers.host);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{
        price_data: {
          currency: "gbp",
          product_data: { name: "Qura introduction", description: "Introduction to a verified " + (profession || "clinician") },
          unit_amount: INTRO_FEE_GBP * 100,
        },
        quantity: 1,
      }],
      customer_email: user.email || undefined,
      client_reference_id: user.id,
      metadata: { supplier: user.id, clinicianId, introId: entry.id },
      success_url: origin + "/?intro=success",
      cancel_url: origin + "/?intro=cancelled",
    });
    return res.status(200).json({ url: session.url, fee: INTRO_FEE_GBP });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
