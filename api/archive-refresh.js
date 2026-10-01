import { createClient } from "@supabase/supabase-js";
import { cronAllowed } from "./_cron.js";
import { kvGet, kvSet } from "./_auth.js";
import { FTS, CF, relevant, tenderRow, awardRows } from "./_tenderarchive.js";

export const config = { maxDuration: 300 };

// Fills the Tender Intelligence Archive (api/_tenderarchive.js).
//
// Runs every hour (vercel.json). Each run does two things:
//   1. picks up everything published or updated since the last run on Find a
//      Tender and Contracts Finder, both tender notices and award notices
//   2. while the archive is still being filled, also works back through one
//      more week of history, until it has a full year. That takes about 2
//      days of hourly runs; after that each run is small.
// Then any LIVE tender whose deadline has passed becomes CLOSED.
//
// Vercel Cron or a signed-in founder only (api/_cron.js).

const PAGE_CAP = 30;
const BUDGET_MS = 230000;
const BACKFILL_DAYS = 365;
const CHUNK_DAYS = 7;

const iso = (d) => new Date(d).toISOString().replace(/\.\d+Z$/, "Z");
const isoDay = (d) => new Date(d).toISOString().slice(0, 10);

async function getJson(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 25000);
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { "User-Agent": "QuraTenderBot/1.0 (+https://qurahealth.org)", Accept: "application/json" } });
    return r.ok ? await r.json() : null;
  } catch (e) { return null; } finally { clearTimeout(timer); }
}

// Follows the portal's own "next" links. Reports whether it got to the end.
async function getAll(url, started) {
  const releases = [];
  let next = url, pages = 0;
  while (next && pages < PAGE_CAP && Date.now() - started < BUDGET_MS) {
    const d = await getJson(next);
    if (!d) return { releases, complete: false, pages };
    const rel = d.releases || [];
    releases.push(...rel);
    pages++;
    next = rel.length ? (d.links && d.links.next) || null : null;
  }
  return { releases, complete: !next, pages };
}

function streams(from, to) {
  return [
    ["Find a Tender", false, FTS + "?stages=tender&limit=100&updatedFrom=" + encodeURIComponent(iso(from)) + "&updatedTo=" + encodeURIComponent(iso(to))],
    ["Find a Tender", true, FTS + "?stages=award&limit=100&updatedFrom=" + encodeURIComponent(iso(from)) + "&updatedTo=" + encodeURIComponent(iso(to))],
    ["Contracts Finder", false, CF + "?stages=tender&size=100&publishedFrom=" + isoDay(from) + "&publishedTo=" + isoDay(to)],
    ["Contracts Finder", true, CF + "?stages=award&size=100&publishedFrom=" + isoDay(from) + "&publishedTo=" + isoDay(to)],
  ];
}

