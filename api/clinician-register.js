import { getUser, kvGet, kvSet } from "./_auth.js";

// GET  /api/clinician-register  -> this clinician's draft or completed record
// POST /api/clinician-register  -> save a draft, or complete the registration
//
// This endpoint was MISSING. The registration screen called it four times — to
// load a draft, to autosave on every keystroke, to submit, and once more from
// the profile screen — and every call returned 404. So a clinician could fill
// the whole form, press the button, and nothing was ever written. Three real
// clinicians signed in and none of them has a stored profile; this is why.
//
// It writes to the same "clinician_profile" record the rest of the platform
// already reads, so a registration made here is immediately visible to the
// founder Clinicians tab, to /api/profile and to supplier search. A second
// store would have split the truth in two.

const KEY = "clinician_profile";
const INDEX = "clinician_registrations";

// The form's field names differ from the stored ones. Mapping here rather than
// renaming the form, because the stored names are what every other endpoint,
// the export and the admin panel already use.
const FROM_FORM = {
  cat: "category",
  prof: "profession",
  regBody: "regBody",
  regNo: "regNumber",
  country: "country",
  years: "experienceYears",
  sector: "sector",
  cv: "cvUploaded",
  availableFrom: "availableFrom",
  dayRate: "dayRate",
  // Career direction, stored alongside the background rather than replacing it.
  careerTrack: "careerTrack",
  targetRoles: "targetRoles",
  sectors: "sectors",
  markets: "markets",
  workPatterns: "workPatterns",
  // Which route this profile is verified by, chosen by the clinician
  // rather than inferred from an empty registration field.
  verificationRoute: "verificationRoute",
  noRegistrationReason: "noRegistrationReason",
};

// Fields that arrive as arrays or objects and must survive the string cleaning
// applied to everything else.
const STRUCTURED = new Set(["targetRoles", "sectors", "markets", "workPatterns"]);

const REQUIRED = ["category", "profession", "regNumber", "country", "experienceYears"];

function toStored(form) {
  const out = {};
  for (const [a, b] of Object.entries(FROM_FORM)) {
    if (form[a] !== undefined && form[a] !== null && form[a] !== "") out[b] = form[a];
  }
  // Markets carry a country and an eligibility status per country. Cleaned
  // here rather than trusted, and capped so the record cannot grow without
  // limit.
  if (Array.isArray(out.markets)) {
    out.markets = out.markets
      .filter((m) => m && String(m.country || "").trim())
      .slice(0, 12)
      .map((m) => ({
        country: String(m.country).trim().slice(0, 60),
        workAuth: ["eligible", "sponsorship", "in-progress", "unknown"].includes(m.workAuth) ? m.workAuth : "unknown",
      }));
  }
  for (const k of ["targetRoles", "sectors", "workPatterns"]) {
    if (Array.isArray(out[k])) out[k] = out[k].slice(0, 25).map((x) => String(x).slice(0, 80));
  }
  if (out.experienceYears !== undefined) {
    const n = Number(String(out.experienceYears).replace(/[^0-9.]/g, ""));
    out.experienceYears = isFinite(n) && n >= 0 && n <= 70 ? Math.round(n) : undefined;
    if (out.experienceYears === undefined) delete out.experienceYears;
  }
  if (out.dayRate !== undefined) {
    const n = Number(String(out.dayRate).replace(/[^0-9.]/g, ""));
    if (isFinite(n) && n > 0 && n <= 10000) out.dayRate = Math.round(n); else delete out.dayRate;
  }
  // cvUploaded is a filename or url from the form; store it as a truthy string.
  if (out.cvUploaded !== undefined) out.cvUploaded = String(out.cvUploaded).slice(0, 300);
  return out;
}

function toForm(stored) {
  const out = {};
  for (const [a, b] of Object.entries(FROM_FORM)) {
    if (stored[b] !== undefined) out[a] = stored[b];
  }
  return out;
}

const missingFrom = (p) => REQUIRED.filter((k) => {
  const v = p[k];
  return v === undefined || v === null || v === "" || v === false;
});

export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Sign in required" });

  const current = (await kvGet(user.id, KEY)) || {};

  if (req.method === "GET") {
    if (!current || !Object.keys(current).length) {
      return res.status(200).json({ ok: true, registration: null });
    }
    return res.status(200).json({
      ok: true,
      registration: {
        status: current.registeredAt ? "registered" : "draft",
        registeredAt: current.registeredAt || null,
        verifiedAt: current.verifiedAt || null,
        form: toForm(current),
        missing: missingFrom(current),
      },
    });
  }

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const body = req.body || {};
  const incoming = toStored(body);
  const merged = { ...current, ...incoming };

  // Verification is the founder's to give. Carried across from what is stored
  // and never read off the request, so nobody can verify themselves by posting.
  if (current.verifiedAt) merged.verifiedAt = current.verifiedAt;
  if (current.verifiedBy) merged.verifiedBy = current.verifiedBy;
  if (current.registeredAt) merged.registeredAt = current.registeredAt;

  // A draft save is every keystroke. Completing registration is the explicit
  // press, and only counts when the required fields are actually there.
  //
  // The CV is NOT required to register. It was, and the result was that three
  // clinicians reached this screen and none of them finished: asking someone
  // who arrived from a LinkedIn post two minutes ago to find and upload a CV on
  // a phone is where they leave. It is asked for afterwards instead.
  const wantsComplete = body.submit === true || body.complete === true ||
    (body.declare === true && missingFrom(merged).length === 0);

  if (wantsComplete && !merged.registeredAt) {
    const missing = missingFrom(merged);
    if (missing.length) {
      return res.status(400).json({ ok: false, error: "Some items are still missing.", missing });
    }
    merged.registeredAt = new Date().toISOString();

    // Add to the shared index the founder Clinicians tab reads.
    try {
      const idx = (await kvGet("shared", INDEX)) || [];
      const list = Array.isArray(idx) ? idx : [];
      if (!list.includes(user.id)) {
        list.push(user.id);
        await kvSet("shared", INDEX, list);
      }
    } catch (e) {
      // The index is a convenience, not the record. Never fail a registration
      // because the index write failed.
      console.error("[clinician-register] index write failed: " + (e && e.message));
    }
  }

  merged.email = user.email;
  merged.updatedAt = new Date().toISOString();

  const ok = await kvSet(user.id, KEY, merged);
  if (!ok) return res.status(500).json({ ok: false, error: "Could not save. Nothing has been lost, please try again." });

  return res.status(200).json({
    ok: true,
    registration: {
      status: merged.registeredAt ? "registered" : "draft",
      registeredAt: merged.registeredAt || null,
      verifiedAt: merged.verifiedAt || null,
      form: toForm(merged),
      missing: missingFrom(merged),
    },
  });
}
