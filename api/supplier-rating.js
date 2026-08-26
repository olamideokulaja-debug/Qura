import { getUser, kvGet, kvSet } from "./_auth.js";

// Supplier ratings.
//
//   GET  ?supplier=<slug>            the rating and its basis
//   GET  ?claims=1                   founder only: evidence awaiting review
//   POST { supplier, stars, note }   a provider rates a supplier they have used
//   POST { supplier, claim }         a supplier submits evidence for a signal
//   POST { claimId, decision }       founder approves or declines that evidence
//   POST { supplier, signals }       a founder sets signals directly
//   POST { supplier, override }      a founder sets an assessment, with a reason
//
// Rules that shape this file:
//
//   1. A provider can only rate a supplier ONCE, and changes that rating rather
//      than adding a second.
//   2. A supplier can ASK for a signal but can never grant itself one. Evidence
//      goes into a queue; only a founder's approval moves the rating.
//   3. Approving a claim is TWO judgements in one: that this account really
//      represents this supplier, and that the evidence is good. There is no
//      account-to-organisation link in Qura yet, so the founder is the link.
//      Every approval records who claimed it, from which account.
//   4. Every founder override carries a reason and is shown as an assessment.

const SIGNALS_KEY = (slug) => "supplier_signals_" + slug;
const REVIEWS_KEY = (slug) => "supplier_reviews_" + slug;
const OVERRIDE_KEY = (slug) => "supplier_override_" + slug;
const CLAIMS_KEY = "supplier_claims";

const OWNERS = (process.env.OWNER_EMAILS || process.env.VITE_OWNER_EMAILS || "")
  .split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
const isOwner = (u) => Boolean(u && u.email && OWNERS.includes(String(u.email).toLowerCase()));

const slugify = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

const ALLOWED = ["quraVerified", "framework", "cqc", "specialtiesEvidenced",
                 "regionsCovered", "respondsFast", "compliancePack"];

export default async function handler(req, res) {
  const q = req.query || {};
  const body = req.body || {};

  // -------------------------------------------------- founder: claims queue
  if (q.claims) {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: "Sign in required" });
    if (!isOwner(user)) return res.status(403).json({ error: "Not authorised." });
    const all = (await kvGet("shared", CLAIMS_KEY)) || [];
    const list = Array.isArray(all) ? all : [];
    return res.status(200).json({
      claims: list.filter((c) => c.status === "pending"),
      recent: list.filter((c) => c.status !== "pending").slice(-20).reverse(),
    });
  }

  const slug = slugify(q.supplier || body.supplier);

  if (req.method === "GET") {
    if (!slug) return res.status(400).json({ error: "supplier is required." });
    const [signals, reviews, override, claims] = await Promise.all([
      kvGet("shared", SIGNALS_KEY(slug)),
      kvGet("shared", REVIEWS_KEY(slug)),
      kvGet("shared", OVERRIDE_KEY(slug)),
      kvGet("shared", CLAIMS_KEY),
    ]);
    const list = Array.isArray(reviews) ? reviews : [];
    const cl = (Array.isArray(claims) ? claims : []).filter((c) => c.supplier === slug);
    return res.status(200).json({
      supplier: slug,
      signals: signals || {},
      override: override || null,
      reviews: list.map((r) => ({ stars: r.stars, at: r.at, note: r.note || "" })),
      reviewCount: list.length,
      // Which signals already have evidence in the queue, so a supplier is not
      // invited to submit the same thing twice.
      pendingSignals: cl.filter((c) => c.status === "pending").map((c) => c.signal),
    });
  }

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Sign in required" });

  // ------------------------------------------- founder: decide on a claim
  if (body.claimId) {
    if (!isOwner(user)) return res.status(403).json({ error: "Not authorised." });
    const all = (await kvGet("shared", CLAIMS_KEY)) || [];
    const list = Array.isArray(all) ? all : [];
    const c = list.find((x) => x.id === body.claimId);
    if (!c) return res.status(404).json({ error: "No such claim." });
    if (c.status !== "pending") return res.status(400).json({ error: "Already decided." });

    const approve = body.decision === "approve";
    c.status = approve ? "approved" : "declined";
    c.decidedBy = user.email;
    c.decidedAt = new Date().toISOString();
    c.decisionNote = String(body.note || "").slice(0, 300);

    if (approve) {
      const cur = (await kvGet("shared", SIGNALS_KEY(c.supplier))) || {};
      const next = { ...cur, [c.signal]: true, setBy: user.email, setAt: c.decidedAt };
      // Kept on the signal record so a rating can always be traced back to the
      // evidence that earned it, and to the person who accepted it.
      next.evidence = { ...(cur.evidence || {}), [c.signal]: {
        by: c.claimedBy, at: c.decidedAt, approvedBy: user.email, note: c.evidence,
      } };
      await kvSet("shared", SIGNALS_KEY(c.supplier), next);
    }
    await kvSet("shared", CLAIMS_KEY, list);
    return res.status(200).json({ ok: true, claim: c });
  }

  // ------------------------------------- a supplier submits evidence
  if (body.claim) {
    if (!slug) return res.status(400).json({ error: "supplier is required." });
    const signal = String(body.claim.signal || "");
    if (!ALLOWED.includes(signal)) return res.status(400).json({ error: "Unknown signal." });
    // quraVerified is the one signal that cannot be claimed. It means a founder
    // checked this supplier themselves, so a supplier asking for it would make
    // the badge mean nothing.
    if (signal === "quraVerified") {
      return res.status(400).json({ error: "Qura Verified is awarded by the Qura team and cannot be requested." });
    }
    const evidence = String(body.claim.evidence || "").trim();
    if (evidence.length < 15) {
      return res.status(400).json({ error: "Please describe the evidence, or paste a link to it." });
    }

    const all = (await kvGet("shared", CLAIMS_KEY)) || [];
    const list = Array.isArray(all) ? all : [];
    // One open claim per supplier per signal, so the queue cannot be flooded.
    if (list.some((c) => c.supplier === slug && c.signal === signal && c.status === "pending")) {
      return res.status(400).json({ error: "You have already submitted evidence for this. It is with the Qura team." });
    }

    const claim = {
      id: "cl_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      supplier: slug,
      supplierName: String(body.supplierName || slug).slice(0, 120),
      signal,
      evidence: evidence.slice(0, 1000),
      claimedBy: user.email,
      claimedById: user.id,
      at: new Date().toISOString(),
      status: "pending",
    };
    list.push(claim);
    const ok = await kvSet("shared", CLAIMS_KEY, list);
    if (!ok) return res.status(500).json({ error: "Could not submit that. Please try again." });
    return res.status(200).json({ ok: true, claim: { id: claim.id, signal, status: "pending" } });
  }

  if (!slug) return res.status(400).json({ error: "supplier is required." });

  // ---- founder: set the objective signals --------------------------------
  if (body.signals) {
    if (!isOwner(user)) return res.status(403).json({ error: "Not authorised." });
    const cur = (await kvGet("shared", SIGNALS_KEY(slug))) || {};
    const clean = { ...cur };
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

  return res.status(200).json({ ok: true, updated: mine >= 0, reviewCount: list.length });
}
