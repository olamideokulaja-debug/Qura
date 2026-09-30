// The Founding Partner offer (agreed by the founders on 30 September 2026).
//
// Anyone who creates a Qura account by the end of 31 December 2026 (UK time)
// gets 12 months of the top plan for their group, free:
//
//   workforce suppliers, agencies, equipment makers  supplier:growth  (Growth)
//   hospitals, providers, GPs, care                   provider:growth  (Intelligence)
//   clinicians                                        clinician:growth (Career+)
//
// Paid introductions are still charged during the free year.
//
// When it starts:
//   organisations  when a founder confirms the organisation (api/_orgcheck.js)
//   clinicians     when they complete registration (api/clinician-register.js)
//
// The year is written to qura_plan, which the app already reads, and recorded
// at kv(owner = the user, key = "founding"). That key has no qura_ prefix, so
// database rules stop the browser writing it. A real payment always wins: the
// Stripe webhook marks the record paid, and a paid plan is never overwritten.

import { kvGet, kvSet } from "./_auth.js";

export const FP_KEY = "founding";
// Midnight at the end of 31 December 2026 in London. The UK is on GMT in
// December, so this is also UTC.
export const FP_DEADLINE = Date.parse("2027-01-01T00:00:00Z");
export const FP_MONTHS = 12;
export const FP_INTRO_FEE = 49;

const PROVIDERS = new Set(["hospital", "healthcare_provider", "gp", "care"]);
const PAID_KEYS = ["starter", "growth", "enterprise", "team", "intelligence", "network", "career"];

export const offerOpen = (t = Date.now()) => t < FP_DEADLINE;

// Did this account join in time? Judged on when the account was created, so an
// organisation that signed up on 30 December is not penalised if the founders
// confirm it on 2 January.
export function joinedInTime(user) {
  const t = Date.parse((user && user.created_at) || "");
  return isFinite(t) ? t < FP_DEADLINE : offerOpen();
}

export function planForRole(role) {
  const r = String(role || "");
  if (r === "clinician") return "clinician:growth";
  if (PROVIDERS.has(r)) return "provider:growth";
  return "supplier:growth";
}

export const planName = (plan) =>
  plan === "clinician:growth" ? "Career+" : plan === "provider:growth" ? "Intelligence" : "Growth";

export function addMonths(ms, n) {
  const d = new Date(ms);
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.getTime();
}

export async function foundingOf(userId) {
  const r = await kvGet(userId, FP_KEY);
  return r && typeof r === "object" ? r : null;
}

// Running now: granted, not yet ended, and not replaced by a paid plan.
export function isRunning(rec, t = Date.now()) {
  return Boolean(rec && !rec.paidAt && !rec.removedAt && typeof rec.until === "string" && t < Date.parse(rec.until));
}

export async function foundingActive(userId) {
  return isRunning(await foundingOf(userId));
}

// Start the free year. Idempotent: a second call returns the first record.
// Never replaces a plan somebody paid for.
export async function grantFounding(userId, role, by) {
  const cur = await foundingOf(userId);
  if (cur && !cur.removedAt) return { granted: false, already: true, record: cur };
  const plan = planForRole(role);
  const stored = await kvGet(userId, "qura_plan");
  const key = stored ? String(stored).split(":").pop().toLowerCase() : "";
  if (PAID_KEYS.includes(key) && !(cur && cur.plan === stored)) {
    // Already a paying customer. Recorded so the founders can decide by hand.
    const rec = { status: "skipped_paid", plan, paidPlan: stored, at: new Date().toISOString(), by: by || "" };
    await kvSet(userId, FP_KEY, rec);
    return { granted: false, paid: true, record: rec };
  }
  const start = Date.now();
  const rec = { status: "active", plan, start: new Date(start).toISOString(), until: new Date(addMonths(start, FP_MONTHS)).toISOString(), by: by || "" };
  const ok = await kvSet(userId, FP_KEY, rec);
  if (!ok) return { granted: false, error: "Could not save the Founding Partner record." };
  await kvSet(userId, "qura_plan", JSON.stringify(plan));
  return { granted: true, record: rec };
}

// A founder removes it (for example an organisation later found not to be real).
export async function removeFounding(userId, by) {
  const cur = await foundingOf(userId);
  if (!cur) return { ok: true, none: true };
  const rec = { ...cur, status: "removed", removedAt: new Date().toISOString(), removedBy: by || "" };
  await kvSet(userId, FP_KEY, rec);
  const plan = await kvGet(userId, "qura_plan");
  if (!cur.paidAt && plan === cur.plan) await kvSet(userId, "qura_plan", "null");
  return { ok: true, record: rec };
}

// Called by the Stripe webhook when a subscription is paid for.
export async function markPaid(userId) {
  const cur = await foundingOf(userId);
  if (!cur || cur.paidAt || cur.status !== "active") return;
  await kvSet(userId, FP_KEY, { ...cur, status: "converted", paidAt: new Date().toISOString() });
}

// Used by planOf: once the free year is over, the plan it granted ends too.
export async function expireIfDue(userId, plan) {
  const cur = await foundingOf(userId);
  if (!cur || cur.status !== "active" || cur.paidAt) return plan;
  if (Date.now() < Date.parse(cur.until)) return plan;
  if (plan !== cur.plan) return plan;
  await kvSet(userId, FP_KEY, { ...cur, status: "ended", endedAt: new Date().toISOString() });
  await kvSet(userId, "qura_plan", "null");
  return null;
}

export const ukDate = (iso) => {
  try { return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/London" }); }
  catch (e) { return String(iso || "").slice(0, 10); }
};
