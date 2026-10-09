import { cronAllowed } from "./_cron.js";
import { sbAdmin, kvGet, kvSet, budgetLeft, recordUsage } from "./_send.js";
import { politeFetch, robotsRules, robotsAllows, pool } from "./_sendcrawl.js";
import { sha, pageText, pageLinks, looksLikeJobs, aiExtract, classify, salaryNumbers } from "./_sendextract.js";

export const config = { maxDuration: 300 };

// SEND Intelligence: daily vacancy checks (jobs crawl, extract, classify, deduplicate,
// verify status), week 2. Every 10 minutes at :05 (vercel.json) it takes the active
// careers pages that are due (checked more than 20 hours ago, or never) and:
//   1. re-checks robots.txt, then fetches the page once,
//   2. if the page text is unchanged since the last check, re-confirms that page's live
//      vacancies without any AI,
//   3. if it changed and looks like it lists jobs, asks the AI model to list the vacancies
//      (only while the daily spend cut-off allows); a "no current vacancies" notice or a page
//      with no job words is recorded without AI,
//   4. classifies each vacancy into the SEND job types, deduplicates by school, title and
//      closing date, and records events,
//   5. a vacancy missing from its page on 3 checks in a row becomes REMOVED; one whose
//      closing date has passed becomes CLOSED. A single failed fetch never closes anything.
//   6. matches the pilot customer's known vacancies (send_ground_truth) against what was found.
// Vercel Cron or a signed-in founder only.

const BATCH = 40, CONCURRENCY = 5, BUDGET_MS = 230000, DUE_HOURS = 20;

