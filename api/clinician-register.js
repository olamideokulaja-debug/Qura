import { getUser, kvGet, kvSet } from "./_auth.js";

// Clinician registration.
//
// This endpoint exists because the registration screen previously recorded
// nothing at all. Its submit handler set a local React flag and showed a
// success page reading "You are registered on Qura", and the moment the
// clinician refreshed, everything they had typed was gone. Nobody was told,
// nothing was stored, and no founder ever saw a registration number to check.
//
// Storage follows the same shape the saved-alerts feature already uses:
//   per-user   "clinician_registration"   the record itself
//   shared     "clinician_registrations"  an index of user ids that have one
//
// The index is what makes the clinician findable. Without it a registration
// sits in a row keyed by the user's own id and no founder can enumerate it,
// which would leave the success message true about storage and false about
// everything a clinician actually cares about.

const KEY = "clinician_registration";
const INDEX = "clinician_registrations";

const CATEGORIES = [
  "Nurse / Midwife",
  "Allied Health Professional",
  "Doctor",
  "Pharmacy & Healthcare Science",
];

function clean(v, max) {
  return String(v == null ? "" : v).trim().slice(0, max);
}

// Validated again here, never trusting the browser's own checklist. The
// client can be edited; this cannot.
function validate(b) {
  const cat = clean(b.cat, 60);
  if (!CATEGORIES.includes(cat)) return { error: "Choose a category." };

  const prof = clean(b.prof, 120);
  if (!prof) return { error: "Choose a profession or specialty." };

  const regNo = clean(b.regNo, 60);
  if (!regNo) return { error: "Your registration number is required." };

  const country = clean(b.country, 80);
  if (!country) return { error: "Choose your country of residence." };

  // The minimum tracks residence: 2 years for international candidates, 1 for
  // the UK. Kept identical to the rule the form shows, so a clinician is never
  // rejected here for something the screen told them was fine.
  const isUK = country === "United Kingdom";
  const minYears = isUK ? 1 : 2;
  const years = Number(b.years);
  if (!Number.isFinite(years) || years < minYears) {
    return { error: "A minimum of " + minYears + " year" + (minYears > 1 ? "s" : "") + " is required to join." };
  }

  const sector = clean(b.sector, 20);
  if (isUK && !["NHS", "Private", "Both"].includes(sector)) {
    return { error: "Tell us whether your UK experience is NHS, private or both." };
  }

  const cv = clean(b.cv, 200);
  if (!cv) return { error: "Upload your CV." };

  if (b.declare !== true) return { error: "The declaration must be ticked." };

  return {
    record: {
      cat, prof, regNo, country, years,
      sector: isUK ? sector : "",
      cv,
      cvPath: clean(b.cvPath, 300),
      declare: true,
    },
  };
}

export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Sign in required" });

  if (req.method === "GET") {
    const saved = await kvGet(user.id, KEY);
    return res.status(200).json({ registration: saved && typeof saved === "object" ? saved : null });
  }

  if (req.method !== "POST") return res.status(405).json({ error: "GET or POST only." });

  const body = req.body || {};

  // A draft save keeps a part-finished form alive across a refresh. It is
  // deliberately not validated: someone half way through the form has not
  // done anything wrong, and losing their typing is the thing being fixed.
  if (body.action === "draft") {
    const existing = await kvGet(user.id, KEY);
    if (existing && existing.status === "registered") {
      return res.status(200).json({ ok: true, ignored: "already registered" });
    }
    const draft = {
      status: "draft",
      updatedAt: new Date().toISOString(),
      form: {
        cat: clean(body.cat, 60), prof: clean(body.prof, 120),
        regNo: clean(body.regNo, 60), country: clean(body.country, 80),
        years: clean(body.years, 4), sector: clean(body.sector, 20),
        cv: clean(body.cv, 200), cvPath: clean(body.cvPath, 300),
        declare: body.declare === true,
      },
    };
    await kvSet(user.id, KEY, draft);
    return res.status(200).json({ ok: true, status: "draft" });
  }

  const { error, record } = validate(body);
  if (error) return res.status(400).json({ error });

  const existing = await kvGet(user.id, KEY);
  const entry = {
    status: "registered",
    // "registered" is not "verified", and the two must never be conflated in
    // storage any more than they are on screen. A founder checking the number
    // against the official public register is what sets verifiedAt.
    verifiedAt: (existing && existing.verifiedAt) || null,
    email: user.email || "",
    userId: user.id,
    registeredAt: (existing && existing.registeredAt) || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...record,
  };

  await kvSet(user.id, KEY, entry);

  // Index second. If this write fails the registration still exists on the
  // clinician's own row and can be re-indexed, whereas indexing first would
  // point founders at a record that was never written.
  try {
    const idx = await kvGet("shared", INDEX);
    const list = Array.isArray(idx) ? idx : [];
    if (!list.includes(user.id)) {
      list.push(user.id);
      await kvSet("shared", INDEX, list);
    }
  } catch (e) {
    return res.status(200).json({ ok: true, indexed: false });
  }

  return res.status(200).json({ ok: true, indexed: true });
}
