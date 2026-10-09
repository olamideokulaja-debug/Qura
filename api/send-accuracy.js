import { cronAllowed } from "./_cron.js";
import { sbAdmin, kvGet, kvSet, budgetLeft, recordUsage } from "./_send.js";
import { politeFetch, robotsRules, robotsAllows } from "./_sendcrawl.js";
import { pageText, aiExtract, classify } from "./_sendextract.js";

export const config = { maxDuration: 300 };

// SEND Intelligence accuracy check (idea 14, the golden test set), Mondays at 06:40 UTC.
// send_golden_pages holds 36 careers pages frozen on 9 October 2026 (24 with SEND roles, 6 with
// only other roles, 6 that are not staff job pages or have none) and the reference answer for
// each: every job the page advertised, and whether it is a SEND role. Labels were made by
// Claude from the frozen text, following written rules, for human review.
// Each run measures three things and keeps the last 12 runs in kv shared/send_accuracy:
//   1. classifier: are the labelled job titles sorted into SEND / not SEND correctly? (no AI)
//   2. extractor:  given the frozen page, does the AI list the same jobs? (about 12p a run;
//                  skipped if the daily spend cut-off has been reached)
//   3. live:       are 20 random LIVE vacancies still on the school's own page today?

const tok = (s) => new Set((String(s || "").toLowerCase().replace(/assistants/g, "assistant").replace(/teachers/g, "teacher").match(/[a-z0-9]+/g) || []).filter((w) => !["the", "and", "of", "a", "for", "to", "in", "x"].includes(w)));
export function titleSim(a, b) { const A = tok(a), B = tok(b); let n = 0; for (const w of A) if (B.has(w)) n++; return n / Math.max(1, new Set([...A, ...B]).size); }
const pct = (a, b) => (b ? Math.round((1000 * a) / b) / 10 : null);