export default async function handler(req, res) {
  if (!(await cronAllowed(req))) return res.status(401).json({ error: "Not allowed" });
  const sb = sbAdmin(); if (!sb) return res.status(500).json({ error: "Supabase not configured" });
  const started = Date.now();
  const log = { at: new Date().toISOString(), checked: 0, unchanged: 0, noJobs: 0, aiPages: 0, aiFailed: 0, deferred: 0, fetchFailed: 0, robotsBlocked: 0, found: 0, inserted: 0, removed: 0, closed: 0, pence: 0, groundTruthMatched: 0, errors: [] };

  const { data: tax } = await sb.from("send_job_taxonomy").select("code,family,synonyms");
  const dueBefore = new Date(Date.now() - DUE_HOURS * 3600000).toISOString();
  const { data: due, error } = await sb.from("send_sources").select("id,organisation_id,url,content_hash,consecutive_failures")
    .in("kind", ["careers_page", "trust_careers"]).eq("status", "active").eq("active", true)
    .or("last_checked_at.is.null,last_checked_at.lt." + dueBefore).order("last_checked_at", { ascending: true, nullsFirst: true }).limit(BATCH);
  if (error) return res.status(500).json({ error: error.message });
  const orgIds = [...new Set((due || []).map((s) => s.organisation_id).filter(Boolean))];
  const { data: orgs } = orgIds.length ? await sb.from("send_organisations").select("id,setting_group,postcode,town").in("id", orgIds) : { data: [] };
  const orgById = new Map((orgs || []).map((o) => [o.id, o]));
  let budget = await budgetLeft(sb);
  const robotsCache = new Map();

  await pool(due || [], CONCURRENCY, async (s) => {
    if (Date.now() - started > BUDGET_MS) return;
    log.checked++;
    const now = new Date().toISOString();
    const org = orgById.get(s.organisation_id) || {};
    let origin, path; try { const u = new URL(s.url); origin = u.origin; path = u.pathname || "/"; } catch (e) { return; }
    let rules = robotsCache.get(origin);
    if (!rules) { const r = await politeFetch(origin + "/robots.txt", { timeoutMs: 6000, maxBytes: 200000 }); rules = r.ok ? robotsRules(r.text) : []; robotsCache.set(origin, rules); }
    if (!robotsAllows(rules, path)) { await sb.from("send_sources").update({ status: "robots_blocked", allowed: false, robots_checked_at: now, last_checked_at: now }).eq("id", s.id); log.robotsBlocked++; return; }

    const page = await politeFetch(s.url);
    if (!page.ok || !page.text) {
      const fails = (s.consecutive_failures || 0) + 1;
      await sb.from("send_sources").update({ last_checked_at: now, last_http_status: page.status || null, consecutive_failures: fails, status: fails >= 5 ? "error" : "active" }).eq("id", s.id);
      log.fetchFailed++; return;  // a failed fetch never changes vacancy status
    }
    const text = pageText(page.text);
    const hash = sha(text.replace(/\d{1,2}:\d{2}(:\d{2})?/g, ""));
    const { data: existing } = await sb.from("send_vacancies").select("id,dedupe_key,missed_checks,status").eq("source_id", s.id).in("status", ["LIVE", "UNVERIFIED"]);

    if (hash === s.content_hash) {
      if (existing && existing.length) await sb.from("send_vacancies").update({ last_seen_at: now, last_verified_at: now, missed_checks: 0 }).in("id", existing.map((v) => v.id));
      await sb.from("send_sources").update({ last_checked_at: now, last_http_status: page.status, consecutive_failures: 0 }).eq("id", s.id);
      log.unchanged++; return;
    }

    let items = [];
    const look = looksLikeJobs(text);
    if (look.jobs) {
      if (budget.stop || budget.left <= 2) { log.deferred++; return; }  // try again on a later run
      const ai = await aiExtract(text, pageLinks(page.text, page.url), page.url);
      if (ai.pence) { log.pence += ai.pence; budget = { ...budget, spent: budget.spent + ai.pence, left: budget.left - ai.pence, stop: budget.left - ai.pence <= 0 }; }
      if (!ai.ok) { log.aiFailed++; log.errors.push("ai: " + ai.error); await sb.from("send_sources").update({ last_checked_at: now }).eq("id", s.id); return; }
      log.aiPages++; items = ai.items;
    } else log.noJobs++;

    const seenKeys = new Set();
    for (const it of items) {
      const cls = classify(it.title, tax || [], org.setting_group);
      const key = sha([s.organisation_id || s.url, it.title.toLowerCase(), it.closing_date || ""].join("|")).slice(0, 40);
      seenKeys.add(key);
      const closed = it.closing_date && new Date(it.closing_date + "T23:59:59Z") < new Date();
      const row = {
        organisation_id: s.organisation_id, source_id: s.id, dedupe_key: key,
        original_title: it.title, normalised_title: it.title, ...cls,
        location: it.location || [org.town, org.postcode].filter(Boolean).join(", ") || null, postcode: org.postcode || null,
        salary_text: it.salary_text, ...salaryNumbers(it.salary_text),
        contract_type: it.contract_type, working_pattern: it.working_pattern,
        closing_at: it.closing_date ? it.closing_date + "T23:59:59Z" : null,
        source_url: it.detail_url || page.url,
        last_seen_at: now, last_verified_at: now, missed_checks: 0,
        status: closed ? "CLOSED" : cls.taxonomy_code ? "LIVE" : "HIDDEN",
        confidence: it.closing_date ? 0.9 : 0.7,
        evidence: { page: page.url, checked_at: now, model_extracted: true },
        updated_at: now,
      };
      const isNew = !(existing || []).some((v) => v.dedupe_key === key);
      const { data: up, error: e2 } = await sb.from("send_vacancies").upsert(row, { onConflict: "dedupe_key" }).select("id").maybeSingle();
      if (e2) { log.errors.push("vacancy: " + e2.message); continue; }
      log.found++;
      if (isNew && up) { log.inserted++; await sb.from("send_vacancy_events").insert({ vacancy_id: up.id, event: "first_seen", detail: { source: s.url } }); }
    }
    // Missing from the page: count misses; 3 in a row means removed
    for (const v of existing || []) {
      if (seenKeys.has(v.dedupe_key)) continue;
      const misses = (v.missed_checks || 0) + 1;
      if (misses >= 3) { await sb.from("send_vacancies").update({ status: "REMOVED", missed_checks: misses, updated_at: now }).eq("id", v.id); await sb.from("send_vacancy_events").insert({ vacancy_id: v.id, event: "removed", detail: { after_misses: misses } }); log.removed++; }
      else await sb.from("send_vacancies").update({ missed_checks: misses, updated_at: now }).eq("id", v.id);
    }
    await sb.from("send_sources").update({ content_hash: hash, last_checked_at: now, last_changed_at: now, last_http_status: page.status, consecutive_failures: 0 }).eq("id", s.id);
  });

  // Re-classify hidden roles when the job types change (taxonomy rows or classify() rules),
  // so a fix reaches roles already stored, not only new ones. Hourly at most; up to 2,000 rows.
  const rcState = (await kvGet("shared", "send_reclassify")) || {};
  const taxSig = sha(JSON.stringify((tax || []).map((r) => [r.code, r.synonyms])) + "|v2").slice(0, 16);
  if (rcState.sig !== taxSig || !rcState.at || Date.now() - Date.parse(rcState.at) > 24 * 3600000) {
    let promoted = 0;
    const { data: hid } = await sb.from("send_vacancies").select("id,original_title,closing_at,organisation_id,send_organisations(setting_group)").eq("status", "HIDDEN").limit(2000);
    for (const v of hid || []) {
      const cls = classify(v.original_title, tax || [], (v.send_organisations || {}).setting_group);
      if (!cls.taxonomy_code) continue;
      const closed = v.closing_at && new Date(v.closing_at) < new Date();
      await sb.from("send_vacancies").update({ ...cls, status: closed ? "CLOSED" : "LIVE", updated_at: new Date().toISOString() }).eq("id", v.id).eq("status", "HIDDEN");
      promoted++;
    }
    log.reclassified = promoted;
    await kvSet("shared", "send_reclassify", { sig: taxSig, at: new Date().toISOString(), promoted });
  }

  // Closing dates passed
  const { data: closedRows } = await sb.from("send_vacancies").update({ status: "CLOSED", updated_at: new Date().toISOString() }).eq("status", "LIVE").lt("closing_at", new Date().toISOString()).select("id");
  log.closed = (closedRows || []).length;

  // Ground truth: match the pilot customer's known vacancies
  const { data: gt } = await sb.from("send_ground_truth").select("id,title,school_name,url").is("matched_vacancy_id", null).limit(200);
  for (const g of gt || []) {
    let match = null;
    if (g.url) { const { data } = await sb.from("send_vacancies").select("id").eq("source_url", g.url).limit(1); match = data && data[0]; }
    if (!match && g.title && g.school_name) {
      const { data: os } = await sb.from("send_organisations").select("id").ilike("name", "%" + String(g.school_name).replace(/[%_]/g, "").slice(0, 60) + "%").limit(5);
      if (os && os.length) { const { data } = await sb.from("send_vacancies").select("id").in("organisation_id", os.map((o) => o.id)).ilike("original_title", "%" + String(g.title).replace(/[%_]/g, "").slice(0, 60) + "%").limit(1); match = data && data[0]; }
    }
    if (match) { await sb.from("send_ground_truth").update({ matched_vacancy_id: match.id, matched_at: new Date().toISOString() }).eq("id", g.id); log.groundTruthMatched++; }
  }

  if (log.pence) await recordUsage(sb, "ai_extraction", log.aiPages, Math.round(log.pence * 100) / 100);
  await recordUsage(sb, "vacancy_requests", log.checked * 2, 0);
  const st = (await kvGet("shared", "send_vacancy_state")) || {};
  const totals = st.totals || {};
  for (const k of ["checked", "unchanged", "noJobs", "aiPages", "aiFailed", "deferred", "fetchFailed", "found", "inserted", "removed", "closed", "pence"]) totals[k] = Math.round(((totals[k] || 0) + log[k]) * 100) / 100;
  await kvSet("shared", "send_vacancy_state", { lastRun: log.at, lastLog: { ...log, errors: log.errors.slice(0, 10) }, totals });
  return res.status(200).json({ ok: true, log });
}
