import { getUser, kvGet, kvSet } from "./_auth.js";

// Cross-department supplier intelligence.
//
// The problem it solves is real and structural: a large trust has audiology
// talking to a supplier while radiology, separately and unknowingly, meets the
// same supplier next month. Nobody has the whole picture, so the organisation
// negotiates twice, onboards twice, and gets none of the leverage.
//
//   POST { supplier, specialty }   record that I engaged this supplier
//   GET  ?supplier=<slug>          what else my organisation has done with them
//
// Two things this deliberately does NOT do:
//
//   It does not invent history. Qura has never recorded a hospital engaging a
//   supplier, so this starts empty for every organisation and fills as people
//   use it. An empty answer says so plainly rather than implying no engagement
//   exists.
//
//   It does not leak across organisations. An engagement is only ever visible
//   to people at the same organisation. A supplier must never learn which of
//   its customers is talking to it elsewhere, and a rival trust must never see
//   any of it.

const KEY = (orgSlug) => "engagements_" + orgSlug;
const LINK_KEY = "supplier_org";

const clean = (v, n) => String(v == null ? "" : v).trim().slice(0, n || 120);
const slugify = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

// Which organisation is this person part of? The same link the supplier claim
// flow creates, reused: it is not agency-specific, it answers "which company
// does this account belong to" for anyone.
async function orgOf(user) {
  const link = await kvGet(user.id, LINK_KEY);
  return link && link.slug ? link : null;
}

// A person's name for a colleague to recognise. Falls back to the email stem
// rather than printing a raw address, which reads as a leak even when it is not.
function displayName(user) {
  const m = user.user_metadata || {};
  const n = [m.first_name, m.last_name].filter(Boolean).join(" ").trim() || m.full_name || m.name;
  if (n) return n;
  return String(user.email || "").split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Sign in required" });

  const link = await orgOf(user);
  const supplier = slugify((req.query && req.query.supplier) || (req.body && req.body.supplier));

  // Without an organisation there is nothing to be cross-department about. Not
  // an error: most accounts have not claimed one yet, and the screen should
  // simply say nothing rather than complain.
  if (!link) return res.status(200).json({ org: null, engagements: [], others: [] });

  if (req.method === "GET") {
    if (!supplier) return res.status(400).json({ error: "supplier is required." });
    const all = (await kvGet("shared", KEY(link.slug))) || [];
    const list = (Array.isArray(all) ? all : []).filter((e) => e.supplier === supplier);

    // Split by whether it was this person or a colleague. "You spoke to them in
    // March" and "someone else in your trust is already talking to them" are
    // different pieces of information and should not be blurred together.
    const mine = list.filter((e) => e.byId === user.id);
    const others = list.filter((e) => e.byId !== user.id);

    // Most recent first, and one entry per person and specialty: a colleague
    // who opened the same supplier nine times is one relationship, not nine.
    const seen = new Set();
    const deduped = [];
    for (const e of others.sort((a, b) => String(b.at).localeCompare(String(a.at)))) {
      const k = e.byId + "|" + (e.specialty || "");
      if (seen.has(k)) continue;
      seen.add(k);
      deduped.push({ by: e.by, specialty: e.specialty, kind: e.kind, at: e.at });
    }

    return res.status(200).json({
      org: { name: link.org, slug: link.slug },
      engagements: mine.map((e) => ({ specialty: e.specialty, kind: e.kind, at: e.at })),
      others: deduped,
      specialties: Array.from(new Set(deduped.map((e) => e.specialty).filter(Boolean))),
    });
  }

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!supplier) return res.status(400).json({ error: "supplier is required." });

  const body = req.body || {};
  const rec = {
    supplier,
    supplierName: clean(body.supplierName, 140),
    // The department or specialty this engagement was about. It is the whole
    // point of the feature: "already engaging" is only useful if you know what
    // for.
    specialty: clean(body.specialty, 80),
    kind: ["viewed", "contacted", "shortlisted", "engaged"].includes(body.kind) ? body.kind : "viewed",
    by: displayName(user),
    byId: user.id,
    at: new Date().toISOString(),
  };

  const all = (await kvGet("shared", KEY(link.slug))) || [];
  const list = Array.isArray(all) ? all : [];

  // Collapse repeats: the same person, supplier, specialty and kind on the same
  // day is one engagement. Without this, opening a page twice would make a
  // colleague look twice as involved as they are.
  const day = rec.at.slice(0, 10);
  const dupe = list.findIndex((e) => e.byId === rec.byId && e.supplier === rec.supplier
    && e.specialty === rec.specialty && e.kind === rec.kind && String(e.at).slice(0, 10) === day);
  if (dupe >= 0) list[dupe] = rec; else list.push(rec);

  // Keep it bounded. A busy trust would otherwise grow this row without limit.
  const trimmed = list.slice(-500);
  const ok = await kvSet("shared", KEY(link.slug), trimmed);
  if (!ok) return res.status(500).json({ error: "Could not record that." });

  return res.status(200).json({ ok: true });
}
