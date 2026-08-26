import { getUser, kvGet, kvSet } from "./_auth.js";

// An agency's framework positions, and the certificates that evidence them.
//
//   GET                          the caller's own entries
//   GET  ?org=<slug>             a named organisation's entries (verified only)
//   GET  ?pending=1              founder: entries awaiting verification
//   POST { entry }               add or update an entry
//   POST { remove }              delete one of your own entries
//   POST { entryId, decision }   founder: verify or reject
//   POST { entryId, file }       attach a certificate
//   GET  ?download=<entryId>     a short-lived link to that certificate
//
// The shape of the problem: an agency can hold several frameworks, several lots
// within one, and their position on each changes over time. So entries are
// stored as a list against the organisation, never as booleans on a supplier
// record.
//
// Certificates go to a PRIVATE Supabase bucket. Nothing is ever served
// publicly: a founder gets a signed link that expires. A framework certificate
// carries company detail an agency has handed over in confidence, and there is
// no version of this where it sits on a public URL.

const BUCKET = "framework-evidence";
const KEY = (slug) => "frameworks_" + slug;
const LINK_KEY = "supplier_org";

const OWNERS = (process.env.OWNER_EMAILS || process.env.VITE_OWNER_EMAILS || "")
  .split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
const isOwner = (u) => Boolean(u && u.email && OWNERS.includes(String(u.email).toLowerCase()));

const base = () => (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const svc = () => process.env.SUPABASE_SERVICE_ROLE_KEY;

const clean = (v, n) => String(v == null ? "" : v).trim().slice(0, n || 200);
const isDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v || "")) && !isNaN(Date.parse(v));

// Which organisation is this account allowed to speak for? Only the one a
// founder has already linked to it. Without this, an agency could add framework
// claims to a competitor's profile.
async function orgOf(user) {
  const link = await kvGet(user.id, LINK_KEY);
  return link && link.slug ? link : null;
}

async function readEntries(slug) {
  const rows = await kvGet("shared", KEY(slug));
  return Array.isArray(rows) ? rows : [];
}

