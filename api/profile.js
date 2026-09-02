import { getUser, kvGet, kvSet } from "./_auth.js";

// GET  /api/profile        -> the signed-in clinician's profile
// POST /api/profile {..}   -> save/merge the profile
const KEY = "clinician_profile";

// What a clinician must supply to count as registered.
//
// cvUploaded is NOT in here. It was, and the effect was that a clinician who
// had finished registering was still shown as incomplete, and could never reach
// 100% without finding and uploading a CV. The CV is genuinely useful to a
// hospital, so it is still asked for — but as an optional extra that improves a
// profile, not as a gate on being registered at all.
const REQUIRED = ["category", "profession", "regBody", "regNumber", "country", "experienceYears"];

// Optional fields that make a profile stronger. They count towards the strength
// score a clinician sees, so there is a visible reason to come back and finish,
// but a missing one never blocks registration or verification.
const OPTIONAL = ["cvUploaded", "availableFrom", "dayRate", "sector"];

// Clinical research experience, stored as one nested object rather than 12 more
// top-level fields. Only people targeting research roles ever fill it in, so
// flattening it would put a dozen permanently-empty columns on every other
// clinician's record.
const RESEARCH_KEYS = ["researchYears", "independentYears", "phases", "therapeuticAreas",
  "activities", "settings", "sitesManaged", "travel", "certifications", "systems", "languages"];

function cleanResearch(v) {
  if (!v || typeof v !== "object") return undefined;
  const out = {};
  for (const k of RESEARCH_KEYS) {
    const val = v[k];
    if (val === undefined || val === null || val === "") continue;
    if (Array.isArray(val)) out[k] = val.slice(0, 30).map((x) => String(x).slice(0, 80));
    else if (typeof val === "number") out[k] = val;
    else out[k] = String(val).slice(0, 200);
  }
  // Numbers stay numbers so matching can compare them without parsing.
  for (const n of ["researchYears", "independentYears", "sitesManaged"]) {
    if (out[n] !== undefined) {
      const num = Number(String(out[n]).replace(/[^0-9.]/g, ""));
      if (isFinite(num) && num >= 0 && num <= 200) out[n] = Math.round(num);
      else delete out[n];
    }
  }
  return Object.keys(out).length ? out : undefined;
}

function completeness(p) {
  const has = (k) => {
    const v = p ? p[k] : undefined;
    return v !== undefined && v !== null && v !== "" && v !== false;
  };
  const done = REQUIRED.filter(has);
  const extras = OPTIONAL.filter(has);
  const missing = REQUIRED.filter((k) => !has(k));
  return {
    done: done.length,
    total: REQUIRED.length,
    // "verified" here means the required set is complete. Actual verification
    // is still a founder checking the registration number by hand.
    verified: missing.length === 0,
    missing,
    // Strength is required fields plus whatever optional detail has been added,
    // so a registered clinician starts high and can reach 100% by adding a CV,
    // availability and a rate.
    strength: Math.round(
      ((done.length / REQUIRED.length) * 0.75 + (extras.length / OPTIONAL.length) * 0.25) * 100
    ),
    optionalMissing: OPTIONAL.filter((k) => !has(k)),
  };
}

export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Sign in required" });

  if (req.method === "GET") {
    const raw = (await kvGet(user.id, KEY)) || {};
    const FIELDS = ["category", "profession", "regBody", "regNumber", "country", "experienceYears", "cvUploaded", "availableFrom", "dayRate", "sector", "registeredAt", "verifiedAt", "verifiedBy", "careerTrack", "targetRoles", "sectors", "markets", "workPatterns", "research"];
    const p = { email: user.email };
    for (const f of FIELDS) if (raw[f] !== undefined) p[f] = raw[f];
    return res.status(200).json({ profile: p, status: completeness(p) });
  }

  if (req.method === "POST") {
    const incoming = req.body || {};
    const current = (await kvGet(user.id, KEY)) || {};
    // Only ever persist these known fields — prevents any runaway growth / nesting.
    const FIELDS = ["category", "profession", "regBody", "regNumber", "country", "experienceYears", "cvUploaded", "availableFrom", "dayRate", "sector", "careerTrack", "targetRoles", "sectors", "markets", "workPatterns"];
    const clean = {};
    for (const f of FIELDS) {
      const v = incoming[f] !== undefined ? incoming[f] : current[f];
      if (v !== undefined) clean[f] = v;
    }
    // Keep the two new fields sane: a day rate is a number in pounds, and
    // availability is either "now" or an ISO date.
    if (clean.dayRate !== undefined) {
      const n = Number(String(clean.dayRate).replace(/[^0-9.]/g, ""));
      if (!isFinite(n) || n <= 0 || n > 10000) delete clean.dayRate;
      else clean.dayRate = Math.round(n);
    }
    if (clean.availableFrom !== undefined) {
      const v = String(clean.availableFrom).trim().toLowerCase();
      if (v === "now") clean.availableFrom = "now";
      else if (/^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(Date.parse(v))) clean.availableFrom = v;
      else delete clean.availableFrom;
    }
    // Research experience arrives as a nested object and is cleaned as one.
    const research = cleanResearch(incoming.research !== undefined ? incoming.research : current.research);
    if (research) clean.research = research;

    // Verification is the founder's to give. These three are carried across from
    // what is already stored and are never read off the request, so a clinician
    // posting {verifiedAt: ...} from the console cannot verify themselves.
    if (current.verifiedAt) clean.verifiedAt = current.verifiedAt;
    if (current.verifiedBy) clean.verifiedBy = current.verifiedBy;
    if (current.registeredAt) clean.registeredAt = current.registeredAt;

    // registeredAt is set once, on the explicit "Complete registration" press,
    // and only if the required fields really are there. Every other POST is a
    // draft save from someone still typing.
    if (incoming.submit === true && !clean.registeredAt) {
      const st = completeness(clean);
      if (!st.verified) return res.status(400).json({ error: "Some items are still missing.", missing: st.missing });
      clean.registeredAt = new Date().toISOString();
    }

    clean.email = user.email;
    clean.updatedAt = new Date().toISOString();
    const ok = await kvSet(user.id, KEY, clean);
    if (!ok && !user._preview) return res.status(500).json({ error: "Could not save profile" });
    return res.status(200).json({ profile: clean, status: completeness(clean) });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
