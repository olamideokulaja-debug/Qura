import crypto from "node:crypto";
import { sbAdmin } from "./_send.js";
import { limited } from "./_ratelimit.js";
import { owners } from "./_waitlist.js";

// SEND Intelligence: public removal requests (idea 33). Anyone can ask Qura to stop showing
// their name or work contact details. Stores only hashes for matching, suppresses any matching
// decision-maker record at once, and tells the founders by email so a person follows up.
// POST { name, email, organisation, note }

const lit = (s) => String(s).replace(/[%_\\]/g, "");  // no wildcards from the public form
const h = (s) => s ? crypto.createHash("sha256").update(String(s).trim().toLowerCase()).digest("hex") : null;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (await limited(req, res, null, { bucket: "send_removal", limit: 5, windowSec: 3600 })) return;
  const b = req.body || {};
  const name = String(b.name || "").trim().slice(0, 120), email = String(b.email || "").trim().slice(0, 200), org = String(b.organisation || "").trim().slice(0, 200), note = String(b.note || "").trim().slice(0, 1000);
  if (!name && !email) return res.status(400).json({ error: "Please give your name or work email." });
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: "That email address does not look right." });
  const sb = sbAdmin(); if (!sb) return res.status(500).json({ error: "Not available" });
  await sb.from("send_contact_suppressions").insert({ name_hash: h(name), email_hash: h(email), reason: "removal request" + (org ? " (" + org.slice(0, 80) + ")" : "") });
  let suppressed = 0;
  if (lit(name).length >= 3) { const { data } = await sb.from("send_decision_makers").update({ privacy_status: "suppressed" }).ilike("name", lit(name)).select("id"); suppressed += (data || []).length; }
  if (lit(email).length >= 6) { const { data } = await sb.from("send_decision_makers").update({ privacy_status: "suppressed" }).ilike("work_email", lit(email)).select("id"); suppressed += (data || []).length; }
  const key = process.env.RESEND_API_KEY;
  // One message per founder: Resend rejects a whole send if any one address on it is suppressed
  if (key) for (const to of (owners().length ? owners() : ["privacy@qurahealth.org"])) await fetch("https://api.resend.com/emails", { method: "POST", headers: { authorization: "Bearer " + key, "content-type": "application/json" }, body: JSON.stringify({ from: "Qura <" + (process.env.MAIL_FROM || "noreply@qurahealth.org") + ">", to: [to], subject: "SEND data removal request", text: "A removal request came in through qurahealth.org/send-data.html.\n\nName: " + (name || "(not given)") + "\nEmail: " + (email || "(not given)") + "\nOrganisation: " + (org || "(not given)") + "\nNote: " + (note || "(none)") + "\n\nMatching records suppressed automatically: " + suppressed + ".\nPlease reply to the person within one month." }) }).catch(() => null);
  return res.status(200).json({ ok: true, message: "Thank you. We have stopped showing any matching details and will confirm by email within one month if you gave an address." });
}
