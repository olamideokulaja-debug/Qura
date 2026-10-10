import crypto from "crypto";
import { kvGet } from "./_auth.js";
import { sbAdmin } from "./_opps.js";

// Application outcome tracking for roles a clinician opens on another site
// (NHS Jobs, Adzuna, reed). Built 10 October 2026.
//
// What Qura knows and what it is told are kept apart:
//   opened                Qura recorded the click (status_source "click").
//   everything after that is what the clinician told us (status_source
//   "self_report"). NHS Jobs does not tell Qura whether anyone applied, so
//   opening an advert is never counted as applying, and nothing here is ever
//   presented as confirmed by an employer.
//
// Follow-up: about 48 hours after the first open, Qura asks "Did you apply?"
// (in the app, by push and by email). A "yes" leads to an outcome question
// about 2 weeks later. At most 1 prompt a day per clinician, only in UK
// daytime, and a role stops being chased after 2 prompts go unanswered.

export const TABLE = "application_tracking";
export const SITE = "https://www.qurahealth.org";
export const DISC = /^(nhsjobs|adzuna|reed):/;

const H = 3600000, D = 24 * H;
export const FIRST_ASK_MS = 48 * H;
export const MAX_PROMPTS = 6;      // per role, ever
export const MAX_UNANSWERED = 2;   // then stop chasing this role
export const RETAIN_DAYS = 730;    // records untouched for 2 years are deleted

export const STATUS_LABEL = {
  opened: "Opened the advert", applied: "Applied", not_applying: "Not applying",
  interview: "Interview", offer: "Offer", started: "Started", not_successful: "Not successful",
};
export const STATUSES = Object.keys(STATUS_LABEL);

// The questions, in the clinician's words.
export const ANSWERS = {
  applied: [["yes", "Yes, I applied"], ["not_yet", "Not yet"], ["no", "No, not applying"]],
  outcome: [["interview", "Invited to interview"], ["offer", "Offered the job"], ["started", "Started the job"], ["not_successful", "Not successful"], ["no_news", "No news yet"]],
};
export function questionText(row) {
  const what = (row.role || "this role") + (row.employer ? " at " + row.employer : "");
  if (row.prompt_stage === "outcome") {
    if (row.status === "offer") return "Have you started " + what + "?";
    return "Any news on " + what + "?";
  }
  return "Did you apply for " + what + "?";
}
export function answersFor(row) {
  if (row.prompt_stage === "outcome" && row.status === "offer") return [["started", "Yes, I have started"], ["no_news", "Not yet"], ["not_successful", "It did not go ahead"]];
  return ANSWERS[row.prompt_stage] || [];
}

// Is a question waiting for this row right now?
export function questionDue(row, now = Date.now()) {
  if (row.prompt_stage === "done") return false;
  return Boolean(row.awaiting_answer || (row.next_prompt_at && Date.parse(row.next_prompt_at) <= now));
}

const hist = (row, entry) => [...(Array.isArray(row.history) ? row.history : []), entry].slice(-40);

// Apply a clinician's answer. Returns the fields to update, or null if the
// answer does not fit the question being asked.
export function applyAnswer(row, a, via) {
  const now = new Date();
  const iso = now.toISOString();
  const valid = answersFor(row).map((x) => x[0]);
  if (!valid.includes(a)) return null;
  const base = { awaiting_answer: false, prompts_unanswered: 0, updated_at: iso };
  const notYets = (Array.isArray(row.history) ? row.history : []).filter((h) => h.answer === "not_yet").length;
  const next = (ms) => new Date(now.getTime() + ms).toISOString();
  let upd;
  if (a === "yes") upd = { status: "applied", prompt_stage: "outcome", next_prompt_at: next(14 * D) };
  else if (a === "not_yet") upd = notYets >= 1 ? { prompt_stage: "done", next_prompt_at: null } : { next_prompt_at: next(4 * D) };
  else if (a === "no") upd = { status: "not_applying", prompt_stage: "done", next_prompt_at: null };
  else if (a === "interview") upd = { status: "interview", next_prompt_at: next(14 * D) };
  else if (a === "offer") upd = { status: "offer", next_prompt_at: next(21 * D) };
  else if (a === "started" || a === "not_successful") upd = { status: a, prompt_stage: "done", next_prompt_at: null };
  else if (a === "no_news") upd = { next_prompt_at: next(14 * D) };
  else return null;
  if ((row.prompts_sent || 0) >= MAX_PROMPTS && upd.prompt_stage !== "done") { upd.prompt_stage = "done"; upd.next_prompt_at = null; }
  const changed = upd.status && upd.status !== row.status;
  return {
    ...base, ...upd,
    ...(changed ? { status_source: "self_report", status_at: iso } : {}),
    history: hist(row, { at: iso, answer: a, ...(changed ? { status: upd.status } : {}), by: "clinician", via: via || "app" }),
  };
}