export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Sign in required" });
  const q = req.query || {};
  const body = req.body || {};

  // ------------------------------------------------- founder: pending queue
  if (q.pending) {
    if (!isOwner(user)) return res.status(403).json({ error: "Not authorised." });
    const idx = (await kvGet("shared", "frameworks_index")) || [];
    const slugs = Array.isArray(idx) ? idx : [];
    const out = [];
    for (const s of slugs) {
      for (const e of await readEntries(s)) {
        if (!e.verifiedAt && !e.rejectedAt) out.push({ ...e, orgSlug: s });
      }
    }
    return res.status(200).json({ entries: out });
  }

  // -------------------------------------------- founder: a signed download
  if (q.download) {
    if (!isOwner(user)) return res.status(403).json({ error: "Not authorised." });
    const idx = (await kvGet("shared", "frameworks_index")) || [];
    let found = null, slug = null;
    for (const s of (Array.isArray(idx) ? idx : [])) {
      const e = (await readEntries(s)).find((x) => x.id === q.download);
      if (e) { found = e; slug = s; break; }
    }
    if (!found || !found.file) return res.status(404).json({ error: "No certificate on that entry." });
    // 5 minutes is enough to open it and short enough that a copied link is
    // useless by the time it leaves the room.
    const r = await fetch(base() + "/storage/v1/object/sign/" + BUCKET + "/" + found.file.path, {
      method: "POST",
      headers: { authorization: "Bearer " + svc(), "content-type": "application/json" },
      body: JSON.stringify({ expiresIn: 300 }),
    });
    if (!r.ok) return res.status(500).json({ error: "Could not produce a link." });
    const j = await r.json();
    return res.status(200).json({ url: base() + "/storage/v1" + j.signedURL, name: found.file.name });
  }

  if (req.method === "GET") {
    // A named organisation: only what a founder has verified. An unverified
    // claim is not something a hospital should be reading.
    if (q.org) {
      const all = await readEntries(String(q.org).toLowerCase());
      return res.status(200).json({
        entries: all.filter((e) => e.verifiedAt).map((e) => ({
          id: e.id, frameworkId: e.frameworkId, otherName: e.otherName,
          reference: e.reference, lots: e.lots, status: e.status,
          awardedOn: e.awardedOn, expiresOn: e.expiresOn, verifiedAt: e.verifiedAt,
        })),
      });
    }
    const link = await orgOf(user);
    if (!link) return res.status(200).json({ org: null, entries: [] });
    return res.status(200).json({ org: link, entries: await readEntries(link.slug) });
  }

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // ------------------------------------------------- founder: verify a claim
  if (body.entryId && body.decision) {
    if (!isOwner(user)) return res.status(403).json({ error: "Not authorised." });
    const idx = (await kvGet("shared", "frameworks_index")) || [];
    for (const s of (Array.isArray(idx) ? idx : [])) {
      const list = await readEntries(s);
      const e = list.find((x) => x.id === body.entryId);
      if (!e) continue;
      const now = new Date().toISOString();
      if (body.decision === "verify") { e.verifiedAt = now; e.verifiedBy = user.email; e.rejectedAt = null; }
      else { e.rejectedAt = now; e.rejectedBy = user.email; e.verifiedAt = null; e.rejectReason = clean(body.note, 300); }
      await kvSet("shared", KEY(s), list);
      return res.status(200).json({ ok: true, entry: e });
    }
    return res.status(404).json({ error: "No such entry." });
  }

  const link = await orgOf(user);
  if (!link) {
    return res.status(403).json({
      error: "Your account is not linked to an organisation yet. Claim it under Your Qura standing first.",
    });
  }
  const list = await readEntries(link.slug);

  // ---------------------------------------------------- attach a certificate
  if (body.entryId && body.file) {
    const e = list.find((x) => x.id === body.entryId);
    if (!e) return res.status(404).json({ error: "No such entry." });
    const name = clean(body.file.name, 160) || "certificate";
    const type = clean(body.file.type, 100);
    const b64 = String(body.file.data || "").split(",").pop();
    if (!b64) return res.status(400).json({ error: "No file received." });
    const bytes = Buffer.from(b64, "base64");
    if (bytes.length > 10 * 1024 * 1024) return res.status(400).json({ error: "That file is over 10MB." });
    const ok = ["application/pdf", "image/png", "image/jpeg", "image/webp",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!ok.includes(type)) return res.status(400).json({ error: "Please upload a PDF, Word document or image." });

    const path = link.slug + "/" + e.id + "-" + Date.now() + "-" + name.replace(/[^A-Za-z0-9._-]/g, "_");
    const up = await fetch(base() + "/storage/v1/object/" + BUCKET + "/" + path, {
      method: "POST",
      headers: { authorization: "Bearer " + svc(), "content-type": type || "application/octet-stream", "x-upsert": "true" },
      body: bytes,
    });
    if (!up.ok) {
      const detail = await up.text().catch(() => "");
      console.error("[frameworks] upload failed " + up.status + ": " + detail.slice(0, 200));
      return res.status(500).json({ error: "Could not store that file. Please try again." });
    }
    e.file = { path, name, type, size: bytes.length, at: new Date().toISOString() };
    // New evidence means the entry needs looking at again.
    e.verifiedAt = null; e.rejectedAt = null;
    await kvSet("shared", KEY(link.slug), list);
    return res.status(200).json({ ok: true, entry: e });
  }

  // ---------------------------------------------------------- remove an entry
  if (body.remove) {
    const next = list.filter((x) => x.id !== body.remove);
    await kvSet("shared", KEY(link.slug), next);
    return res.status(200).json({ ok: true, entries: next });
  }

  // ------------------------------------------------------ add or update one
  const en = body.entry || {};
  const frameworkId = clean(en.frameworkId, 40);
  if (!frameworkId) return res.status(400).json({ error: "Choose a framework." });
  if (frameworkId === "other" && !clean(en.otherName)) {
    return res.status(400).json({ error: "Name the framework or arrangement." });
  }

  const rec = {
    id: en.id || ("fw_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7)),
    frameworkId,
    otherName: clean(en.otherName, 160),
    reference: clean(en.reference, 120),          // e.g. RM6397
    lots: Array.isArray(en.lots) ? en.lots.slice(0, 30).map((l) => clean(l, 80)) : [],
    status: clean(en.status, 30) || "awarded",
    awardedOn: isDate(en.awardedOn) ? en.awardedOn : "",
    expiresOn: isDate(en.expiresOn) ? en.expiresOn : "",
    addedBy: user.email,
    at: new Date().toISOString(),
  };

  const existing = list.findIndex((x) => x.id === rec.id);
  if (existing >= 0) {
    // Keep the certificate across an edit; changing the detail invalidates the
    // verification, since a founder checked the old wording.
    rec.file = list[existing].file || null;
    list[existing] = rec;
  } else {
    list.push(rec);
  }
  await kvSet("shared", KEY(link.slug), list);

  try {
    const idx = (await kvGet("shared", "frameworks_index")) || [];
    const arr = Array.isArray(idx) ? idx : [];
    if (!arr.includes(link.slug)) { arr.push(link.slug); await kvSet("shared", "frameworks_index", arr); }
  } catch (e) {
    console.error("[frameworks] index write failed: " + (e && e.message));
  }

  return res.status(200).json({ ok: true, entry: rec, entries: list });
}
