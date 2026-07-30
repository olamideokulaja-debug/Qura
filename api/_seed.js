// Seeded records: the illustrative roles, demand and clinicians that make the
// product look populated before there is real supply and demand.
//
// Two rules:
//   1. They switch themselves off at launch. No deploy needed, no one to
//      remember, no risk of a fictional role still being on the platform in
//      October because everyone was busy on launch day.
//   2. Nothing seeded can be acted on. A clinician cannot apply to an invented
//      role, and a supplier cannot pay £99 for an introduction to a person who
//      does not exist.

// 22 September 2026, 09:00 UK time, matching the countdown on the website.
export const LAUNCH_AT = Date.parse("2026-09-22T08:00:00Z");

// Escape hatches, both optional:
//   SEED_ENABLED=false  turns seeded records off before the date
//   SEED_ENABLED=true   keeps them on after it (for a demo, deliberately)
function override() {
  const v = (process.env.SEED_ENABLED || "").trim().toLowerCase();
  if (v === "false" || v === "0" || v === "off") return false;
  if (v === "true" || v === "1" || v === "on") return true;
  return null;
}

/** Should seeded records be included in responses? */
export function seedActive() {
  const o = override();
  if (o !== null) return o;
  return Date.now() < LAUNCH_AT;
}

/** Identifiers belonging to seeded records, so they can never be acted on. */
export function isSeededId(id) {
  const s = String(id || "");
  return s.startsWith("op_") || s.startsWith("dm_") || s.startsWith("sample_");
}

/**
 * Standard refusal when someone tries to act on a seeded record. Kept in one
 * place so the wording is the same everywhere.
 */
export function refuseSeeded(res) {
  return res.status(409).json({
    error: "illustrative_listing",
    message: "This is an illustrative listing shown before launch, so it cannot be actioned. Real listings appear from 22 September 2026.",
  });
}
