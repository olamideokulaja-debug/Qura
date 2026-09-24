import { adminClient, kvRead, kvWrite, sendMailEach, owners } from "./_waitlist.js";
import { bump } from "./_metrics.js";
import { claim, evaluate, allRows, CLAIM_WINDOW_DAYS } from "./_referral.js";

// GET /api/signup-alerts
//
// Emails the founders about new accounts. Since launch anyone can create an
// account and choose their own role, so there is no approval step and nothing
// else told the founders someone had joined. This sends one email per run
// listing every account confirmed since the last run.
//
// Called every 10 minutes by a pg_cron job in Supabase (Vercel's own cron here
// only runs daily). It needs no secret: it only ever emails the founders, and
// only about accounts it has not reported before, so calling it early does
// nothing worse than send the next alert sooner.
//
// An account is reported once its email is confirmed and at least 10 minutes
// have passed, so the role and company it picks straight after confirming are
// usually in the email. Anything still missing is shown as missing.

const SITE = "https://www.qurahealth.org";
const STATE_OWNER = "alerts";
const STATE_KEY = "signup_alerts";
// Accounts from before this went live were looked at by hand on 24 September.
// The 2 from 23 September are included so the first email shows the format.
const START = "2026-09-23T00:00:00Z";
const SETTLE_MS = 10 * 60 * 1000;
const SKIP = /^play\.review(\.[a-z]+)?@qurahealth\.org$/i;
const FREE_MAIL = /@(gmail|googlemail|hotmail|outlook|live|msn|yahoo|ymail|icloud|me|mac|aol|proton|protonmail|gmx|mail|yandex)\.[a-z.]+$/i;