async function ingest(sb, from, to, started) {
  const tenders = new Map(), fromAwards = new Map(), awards = new Map();
  let complete = true, scanned = 0;
  for (const [source, isAward, url] of streams(from, to)) {
    const got = await getAll(url, started);
    if (!got.complete) complete = false;
    scanned += got.releases.length;
    for (const rel of got.releases) {
      if (!rel || !rel.ocid || !relevant(rel)) continue;
      const tags = (rel.tag || []).map((x) => String(x).toLowerCase());
      const award = isAward || tags.some((x) => /award|contract/.test(x)) || (rel.awards || []).length > 0;
      if (award) {
        const rows = awardRows(rel, source);
        if (!rows.length) continue;
        rows.forEach((a) => awards.set(a.id, a));
        if (!fromAwards.has("ft_" + rel.ocid)) fromAwards.set("ft_" + rel.ocid, tenderRow(rel, source, true));
      } else {
        const row = tenderRow(rel, source, false);
        const prev = tenders.get(row.id);
        if (!prev || String(row.published_at || "") >= String(prev.published_at || "")) tenders.set(row.id, row);
      }
    }
  }

  // What is already stored, so an update never undoes an award.
  const ids = [...new Set([...tenders.keys(), ...fromAwards.keys()])];
  const existing = new Map();
  for (let i = 0; i < ids.length; i += 200) {
    const { data } = await sb.from("tenders").select("id,status").in("id", ids.slice(i, i + 200));
    (data || []).forEach((r) => existing.set(r.id, r));
  }

  // Tender notices: insert, or refresh the notice data.
  const tRows = [...tenders.values()].map((r) => {
    const ex = existing.get(r.id);
    return ex && ex.status === "AWARDED" ? { ...r, status: "AWARDED" } : r;
  });
  // Award notices for tenders never seen as live: the award notice's own
  // tender section becomes the record, marked AWARDED.
  const newFromAwards = [...fromAwards.values()].filter((r) => !existing.has(r.id) && !tenders.has(r.id));
  const errors = [];
  for (const batch of chunk([...tRows, ...newFromAwards], 100)) {
    const { error } = await sb.from("tenders").upsert(batch, { onConflict: "id" });
    if (error) errors.push("tenders: " + error.message);
  }
  // Tenders already held that now have an award.
  const toAward = [...fromAwards.keys()].filter((id) => existing.has(id) || tenders.has(id));
  for (const batch of chunk(toAward, 200)) {
    const { error } = await sb.from("tenders").update({ status: "AWARDED", updated_at: new Date().toISOString() }).in("id", batch);
    if (error) errors.push("status: " + error.message);
  }
  for (const batch of chunk([...awards.values()], 100)) {
    const { error } = await sb.from("tender_awards").upsert(batch, { onConflict: "id" });
    if (error) errors.push("awards: " + error.message);
  }
  return { complete, scanned, tenders: tRows.length, awardedNew: newFromAwards.length, awards: awards.size, errors };
}

const chunk = (arr, n) => { const out = []; for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n)); return out; };

export default async function handler(req, res) {
  if (!(await cronAllowed(req))) return res.status(403).json({ error: "Not allowed" });
  const sbUrl = process.env.SUPABASE_URL, service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!sbUrl || !service) return res.status(500).json({ error: "Supabase is not configured." });
  const sb = createClient(sbUrl, service, { auth: { persistSession: false } });
  const started = Date.now();
  const state = (await kvGet("shared", "archive_state")) || {};
  const now = Date.now();
  const out = { at: new Date(now).toISOString() };

  try {
    // 1. Since the last run (a day of overlap, in case a portal was late).
    const since = state.lastRun ? Date.parse(state.lastRun) - 86400000 : now - 3 * 86400000;
    out.recent = await ingest(sb, since, now, started);
    if (out.recent.complete) state.lastRun = new Date(now).toISOString();

    // 2. One more week of history until a year is held.
    if (!state.backfillDone && Date.now() - started < BUDGET_MS - 60000) {
      const to = state.backfillTo ? Date.parse(state.backfillTo) : now - 3 * 86400000;
      const from = to - CHUNK_DAYS * 86400000;
      out.backfill = { from: isoDay(from), to: isoDay(to), ...(await ingest(sb, from, to, started)) };
      if (out.backfill.complete) {
        state.backfillTo = new Date(from).toISOString();
        if (from <= now - BACKFILL_DAYS * 86400000) state.backfillDone = true;
      }
    }

    // 3. Deadlines that have passed.
    const { error: closeErr } = await sb.from("tenders").update({ status: "CLOSED", updated_at: new Date().toISOString() })
      .eq("status", "LIVE").lt("closing_date", new Date().toISOString());
    if (closeErr) out.closeError = closeErr.message;

    await kvSet("shared", "archive_state", state);
    const log = (await kvGet("shared", "archive_runs")) || [];
    await kvSet("shared", "archive_runs", [{ ...out, ms: Date.now() - started }, ...(Array.isArray(log) ? log : [])].slice(0, 30));
    return res.status(200).json({ ok: true, ...out, state, ms: Date.now() - started });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e), ...out });
  }
}
