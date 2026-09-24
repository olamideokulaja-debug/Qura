// Single source of truth for what each plan includes. Every endpoint checks against this.
// plan strings are stored as "group:key" (e.g. "supplier:growth") or a bare key.
// The webhook writes qura_plan; introduction-checkout and feature endpoints read it via planOf().

import { kvGet } from "./_auth.js";

// Normalise a stored plan value to a simple tier key.
export function tierOf(plan) {
  if (!plan) return "free";
  const parts = String(plan).split(":");
  const key = (parts.length > 1 ? parts[1] : parts[0]).toLowerCase();
  // trial/pilot behave as the top self-serve tier for the duration
  if (key === "trial" || key === "pilot") return "growth";
  return key; // free | starter | growth | enterprise | career | team | intelligence | network
}

// Map the two supplier labellings onto one internal ladder: 1=starter/team, 2=growth/intelligence, 3=enterprise/network
const SUPPLIER_RANK = { free: 0, starter: 1, team: 1, growth: 2, intelligence: 2, enterprise: 3, network: 3 };

// What each plan can do.
export const ENTITLEMENTS = {
  // suppliers
  supplierRank: (plan) => SUPPLIER_RANK[tierOf(plan)] ?? 0,
  // seats by tier
  seats: (plan) => ({ free: 1, starter: 3, team: 5, growth: 10, intelligence: 15, enterprise: 9999, network: 9999 }[tierOf(plan)] ?? 1),
  // international markets: Growth/Intelligence and above (Starter/Team is UK only)
  internationalMarkets: (plan) => (SUPPLIER_RANK[tierOf(plan)] ?? 0) >= 2,
  // AI assistant: Growth and above (explicitly a Growth feature)
  aiAssistant: (plan) => (SUPPLIER_RANK[tierOf(plan)] ?? 0) >= 2,
  // ICB & council intelligence and decision-maker contact details: Starter/Team
  // and above (24 September 2026: Starter used to unlock nothing premium, which
  // made the paid plan worse than the free trial).
  intelligence: (plan) => (SUPPLIER_RANK[tierOf(plan)] ?? 0) >= 1,
  // Exporting the directory in bulk: Growth/Intelligence and above.
  contactsExport: (plan) => (SUPPLIER_RANK[tierOf(plan)] ?? 0) >= 2,
  // introductions included (any paid supplier plan)
  introductionsIncluded: (plan) => (SUPPLIER_RANK[tierOf(plan)] ?? 0) >= 1,
  // clinician: Career+ gives priority visibility etc. (clinician core stays free)
  careerPlus: (plan) => tierOf(plan) === "career" || tierOf(plan) === "growth",
};

// Convenience: read a user's stored plan.
//
// Complimentary access (a referral month) lives in its own key, qura_comp,
// and is only honoured when the user has no paid plan of their own. A real
// purchase always wins, and the comp simply expires by date, so the Stripe
// webhook and the referral scheme can never fight over qura_plan.
// The founders' accounts are always entitled to at least Growth. Identified by
// account id, which a user cannot change, rather than by role: roles are
// written from the client, so "operator means Growth" would let anyone grant
// themselves Growth. A paid plan above Growth still wins.
const FOUNDER_IDS = new Set([
  "0235b440-acb2-4fed-9b08-5c6077243793", // olamideokulaja@qurahealth.org
  "b8aea6f6-41e0-4913-9deb-0b50d5e8eeb3", // olafolawiyo@qurahealth.org
  "aa58f73a-4d87-40f5-abc3-c1bc913d691a", // olamideokulaja@gmail.com
]);

// A trial lasts 7 days, plus 3 if extended once. The start is written by
// api/trial.js on the server; the browser can read it but cannot change it.
export const TRIAL_DAYS = 7;
export function trialActive(trial) {
  if (!trial || typeof trial.start !== "number") return false;
  const days = TRIAL_DAYS + (Number(trial.extra) || 0);
  return Date.now() < trial.start + days * 86400000;
}

// qura_plan and qura_trial can only be written by the server (Stripe webhook,
// api/trial.js, founder Admin). Database rules stop the browser writing them,
// so a plan here is one somebody paid for or a founder granted.
export async function planOf(userId) {
  const lift = (p) => (FOUNDER_IDS.has(userId) && (SUPPLIER_RANK[tierOf(p)] ?? 0) < 2 ? "supplier:growth" : p);
  try {
    let plan = await kvGet(userId, "qura_plan");
    const key = plan ? String(plan).split(":").pop().toLowerCase() : "";
    if (key === "trial" || key === "pilot") {
      const trial = await kvGet(userId, "qura_trial");
      plan = trialActive(trial) ? plan : null;
    }
    if (plan) return lift(plan);
    const comp = await kvGet(userId, "qura_comp");
    if (comp && comp.plan && comp.until && Date.parse(comp.until) > Date.now()) return lift(comp.plan);
    return lift(plan);
  } catch (e) { return lift(null); }
}

// Standard 402-style block payload the app understands as "upgrade to unlock".
export function upgradeBlock(res, feature, needed) {
  return res.status(403).json({
    error: "upgrade_required",
    feature,
    message: "Your plan doesn't include " + feature + ". Upgrade to " + needed + " to unlock it.",
    needed,
  });
}
