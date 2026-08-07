import { getUser, kvGet, kvSet } from "./_auth.js";

// GET  /api/profile        -> the signed-in clinician's profile
// POST /api/profile {..}   -> save/merge the profile
const KEY = "clinician_profile";

function completeness(p) {
  const req = ["category", "profession", "regBody", "regNumber", "country", "experienceYears", "cvUploaded"];
  const done = req.filter((k) => {
    const v = p ? p[k] : undefined;
    return v !== undefined && v !== null && v !== "" && v !== false;
  });
  return { done: done.length, total: req.length, verified: done.length === req.length, missing: req.filter((k) => !done.includes(k)) };
}

export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Sign in required" });

  if (req.method === "GET") {
    const raw = (await kvGet(user.id, KEY)) || {};
    const FIELDS = ["category", "profession", "regBody", "regNumber", "country", "experienceYears", "cvUploaded", "availableFrom", "dayRate", "sector", "registeredAt", "verifiedAt", "verifiedBy"];
    const p = { email: user.email };
    for (const f of FIELDS) if (raw[f] !== undefined) p[f] = raw[f];
    return res.status(200).json({ profile: p, status: completeness(p) });
  }

  if (req.method === "POST") {
    const incoming = req.body || {};
    const current = (await kvGet(user.id, KEY)) || {};
    // Only ever persist these known fields — prevents any runaway growth / nesting.
    const FIELDS = ["category", "profession", "regBody", "regNumber", "country", "experienceYears", "cvUploaded", "availableFrom", "dayRate", "sector"];
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
    // Verification is the founder's to give. These three are carried across from
    // what is already stored and are never read off the request, so a clinician
    // posting {verifiedAt: ...} from the console cannot verify themselves.
    if (current.verifiedAt) clean.verifiedAt = current.verifiedAt;
    if (current.verifiedBy) clean.verifiedBy = current.verifiedBy;
    if (current.registeredAt) clean.registeredAt = current.registeredAt;

    // registeredAt is set once, on the explicit "Complete registration" press,
    // and only if the profile really is complete. Every other POST is a draft
    // save from someone still typing.
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
