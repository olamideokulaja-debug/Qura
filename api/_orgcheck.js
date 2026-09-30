// Organisation checks.
//
// Anyone can create a Qura account and say they are a hospital, an agency or a
// care provider. Before 27 September that was enough to start a 7-day trial
// with the full decision-maker directory and to post roles in an
// organisation's name. On 26 September a dental marketing agency did exactly
// that, which is harmless, but the next one might not be.
//
// So a business account now waits for a founder to confirm the organisation is
// real. Until then it can look around on the free plan (contacts masked), but
// the trial does not start and it cannot post roles. When a founder confirms
// it, the trial starts there and then and the person is emailed.
//
// The record lives at kv(owner = the user, key = "org_check"). The key has no
// qura_ or cura_ prefix, so database rules stop the browser writing it.
//
//   { status: "pending" | "verified" | "rejected", requestedAt, decidedAt,
//     decidedBy, note, founderEmailedAt }

import { kvGet, kvSet } from "./_auth.js";
import { sign, verify as verifyToken, sendMail, sendMailEach, owners, SUPPORT } from "./_waitlist.js";
import { TRIAL_DAYS } from "./_entitlements.js";
import { bump } from "./_metrics.js";
import { grantFounding, removeFounding, joinedInTime, planName, ukDate } from "./_founding.js";

export const KEY = "org_check";
const SITE = "https://www.qurahealth.org";
const BUSINESS = new Set(["agency", "supplier", "hospital", "healthcare_provider", "gp", "care"]);
const PAID = ["starter", "growth", "enterprise", "team", "intelligence", "network", "career"];
export const FREE_MAIL = /@(gmail|googlemail|hotmail|outlook|live|msn|yahoo|ymail|icloud|me|mac|aol|proton|protonmail|gmx|mail|yandex)\.[a-z.]+$/i;

export const isFounderEmail = (email) => owners().includes(String(email || "").toLowerCase());
export const isBusinessRole = (role) => BUSINESS.has(String(role || ""));

// The role an account chose, from the server-held record first.
export async function roleOf(userId) {
  const acc = (await kvGet(userId, "account")) || {};
  if (acc.lens === "supplier") return "supplier";
  if (acc.lens === "healthcare_provider") return "healthcare_provider";
  if (acc.lens === "clinician") return "clinician";
  if (acc.role) return acc.role;
  const r = await kvGet(userId, "qura_role");
  return typeof r === "string" ? r : "";
}

export async function orgCheckOf(userId) {
  const r = await kvGet(userId, KEY);
  return r && typeof r === "object" ? r : null;
}

// true when this account may use the things that need a checked organisation.
export async function orgVerified(user) {
  if (!user || !user.id) return false;
  if (isFounderEmail(user.email)) return true;
  const rec = await orgCheckOf(user.id);
  return Boolean(rec && rec.status === "verified");
}

// One-tap links for the founders' email. Signed per account and decision, so
// a link only ever does the one thing it was made for. Opening one shows a
// confirmation button rather than acting, because email security scanners
// open links on their own.
export function checkLinks(userId) {
  const q = (d) => SITE + "/api/org-check?u=" + encodeURIComponent(userId) + "&d=" + d + "&t=" + sign("org:" + userId, d);
  return { verify: q("verify"), reject: q("reject") };
}
export const checkToken = (userId, d, t) => verifyToken("org:" + userId, d, String(t || ""));

// Start the pending record if there is none. Returns the record.
export async function ensurePending(userId) {
  const cur = await orgCheckOf(userId);
  if (cur) return cur;
  const rec = { status: "pending", requestedAt: new Date().toISOString() };
  await kvSet(userId, KEY, rec);
  return rec;
}

// Start the 7-day trial, the same way api/trial.js used to on arrival.
export async function startTrialFor(userId) {
  const cur = await kvGet(userId, "qura_trial");
  if (cur && typeof cur.start === "number") return { started: false, trial: cur };
  const next = { start: Date.now(), extra: 0, extended: false };
  await kvSet(userId, "qura_trial", next);
  const plan = await kvGet(userId, "qura_plan");
  const key = plan ? String(plan).split(":").pop().toLowerCase() : "";
  if (!PAID.includes(key)) await kvSet(userId, "qura_plan", JSON.stringify("trial"));
  try { await bump("trial_started"); } catch (e) {}
  return { started: true, trial: next };
}

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// The "what to check" block and the two buttons, used in the sign-up alert
// and in the standalone email below.
export function checkBlockHtml(p) {
  const links = checkLinks(p.id);
  const q = encodeURIComponent([p.company, p.name].filter(Boolean).join(" "));
  const domain = String(p.email || "").split("@")[1] || "";
  const btn = (href, label, bg, fg) =>
    '<a href="' + href + '" style="display:inline-block;background:' + bg + ";color:" + fg +
    ';font-weight:700;font-size:13px;padding:9px 16px;border-radius:999px;text-decoration:none;margin:0 8px 6px 0">' + label + "</a>";
  return '<div style="margin-top:8px;padding:10px 12px;background:#FFF7E6;border-radius:8px;font-size:13px;line-height:1.55">' +
    "<b>Check this organisation.</b> Their free trial starts, and they can post roles, only once one of you confirms it is real. Quick checks: " +
    '<a href="https://www.google.com/search?q=' + q + '" style="color:#0E8C7E">search the name</a>' +
    (p.phone ? ", does the phone number belong to it" : "") +
    (domain && !FREE_MAIL.test(p.email || "") ? ', does <a href="https://' + esc(domain) + '" style="color:#0E8C7E">' + esc(domain) + "</a> match the company" : ", the email is a personal address so look harder") +
    ", and is it a healthcare organisation in a market we serve." +
    '<div style="margin-top:10px">' + btn(links.verify, "Confirm organisation", "#00C2B8", "#04231F") + btn(links.reject, "Not confirmed", "#EEF1F7", "#5A6783") + "</div></div>";
}

