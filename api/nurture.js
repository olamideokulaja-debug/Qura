import { adminClient, kvRead, kvWrite, sendMail, owners, SUPPORT } from "./_waitlist.js";
import { TRIAL_DAYS } from "./_entitlements.js";
import { foundingState } from "./founding.js";

// GET /api/nurture
//
// Emails to new business accounts, run every hour by a pg_cron job in Supabase.
//
//   welcome  about 1 hour after the email is confirmed: what is live for them
//            right now (tenders matching their alerts, or the UK tenders
//            closing soonest), their trial, and a direct line to a founder.
//            It also reaches people who joined on iPhone, where the app may not
//            point to plans or prices; an email outside the app can.
//   day5     on day 5 of the trial: 2 days left, what they would lose, the
//            plans, and the founding offer while places remain.
//
// Clinicians get neither. Each email is sent once per account. Anyone can ask
// to stop by replying; the founders then remove them from this list.
//
// Needs no secret for the same reason as api/signup-alerts.js: it only emails
// accounts it has not emailed before, and reports counts only.

const SITE = "https://www.qurahealth.org";
const STATE = { owner: "alerts", key: "nurture" };
const START = "2026-09-24T00:00:00Z"; // accounts from before this were contacted by hand
const WELCOME_AFTER_MS = 60 * 60 * 1000;
const SKIP = /^play\.review(\.[a-z]+)?@qurahealth\.org$/i;
const BUSINESS = new Set(["agency", "supplier", "hospital", "healthcare_provider", "gp", "care"]);

const esc = (v) => String(v == null ? "" : v).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function daysLeftOf(closes) {
  const v = String(closes || "");
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) return Math.ceil((Date.parse(v.slice(0, 10) + "T23:59:59Z") - Date.now()) / 86400000);
  const m = v.match(/(\d+)\s*day/);
  if (m) return Number(m[1]);
  if (/today/i.test(v)) return 0;
  return 9999;
}

function pickTenders(items, alerts) {
  const open = (items || []).filter((t) => daysLeftOf(t.closes) >= 0);
  const qs = (alerts || []).map((a) => String((a && (a.query || a.category)) || "").toLowerCase()).filter(Boolean);
  const matched = qs.length
    ? open.filter((t) => qs.some((q) => (String(t.title || "") + " " + String(t.category || "")).toLowerCase().includes(q)))
    : [];
  const pool = matched.length ? matched : open.filter((t) => ["Find a Tender", "Contracts Finder"].includes(t.source));
  return { matched: matched.length > 0, total: pool.length, top: pool.sort((a, b) => daysLeftOf(a.closes) - daysLeftOf(b.closes)).slice(0, 5) };
}

function tenderList(top) {
  return '<table cellpadding="0" cellspacing="0" style="width:100%;margin:10px 0 18px">' + top.map((t) =>
    '<tr><td style="padding:9px 0;border-bottom:1px solid #E3E8F2">' +
    '<div style="font-weight:600;font-size:14px">' + esc(t.title) + "</div>" +
    '<div style="font-size:12.5px;color:#5A6783">' + esc([t.buyer, t.category].filter(Boolean).join(" · ")) + "</div></td>" +
    '<td style="padding:9px 0 9px 12px;border-bottom:1px solid #E3E8F2;font-size:12.5px;color:#0E8C7E;white-space:nowrap;vertical-align:top">' +
    (daysLeftOf(t.closes) < 9999 ? "Closes in " + daysLeftOf(t.closes) + " days" : "") + "</td></tr>").join("") + "</table>";
}

const button = (href, label) =>
  '<a href="' + href + '" style="background:#00C2B8;color:#04231F;font-weight:700;padding:12px 24px;border-radius:999px;text-decoration:none;display:inline-block">' + label + "</a>";
const footer =
  '<p style="font-size:12px;color:#8A96AD;margin-top:26px">You are receiving this because you created a Qura account. Reply "stop" and we will not send these again. Qura Ltd, company number 17310951, 167-169 Great Portland Street, London W1W 5PF.</p>';