// A clinician sets the status directly (corrects it, or updates before being asked).
export function applySet(row, status) {
  if (!STATUSES.includes(status) || status === "opened" && row.status !== "opened") return null;
  const iso = new Date().toISOString();
  const terminal = ["not_applying", "started", "not_successful"].includes(status);
  const next = (ms) => new Date(Date.now() + ms).toISOString();
  const stage = terminal ? "done" : status === "opened" ? "applied" : "outcome";
  return {
    status, status_source: status === "opened" ? "click" : "self_report", status_at: iso, updated_at: iso,
    prompt_stage: stage, awaiting_answer: false, prompts_unanswered: 0,
    next_prompt_at: terminal ? null : next(status === "offer" ? 21 * D : 14 * D),
    history: hist(row, { at: iso, status, by: "clinician", via: "edit" }),
  };
}

// Is this account a clinician? Only clinicians are asked about applications.
export async function isClinician(userId) {
  try {
    const acc = (await kvGet(userId, "account")) || {};
    if (acc.lens === "clinician" || acc.role === "clinician") return true;
    const prof = await kvGet(userId, "clinician_profile");
    return Boolean(prof && typeof prof === "object" && Object.keys(prof).length);
  } catch (e) { return false; }
}

// Record that a signed-in clinician opened a discovered advert. One row per
// clinician per role; opening it again only counts the open. Never throws.
export async function recordOpen(user, oppId, platform) {
  try {
    if (!user || user._preview || !DISC.test(String(oppId || ""))) return null;
    const sb = sbAdmin(); if (!sb) return null;
    if (!(await isClinician(user.id))) return null;
    const plat = ["web", "ios", "android"].includes(platform) ? platform : null;
    const { data: existing } = await sb.from(TABLE).select("id,open_count").eq("user_id", user.id).eq("opportunity_id", oppId).maybeSingle();
    if (existing) {
      await sb.from(TABLE).update({ open_count: (existing.open_count || 1) + 1, updated_at: new Date().toISOString() }).eq("id", existing.id);
      return existing.id;
    }
    const { data: o } = await sb.from("opportunities").select("title,employer,source_name,source_url,profession,city,region").eq("id", oppId).maybeSingle();
    const now = new Date();
    const row = {
      user_id: user.id, email: user.email || null, opportunity_id: oppId,
      role: o ? o.title : null, employer: o ? o.employer : null, source_name: o ? o.source_name : null, source_url: o ? o.source_url : null,
      profession: o ? o.profession : null, region: o ? (o.region || o.city || null) : null, platform: plat,
      opened_at: now.toISOString(), status: "opened", status_source: "click", status_at: now.toISOString(),
      prompt_stage: "applied", next_prompt_at: new Date(now.getTime() + FIRST_ASK_MS).toISOString(),
      history: [{ at: now.toISOString(), status: "opened", by: "qura", via: plat || "unknown" }],
    };
    const { data, error } = await sb.from(TABLE).upsert(row, { onConflict: "user_id,opportunity_id", ignoreDuplicates: true }).select("id").maybeSingle();
    if (error) return null;
    return data ? data.id : null;
  } catch (e) { return null; }
}

// What a clinician's screen needs for one row.
export function present(row, now = Date.now()) {
  const due = questionDue(row, now);
  return {
    id: row.id, opportunityId: row.opportunity_id, role: row.role || "Role", employer: row.employer || "",
    sourceName: row.source_name || "the original site", sourceUrl: row.source_url || "",
    openedAt: row.opened_at, status: row.status, statusLabel: STATUS_LABEL[row.status] || row.status,
    statusSource: row.status_source, statusAt: row.status_at, stage: row.prompt_stage,
    question: due ? { text: questionText(row), options: answersFor(row).map(([a, label]) => ({ a, label })) } : null,
    history: (Array.isArray(row.history) ? row.history : []).filter((h) => h.status).map((h) => ({ at: h.at, status: h.status, label: STATUS_LABEL[h.status] || h.status, by: h.by })),
  };
}

// Signed links for the email buttons. They lead to a confirmation page, never
// straight to a change, because email security scanners open links on their own.
const secret = () => process.env.CRON_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
export function signLink(id, a) { return crypto.createHmac("sha256", secret()).update("track|" + id + "|" + a).digest("hex").slice(0, 40); }
export function verifyLink(id, a, t) {
  const want = signLink(id, a);
  if (!t || String(t).length !== want.length || !secret()) return false;
  return crypto.timingSafeEqual(Buffer.from(want), Buffer.from(String(t)));
}
export const answerUrl = (id, a) => SITE + "/api/tracking?id=" + encodeURIComponent(id) + "&a=" + a + "&t=" + signLink(id, a);
