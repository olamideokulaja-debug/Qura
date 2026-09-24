import { kvGet, kvSet } from "./_auth.js";

// A simple count of each step of the paying journey, per day, so the founders
// can see where people stop: sign-up, role chosen, trial started, a locked
// screen seen, pricing seen, checkout started, paid.
//
// Counts only. No names, no emails, no IP addresses. Read-then-write is not
// atomic, so two events in the same instant can lose one count; for a funnel
// read by eye that is an acceptable trade for needing no new table.

export const EVENTS = [
  "signup", "role_picked", "trial_started", "trial_extended", "pricing_viewed",
  "locked_viewed", "checkout_started", "paid", "enquiry", "billing_portal",
];

export async function bump(event, n = 1) {
  if (!EVENTS.includes(event)) return;
  try {
    const day = new Date().toISOString().slice(0, 10);
    const all = (await kvGet("metrics", "funnel")) || {};
    const d = all[day] || {};
    d[event] = (d[event] || 0) + n;
    all[day] = d;
    // Keep a year of days.
    const days = Object.keys(all).sort();
    while (days.length > 366) delete all[days.shift()];
    await kvSet("metrics", "funnel", all);
  } catch (e) {}
}

export async function funnel(sinceDays = 30) {
  const all = (await kvGet("metrics", "funnel")) || {};
  const from = new Date(Date.now() - sinceDays * 86400000).toISOString().slice(0, 10);
  const totals = {};
  for (const [day, counts] of Object.entries(all)) {
    if (day < from) continue;
    for (const [k, v] of Object.entries(counts || {})) totals[k] = (totals[k] || 0) + v;
  }
  return { sinceDays, totals, days: all };
}
