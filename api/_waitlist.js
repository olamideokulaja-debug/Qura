// Everything the early-access queue does, in one place, so the founder panel,
// the landing-page form and the one-tap links in the notification email cannot
// drift apart.
//
// The queue lives in kv under shared/qura_waitlist_v2 as:
//   { email, role, ts, status, decidedAt, decidedBy, userId, emailed }

import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// The roles the signup picker knows. "supplier" is kept only so requests
// queued before the landing page widened still approve correctly.
const ROLE_LABEL = {
  agency: "workforce supplier", supplier: "workforce supplier",
  hospital: "hospital or provider", gp: "GP practice",
  care: "care provider", clinician: "clinician",
};

const SITE = "https://www.qurahealth.org";

// The signature block that goes under every founder email. Kept in one place
// so the two emails cannot drift apart.
const SIGNATURE =
  '<table cellpadding="0" cellspacing="0" border="0" style="margin-top:30px;border-top:1px solid #E3E8F0;padding-top:18px">' +
  '<tr><td style="padding:0 0 10px 0">' +
  '<img src="' + SITE + '/qura-logo-email.png" width="200" height="47" alt="Qura, Healthcare Growth CRM" style="display:block;border:0">' +
  '</td></tr>' +
  '<tr><td style="font-family:Inter,Arial,sans-serif;font-size:13px;line-height:1.7;color:#5A6783">' +
  '<strong style="color:#0A1730">The Qura Founders</strong><br>' +
  '<a href="' + SITE + '" style="color:#0E8C7E;text-decoration:none">qurahealth.org</a> &nbsp;·&nbsp; ' +
  '<a href="https://www.linkedin.com/company/qura-healthcare" style="color:#0E8C7E;text-decoration:none">LinkedIn</a><br>' +
  'Qura Ltd, company no. 17310951<br>' +
  '167-169 Great Portland Street, 5th Floor, London W1W 5PF' +
  '</td></tr></table>';


export function adminClient() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) return null;
  return createClient(url, service);
}

export async function kvRead(admin, owner, key) {
  const { data } = await admin.from("kv").select("value").eq("owner", owner).eq("key", key).maybeSingle();
  if (!data) return null;
  try { return JSON.parse(data.value); } catch { return data.value; }
}

export function kvWrite(admin, owner, key, value) {
  return admin.from("kv").upsert({ owner, key, value: JSON.stringify(value) }, { onConflict: "owner,key" });
}

export async function getQueue(admin) {
  const list = await kvRead(admin, "shared", "qura_waitlist_v2");
  return Array.isArray(list) ? list : [];
}

// One-tap links are signed rather than session-authenticated, because the
// point of them is that they work from a phone notification without signing
// in. CRON_SECRET is reused so there is no new environment variable to set.
export function sign(email, decision) {
  const secret = process.env.CRON_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return crypto.createHmac("sha256", secret).update(email + "|" + decision).digest("hex").slice(0, 40);
}

export function verify(email, decision, token) {
  const want = sign(email, decision);
  if (!token || token.length !== want.length) return false;
  return crypto.timingSafeEqual(Buffer.from(want), Buffer.from(token));
}

export function actionLinks(email) {
  const q = (d) => SITE + "/api/waitlist-action?e=" + encodeURIComponent(email) + "&d=" + d + "&t=" + sign(email, d);
  return { approve: q("approve"), deny: q("deny") };
}

export const SUPPORT = "support@qurahealth.org";

// replyTo matters here: the from address is noreply@, so an email that invites
// a reply and does not set this sends the answer into a black hole.
export async function sendMail(to, subject, html, replyTo) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM || "noreply@qurahealth.org";
  if (!key) return { ok: false, error: "RESEND_API_KEY is not set." };
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: "Bearer " + key, "content-type": "application/json" },
      body: JSON.stringify(Object.assign({ from: "Qura <" + from + ">", to, subject, html },
        replyTo ? { reply_to: replyTo } : {})),
    });
    let detail = "";
    if (!r.ok) { try { detail = (await r.text()).slice(0, 300); } catch (e) {} }
    return { ok: r.ok, status: r.status, error: r.ok ? "" : "Resend returned " + r.status + (detail ? ": " + detail : "") };
  } catch (e) {
    return { ok: false, status: 0, error: String(e.message || e) };
  }
}

// Send the SAME message to several people as SEPARATE messages.
//
// Resend rejects an entire send if ANY recipient on it is suppressed. One dead
// test address (audit.owner@) therefore silently killed every early-access
// notification to every founder for a week — nobody was told that people were
// waiting. One message per person means a bad address can only ever lose its
// own copy.
//
// Returns per-recipient outcomes so the caller can report who actually got it
// rather than a single true/false that hides a partial failure.
export async function sendMailEach(recipients, subject, html, replyTo) {
  const list = (Array.isArray(recipients) ? recipients : [recipients]).filter(Boolean);
  const results = await Promise.all(list.map(async (addr) => {
    const r = await sendMail([addr], subject, html, replyTo);
    return { to: addr, ok: r.ok, error: r.error || "" };
  }));
  const delivered = results.filter((x) => x.ok).map((x) => x.to);
  const failed = results.filter((x) => !x.ok);
  // Anything that fails here is worth a server log: this is the path that was
  // failing invisibly before.
  for (const f of failed) console.error("[mail] failed to " + f.to + ": " + f.error);
  return { ok: delivered.length > 0, delivered, failed, results };
}

