import { seedActive } from "./_seed.js";
import { getUser, kvGet, kvSet, kvListByKey } from "./_auth.js";
import { ENTITLEMENTS } from "./_entitlements.js";
import { orgVerified } from "./_orgcheck.js";
import { bandLabel, salaryFit, PREF_KEYS } from "./_comp.js";

// GET  /api/clinicians                 -> verified clinicians a supplier can shortlist
// GET  /api/clinicians?shortlist=1     -> this supplier's shortlist
// POST /api/clinicians {clinicianId}   -> add/remove from shortlist (toggle)
//
// Pulls REAL verified clinician profiles from the kv store. Privacy-safe: exposes only
// professional attributes (no name, email, or registration number) until an introduction
// is made. Falls back to a small sample set only if no real clinicians have verified yet.

const PROFILE_KEY = "clinician_profile";
const SHORTLIST_KEY = "supplier_shortlist";

const SAMPLE = [
  { id: "sample_1", handle: "Radiographer, MRI", profession: "Radiographer", spec: "MRI", country: "United Kingdom", region: "—", experience: "6 to 10 years", regBody: "HCPC", verified: true, fit: 96, sample: true },
  { id: "sample_2", handle: "Sonographer", profession: "Sonographer", spec: "General", country: "United Kingdom", region: "—", experience: "3 to 5 years", regBody: "HCPC", verified: true, fit: 90, sample: true },
];

// Verified means a founder opened the official public register and confirmed the
// number. It does NOT mean the clinician filled in every box.
//
// This function used to return true the moment all seven fields were present, so
// completing a form put you in front of suppliers labelled verified with nobody
// having checked anything. That is precisely the claim Qura sells against.
function isVerified(p) {
  if (!p || !p.verifiedAt) return false;
  const req = ["category", "profession", "regBody", "regNumber", "country", "experienceYears", "cvUploaded"];
  return req.every((k) => { const v = p[k]; return v !== undefined && v !== null && v !== "" && v !== false; });
}

// Turn a stored profile into a privacy-safe talent card. Deterministic id from owner.
function toCard(owner, p) {
  return {
    id: "cl_" + owner,                 // stable per clinician, not their raw id in the UI text
    handle: p.profession + (p.category && p.category !== p.profession ? "" : ""), // role label only
    profession: p.profession,
    spec: p.profession,                // spec detail can be added later
    country: p.country,
    region: p.country,                 // region not collected yet; show country
    experience: p.experienceYears,
    regBody: p.regBody,
    verified: true,
    availableFrom: p.availableFrom || null,
    // Permanent First (1 October 2026): the kinds of work wanted, Permanent
    // first, then the annual salary expectation as the main figure and the day
    // rate underneath. Salary and day rate are separate fields.
    employmentPreferences: Array.isArray(p.employmentPreferences) ? p.employmentPreferences : [],
    salaryBand: p.salaryBand || null,
    salaryLabel: p.salaryBand ? bandLabel(p.salaryBand) : null,
    salaryMin: p.salaryBand ? (p.salaryMin == null ? null : p.salaryMin) : null,
    salaryMax: p.salaryBand ? (p.salaryMax == null ? null : p.salaryMax) : null,
    salaryCurrency: p.salaryBand ? "GBP" : null,
    salaryPeriod: p.salaryBand ? "year" : null,
    salaryNegotiable: Boolean(p.salaryNegotiable),
    dayRate: p.dayRate || null,
  };
}

// Pay is shown only to organisations a founder has checked (and to the
// founders). Everyone else sees the card with pay withheld, and is told why.
const PAY_FIELDS = ["salaryBand", "salaryLabel", "salaryMin", "salaryMax", "salaryCurrency", "salaryPeriod", "salaryNegotiable", "dayRate"];
function withholdPay(card) {
  const c = { ...card };
  for (const k of PAY_FIELDS) c[k] = k === "salaryNegotiable" ? false : null;
  c.payHidden = true;
  return c;
}

