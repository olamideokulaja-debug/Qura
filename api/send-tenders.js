import { cronAllowed } from "./_cron.js";
import { sbAdmin, kvGet, kvSet } from "./_send.js";
import { laMatcher, tenderRow } from "./_sendmarket.js";

export const config = { maxDuration: 300 };

// SEND Intelligence week 5: SEND tenders, pre-tender notices, frameworks and contract end dates
// (ideas 16, 17 and 18). Every 10 minutes at :02 (vercel.json).
// Reads Find a Tender and Contracts Finder (both Open Government Licence) one day-window at a time,
// keeps only SEND-related notices (see sendRelevant in _sendmarket.js) and stores one row per
// notice and stage in send_tenders:
//   planning  pipeline, preliminary market engagement and planned procurement notices: early signals
//   tender    open opportunities, including frameworks and dynamic purchasing systems
//   award     contracts let, with their end dates, which drive the renewal forecast
// The first runs work back through 3 years of notices (about 2 days of runs); after that each run
// only reads what changed since the last one. At most 12 Find a Tender and 10 Contracts Finder
// pages a run, one request every 3 seconds, never in parallel; a 429 (slow down) pauses
// that source for 20 minutes or as long as the service asks, whichever is longer.

const FTS = "https://www.find-tender.service.gov.uk/api/1.0/ocdsReleasePackages";
const CF = "https://www.contractsfinder.service.gov.uk/Published/Notices/OCDS/Search";
const UA = "QuraBot/1.0 (SEND Intelligence; +https://www.qurahealth.org/send-data.html; privacy@qurahealth.org)";
const BACKFILL_DAYS = 3 * 365, BUDGET_MS = 230000, DAY = 86400000;
// Pages per run and the pause after a 429, tuned on 9 October 2026: Find a Tender answered 429
// after 19 pages at one every 3 seconds, and Contracts Finder after about 12 at one every 1.5 seconds.
const MAX_PAGES = { fts: 12, cf: 10 }, PAUSE_MS = 20 * 60000;

async function getJson(url) {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 30000);
  try { const r = await fetch(url, { signal: ctl.signal, headers: { "User-Agent": UA, Accept: "application/json" } }); if (!r.ok) return { error: "HTTP " + r.status, retryAfter: Number(r.headers.get("retry-after")) || 0 }; return { data: await r.json() }; }
  catch (e) { return { error: String((e && e.name === "AbortError") ? "timeout" : (e && e.message) || e) }; }
  finally { clearTimeout(t); }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isoDay = (d) => new Date(d).toISOString().slice(0, 10);

// Source state: { cursorDay (YYYY-MM-DD, the day being read), next (page link within that day), doneTo (last day fully read) }
function firstUrl(src, day) {
  if (src === "fts") return FTS + "?updatedFrom=" + day + "T00:00:00Z&updatedTo=" + isoDay(Date.parse(day) + DAY) + "T00:00:00Z&limit=100";
  return CF + "?publishedFrom=" + day + "&publishedTo=" + isoDay(Date.parse(day) + DAY) + "&size=100";
}

async function runSource(sb, src, st, log, deadline, match) {
  const name = src === "fts" ? "Find a Tender" : "Contracts Finder";
  const today = isoDay(Date.now());
  if (!st.cursorDay) st.cursorDay = isoDay(Date.now() - BACKFILL_DAYS * DAY);
  let pages = 0;
  if (st.pausedUntil && Date.now() < Date.parse(st.pausedUntil)) { log[src + "Paused"] = st.pausedUntil; return; }
  while (Date.now() < deadline && pages < MAX_PAGES[src]) {
    if (st.cursorDay > today) { st.cursorDay = today; st.next = null; break; }
    const url = st.next || firstUrl(src, st.cursorDay);
    const r = await getJson(url); pages++;
    if (r.error === "HTTP 429") { const wait = Math.max(PAUSE_MS, (r.retryAfter || 0) * 1000); st.pausedUntil = new Date(Date.now() + wait).toISOString(); log.errors.push(name + ": asked to slow down (429); pausing until " + st.pausedUntil); log[src + "Throttled"] = true; break; }
    if (r.error) { log.errors.push(name + " " + st.cursorDay + ": " + r.error); st.fails = (st.fails || 0) + 1; if (st.fails >= 3) { st.fails = 0; st.next = null; st.cursorDay = isoDay(Date.parse(st.cursorDay) + DAY); } break; }
    st.fails = 0;
    const rels = (r.data && r.data.releases) || [];
    const rows = []; for (const rel of rels) { const row = tenderRow(rel, name, match); if (row) rows.push(row); }
    if (rows.length) {
      const uniq = [...new Map(rows.map((x) => [x.id, x])).values()];
      const { error } = await sb.from("send_tenders").upsert(uniq, { onConflict: "id" });
      if (error) { log.errors.push(name + " save: " + error.message); break; }
      log[src + "Kept"] = (log[src + "Kept"] || 0) + uniq.length;
    }
    log[src + "Read"] = (log[src + "Read"] || 0) + rels.length;
    const next = r.data && r.data.links && r.data.links.next;
    if (next && rels.length) st.next = next;
    else {
      st.next = null; st.doneTo = st.cursorDay;
      // Today stays open: re-read it on the next run, and the day before too, for late updates.
      if (st.cursorDay >= today) { st.cursorDay = isoDay(Date.now() - DAY); break; }
      st.cursorDay = isoDay(Date.parse(st.cursorDay) + DAY);
    }
    await sleep(3000);
  }
  log[src + "Pages"] = pages; log[src + "Day"] = st.cursorDay;
}

export default async function handler(req, res) {
  if (!(await cronAllowed(req))) return res.status(401).json({ error: "Not allowed" });
  const sb = sbAdmin(); if (!sb) return res.status(500).json({ error: "Supabase not configured" });
  const started = Date.now();
  const st = (await kvGet("shared", "send_tender_state")) || {};
  // Once caught up, read again at most hourly.
  const caughtUp = st.fts && st.cf && st.fts.doneTo >= isoDay(Date.now() - 2 * DAY) && st.cf.doneTo >= isoDay(Date.now() - 2 * DAY);
  if (caughtUp && st.lastRun && Date.now() - Date.parse(st.lastRun) < 55 * 60000 && !(req.query && req.query.force)) return res.status(200).json({ ok: true, skipped: "caught up; next read within the hour" });
  const { data: las } = await sb.from("send_council_stats").select("la_code,la_name");
  const match = laMatcher((las || []).map((l) => ({ code: l.la_code, name: l.la_name })));
  const log = { at: new Date().toISOString(), errors: [] };
  st.fts = st.fts || {}; st.cf = st.cf || {};
  await runSource(sb, "fts", st.fts, log, started + BUDGET_MS * 0.55, match);
  await runSource(sb, "cf", st.cf, log, started + BUDGET_MS, match);
  // Buyers that did not match a council when first stored (council list not loaded yet)
  if (las && las.length && st.matchedWith !== las.length) {
    st.matchedWith = las.length;
    const { data: loose } = await sb.from("send_tenders").select("id,buyer").is("la_code", null).not("buyer", "is", null).limit(500);
    for (const t of loose || []) { const c = match(t.buyer); if (c) await sb.from("send_tenders").update({ la_code: c }).eq("id", t.id); }
  }
  st.lastRun = log.at; st.lastLog = { ...log, errors: log.errors.slice(0, 10) };
  await kvSet("shared", "send_tender_state", st);
  return res.status(200).json({ ok: true, log });
}
