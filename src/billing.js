// Client-side Stripe helper. Only redirects to Checkout when billing is
// switched on (VITE_BILLING_ENABLED=true) and Supabase auth is present.
import { supabase } from "./supabase.js";

export const billingEnabled = import.meta.env.VITE_BILLING_ENABLED === "true";

export async function startCheckout(plan, annual = true) {
  if (!supabase) { alert("Billing needs accounts (Supabase) to be enabled first."); return false; }
  try {
    const { data } = await supabase.auth.getSession();
    const s = data?.session;
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ plan, annual, userId: s?.user?.id, email: s?.user?.email }),
    });
    const j = await res.json();
    if (j.url) { window.location.href = j.url; return true; }
    alert(j.error || "Checkout is not available yet."); return false;
  } catch (e) { alert("Checkout failed: " + e); return false; }
}
