import { getUser, kvGet, kvSet } from "./_auth.js";
import { sbAdmin } from "./_opps.js";
import { cronAllowed } from "./_cron.js";
import { isFounderEmail } from "./_orgcheck.js";
import { sendMail } from "./_waitlist.js";
import { shouldPush } from "./push-register.js";
import { limited } from "./_ratelimit.js";
import {
  TABLE, SITE, STATUSES, STATUS_LABEL, MAX_UNANSWERED, RETAIN_DAYS, present, applyAnswer, applySet,
  questionText, answersFor, verifyLink, answerUrl, signLink,
} from "./_tracking.js";

export const config = { maxDuration: 60 };

// Application outcome tracking (10 October 2026). See _tracking.js for the rules.
//
// Signed in (clinician):
//   GET  /api/tracking                              my tracked roles, any question due, my reminder setting
//   POST { action: "answer", id, a }                answer the question on a role
//   POST { action: "set", id, status }              set or correct the status myself
//   POST { action: "stop", id }                     stop asking about this role
//   POST { action: "delete", id }                   delete this record
//   POST { action: "reminders", on }                email and push reminders on or off
// Founders:
//   GET  /api/tracking?view=funnel&days=90[&profession=][&region=]
// Email buttons (no sign-in, signed link):
//   GET  /api/tracking?id&a&t                       a confirmation page with one button
//   POST /api/tracking?id&a&t                       records the answer
// Vercel Cron (hourly):
//   GET  /api/tracking?cron=1                       sends due prompts, deletes old records

const PREFS = "app_tracking_prefs";
const esc = (v) => String(v == null ? "" : v).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const ukHour = () => Number(new Date().toLocaleString("en-GB", { hour: "2-digit", hour12: false, timeZone: "Europe/London" }));

export default async function handler(req, res) {
  const q = req.query || {};
  const sb = sbAdmin();
  if (!sb) return res.status(500).json({ error: "Not configured" });

  if (q.cron) {
    if (!(await cronAllowed(req))) return res.status(401).json({ error: "Not allowed" });
    return res.status(200).json(await runPrompts(sb, { force: q.force === "1" }));
  }
  if (q.id && q.a && q.t) return emailAnswer(req, res, sb, q);

  const user = await getUser(req);
  if (!user || user._preview) return res.status(401).json({ error: "Sign in required" });

  if (req.method === "GET") {
    if (q.view === "funnel") {
      if (!isFounderEmail(user.email)) return res.status(403).json({ error: "Founders only" });
      return res.status(200).json(await funnel(sb, q));
    }
    const { data } = await sb.from(TABLE).select("*").eq("user_id", user.id).order("opened_at", { ascending: false }).limit(200);
    const prefs = (await kvGet(user.id, PREFS)) || {};
    const now = Date.now();
    return res.status(200).json({ items: (data || []).map((r) => present(r, now)), reminders: prefs.reminders !== false });
  }
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (await limited(req, res, user, { bucket: "tracking", limit: 120, windowSec: 3600 })) return;

  const b = req.body || {};
  if (b.action === "reminders") {
    const prefs = (await kvGet(user.id, PREFS)) || {};
    await kvSet(user.id, PREFS, { ...prefs, reminders: Boolean(b.on), updatedAt: new Date().toISOString() });
    return res.status(200).json({ ok: true, reminders: Boolean(b.on) });
  }

  const id = String(b.id || "").slice(0, 40);
  const { data: row } = await sb.from(TABLE).select("*").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (!row) return res.status(404).json({ error: "Not found" });

  let upd = null;
  if (b.action === "answer") upd = applyAnswer(row, String(b.a || ""), "app");
  else if (b.action === "set") upd = applySet(row, String(b.status || ""));
  else if (b.action === "stop") upd = { prompt_stage: "done", next_prompt_at: null, awaiting_answer: false, updated_at: new Date().toISOString() };
  else if (b.action === "delete") {
    await sb.from(TABLE).delete().eq("id", row.id).eq("user_id", user.id);
    return res.status(200).json({ ok: true, deleted: true });
  } else return res.status(400).json({ error: "Unknown action" });
  if (!upd) return res.status(400).json({ error: "That answer does not fit this role." });

  const { data: saved, error } = await sb.from(TABLE).update(upd).eq("id", row.id).eq("user_id", user.id).select("*").maybeSingle();
  if (error || !saved) return res.status(500).json({ error: "Could not save." });
  return res.status(200).json({ ok: true, item: present(saved) });
}

