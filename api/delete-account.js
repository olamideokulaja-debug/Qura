import { getUser } from "./_auth.js";
import { adminClient } from "./_waitlist.js";

// POST /api/delete-account
//
// Deletes the signed-in person's account for good: every row they own in the
// kv table, their uploaded CV and documents, and the sign-in itself.
//
// This used to blank 5 keys and leave the login in place, so a "deleted"
// person could sign straight back in to an account with their other data
// still there. Apple requires deletion to delete the account, and so does
// UK GDPR when someone asks.
//
// Kept on purpose: records of completed payments, which live in Stripe for as
// long as UK tax law requires, and a bare log line (account id and date, no
// personal details) so the founders can see a deletion happened.

const BUCKETS = ["cvs", "clinician-documents"];

export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Sign in required" });
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const admin = adminClient();
  if (!admin) return res.status(500).json({ error: "Account deletion is not configured. Please email support@qurahealth.org." });

  const id = user.id;
  const problems = [];

  // 1. Uploaded files. A missing bucket or an empty folder is not an error.
  for (const bucket of BUCKETS) {
    try {
      const { data: files } = await admin.storage.from(bucket).list(id, { limit: 1000 });
      const paths = (files || []).map((f) => id + "/" + f.name);
      if (paths.length) {
        const { error } = await admin.storage.from(bucket).remove(paths);
        if (error) problems.push(bucket + ": " + error.message);
      }
    } catch (e) {}
  }

  // 2. Everything they own in the kv table.
  const { error: kvErr } = await admin.from("kv").delete().eq("owner", id);
  if (kvErr) problems.push("kv: " + kvErr.message);

  // 3. The sign-in itself. Done last, so a failure above can be retried by the
  // same person still signed in.
  const { error: authErr } = await admin.auth.admin.deleteUser(id);
  if (authErr) problems.push("auth: " + authErr.message);

  try {
    const { data } = await admin.from("kv").select("value").eq("owner", "deletions").eq("key", "log").maybeSingle();
    let log = [];
    try { log = JSON.parse((data && data.value) || "[]"); } catch (e) { log = []; }
    log.unshift({ id, at: new Date().toISOString(), ok: !problems.length });
    await admin.from("kv").upsert({ owner: "deletions", key: "log", value: JSON.stringify(log.slice(0, 2000)) }, { onConflict: "owner,key" });
  } catch (e) {}

  if (authErr) {
    return res.status(500).json({ error: "We could not finish deleting your account. Please try again, or email support@qurahealth.org and we will do it for you." });
  }
  return res.status(200).json({ ok: true, deleted: true });
}
