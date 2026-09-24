import { getUser } from "./_auth.js";
import { limited } from "./_ratelimit.js";
import { sendMailEach, owners } from "./_waitlist.js";
import { bump } from "./_metrics.js";

// POST /api/sales-enquiry { name, company, phone, message, plan }
//
// "Contact sales" on Enterprise and Network used to switch the account to the
// Enterprise plan on the spot, free. It now sends the founders an enquiry and
// nothing else: an Enterprise plan is only ever set by a founder in Admin.

const esc = (v) => String(v == null ? "" : v).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const clean = (v, n) => String(v || "").replace(/\s+/g, " ").trim().slice(0, n);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const user = await getUser(req);
  if (await limited(req, res, user && !user._preview ? user : null, { bucket: "sales-enquiry", limit: 5, windowSec: 3600 })) return;

  const b = req.body || {};
  const name = clean(b.name, 80);
  const company = clean(b.company, 120);
  const phone = clean(b.phone, 40);
  const message = String(b.message || "").trim().slice(0, 2000);
  const plan = clean(b.plan, 40) || "Enterprise";
  const email = clean((user && !user._preview && user.email) || b.email, 120).toLowerCase();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: "Please give an email address we can reply to." });
  if (!name) return res.status(400).json({ error: "Please give your name." });

  const to = owners();
  const row = (k, v) => v ? "<tr><td style=\"padding:3px 14px 3px 0;color:#5A6783\">" + k + "</td><td>" + esc(v) + "</td></tr>" : "";
  const html =
    '<div style="font-family:Inter,Arial,sans-serif;color:#0A1730;line-height:1.55">' +
    "<p><b>" + esc(name) + "</b> wants to talk about <b>" + esc(plan) + "</b>. Reply to this email to answer them directly, ideally within 1 working day.</p>" +
    '<table cellpadding="0" cellspacing="0">' + row("Email", email) + row("Company", company) + row("Phone", phone) + "</table>" +
    (message ? '<p style="white-space:pre-wrap;border-left:3px solid #00C2B8;padding-left:12px">' + esc(message) + "</p>" : "") +
    '<p style="font-size:13px;color:#5A6783">Once agreed, set their plan in Admin. Nothing has been switched on for them.</p></div>';
  const r = to.length ? await sendMailEach(to, "Sales enquiry: " + plan + " from " + (company || name), html, email) : { ok: false };
  await bump("enquiry");
  if (!r.ok) return res.status(502).json({ error: "We could not send that just now. Please email support@qurahealth.org." });
  return res.status(200).json({ ok: true });
}