const ROLE_NAMES = {
  clinician: "Clinician", agency: "Workforce supplier", supplier: "Supplier",
  hospital: "Hospital / Provider", healthcare_provider: "Hospital / Provider",
  gp: "GP practice", care: "Care provider", operator: "Operator",
};

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const ukTime = (iso) => {
  try {
    return new Date(iso).toLocaleString("en-GB", { timeZone: "Europe/London", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch (e) { return iso; }
};

export default async function handler(req, res) {
  const admin = adminClient();
  if (!admin) return res.status(500).json({ error: "Supabase is not configured." });

  const state = (await kvRead(admin, STATE_OWNER, STATE_KEY)) || {};
  const reported = new Set(Array.isArray(state.reported) ? state.reported : []);
  const since = state.since || START;
  const founders = new Set(owners());

  // Fewer than a few thousand accounts, so one page of 1000 newest-first is
  // plenty; the date filter below does the rest.
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) return res.status(500).json({ error: error.message });
  const now = Date.now();
  const allUsers = (data && data.users) || [];

  // Refer & Reward. An account created through a personal invite link, or with
  // a code typed at sign-up on the phone, carries the code on the account. It
  // is attributed here, whichever device it came from, and any referral whose
  // person has since qualified is moved on. Neither step sends anything to the
  // new user.
  const invitedBy = {};
  try {
    const rows = await allRows(admin);
    const recOf = {};
    for (const r of rows) recOf[r.owner] = r.value;
    for (const u of allUsers) {
      const code = (u.user_metadata || {}).referral_code;
      if (!code || (recOf[u.id] && recOf[u.id].referredBy)) continue;
      if (now - Date.parse(u.created_at) > CLAIM_WINDOW_DAYS * 86400000) continue;
      await claim(admin, u, code, "signup");
    }
    for (const r of await allRows(admin)) {
      if (!r.value.referredBy) continue;
      invitedBy[r.owner] = r.value.referredBy;
      if (["pending", "eligible", "capped"].includes(r.value.status || "pending")) await evaluate(admin, r.owner);
    }
  } catch (e) { console.error("[referrals] " + (e.message || e)); }
  const emailOf = {};
  for (const u of allUsers) emailOf[u.id] = u.email || "";

  const fresh = allUsers.filter((u) =>
    u.email_confirmed_at &&
    String(u.created_at) >= since &&
    now - Date.parse(u.email_confirmed_at) >= SETTLE_MS &&
    !reported.has(u.id) &&
    !SKIP.test(u.email || "") &&
    !founders.has(String(u.email || "").toLowerCase()));

  if (!fresh.length) return res.status(200).json({ ok: true, sent: 0 });

  const ids = fresh.map((u) => u.id);
  const { data: rows } = await admin.from("kv").select("owner,key,value").in("owner", ids).in("key", ["qura_role", "account"]);
  const kv = {};
  (rows || []).forEach((r) => {
    let v = r.value;
    try { v = JSON.parse(r.value); } catch (e) {}
    (kv[r.owner] = kv[r.owner] || {})[r.key] = v;
  });

  const people = fresh.map((u) => {
    const m = u.user_metadata || {};
    const acc = (kv[u.id] && kv[u.id].account) || {};
    const roleKey = (kv[u.id] && kv[u.id].qura_role) || acc.role || acc.lens || m.signup_role || "";
    const name = m.full_name || [m.first_name, m.last_name].filter(Boolean).join(" ") ||
      [acc.firstName, acc.lastName].filter(Boolean).join(" ");
    const org = acc.org && typeof acc.org === "object" ? acc.org.name : acc.org;
    return {
      id: u.id,
      email: u.email,
      name: name || "",
      role: ROLE_NAMES[roleKey] || roleKey || "",
      company: m.company || org || "",
      phone: m.phone || "",
      business: !!roleKey && roleKey !== "clinician",
      joined: u.created_at,
      personalEmail: FREE_MAIL.test(u.email || ""),
      invitedBy: invitedBy[u.id] ? emailOf[invitedBy[u.id]] || "a Qura member" : "",
    };
  });

  const line = (label, value, missing) =>
    '<tr><td style="padding:3px 14px 3px 0;color:#5A6783;font-size:13px;vertical-align:top">' + label + "</td>" +
    '<td style="padding:3px 0;font-size:14px">' + (value ? esc(value) : '<span style="color:#B45309">' + missing + "</span>") + "</td></tr>";
  const cards = people.map((p) =>
    '<div style="border:1px solid #E3E8F2;border-radius:12px;padding:14px 16px;margin:0 0 12px">' +
    '<div style="font-weight:700;font-size:15px;margin-bottom:6px">' + esc(p.name || p.email) + "</div>" +
    '<table cellpadding="0" cellspacing="0">' +
    line("Email", p.email + (p.personalEmail ? " (personal address)" : ""), "") +
    line("Role", p.role, "Not chosen yet") +
    line("Company", p.company, "Not given") +
    (p.phone ? line("Phone", p.phone, "") : "") +
    (p.invitedBy ? line("Invited by", p.invitedBy, "") : "") +
    line("Joined", ukTime(p.joined) + " UK time", "") +
    "</table>" +
    (p.business ? '<div style="margin-top:8px;padding:8px 10px;background:#E8FAF8;border-radius:8px;font-size:13px"><b>Business account.</b> A welcome call within 24 hours is the single best way to turn this into a paying customer. ' +
      (p.phone ? "Their number is above." : "Their email is above.") + "</div>" : "") +
    "</div>").join("");

  const subject = people.length === 1
    ? "New Qura account: " + (people[0].name || people[0].email) + (people[0].company ? " (" + people[0].company + ")" : "")
    : people.length + " new Qura accounts";
  const html =
    '<div style="font-family:Inter,Arial,sans-serif;color:#0A1730;line-height:1.55;max-width:560px">' +
    "<p>" + (people.length === 1 ? "Someone has" : people.length + " people have") +
    " created a Qura account and confirmed their email address.</p>" + cards +
    '<p style="font-size:13px;color:#5A6783">No approval is needed: accounts open straight away. ' +
    "A clinician is not shown to hospitals or suppliers until one of you marks them verified. " +
    'To change a role, open <a href="' + SITE + '" style="color:#0E8C7E">Qura</a>, sign in and go to Admin.</p></div>';

  const to = [...founders];
  const r = to.length ? await sendMailEach(to, subject, html, people.length === 1 ? people[0].email : undefined) : { ok: false, failed: [] };

  // Only record them as reported if at least one founder received it, so a
  // mail outage does not swallow sign-ups for good.
  if (r.ok) {
    await bump("signup", people.length);
    const keep = [...reported, ...ids].slice(-5000);
    await kvWrite(admin, STATE_OWNER, STATE_KEY, { since, reported: keep, lastSentAt: new Date().toISOString() });
  }
  // Counts only: this endpoint is public, so it names nobody.
  return res.status(200).json({ ok: r.ok, sent: r.ok ? people.length : 0, delivered: (r.delivered || []).length, failed: (r.failed || []).length });
}