// ---- email buttons ------------------------------------------------------------

function page(title, body) {
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">' +
    "<title>" + esc(title) + " | Qura</title><style>body{margin:0;background:#F4F6FA;font-family:Inter,Arial,sans-serif;color:#0A1730}" +
    ".c{max-width:460px;margin:12vh auto;background:#fff;border-radius:18px;padding:30px 28px;box-shadow:0 10px 30px rgba(10,23,48,.08);text-align:center}" +
    "h1{font-size:21px;margin:0 0 10px}p{color:#5A6783;line-height:1.6;font-size:15px}button,a.b{display:inline-block;margin-top:14px;background:#0E8C7E;color:#fff;border:0;border-radius:999px;padding:13px 26px;font-size:16px;font-weight:700;text-decoration:none;cursor:pointer}" +
    "a{color:#0E8C7E}</style></head><body><div class=\"c\">" + body + "</div></body></html>";
}

async function emailAnswer(req, res, sb, q) {
  const id = String(q.id).slice(0, 40), a = String(q.a).slice(0, 20), t = String(q.t);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  if (!verifyLink(id, a, t)) return res.status(400).send(page("Link not valid", "<h1>This link is not valid</h1><p>Open My applications in Qura to update this role.</p><a class=\"b\" href=\"" + SITE + "/?open=myapps\">Open Qura</a>"));
  const { data: row } = await sb.from(TABLE).select("*").eq("id", id).maybeSingle();
  if (!row) return res.status(404).send(page("Not found", "<h1>This record no longer exists</h1><p>It may have been deleted.</p>"));

  const label = a === "mute" ? "Stop these reminders" : ((answersFor(row).find((x) => x[0] === a) || [])[1] || "");
  // GET only shows the choice. Email security scanners open links by themselves,
  // so a change only happens when the person presses the button.
  if (req.method !== "POST") {
    if (a !== "mute" && !label) return res.status(200).send(page("Already answered", "<h1>Already up to date</h1><p>This question has already been answered. You can change it any time in My applications.</p><a class=\"b\" href=\"" + SITE + "/?open=myapps\">Open My applications</a>"));
    const heading = a === "mute" ? "Stop application reminders?" : esc(questionText(row));
    const sub = a === "mute" ? "Qura will stop emailing and notifying you about roles you opened. Your tracker stays in the app." : "Your answer: <b>" + esc(label) + "</b>";
    return res.status(200).send(page("Confirm", "<h1>" + heading + "</h1><p>" + sub + "</p><form method=\"post\" action=\"/api/tracking?id=" + encodeURIComponent(id) + "&a=" + encodeURIComponent(a) + "&t=" + encodeURIComponent(t) + "\"><button type=\"submit\">Confirm</button></form>"));
  }
  if (a === "mute") {
    const prefs = (await kvGet(row.user_id, PREFS)) || {};
    await kvSet(row.user_id, PREFS, { ...prefs, reminders: false, updatedAt: new Date().toISOString() });
    return res.status(200).send(page("Reminders off", "<h1>Reminders are off</h1><p>You can switch them back on in My applications.</p>"));
  }
  const upd = applyAnswer(row, a, "email");
  if (!upd) return res.status(200).send(page("Already answered", "<h1>Already up to date</h1><p>You can change this any time in My applications.</p><a class=\"b\" href=\"" + SITE + "/?open=myapps\">Open My applications</a>"));
  await sb.from(TABLE).update(upd).eq("id", row.id);
  return res.status(200).send(page("Thank you", "<h1>Thank you, saved</h1><p>" + esc(row.role || "This role") + ": <b>" + esc(STATUS_LABEL[upd.status || row.status]) + "</b>.</p><p>It only goes into your own tracker and Qura's anonymous totals. It is never shared with the employer.</p><a class=\"b\" href=\"" + SITE + "/?open=myapps\">Open My applications</a>"));
}

