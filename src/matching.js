// Matching a clinician to real demand.
//
// What this is NOT: a jobs board match. Qura holds no clinical vacancies. The
// live feed is procurement notices and staffing contracts, aimed at
// organisations, not at individuals. Scoring a clinician against those and
// calling it "94% match" would be an invented number of exactly the kind we
// removed from the supplier ratings.
//
// What it IS, and why it is stronger: a tender for audiology staffing at
// Imperial means Imperial needs audiologists. That is a real, checkable,
// early signal of where a clinician's skills are wanted — usually months before
// a vacancy is advertised anywhere. Qura's whole thesis is that it knows where
// healthcare demand is; this is that thesis applied to one person.
//
// So every score here is built from facts on both sides, and every point is
// shown to the clinician as a reason. A score with no reason is decoration.

import { TRACK_TERMS, trackForRole } from "./data/careers.js";

// Words that reliably indicate a profession in a procurement notice. Kept
// deliberately tight: a loose match is worse than no match, because it teaches
// a clinician to ignore the feed.
const PROFESSION_TERMS = {
  "Sonographer": ["sonograph", "ultrasound"],
  "Radiographer": ["radiograph", "imaging", "x-ray", "mri", "ct scan"],
  "Physiotherapist": ["physiotherap", "physio", "musculoskeletal", "msk"],
  "Occupational Therapist": ["occupational therap"],
  "Speech and Language Therapist": ["speech and language", "slt"],
  "Biomedical Scientist": ["biomedical", "pathology", "laborator"],
  "Pharmacist": ["pharmac"],
  "Podiatrist": ["podiatr", "chiropod"],
  "Dietitian": ["dietit", "nutrition"],
  "Audiologist": ["audiolog", "hearing"],
  "Optometrist": ["optometr", "ophthalm"],
  "Paramedic": ["paramedic", "ambulance"],
  "Midwife": ["midwif", "maternity", "obstetric"],
  "Mental Health Nurse": ["mental health", "psychiatr", "camhs"],
  "Psychologist": ["psycholog", "talking therap", "cbt", "iapt"],
  "Clinical Laboratory Scientist": ["laborator", "clinical scientist"],
  "General Practice (GP)": ["general practice", "primary care", "gp ", "gp,"],
  "Theatre Nurse": ["theatre", "perioperative", "surgical"],
  "ICU Nurse": ["intensive care", "critical care", "icu"],
  "Endoscopy": ["endoscop", "colonoscop"],
};

// Broader family terms, worth less than a direct profession hit.
const CATEGORY_TERMS = {
  "Doctor": ["consultant", "physician", "medical staffing", "locum doctor", "clinician"],
  "Nurse / Midwife": ["nurse", "nursing", "midwif"],
  // "therap" alone is too loose: it matches "Talking Therapies", which is
  // psychological and has nothing to do with a physiotherapist. Named
  // therapies only.
  "Allied Health Professional": ["allied health", "ahp", "diagnostic",
    "physiotherap", "occupational therap", "speech and language",
    "radiograph", "sonograph", "dietit", "podiatr", "orthopt"],
  "Pharmacy & Healthcare Science": ["pharmac", "laborator", "pathology", "healthcare science"],
};

const hay = (n) => [n && n.title, n && n.note, n && n.buyer, n && n.category, n && n.spec]
  .filter(Boolean).join(" ").toLowerCase();

const anyTerm = (text, terms) => (terms || []).some((t) => text.includes(t));

// UK regions and nations, so "United Kingdom" on a profile matches a notice in
// Stafford without needing a full gazetteer.
const UK_HINTS = ["uk", "united kingdom", "england", "scotland", "wales",
  "northern ireland", "nhs", "london", "manchester", "birmingham", "leeds"];

const sameCountry = (profile, notice) => {
  const c = String((profile && profile.country) || "").toLowerCase();
  const r = String((notice && notice.region) || "").toLowerCase();
  const m = String((notice && notice.market) || "").toLowerCase();
  if (!c) return false;
  if (c.includes("united kingdom")) return m === "nhs" || m === "private" || UK_HINTS.some((h) => r.includes(h));
  if (c.includes("united states")) return m.includes("united states") || m.includes("international");
  return r.includes(c) || m.includes(c);
};

/**
 * Score one notice against one clinician profile.
 *
 * Returns null when nothing matches. Showing a clinician a list of everything
 * with a low number against it is how a feed gets ignored, so the caller only
 * ever sees things that genuinely relate to them.
 */
