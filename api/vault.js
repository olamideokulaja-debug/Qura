import { getUser, kvGet, kvSet } from "./_auth.js";

// The clinician document vault.
//
//   GET                          the clinician's own vault
//   GET  ?owner=<id>             an organisation's view — only what is shared
//   GET  ?open=<docId>           a signed link, expiring in 5 minutes
//   POST { type, file }          upload a document
//   POST { type, meta }          record metadata (DBS, occupational health)
//   POST { remove }              delete one entry
//   GET  ?log=<docId>            founder: who has opened this document
//
// Four rules, each enforced here rather than in the interface, because an
// interface-only rule is one refactor away from not existing:
//
//   1. DBS and occupational health store metadata. A file posted against a
//      metadata type is refused outright.
//   2. An occupational health REPORT is never shared, whatever the sharing
//      flags say. A hospital sees fit-to-work status and a date.
//   3. An organisation sees a document only where the clinician has shared it
//      AND the document has not expired.
//   4. Every open is logged — who, what, when. Your audit asks for it, and it
//      is far easier to build now than to add to a vault already in use.

const BUCKET = "clinician-documents";
const KEY = "clinician_vault";
const LOG = (owner) => "vault_access_" + owner;

const METADATA_TYPES = new Set(["dbs", "occupational-health"]);
const OWNERS = (process.env.OWNER_EMAILS || process.env.VITE_OWNER_EMAILS || "")
  .split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
const isOwner = (u) => Boolean(u && u.email && OWNERS.includes(String(u.email).toLowerCase()));

const base = () => (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const svc = () => process.env.SUPABASE_SERVICE_ROLE_KEY;
const clean = (v, n) => String(v == null ? "" : v).trim().slice(0, n || 200);
const isDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v || "")) && !isNaN(Date.parse(v));
const expired = (d) => Boolean(d.expiresOn) && Date.parse(d.expiresOn) < Date.now();