// ---- the hourly job --------------------------------------------------------------

function emailHtml(row) {
  const btn = (a, label) => '<a href="' + answerUrl(row.id, a) + '" style="display:inline-block;margin:4px 6px 4px 0;padding:11px 18px;border-radius:999px;background:#0E8C7E;color:#fff;font-weight:700;font-size:14px;text-decoration:none">' + esc(label) + "</a>";
  return '<div style="font-family:Inter,Arial,sans-serif;color:#0A1730;max-width:560px;line-height:1.6;font-size:15px">' +
    "<p>Hello,</p>" +
    "<p>You opened <b>" + esc(row.role || "a role") + "</b>" + (row.employer ? " at <b>" + esc(row.employer) + "</b>" : "") + " on " + esc(row.source_name || "another site") + " through Qura.</p>" +
    "<p style=\"font-size:17px;font-weight:700;margin:20px 0 8px\">" + esc(questionText(row)) + "</p>" +
    "<div>" + answersFor(row).map(([a, l]) => btn(a, l)).join("") + "</div>" +
    "<p style=\"color:#5A6783;font-size:13.5px;margin-top:22px\">One tap keeps your Qura tracker up to date. Your answer is for your own tracker and Qura's anonymous totals, and is never shared with the employer.</p>" +
    "<p style=\"color:#8A97AD;font-size:12.5px;margin-top:22px\">You are getting this because you opened this advert from your Qura account. " +
    '<a href="' + answerUrl(row.id, "mute") + '" style="color:#8A97AD">Stop these reminders</a>. Qura Ltd, 167-169 Great Portland Street, 5th Floor, London W1W 5PF.</p></div>';
}

async function pushTo(userId, row) {
  try {
    const reg = await kvGet(userId, "push_registration");
    if (!shouldPush(reg, "applications")) return false;
    const r = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify([{ to: reg.token, sound: "default", title: "Quick question", body: questionText(row), data: { screen: "myapps", trackingId: row.id }, channelId: "default" }]),
    });
    return r.ok;
  } catch (e) { return false; }
}

export async function runPrompts(sb, { force } = {}) {
  const log = { at: new Date().toISOString(), due: 0, users: 0, sent: 0, emailed: 0, pushed: 0, skipped: {}, deleted: 0 };
  const skip = (k) => { log.skipped[k] = (log.skipped[k] || 0) + 1; };

  // Retention: records untouched for 2 years go.
  try {
    const cut = new Date(Date.now() - RETAIN_DAYS * 86400000).toISOString();
    const { data: gone } = await sb.from(TABLE).delete().lt("updated_at", cut).select("id");
    log.deleted = (gone || []).length;
  } catch (e) {}

  const h = ukHour();
  if (!force && (h < 9 || h >= 20)) { log.note = "Outside 09:00 to 20:00 UK time; nothing sent."; return log; }

  const { data: due } = await sb.from(TABLE).select("*").neq("prompt_stage", "done").not("next_prompt_at", "is", null)
    .lte("next_prompt_at", new Date().toISOString()).order("next_prompt_at", { ascending: true }).limit(500);
  log.due = (due || []).length;
  const byUser = new Map();
  for (const r of due || []) if (!byUser.has(r.user_id)) byUser.set(r.user_id, r);   // the oldest due role per person
  log.users = byUser.size;

  for (const [userId, row] of byUser) {
    const prefs = (await kvGet(userId, PREFS)) || {};
    const iso = new Date().toISOString();
    const unanswered = (row.prompts_unanswered || 0) + 1;
    // Whatever happens, this row is not picked up again for a week, and stops after 2 unanswered.
    const after = { awaiting_answer: true, prompts_unanswered: unanswered, updated_at: iso,
      next_prompt_at: unanswered >= MAX_UNANSWERED ? null : new Date(Date.now() + 7 * 86400000).toISOString() };
    if (prefs.reminders === false) { skip("reminders_off"); await sb.from(TABLE).update(after).eq("id", row.id); continue; }
    if (prefs.lastPromptAt && Date.now() - Date.parse(prefs.lastPromptAt) < 20 * 3600000) { skip("asked_today"); continue; }
    let emailed = false, pushed = false;
    if (row.email) {
      const r = await sendMail(row.email, questionText(row), emailHtml(row));
      emailed = Boolean(r && r.ok);
    }
    pushed = await pushTo(userId, row);
    if (emailed) log.emailed++;
    if (pushed) log.pushed++;
    if (emailed || pushed) log.sent++; else skip("no_channel");
    await sb.from(TABLE).update({ ...after, prompts_sent: (row.prompts_sent || 0) + 1, last_prompt_at: iso,
      history: [...(Array.isArray(row.history) ? row.history : []), { at: iso, prompt: row.prompt_stage, email: emailed, push: pushed, by: "qura" }].slice(-40) }).eq("id", row.id);
    await kvSet(userId, PREFS, { ...prefs, lastPromptAt: iso });
  }
  try {
    const state = (await kvGet("shared", "tracking_runs")) || [];
    await kvSet("shared", "tracking_runs", [log, ...(Array.isArray(state) ? state : [])].slice(0, 48));
  } catch (e) {}
  return log;
}