// For accounts that were not in a sign-up alert (older accounts asking for a
// trial now). Sent once per account.
export async function emailFoundersOnce(userId, p) {
  const rec = await ensurePending(userId);
  if (rec.founderEmailedAt || rec.status !== "pending") return false;
  const html = '<div style="font-family:Inter,Arial,sans-serif;color:#0A1730;line-height:1.55;max-width:560px">' +
    "<p>" + esc(p.name || p.email) + (p.company ? " (" + esc(p.company) + ")" : "") + ", " + esc(p.email) +
    ", has asked for a Qura trial. Their account was created before organisation checks began.</p>" +
    checkBlockHtml({ ...p, id: userId }) +
    '<p style="font-size:13px;color:#5A6783">You can also decide in Qura: Admin, New organisations.</p></div>';
  const r = await sendMailEach(owners(), "Organisation to check: " + (p.company || p.name || p.email), html, p.email);
  if (r.ok) await kvSet(userId, KEY, { ...rec, founderEmailedAt: new Date().toISOString() });
  return r.ok;
}

// Record a founder's decision. On confirmation the trial starts and the person
// is told. A rejection is recorded quietly (the founder follows up by hand)
// and ends any trial that was already running.
// allowChange: a founder in Admin may reverse an earlier decision; a one-tap
// email link never can.
export async function decide(userId, decision, by, note, allowChange = false) {
  const cur = (await orgCheckOf(userId)) || { requestedAt: new Date().toISOString() };
  const want = decision === "verify" ? "verified" : "rejected";
  if (cur.status === want || ((cur.status === "verified" || cur.status === "rejected") && !allowChange)) return { ok: true, already: cur.status, record: cur };
  const rec = { ...cur, status: decision === "verify" ? "verified" : "rejected", decidedAt: new Date().toISOString(), decidedBy: by || "", note: String(note || "").slice(0, 300) };
  const ok = await kvSet(userId, KEY, rec);
  if (!ok) return { ok: false, error: "Could not save the decision." };
  let trialStarted = false, emailed = false, trialEnded = false;
  if (rec.status === "rejected") {
    // A trial already running (an account from before these checks) ends:
    // the plan falls back to free. The trial record stays, so it cannot be
    // started again.
    const plan = await kvGet(userId, "qura_plan");
    if (/(^|:)(trial|pilot)$/i.test(String(plan || ""))) { await kvSet(userId, "qura_plan", "null"); trialEnded = true; }
    // A Founding Partner year given in error ends too.
    try { await removeFounding(userId, by || "org-check"); } catch (e) {}
  }
  let founding = null;
  if (rec.status === "verified") {
    const u = await authUser(userId);
    // Founding Partner offer (30 September 2026): an organisation that joined
    // by 31 December 2026 gets 12 months of its top plan free, starting now,
    // in place of the 7-day trial. Later sign-ups get the trial as before.
    let t = { started: false };
    if (u && joinedInTime(u)) {
      const role = await roleOf(userId);
      founding = await grantFounding(userId, role, by || "org-check");
    }
    if (!founding || (!founding.granted && !founding.already)) t = await startTrialFor(userId);
    trialStarted = t.started;
    const fp = founding && (founding.granted || founding.already) && founding.record && founding.record.until ? founding.record : null;
    if (u && u.email) {
      const first = (u.user_metadata || {}).first_name || "";
      const body = fp
        ? "<p>Thank you for your patience. We have confirmed your organisation, and your <b>Founding Partner year</b> has started: Qura " + esc(planName(fp.plan)) +
          ", our top plan, free until " + esc(ukDate(fp.until)) + ". Every market, decision-maker contacts, AI summaries and proposals, and posting roles for clinicians are switched on.</p>" +
          "<p>Introductions to clinicians are still charged at £99 each. Nothing else is, and no card is needed. At the end of the year you choose a plan or move to the free plan.</p>"
        : "<p>Thank you for your patience. We have confirmed your organisation, and your 7-day Qura trial " +
          (t.started ? "has started today" : "is running") + ", with everything in Growth switched on: every market, decision-maker contacts, AI summaries and proposals, and posting roles for clinicians.</p>";
      const html = '<div style="font-family:Inter,Arial,sans-serif;color:#0A1730;line-height:1.6;max-width:600px">' +
        "<p>" + (first ? "Hello " + esc(first) + "," : "Hello,") + "</p>" + body +
        '<p style="margin:22px 0"><a href="' + SITE + '" style="background:#00C2B8;color:#04231F;font-weight:700;padding:12px 24px;border-radius:999px;text-decoration:none;display:inline-block">Open Qura</a></p>' +
        "<p>If you would like a quick walk-through, reply to this email and one of the founders will call you.</p>" +
        "<p>Olamide Okulaja and Ola Folawiyo<br>Co-founders, Qura</p></div>";
      const m = await sendMail([u.email], fp ? "Welcome, Founding Partner: your free year has started" : "Your Qura trial has started", html, owners()[0] || SUPPORT);
      emailed = m.ok;
    }
  }
  return { ok: true, record: rec, trialStarted, trialEnded, emailed, founding: founding && founding.record ? founding.record : null };
}

export async function authUser(userId) {
  const base = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !svc) return null;
  try {
    const r = await fetch(base + "/auth/v1/admin/users/" + encodeURIComponent(userId), { headers: { apikey: svc, Authorization: "Bearer " + svc } });
    return r.ok ? await r.json() : null;
  } catch (e) { return null; }
}

export { TRIAL_DAYS };