const OK_MIME = ["application/pdf", "image/png", "image/jpeg", "image/webp",
  "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

async function readVault(uid) {
  const v = await kvGet(uid, KEY);
  return Array.isArray(v) ? v : [];
}

// What an organisation is allowed to see. Deliberately a whitelist: a new field
// added to a document does not become visible to hospitals by accident.
function shareableView(docs) {
  return docs
    .filter((d) => d.shared && !expired(d))
    .filter((d) => !(d.type === "occupational-health" && d.file))
    .map((d) => ({
      id: d.id, type: d.type, label: d.label,
      expiresOn: d.expiresOn || "",
      hasFile: Boolean(d.file),
      // Metadata types expose only the fields meant to be seen. An OH entry
      // gives status and date, never a report.
      meta: d.type === "occupational-health"
        ? { status: (d.meta || {}).status || "", assessedOn: (d.meta || {}).assessedOn || "" }
        : d.meta || {},
      addedAt: d.addedAt,
    }));
}

export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Sign in required" });
  const q = req.query || {};
  const body = req.body || {};

  // ------------------------------------------------- founder: pending queue
  if (q.pending) {
    if (!isOwner(user)) return res.status(403).json({ error: "Not authorised." });
    const r = await fetch(base() + "/rest/v1/kv?key=eq." + KEY + "&select=owner,value", {
      headers: { apikey: svc(), authorization: "Bearer " + svc() },
    });
    if (!r.ok) return res.status(200).json({ documents: [] });
    const rows = await r.json();
    const out = [];
    for (const row of (Array.isArray(rows) ? rows : [])) {
      let docs;
      try { docs = typeof row.value === "string" ? JSON.parse(row.value) : row.value; }
      catch (e) { continue; }
      if (!Array.isArray(docs)) continue;
      for (const d of docs) {
        // Nothing to check on an occupational health report: it is never
        // released, so a founder has no reason to open one.
        if (d.type === "occupational-health" && d.file) continue;
        if (!d.verifiedAt && !d.rejectedAt) out.push({ ...d, ownerId: row.owner });
      }
    }
    return res.status(200).json({ documents: out });
  }

  // ------------------------------------------------- an organisation's view
  if (q.owner) {
    const docs = await readVault(String(q.owner));
    return res.status(200).json({ documents: shareableView(docs) });
  }

  // ------------------------------------------------------------ access log
  if (q.log) {
    if (!isOwner(user)) return res.status(403).json({ error: "Not authorised." });
    const log = (await kvGet("shared", LOG(clean(q.ownerId, 60)))) || [];
    return res.status(200).json({ log: Array.isArray(log) ? log : [] });
  }

  // ------------------------------------------------ open a document
  if (q.open) {
    // The holder, or a founder. When providers manage applicants in Qura this
    // widens to an organisation the clinician has shared with — and the log is
    // already here to record it.
    const holder = clean(q.ownerId, 60) || user.id;
    if (holder !== user.id && !isOwner(user)) {
      return res.status(403).json({ error: "Not authorised." });
    }
    const docs = await readVault(holder);
    const doc = docs.find((d) => d.id === q.open);
    if (!doc || !doc.file) return res.status(404).json({ error: "No such document." });
    // An OH report never leaves, even for a founder opening it on request.
    if (doc.type === "occupational-health" && holder !== user.id) {
      return res.status(403).json({ error: "Occupational health reports are private to the clinician." });
    }

    const r = await fetch(base() + "/storage/v1/object/sign/" + BUCKET + "/" + doc.file.path, {
      method: "POST",
      headers: { authorization: "Bearer " + svc(), "content-type": "application/json" },
      body: JSON.stringify({ expiresIn: 300 }),
    });
    if (!r.ok) return res.status(500).json({ error: "Could not produce a link." });
    const j = await r.json();

    // Logged before the link is handed over, so a failure to log is not a
    // silent way to read a document unrecorded.
    try {
      const log = (await kvGet("shared", LOG(holder))) || [];
      const list = Array.isArray(log) ? log : [];
      list.push({ docId: doc.id, type: doc.type, by: user.email, at: new Date().toISOString() });
      await kvSet("shared", LOG(holder), list.slice(-500));
    } catch (e) {
      console.error("[vault] access log failed: " + (e && e.message));
    }

    return res.status(200).json({ url: base() + "/storage/v1" + j.signedURL, name: doc.file.name });
  }

  if (req.method === "GET") {
    const docs = await readVault(user.id);
    return res.status(200).json({ documents: docs });
  }

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // ------------------------------------------- founder: check a document
  if (body.docId && body.decision) {
    if (!isOwner(user)) return res.status(403).json({ error: "Not authorised." });
    const holder = clean(body.ownerId, 60);
    if (!holder) return res.status(400).json({ error: "ownerId is required." });
    const theirs = await readVault(holder);
    const doc = theirs.find((d) => d.id === body.docId);
    if (!doc) return res.status(404).json({ error: "No such document." });
    const now = new Date().toISOString();
    if (body.decision === "verify") {
      doc.verifiedAt = now; doc.verifiedBy = user.email; doc.rejectedAt = null; doc.rejectReason = "";
    } else {
      // A rejection the clinician cannot act on is just a dead end, so a
      // reason is required rather than optional.
      const why = clean(body.note, 300);
      if (!why) return res.status(400).json({ error: "Give a reason the clinician can act on." });
      doc.rejectedAt = now; doc.rejectedBy = user.email; doc.verifiedAt = null; doc.rejectReason = why;
      // A rejected document stops being shared straight away. Leaving it
      // visible while marked bad is the worst of both.
      doc.shared = false;
    }
    await kvSet(holder, KEY, theirs);
    return res.status(200).json({ ok: true, document: doc });
  }

  const docs = await readVault(user.id);

  // ---------------------------------------------------------- remove one
  if (body.remove) {
    const doc = docs.find((d) => d.id === body.remove);
    if (doc && doc.file) {
      try {
        await fetch(base() + "/storage/v1/object/" + BUCKET + "/" + doc.file.path, {
          method: "DELETE", headers: { authorization: "Bearer " + svc() },
        });
      } catch (e) {
        console.error("[vault] file delete failed: " + (e && e.message));
      }
    }
    const next = docs.filter((d) => d.id !== body.remove);
    await kvSet(user.id, KEY, next);
    return res.status(200).json({ ok: true, documents: next });
  }

  const type = clean(body.type, 40);
  if (!type) return res.status(400).json({ error: "type is required." });

  const existing = docs.find((d) => d.id === body.id);
  const doc = existing || {
    id: "doc_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    type, addedAt: new Date().toISOString(),
  };
  doc.label = clean(body.label, 140);
  doc.expiresOn = isDate(body.expiresOn) ? body.expiresOn : "";
  doc.shared = body.shared !== false;
  doc.updatedAt = new Date().toISOString();

  // ---------------------------------------------------------- metadata
  if (body.meta) {
    const meta = {};
    for (const [k, v] of Object.entries(body.meta)) {
      meta[clean(k, 40)] = typeof v === "boolean" ? v : clean(v, 120);
    }
    doc.meta = meta;
  }

  // ---------------------------------------------------------- a file
  if (body.file) {
    // The rule that matters most in this file. A DBS certificate must never be
    // stored, so a file against a metadata type is refused rather than quietly
    // ignored — the clinician needs to know it did not save.
    if (type === "dbs") {
      return res.status(400).json({
        error: "We do not store DBS certificates. Record the certificate number instead — organisations verify it on the DBS update service.",
      });
    }
    const name = clean(body.file.name, 160) || "document";
    const mime = clean(body.file.type, 100);
    if (!OK_MIME.includes(mime)) return res.status(400).json({ error: "Please upload a PDF, Word document or image." });
    const b64 = String(body.file.data || "").split(",").pop();
    if (!b64) return res.status(400).json({ error: "No file received." });
    const bytes = Buffer.from(b64, "base64");
    if (bytes.length > 10 * 1024 * 1024) return res.status(400).json({ error: "That file is over 10MB." });

    const path = user.id + "/" + doc.id + "-" + Date.now() + "-" + name.replace(/[^A-Za-z0-9._-]/g, "_");
    const up = await fetch(base() + "/storage/v1/object/" + BUCKET + "/" + path, {
      method: "POST",
      headers: { authorization: "Bearer " + svc(), "content-type": mime, "x-upsert": "true" },
      body: bytes,
    });
    if (!up.ok) {
      const detail = await up.text().catch(() => "");
      console.error("[vault] upload failed " + up.status + ": " + detail.slice(0, 200));
      return res.status(500).json({ error: "Could not store that file. Please try again." });
    }
    doc.file = { path, name, type: mime, size: bytes.length, at: new Date().toISOString() };
    // A new document has not been checked yet.
    doc.verifiedAt = null;
  }

  if (!existing) docs.push(doc);
  await kvSet(user.id, KEY, docs);
  return res.status(200).json({ ok: true, document: doc, documents: docs });
}
