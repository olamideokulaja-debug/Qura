import { getUser, kvGet, kvSet } from "./_auth.js";
import { limited } from "./_ratelimit.js";

// Supplier organisation pages.
//
// Trust runs both ways in this market. A supplier can read a clinician's whole
// profile before requesting an introduction, but the clinician accepting one
// currently gets an email address and nothing else. This gives the clinician
// something to look at: who this organisation is, in the supplier's own words.
//
// Access mirrors messaging: a clinician can only view the page of a supplier
// they share a verified introduction with, resolved server-side from the
// introduction itself, so no enumeration of supplier profiles is possible.

const KEY = "org_profile";
const FIELDS = ["name", "about", "website", "regions", "specialties"];
const LIMITS = { name: 80, about: 600, website: 120, regions: 120, specialties: 160 };

function cleanProfile(input, current) {
  const out = { ...current };
  for (const f of FIELDS) {
    if (input[f] === undefined) continue;
    let v = String(input[f] || "").trim().slice(0, LIMITS[f]);
    if (f === "website" && v && !/^https?:\/\//i.test(v)) v = "https://" + v;
    out[f] = v;
  }
  out.updatedAt = new Date().toISOString();
  return out;
}

export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Sign in required" });
  if (await limited(req, res, user, { bucket: "orgprofile", limit: 120, windowSec: 3600 })) return;

  if (req.method === "GET") {
    const { introId } = req.query || {};

    // No introId: your own page, for editing.
    if (!introId) {
      const p = (await kvGet(user.id, KEY)) || {};
      return res.status(200).json({ profile: p, own: true });
    }

    // With introId: the clinician viewing the supplier behind their introduction.
    const queue = (await kvGet("shared", "intro_queue")) || [];
    const intro = (Array.isArray(queue) ? queue : []).find((q) => q.id === introId);
    if (!intro) return res.status(404).json({ error: "Introduction not found" });
    const clinician = String(intro.clinicianId || "").startsWith("cl_") ? String(intro.clinicianId).slice(3) : null;
    if (user.id !== clinician && user.id !== intro.supplier) {
      return res.status(403).json({ error: "This page belongs to the introduction's two parties." });
    }
    const p = (await kvGet(intro.supplier, KEY)) || {};
    return res.status(200).json({
      profile: { name: p.name || "", about: p.about || "", website: p.website || "", regions: p.regions || "", specialties: p.specialties || "" },
      contactEmail: intro.supplierEmail || null,
      own: false,
    });
  }

  if (req.method === "POST") {
    const current = (await kvGet(user.id, KEY)) || {};
    const next = cleanProfile(req.body || {}, current);
    const ok = await kvSet(user.id, KEY, next);
    if (!ok) return res.status(500).json({ error: "Could not save. Try again." });
    return res.status(200).json({ ok: true, profile: next });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
