// Everything the early-access queue does, in one place, so the founder panel,
// the landing-page form and the one-tap links in the notification email cannot
// drift apart.
//
// The queue lives in kv under shared/qura_waitlist_v2 as:
//   { email, role, ts, status, decidedAt, decidedBy, userId, emailed }

import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const SITE = "https://www.qurahealth.org";

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

export async function sendMail(to, subject, html) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM || "noreply@qurahealth.org";
  if (!key) return { ok: false, error: "RESEND_API_KEY is not set." };
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: "Bearer " + key, "content-type": "application/json" },
      body: JSON.stringify({ from: "Qura <" + from + ">", to, subject, html }),
    });
    return { ok: r.ok, error: r.ok ? "" : "Resend returned " + r.status };
  } catch (e) {
    return { ok: false, error: String(e.message || e) };
  }
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
  const role = entry.role === "supplier" ? "supplier" : "clinician";

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

  const mail = await sendMail([addr], "Your Qura early access is approved",
    '<div style="font-family:Inter,Arial,sans-serif;color:#0A1730;line-height:1.6">' +
    "<p>Your request for early access to Qura has been approved.</p>" +
    "<p>Set your password and sign in as a " + role + ":</p>" +
    '<p><a href="' + actionLink + '" style="background:#00C2B8;color:#04231F;font-weight:700;padding:12px 22px;border-radius:999px;text-decoration:none;display:inline-block">Set your password</a></p>' +
    '<p style="font-size:13px;color:#5A6783">If the button does not work, paste this into your browser:<br>' + actionLink + "</p></div>");

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