// ---- founders' funnel --------------------------------------------------------------

async function funnel(sb, q) {
  const days = Math.max(1, Math.min(730, Number(q.days) || 90));
  const since = new Date(Date.now() - days * 86400000).toISOString();
  let query = sb.from(TABLE).select("user_id,status,status_source,history,profession,region,employer,source_name,prompt_stage,awaiting_answer,prompts_sent,next_prompt_at,platform").gte("opened_at", since).limit(20000);
  if (q.profession) query = query.eq("profession", String(q.profession).slice(0, 80));
  if (q.region) query = query.ilike("region", "%" + String(q.region).replace(/[%_]/g, "").slice(0, 60) + "%");
  const { data } = await query;
  const rows = data || [];
  const reached = (r) => {
    const s = new Set((Array.isArray(r.history) ? r.history : []).map((h) => h.status).filter(Boolean)); s.add(r.status); return s;
  };
  const steps = [
    ["opened", "Opened an advert", () => true],
    ["applied", "Said they applied", (s) => ["applied", "interview", "offer", "started", "not_successful"].some((x) => s.has(x))],
    ["interview", "Said they had an interview", (s) => ["interview", "offer", "started"].some((x) => s.has(x))],
    ["offer", "Said they had an offer", (s) => ["offer", "started"].some((x) => s.has(x))],
    ["started", "Said they started", (s) => s.has("started")],
  ];
  const out = steps.map(([k, label, f]) => {
    const hit = rows.filter((r) => f(reached(r)));
    return { key: k, label, roles: hit.length, clinicians: new Set(hit.map((r) => r.user_id)).size };
  });
  const asked = rows.filter((r) => (r.prompts_sent || 0) > 0 || r.awaiting_answer || r.status !== "opened");
  const answered = rows.filter((r) => r.status !== "opened" || (Array.isArray(r.history) && r.history.some((h) => h.answer)));
  const top = (key) => {
    const m = {}; for (const r of rows) { const k = r[key] || "Not stated"; m[k] = (m[k] || 0) + 1; }
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, n]) => ({ name, n }));
  };
  return {
    days, since, filters: { profession: q.profession || "", region: q.region || "" },
    steps: out,
    notApplying: rows.filter((r) => r.status === "not_applying").length,
    notSuccessful: rows.filter((r) => r.status === "not_successful").length,
    asked: asked.length, answered: answered.length,
    noAnswer: rows.filter((r) => r.status === "opened" && (r.prompts_sent || 0) > 0 && !(Array.isArray(r.history) && r.history.some((h) => h.answer))).length,
    waitingFirstQuestion: rows.filter((r) => r.status === "opened" && !(r.prompts_sent > 0) && !r.awaiting_answer).length,
    employerVerified: rows.filter((r) => r.status_source === "employer_verified").length,
    byProfession: top("profession"), byEmployer: top("employer"), bySource: top("source_name"), byPlatform: top("platform"),
    note: "Opened is recorded by Qura. Every later step is what clinicians told us and is not confirmed by any employer.",
  };
}