// The Apple and Google review accounts hold a verified GP profile so reviewers
// can see the clinician side working. Real suppliers must never be shown a test
// account as a real clinician, so these are kept out of Talent entirely.
const REVIEW_EMAIL = /^play\.review(\.[a-z]+)?@qurahealth\.org$/i;
const isReviewAccount = (p) => Boolean(p && p.email && REVIEW_EMAIL.test(String(p.email)));

async function loadVerifiedTalent() {
  const rows = await kvListByKey(PROFILE_KEY);
  const cards = [];
  for (const { owner, value } of rows) {
    if (value && isVerified(value) && !isReviewAccount(value)) {
      const card = toCard(owner, value);
      try { const sum = await kvGet(owner, "cv_summary"); if (sum && sum.summary) card.summary = sum.summary; } catch (e) {}
      // Career+ clinicians get priority visibility: flagged and surfaced first.
      try {
        const plan = await kvGet(owner, "qura_plan");
        if (ENTITLEMENTS.careerPlus(plan)) card.priority = true;
      } catch (e) {}
      cards.push(card);
    }
  }
  // Priority (Career+) clinicians sort to the top, order otherwise preserved.
  cards.sort((a, b) => (b.priority ? 1 : 0) - (a.priority ? 1 : 0));
  return cards;
}

export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Sign in required" });

  const shortlist = (await kvGet(user.id, SHORTLIST_KEY)) || [];
  const ids = Array.isArray(shortlist) ? shortlist : [];

  let talent = await loadVerifiedTalent();
  const canSeePay = await orgVerified(user);
  if (!canSeePay) talent = talent.map(withholdPay);
  // Sample profiles only while there is nothing real and only before launch.
  const usingSample = talent.length === 0 && seedActive();
  if (usingSample) talent = SAMPLE.map((c) => ({ ...c, seeded: true }));

  // The saved shortlist can hold clinicians who have since deleted their
  // account or are no longer verified. Counting those raw showed "Shortlist (4)"
  // on Talent while Home showed 0. Every count now comes from clinicians a
  // supplier can actually see.
  const visible = new Set(talent.map((c) => c.id));
  const shown = (list) => list.filter((id) => visible.has(id));

  if (req.method === "GET") {
    if (req.query && req.query.shortlist) {
      return res.status(200).json({ items: talent.filter((c) => ids.includes(c.id)), shortlistIds: shown(ids) });
    }
    const { profession, country } = req.query || {};
    let items = talent;
    if (profession && profession !== "All") items = items.filter((c) => c.profession === profession);
    if (country && country !== "All") items = items.filter((c) => c.country === country);
    // Optional filters. ?employment=permanent keeps clinicians open to that kind
    // of work (anyone who has not said yet is kept too). ?salaryMin and
    // ?salaryMax are a vacancy's annual range: clinicians whose band overlaps,
    // or who are negotiable or have not said, are kept, so nobody is ruled out
    // on salary they have not given.
    const { employment, salaryMin, salaryMax } = req.query || {};
    if (employment && PREF_KEYS.includes(String(employment))) {
      items = items.filter((c) => { const e = c.employmentPreferences || []; return !e.length || e.includes(String(employment)); });
    }
    if (canSeePay && (salaryMin || salaryMax)) {
      items = items
        .map((c) => ({ ...c, salaryFit: salaryFit(c, salaryMin, salaryMax) }))
        .filter((c) => c.salaryFit !== "outside");
    }
    return res.status(200).json({ items, shortlistIds: shown(ids), live: !usingSample, payVisible: canSeePay });
  }

  if (req.method === "POST") {
    const { clinicianId } = req.body || {};
    if (!clinicianId) return res.status(400).json({ error: "clinicianId required" });
    const next = ids.includes(clinicianId) ? ids.filter((x) => x !== clinicianId) : [clinicianId, ...ids];
    await kvSet(user.id, SHORTLIST_KEY, next);
    return res.status(200).json({ shortlistIds: shown(next), shortlisted: next.includes(clinicianId) });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