export default async function handler(req, res) {
  const admin = adminClient();
  if (!admin) return res.status(500).json({ error: "Supabase is not configured." });

  const state = (await kvRead(admin, STATE.owner, STATE.key)) || {};
  const sent = state.sent || {};
  const stopped = new Set(Array.isArray(state.stopped) ? state.stopped : []);
  const founders = new Set(owners());
  const replyTo = owners()[0] || SUPPORT;

  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) return res.status(500).json({ error: error.message });
  const now = Date.now();
  const users = ((data && data.users) || []).filter((u) =>
    u.email_confirmed_at && String(u.created_at) >= START &&
    !SKIP.test(u.email || "") && !founders.has(String(u.email || "").toLowerCase()) && !stopped.has(u.id));
  if (!users.length) return res.status(200).json({ ok: true, welcome: 0, day5: 0 });

  const ids = users.map((u) => u.id);
  const { data: rows } = await admin.from("kv").select("owner,key,value").in("owner", ids)
    .in("key", ["qura_role", "account", "qura_trial", "qura_plan", "tender_alerts"]);
  const kv = {};
  (rows || []).forEach((r) => { let v = r.value; try { v = JSON.parse(r.value); } catch (e) {} (kv[r.owner] = kv[r.owner] || {})[r.key] = v; });

  const feed = (await kvRead(admin, "shared", "tenders")) || {};
  const items = Array.isArray(feed.items) ? feed.items : [];
  const founding = await foundingState();
  let welcome = 0, day5 = 0;

  for (const u of users) {
    const k = kv[u.id] || {};
    const acc = k.account || {};
    const role = k.qura_role || acc.role || acc.lens || (u.user_metadata || {}).signup_role || "";
    if (!BUSINESS.has(role)) continue;
    const plan = String(k.qura_plan || "");
    const paid = plan && !/trial|pilot/.test(plan);
    if (paid) continue;
    const m = u.user_metadata || {};
    const first = m.first_name || acc.firstName || "";
    const hello = first ? "Hello " + esc(first) + "," : "Hello,";
    const mine = sent[u.id] || {};
    const picked = pickTenders(items, k.tender_alerts);

    if (!mine.welcome && now - Date.parse(u.email_confirmed_at) >= WELCOME_AFTER_MS) {
      const trial = k.qura_trial && typeof k.qura_trial.start === "number";
      const html =
        '<div style="font-family:Inter,Arial,sans-serif;color:#0A1730;line-height:1.6;max-width:600px">' +
        "<p>" + hello + "</p>" +
        "<p>Thank you for joining Qura. Here is what is live for you right now: " +
        (picked.matched ? "<b>" + picked.total + " open tenders match your alerts</b>." : "<b>" + picked.total + " open UK healthcare tenders</b>, with the ones closing soonest first.") + "</p>" +
        tenderList(picked.top) +
        "<p>" + (trial ? "Your 7-day free trial is running, with everything in Growth switched on: every market, decision-maker contacts, AI summaries and proposals." :
          "Your 7-day free trial starts the moment you sign in on the web, with everything in Growth switched on. No card is needed.") + "</p>" +
        '<p style="margin:22px 0">' + button(SITE, "Open Qura") + "</p>" +
        "<p>We would like to hear what you are trying to win this quarter, so we can set Qura up around it. Reply to this email with a good time and number, and one of the founders will call you.</p>" +
        "<p>Olamide Okulaja and Ola Folawiyo<br>Co-founders, Qura</p>" + footer + "</div>";
      const r = await sendMail([u.email], "Your Qura account: " + picked.total + " live tenders for you today", html, replyTo);
      if (r.ok) { sent[u.id] = { ...mine, welcome: new Date().toISOString() }; welcome++; }
      continue;
    }

    const t = k.qura_trial;
    if (mine.welcome && !mine.day5 && t && typeof t.start === "number") {
      const day = Math.floor((now - t.start) / 86400000);
      const total = TRIAL_DAYS + (Number(t.extra) || 0);
      if (day >= 5 && day < total) {
        const left = total - day;
        const html =
          '<div style="font-family:Inter,Arial,sans-serif;color:#0A1730;line-height:1.6;max-width:600px">' +
          "<p>" + hello + "</p>" +
          "<p>Your Qura trial has <b>" + left + " " + (left === 1 ? "day" : "days") + " left</b>. " +
          "Right now there are " + picked.total + (picked.matched ? " open tenders matching your alerts" : " open UK healthcare tenders") + ". These are the next to close:</p>" +
          tenderList(picked.top.slice(0, 3)) +
          "<p>When the trial ends, Qura becomes read-only until you choose a plan. <b>Starter</b> keeps UK tenders, the pipeline, alerts and decision-maker contacts. <b>Growth</b> adds every international market, AI proposals, analytics and exports.</p>" +
          (founding.active && founding.left > 0 && (role === "agency" || role === "supplier")
            ? "<p>Founding offer: the first " + founding.total + " workforce suppliers on Growth pay the Starter price for their first 12 months. " + founding.left + " of " + founding.total + " places are left.</p>" : "") +
          "<p>One extra contract won can cover a year of Qura.</p>" +
          '<p style="margin:22px 0">' + button(SITE, "Choose a plan") + "</p>" +
          "<p>Plans can be cancelled at any time from Settings. If you would rather talk it through first, reply to this email.</p>" +
          "<p>Olamide and Ola<br>Qura</p>" + footer + "</div>";
        const r = await sendMail([u.email], left + " " + (left === 1 ? "day" : "days") + " left in your Qura trial", html, replyTo);
        if (r.ok) { sent[u.id] = { ...(sent[u.id] || mine), day5: new Date().toISOString() }; day5++; }
      }
    }
  }

  if (welcome || day5) await kvWrite(admin, STATE.owner, STATE.key, { ...state, sent });
  return res.status(200).json({ ok: true, welcome, day5 });
}