export function owners() {
  return (process.env.OWNER_EMAILS || process.env.VITE_OWNER_EMAILS || "")
    .split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
}

// Approve: create the account, generate a set-password link, write the role
// they chose, then email them. The role is written before the email goes out
// so an account can never be reachable without one.
export async function approve(admin, entry, by) {
  const addr = entry.email;
  // Anything unrecognised falls back to clinician, which is the most limited
  // view: a wrong guess that under-grants is recoverable, one that over-grants
  // is not. "supplier" from the old form maps to the real key, "agency".
  const raw = String(entry.role || "");
  const role = raw === "supplier" ? "agency" : (ROLE_LABEL[raw] ? raw : "clinician");

  let userId = null;
  const made = await admin.auth.admin.createUser({ email: addr, email_confirm: true });
  if (made && made.data && made.data.user) userId = made.data.user.id;
  if (!userId) {
    const { data: found } = await admin.auth.admin.listUsers();
    const hit = ((found && found.users) || []).find((u) => (u.email || "").toLowerCase() === addr);
    if (hit) userId = hit.id;
  }
  if (!userId) return { ok: false, error: "Could not create or find that account." };

  // recovery, not invite: invite fails outright if the address already exists
  const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
    type: "recovery",
    email: addr,
    options: { redirectTo: SITE + "/reset-password.html" },
  });
  if (linkErr) return { ok: false, error: "Could not generate the link: " + linkErr.message };
  const actionLink = link && link.properties && link.properties.action_link;

  await kvWrite(admin, userId, "qura_role", role);
  // No qura_plan row is written. Absence of one already means the free plan.

  // The set-password link must be a QURA url. A Supabase verify link in an
  // email from a healthcare platform reads as phishing, and this is the one
  // link we most need people to trust. So the real link is stored against a
  // short opaque token and /api/set-password redirects to it.
  const token = crypto.randomBytes(16).toString("hex");
  await kvWrite(admin, "shared", "pw_link_" + token, {
    link: actionLink, email: addr, role,
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });
  const setLink = SITE + "/api/set-password?t=" + token;
  const roleWord = ROLE_LABEL[role] || "clinician";

  const mail = await sendMail([addr], "Welcome to Qura: your early access is open",
    '<div style="font-family:Inter,Arial,sans-serif;color:#0A1730;line-height:1.65;font-size:15px;max-width:620px">' +
    '<h1 style="font-size:24px;margin:0 0 18px 0;color:#0A1730">Welcome to Qura</h1>' +
    "<p>Thank you for becoming one of our early pre-launch subscribers. We are genuinely excited to have you with us at the very beginning of the Qura journey.</p>" +
    "<p>Qura has been built to bring the healthcare ecosystem together through one intelligent platform. Whether you are a healthcare provider, workforce supplier, clinician, medical device company or another organisation supporting healthcare, our mission is simple: to make meaningful connections easier, improve collaboration, and help the right people find the right opportunities.</p>" +

    '<div style="background:#F2F5F9;border-left:4px solid #0E8C7E;padding:18px 22px;margin:26px 0;border-radius:6px">' +
    '<p style="margin:0 0 14px 0"><strong>Set your password and sign in.</strong><br>' +
    "You asked for access as a <strong>" + roleWord + "</strong>, so that is the view your account opens on.</p>" +
    '<p style="margin:0 0 12px 0"><a href="' + setLink + '" style="background:#00C2B8;color:#04231F;font-weight:700;padding:13px 26px;border-radius:999px;text-decoration:none;display:inline-block">Create your password</a></p>' +
    '<p style="margin:0;font-size:12.5px;color:#5A6783">This link is for you alone and lasts seven days. If the button does not work, paste this into your browser:<br>' + setLink + "</p></div>" +

    "<p>We would also love to hear from you. Write to us at <a href=\"mailto:" + SUPPORT + "\" style=\"color:#0E8C7E\">" + SUPPORT + "</a> and tell us:</p>" +
    '<ul style="margin:0 0 18px 22px;padding:0">' +
    "<li>What you would like to achieve using Qura</li>" +
    "<li>Any features or functionality you would find valuable</li>" +
    "<li>Any challenges you are hoping Qura can help solve</li></ul>" +

    "<p>Your feedback will directly influence how we develop the platform ahead of our public launch. Your message will be read personally by the founders, and you will get a direct response from us.</p>" +
    "<p>Thank you for helping shape the future of Qura. We are looking forward to building it with you.</p>" +
    SIGNATURE + "</div>", SUPPORT);

  entry.status = "approved";
  entry.decidedAt = new Date().toISOString();
  entry.decidedBy = by;
  entry.userId = userId;
  entry.emailed = mail.ok;
  return { ok: true, status: "approved", role, userId, emailed: mail.ok, mailError: mail.error, link: mail.ok ? undefined : actionLink };
}

export function deny(entry, by) {
  entry.status = "denied";
  entry.decidedAt = new Date().toISOString();
  entry.decidedBy = by;
  return { ok: true, status: "denied" };
}
