import { kvGet, kvSet } from "./_auth.js";

// Retention, applied.
//
// Until this ran, retention was a policy: written down, stated in the privacy
// notice, and not actually happening. That gap matters — a ROPA claiming
// documents are deleted after 12 months is worse than no ROPA if nothing
// deletes them.
//
// Two rules, both from src/data/vault.js:
//
//   Expired documents      deleted 12 months after their expiry date
//   Deleted accounts       everything removed 30 days after deletion
//
// Called by Vercel Cron daily. Idempotent, so running it twice is harmless, and
// it reports what it did rather than working silently — an unattended job that
// never says anything is one nobody notices has stopped.

const BUCKET = "clinician-documents";
const VAULT_KEY = "clinician_vault";

// Must match RETENTION in src/data/vault.js. Duplicated deliberately rather
// than imported: an API function reaching into the client bundle is a bundling
// risk, and these two numbers change about once a year.
const AFTER_EXPIRY_MONTHS = 12;
const AFTER_DELETION_DAYS = 30;

const base = () => (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const svc = () => process.env.SUPABASE_SERVICE_ROLE_KEY;

async function deleteFile(path) {
  try {
    const r = await fetch(base() + "/storage/v1/object/" + BUCKET + "/" + path, {
      method: "DELETE", headers: { authorization: "Bearer " + svc() },
    });
    return r.ok;
  } catch (e) {
    console.error("[retention] file delete failed: " + (e && e.message));
    return false;
  }
}

// Every vault in the system. Reads the kv table directly because there is no
// per-user index, and this runs once a day rather than per request.
async function allVaults() {
  const r = await fetch(base() + "/rest/v1/kv?key=eq." + VAULT_KEY + "&select=owner,value", {
    headers: { apikey: svc(), authorization: "Bearer " + svc() },
  });
  if (!r.ok) return [];
  const rows = await r.json();
  return Array.isArray(rows) ? rows : [];
}

export default async function handler(req, res) {
  // Vercel Cron sends this header. Without the check the endpoint would let
  // anyone trigger a deletion sweep.
  const secret = process.env.CRON_SECRET;
  const auth = String(req.headers.authorization || "");
  if (secret && auth !== "Bearer " + secret) {
    return res.status(401).json({ error: "Not authorised." });
  }

  const now = Date.now();
  const expiryCutoff = AFTER_EXPIRY_MONTHS * 30 * 86400000;
  const deletionCutoff = AFTER_DELETION_DAYS * 86400000;

  let vaultsSeen = 0, docsRemoved = 0, filesRemoved = 0, accountsPurged = 0;
  const notes = [];

  for (const row of await allVaults()) {
    vaultsSeen++;
    let docs;
    try { docs = typeof row.value === "string" ? JSON.parse(row.value) : row.value; }
    catch (e) { continue; }
    if (!Array.isArray(docs)) continue;

    // Has this account been deleted? The marker is written when the person
    // deletes; the documents survive only long enough to restore a mistake.
    let purgeAll = false;
    try {
      const acc = await kvGet(row.owner, "account");
      if (acc && acc.deletedAt) {
        const t = Date.parse(acc.deletedAt);
        if (isFinite(t) && now - t > deletionCutoff) purgeAll = true;
      }
    } catch (e) {}

    const keep = [];
    for (const d of docs) {
      let drop = purgeAll;
      if (!drop && d.expiresOn) {
        const t = Date.parse(d.expiresOn);
        if (isFinite(t) && now > t + expiryCutoff) drop = true;
      }
      if (!drop) { keep.push(d); continue; }
      if (d.file && d.file.path) { if (await deleteFile(d.file.path)) filesRemoved++; }
      docsRemoved++;
    }

    if (keep.length !== docs.length) {
      await kvSet(row.owner, VAULT_KEY, keep);
      if (purgeAll) {
        accountsPurged++;
        // The access log goes with the documents. Keeping a record of who
        // opened a document that no longer exists serves nobody.
        try { await kvSet("shared", "vault_access_" + row.owner, []); } catch (e) {}
      }
      notes.push({ owner: row.owner.slice(0, 8), removed: docs.length - keep.length, reason: purgeAll ? "account deleted" : "expired" });
    }
  }

  // Expired password reset tokens, while we are here. They were persisting
  // indefinitely, which is a small but real exposure.
  let tokensRemoved = 0;
  try {
    const r = await fetch(base() + "/rest/v1/kv?key=like.pw_link_*&select=owner,key,value", {
      headers: { apikey: svc(), authorization: "Bearer " + svc() },
    });
    if (r.ok) {
      for (const row of await r.json()) {
        let v; try { v = typeof row.value === "string" ? JSON.parse(row.value) : row.value; } catch (e) { continue; }
        const exp = v && Number(v.expires);
        if (isFinite(exp) && exp < now) {
          await fetch(base() + "/rest/v1/kv?key=eq." + encodeURIComponent(row.key), {
            method: "DELETE", headers: { apikey: svc(), authorization: "Bearer " + svc() },
          });
          tokensRemoved++;
        }
      }
    }
  } catch (e) {
    console.error("[retention] token sweep failed: " + (e && e.message));
  }

  const summary = { vaultsSeen, docsRemoved, filesRemoved, accountsPurged, tokensRemoved, at: new Date().toISOString() };
  // Kept so there is evidence the schedule is running. An auditor asking
  // "how do you know retention is applied" needs an answer better than trust.
  try {
    const log = (await kvGet("shared", "retention_log")) || [];
    await kvSet("shared", "retention_log", [...(Array.isArray(log) ? log : []), summary].slice(-90));
  } catch (e) {}

  return res.status(200).json({ ok: true, ...summary, notes });
}