export default async function handler(req, res) {
  if (!(await cronAllowed(req))) return res.status(401).json({ error: "Not allowed" });
  const sb = sbAdmin(); if (!sb) return res.status(500).json({ error: "Supabase not configured" });
  const started = Date.now();
  const run = { at: new Date().toISOString(), errors: [] };
  const { data: tax } = await sb.from("send_job_taxonomy").select("code,family,synonyms");
  const { data: pages, error } = await sb.from("send_golden_pages").select("id,source_id,school_name,setting_group,url,snapshot_at,page_text,page_links,labels").order("id");
  if (error) return res.status(500).json({ error: error.message });

  // 1. Classifier on the labelled titles
  const c = { labelled: 0, correct: 0, sendLabelled: 0, sendFound: 0, shownNotSend: 0, misses: [], wrong: [] };
  for (const p of pages || []) for (const v of (p.labels && p.labels.vacancies) || []) {
    c.labelled++;
    const isSend = Boolean(classify(v.title, tax || [], p.setting_group).taxonomy_code);
    if (isSend === Boolean(v.send_relevant)) c.correct++;
    if (v.send_relevant) { c.sendLabelled++; if (isSend) c.sendFound++; else c.misses.push(v.title + " (" + p.school_name + ")"); }
    else if (isSend) { c.shownNotSend++; c.wrong.push(v.title + " (" + p.school_name + ")"); }
  }
  run.classifier = { labelled: c.labelled, accuracy_pct: pct(c.correct, c.labelled), send_recall_pct: pct(c.sendFound, c.sendLabelled), send_shown_wrongly: c.shownNotSend, misses: c.misses.slice(0, 15), wrong: c.wrong.slice(0, 15) };

  // 2. Extractor on the frozen pages
  const e = { pages: 0, labelled: 0, found: 0, extracted: 0, matched: 0, dates: 0, datesRight: 0, pence: 0, skipped: null, misses: [], extra: [] };
  const b0 = await budgetLeft(sb); let budget = b0.left;
  for (const p of pages || []) {
    if (Date.now() - started > 200000) { e.skipped = "time"; break; }
    if (budget <= 1) { e.skipped = "daily AI spend cut-off reached"; break; }
    const lab = p.labels || {}; if (lab.page_kind !== "staff_vacancies") continue;
    const day = String(p.snapshot_at).slice(0, 10);
    const r = await aiExtract(p.page_text, p.page_links || [], p.url, false, day);
    if (!r.ok) { run.errors.push(p.school_name + ": " + r.error); continue; }
    e.pages++; e.pence += r.pence || 0; budget -= r.pence || 0;
    const items = r.items || []; e.extracted += items.length;
    const used = new Set();
    for (const v of lab.vacancies || []) {
      e.labelled++;
      let best = -1, bs = 0; items.forEach((x, i) => { if (used.has(i)) return; const s = titleSim(v.title, x.title); if (s > bs) { bs = s; best = i; } });
      if (best >= 0 && bs >= 0.5) {
        used.add(best); e.found++;
        if (v.closing_date) { e.dates++; if (items[best].closing_date === v.closing_date) e.datesRight++; }
      } else e.misses.push(v.title + " (" + p.school_name + ")");
    }
    items.forEach((x, i) => { if (used.has(i)) e.matched++; else if (!(lab.expired || []).some((t) => titleSim(t, x.title) >= 0.5)) e.extra.push(x.title + " (" + p.school_name + ")"); });
  }
  if (e.pence) await recordUsage(sb, "ai_accuracy_check", e.pages, Math.round(e.pence * 100) / 100);
  run.extractor = { pages: e.pages, jobs_found_pct: pct(e.found, e.labelled), extracted_correct_pct: pct(e.matched, e.extracted), closing_dates_right_pct: pct(e.datesRight, e.dates), pence: Math.round(e.pence * 10) / 10, skipped: e.skipped, misses: e.misses.slice(0, 15), extra: e.extra.slice(0, 15) };

  // 3. Live: are LIVE vacancies still advertised on the school's own page?
  const l = { checked: 0, present: 0, blocked: 0, failed: 0, gone: [] };
  const { data: live } = await sb.from("send_vacancies").select("id,original_title,source_id,send_sources(url)").eq("status", "LIVE").limit(1000);
  const sample = [...(live || [])].sort(() => Math.random() - 0.5).slice(0, 20);
  const robots = new Map();
  for (const v of sample) {
    if (Date.now() - started > 270000) break;
    const url = v.send_sources && v.send_sources.url; if (!url) continue;
    try {
      const u = new URL(url);
      if (!robots.has(u.origin)) { const rb = await politeFetch(u.origin + "/robots.txt", { timeoutMs: 6000 }); robots.set(u.origin, rb.ok ? robotsRules(rb.text) : null); }
      const rules = robots.get(u.origin);
      if (rules && !robotsAllows(rules, u.pathname + u.search)) { l.blocked++; continue; }
      const pg = await politeFetch(url, { timeoutMs: 10000 });
      if (!pg.ok) { l.failed++; continue; }
      l.checked++;
      const text = pageText(pg.text).toLowerCase();
      const words = [...tok(v.original_title)].filter((w) => w.length > 2);
      const hit = words.length && words.filter((w) => text.includes(w)).length / words.length >= 0.8;
      if (hit) l.present++; else l.gone.push(v.original_title);
    } catch (err) { l.failed++; }
    await new Promise((r) => setTimeout(r, 1500));
  }
  run.live = { checked: l.checked, still_advertised_pct: pct(l.present, l.checked), robots_blocked: l.blocked, fetch_failed: l.failed, not_found: l.gone.slice(0, 10) };

  const st = (await kvGet("shared", "send_accuracy")) || {};
  const runs = [...(st.runs || []), run].slice(-12);
  await kvSet("shared", "send_accuracy", { runs, golden: { pages: (pages || []).length, frozen: "2026-10-09" } });
  return res.status(200).json({ ok: true, run });
}