export function scoreNotice(profile, notice) {
  if (!profile || !notice) return null;
  const text = hay(notice);
  const reasons = [];
  let score = 0;

  const prof = profile.profession || "";
  const cat = profile.category || "";
  const targets = Array.isArray(profile.targetRoles) ? profile.targetRoles : [];

  const professionHit = anyTerm(text, PROFESSION_TERMS[prof]);
  const categoryHit = anyTerm(text, CATEGORY_TERMS[cat]);

  // Where someone has said what they want to do next, that outranks what they
  // are registered as. A biomedical scientist targeting clinical research
  // should see trial work first, not more laboratory contracts.
  let targetHit = null;
  for (const role of targets) {
    const r = String(role).toLowerCase();
    if (text.includes(r)) { targetHit = { role, exact: true }; break; }
    const track = trackForRole(role);
    if (track && anyTerm(text, TRACK_TERMS[track.id])) { targetHit = { role, track }; break; }
  }

  // Without one of these the notice has nothing to do with this person.
  if (!targetHit && !professionHit && !categoryHit) return null;

  if (targetHit && targetHit.exact) {
    score += 60;
    reasons.push({ label: targetHit.role + ", the role you are looking for", ok: true });
  } else if (targetHit) {
    score += 45;
    reasons.push({ label: targetHit.track.label + ", the direction you are moving in", ok: true });
  }

  if (professionHit) {
    // Background is evidence of capability, not a description of what someone
    // wants. Once a person has told us their direction, a notice that matches
    // only their past must rank BELOW one that matches their future, or the
    // feed just shows them the career they are trying to leave.
    const weight = targetHit ? 15 : (targets.length ? 28 : 55);
    score += weight;
    reasons.push({
      label: prof + (targetHit ? ", your background" : targets.length ? ", your background rather than your target role" : " named in the notice"),
      ok: true,
    });
  } else if (categoryHit && !targetHit) {
    score += targets.length ? 16 : 30;
    reasons.push({ label: cat + " work", ok: true });
  }

  // Preferred markets, if given, otherwise country of residence. Someone in
  // Canada targeting the United States should see US work ranked up, not down.
  const markets = Array.isArray(profile.markets) && profile.markets.length
    ? profile.markets : (profile.country ? [{ country: profile.country }] : []);
  const hit = markets.find((m) => sameCountry({ country: m.country }, notice));
  if (hit) {
    score += 20;
    reasons.push({ label: "In " + hit.country + ", a market you want", ok: true });
    // Eligibility is stated, never assumed. Showing someone work they cannot
    // take without saying so is worse than not showing it.
    if (hit.workAuth === "sponsorship") {
      reasons.push({ label: "You would need visa sponsorship here", ok: false });
    } else if (hit.workAuth === "eligible") {
      score += 8; reasons.push({ label: "You are eligible to work here", ok: true });
    }
  } else {
    reasons.push({ label: "Outside your preferred markets", ok: false });
  }

  // Sector, where the clinician has said and the notice makes it knowable.
  const sector = String(profile.sector || "").toLowerCase();
  const market = String(notice.market || "").toLowerCase();
  if (sector && sector !== "both") {
    const nhs = market === "nhs";
    if ((sector === "nhs" && nhs) || (sector === "private" && !nhs)) {
      score += 10; reasons.push({ label: sector === "nhs" ? "NHS" : "Private", ok: true });
    }
  } else if (sector === "both") {
    score += 10; reasons.push({ label: "NHS and private", ok: true });
  }

  // Experience is a weak signal here: procurement notices rarely state a
  // requirement, so it counts only when the clinician has real depth.
  const yrs = Number(String(profile.experienceYears || "").replace(/[^0-9]/g, ""));
  if (isFinite(yrs) && yrs >= 5) { score += 8; reasons.push({ label: yrs + "+ years' experience", ok: true }); }

  // Recency. A notice from this week is worth more than one from last month.
  const when = Date.parse(notice.publishedAt || notice.at || "");
  if (isFinite(when)) {
    const days = (Date.now() - when) / 86400000;
    if (days <= 14) { score += 7; reasons.push({ label: "Published in the last two weeks", ok: true }); }
  }

  return {
    score: Math.min(100, Math.round(score)),
    reasons,
    // Named honestly. This is a demand signal, not a vacancy, and the wording
    // has to keep saying so wherever it appears.
    kind: "demand",
  };
}

/**
 * Rank a feed for one clinician. Only genuine matches come back.
 */
export function matchFeed(profile, notices, limit) {
  const out = [];
  for (const n of (notices || [])) {
    const m = scoreNotice(profile, n);
    if (m) out.push({ ...n, match: m });
  }
  out.sort((a, b) => b.match.score - a.match.score);
  return typeof limit === "number" ? out.slice(0, limit) : out;
}

// What a clinician should be told the number means. Deliberately not "94%
// match" — it is a relevance score against demand, and saying so keeps it
// honest and still useful.
export function matchLabel(score) {
  if (score >= 80) return "Strong signal";
  if (score >= 60) return "Relevant";
  return "Worth watching";
}
