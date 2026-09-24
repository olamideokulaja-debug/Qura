// Client-side Stripe helper. Only redirects to Checkout when billing is
// switched on (VITE_BILLING_ENABLED=true) and Supabase auth is present.
//
// Sends the signed-in session so the server attaches the payment to the
// account that made it, rather than trusting an id from the browser. Returns
// true when the browser is on its way to Stripe, false otherwise, and never
// pops an alert: the caller shows the message in the page.
import { supabase } from "./supabase.js";

export const billingEnabled = import.meta.env.VITE_BILLING_ENABLED === "true";

export async function startCheckout(plan, annual = true) {
  if (!supabase) return false;
  try {
    const { data } = await supabase.auth.getSession();
    const s = data?.session;
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: Object.assign({ "content-type": "application/json" }, s?.access_token ? { authorization: "Bearer " + s.access_token } : {}),
      body: JSON.stringify({ plan, annual, userId: s?.user?.id, email: s?.user?.email }),
    });
    const j = await res.json();
    if (j.url) { window.location.href = j.url; return true; }
    return false;
  } catch (e) { return false; }
}
