import { getUser, kvGet, kvSet } from "./_auth.js";

// Supplier ratings.
//
//   GET  ?supplier=<slug>            the rating and its basis
//   POST { supplier, stars, note }   a provider rates a supplier they have used
//   POST { supplier, signals }       a founder sets the objective signals
//   POST { supplier, override }      a founder sets an assessment, with a reason
//
// Three rules shape this file:
//
//   1. A provider can only rate a supplier ONCE, and can change that rating
//      rather than adding a second. Otherwise the score is a popularity contest
//      between whoever clicks most.
//   2. Only the objective signals a founder has confirmed count towards the
//      earned rating. A supplier cannot mark itself Qura Verified.
//   3. Every founder override carries a reason and is shown as an assessment,
//      never disguised as provider feedback.

const SIGNALS_KEY = (slug) => "supplier_signals_" + slug;
const REVIEWS_KEY = (slug) => "supplier_reviews_" + slug;
const OVERRIDE_KEY = (slug) => "supplier_override_" + slug;

const OWNERS = (process.env.OWNER_EMAILS || process.env.VITE_OWNER_EMAILS || "")
  .split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
const isOwner = (u) => Boolean(u && u.email && OWNERS.includes(String(u.email).toLowerCase()));

const slugify = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

// The signals a founder can set. Anything else posted is ignored, so the shape
// cannot drift and a stray field cannot quietly become worth points.
const ALLOWED = ["quraVerified", "framework", "cqc", "specialtiesEvidenced",
                 "regionsCovered", "respondsFast", "compliancePack"];

export default async function handler(req, res) {
  const q = req.query || {};
  const slug = slugify(q.supplier || (req.body && req.body.supplier));
  if (!slug) return res.status(400).json({ error: "supplier is required." });

  if (req.method === "GET") {
    const [signals, reviews, override] = await Promise.all([
      kvGet("shared", SIGNALS_KEY(slug)),
      kvGet("shared", REVIEWS_KEY(slug)),
      kvGet("shared", OVERRIDE_KEY(slug)),
    ]);
    const list = Array.isArray(reviews) ? reviews : [];
    return res.status(200).json({
      supplier: slug,
      signals: signals || {},
      override: override || null,
      // Ratings only, never who gave them. A hospital that rates a supplier
      // three stars should not have that traceable back to them by anyone
      // browsing the supplier's page.
      reviews: list.map((r) => ({ stars: r.stars, at: r.at, note: r.note || "" })),
      reviewCount: list.length,
    });
  }

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Sign in required" });
  const body = req.body || {};

  // ---- founder: set the objective signals --------------------------------
  if (body.signals) {
    if (!isOwner(user)) return res.status(403).json({ error: "Not authorised." });
    const clean = {};
    for (const k of ALLOWED) if (body.signals[k] !== undefined) clean[k] = Boolean(body.signals[k]);
    clean.setBy = user.email;
    clean.setAt = new Date().toISOString();
    await kvSet("shared", SIGNALS_KEY(slug), clean);
    return res.status(200).json({ ok: true, signals: clean });
  }

  // ---- founder: an assessment, with a reason -----------------------------
  if (body.override !== undefined) {
    if (!isOwner(user)) return res.status(403).json({ error: "Not authorised." });
    if (body.override === null) {
      await kvSet("shared", OVERRIDE_KEY(slug), null);
      return res.status(200).json({ ok: true, override: null });
    }
    const stars = Number(body.override.stars);
    if (!isFinite(stars) || stars < 0 || stars > 5) {
      return res.status(400).json({ error: "stars must be between 0 and 5." });
    }
    // A number with no reason is indistinguishable from an invented rating,
    // which is the thing this whole feature exists to avoid.
    const note = String(body.override.note || "").trim();
    if (note.length < 10) {
      return res.status(400).json({ error: "Please give a short reason for this assessment." });
    }
    const rec = { stars: Math.round(stars * 2) / 2, note: note.slice(0, 400), by: user.email, at: new Date().toISOString() };
    await kvSet("shared", OVERRIDE_KEY(slug), rec);
    return res.status(200).json({ ok: true, override: rec });
  }

  // ---- a provider rates a supplier ---------------------------------------
  const stars = Number(body.stars);
  if (!isFinite(stars) || stars < 1 || stars > 5) {
    return res.status(400).json({ error: "Please give a rating between 1 and 5." });
  }

  const existing = (await kvGet("shared", REVIEWS_KEY(slug))) || [];
  const list = Array.isArray(existing) ? existing : [];

  // One rating per organisation, updated rather than repeated. Keyed on the
  // account so the same person cannot stack ratings, and the identity is not
  // returned by the GET above.
  const mine = list.findIndex((r) => r.by === user.id);
  const rec = {
    by: user.id,
    stars: Math.round(stars * 2) / 2,
    note: String(body.note || "").trim().slice(0, 400),
    at: new Date().toISOString(),
  };
  if (mine >= 0) list[mine] = rec; else list.push(rec);

  const ok = await kvSet("shared", REVIEWS_KEY(slug), list);
  if (!ok) return res.status(500).json({ error: "Could not save that rating. Please try again." });

  return res.status(200).json({
    ok: true,
    updated: mine >= 0,
    reviewCount: list.length,
  });
}
