import { cronAllowed } from "./_cron.js";
import { sbAdmin, kvGet, kvSet, parseCsv } from "./_send.js";
import { politeFetch } from "./_sendcrawl.js";
import { laMatcher, DBV, DBV_URL } from "./_sendmarket.js";

export const config = { maxDuration: 300 };

// SEND Intelligence week 5: council intelligence (ideas 3, 4, 5 and 8). Hourly at :35; each
// run does whichever step is due, so no single run is long and no source is asked twice.
//   ehcp       weekly   DfE statistics API: EHC plans by setting, assessment requests, 20-week timeliness
//   ofsted     daily    checks GOV.UK for a newer Ofsted "latest inspections" file; imports it when new
//   funding    weekly   GOV.UK list of Safety Valve agreements, and the DBV grant list (fixed, Nov 2023)
//   highneeds  rolling  ESFA dedicated schools grant pages, 12 councils a run, each refreshed every 30 days
// All sources are published under the Open Government Licence v3.0. Vercel Cron or a founder only.

const EES = "https://api.education.gov.uk/statistics/v1/data-sets/";
const DS = {
  plans: "01a0aa37-1008-7183-9271-35e3bcbb26c8",     // EHC plans as at January each year
  requests: "01a0aa36-eb22-7682-94aa-a6bcbb1117ae",  // requests for an EHC needs assessment
  timeliness: "01a0aa36-b680-76f8-8e62-55b216223feb", // new plans issued within 20 weeks
};
const SETTING = { EY6Rq: "total", W64Y2: "special", "1Acgi": "mainstream", TaJTP: "ap", "5kzid": "indep_special" };
const OFSTED_PAGE = "https://www.gov.uk/api/content/government/statistical-data-sets/monthly-management-information-ofsteds-school-inspections-outcomes";
const SV_PAGE = "https://www.gov.uk/api/content/government/publications/dedicated-schools-grant-very-high-deficit-intervention";
const ESFA = "https://skillsfunding.service.gov.uk";
const DAY = 86400000;

async function eesQuery(id, filters, indicator) {
  const body = { criteria: { and: [...filters.map((f) => ({ filters: { in: f } })), { geographicLevels: { eq: "LA" } }] }, indicators: [indicator], pageSize: 10000 };
  const r = await fetch(EES + id + "/query", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json", "User-Agent": "QuraBot/1.0 (SEND Intelligence; +https://www.qurahealth.org/send-data.html)" }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error("DfE statistics API " + r.status);
  const j = await r.json();
  return j.results || [];
}
async function eesLas(id) {
  const r = await fetch(EES + id + "/meta", { headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error("DfE statistics meta " + r.status);
  const j = await r.json();
  const la = (j.locations || []).find((l) => l.level && l.level.code === "LA");
  return new Map(((la && la.options) || []).map((o) => [o.id, { code: String(o.oldCode || ""), name: o.label }]));
}
const pct = (now, then) => (then ? Math.round(((now - then) / then) * 1000) / 10 : null);
const ukDate = (s) => { const m = String(s || "").match(/^(\d{2})\/(\d{2})\/(\d{4})$/); return m ? m[3] + "-" + m[2] + "-" + m[1] : null; };
const clean = (v) => { const s = String(v == null ? "" : v).trim(); return !s || s === "NULL" ? null : s; };

async function stepEhcp(sb, log) {
  const las = await eesLas(DS.plans);
  const plans = await eesQuery(DS.plans, [["a1u9L"], ["QBxmw"], Object.keys(SETTING)], "YJV9H");
  const reqLas = await eesLas(DS.requests);
  const reqs = await eesQuery(DS.requests, [["6glLr"], ["VRf45"], ["93Vg4"], ["75E6X"], ["CpwwI"]], "Hv5mz");
  const timLas = await eesLas(DS.timeliness);
  const tim = await eesQuery(DS.timeliness, [["75b1X"], ["TazmP"], ["OnDsC"], ["iG2h6", "Liu0W"]], "6QqCr");
  const by = new Map();
  const get = (code, name) => { if (!by.has(code)) by.set(code, { la_code: code, la_name: name, ehcp: {}, requests: {}, timeliness: {} }); return by.get(code); };
  for (const r of plans) {
    const la = las.get(r.locations.LA); if (!la || !la.code) continue;
    const set = SETTING[r.filters.b0BtT]; const v = Number(r.values.YJV9H); if (!set || !isFinite(v)) continue;
    const row = get(la.code, la.name); const yr = r.timePeriod.period; (row.ehcp[yr] = row.ehcp[yr] || {})[set] = v;
  }
  for (const r of reqs) {
    const la = reqLas.get(r.locations.LA); if (!la || !la.code) continue;
    const v = Number(r.values.Hv5mz); if (isFinite(v)) get(la.code, la.name).requests[r.timePeriod.period] = v;
  }
  for (const r of tim) {
    const la = timLas.get(r.locations.LA); if (!la || !la.code) continue;
    const v = Number(r.values["6QqCr"]); if (!isFinite(v)) continue;
    const row = get(la.code, la.name); const yr = r.timePeriod.period;
    (row.timeliness[yr] = row.timeliness[yr] || {})[r.filters.UthRF === "iG2h6" ? "within20" : "total"] = v;
  }
  const match = laMatcher([...by.values()].map((r) => ({ code: r.la_code, name: r.la_name })));
  const dbv = new Map(); for (const [tranche, names] of Object.entries(DBV)) for (const n of names) { const c = match(n); if (c) dbv.set(c, tranche); else log.errors.push("DBV name not matched: " + n); }
  const rows = [];
  for (const r of by.values()) {
    const years = Object.keys(r.ehcp).sort(); const last = years[years.length - 1];
    const ry = Object.keys(r.requests).sort(); const ty = Object.keys(r.timeliness).sort(); const tl = r.timeliness[ty[ty.length - 1]] || {};
    const latest = last ? r.ehcp[last] : {};
    // A published year that drops by more than 20% and then rebounds by more than 50% is a break in
    // the source series (Newham, January 2025: 2,705 then 1,199 then 3,639). Growth measured from a
    // broken year is not shown, and the council is labelled.
    const tot = years.map((y) => (r.ehcp[y] || {}).total || 0); const breaks = [];
    for (let i = 1; i < tot.length - 1; i++) if (tot[i - 1] && tot[i] < 0.8 * tot[i - 1] && tot[i + 1] > 1.5 * tot[i]) breaks.push(years[i]);
    const g1 = breaks.includes(years[years.length - 2]) ? null : pct(latest.total, (r.ehcp[years[years.length - 2]] || {}).total);
    const g5 = breaks.includes(years[years.length - 6]) ? null : pct(latest.total, (r.ehcp[years[years.length - 6]] || {}).total);
    rows.push({
      la_code: r.la_code, la_name: r.la_name, ehcp: r.ehcp, requests: r.requests, timeliness: r.timeliness,
      ehcp_latest: latest.total ?? null, ehcp_growth_1y: g1, ehcp_growth_5y: g5,
      ehcp_note: breaks.length ? "The published figure for " + breaks.join(" and ") + " breaks the series, so growth from it is not shown." : null,
      ehcp_special: latest.special ?? null, ehcp_mainstream: latest.mainstream ?? null, ehcp_ap: latest.ap ?? null, ehcp_indep_special: latest.indep_special ?? null,
      requests_latest: r.requests[ry[ry.length - 1]] ?? null, requests_growth_1y: pct(r.requests[ry[ry.length - 1]], r.requests[ry[ry.length - 2]]),
      pct_20wk: tl.total ? Math.round((tl.within20 / tl.total) * 1000) / 10 : null,
      dbv: dbv.has(r.la_code), dbv_tranche: dbv.get(r.la_code) || null, updated_at: new Date().toISOString(),
    });
  }
  for (let i = 0; i < rows.length; i += 200) { const { error } = await sb.from("send_council_stats").upsert(rows.slice(i, i + 200), { onConflict: "la_code" }); if (error) throw new Error(error.message); }
  log.ehcpCouncils = rows.length;
}

async function stepOfsted(sb, st, log) {
  const r = await fetch(OFSTED_PAGE, { headers: { Accept: "application/json" } }); if (!r.ok) throw new Error("GOV.UK content " + r.status);
  const page = await r.json(); let best = null;
  for (const a of (page.details && page.details.attachments) || []) {
    const m = String(a.title || "").match(/latest inspections as at (\d{1,2}) (\w+) (\d{4})/i);
    if (!m || !/\.csv$/i.test(a.url || "")) continue;
    const dt = new Date(m[1] + " " + m[2].replace(/^Sept$/i, "Sep") + " " + m[3] + " 12:00 UTC");
    if (!isNaN(dt) && (!best || dt > best.dt)) best = { dt, url: a.url, title: a.title };
  }
  if (!best) throw new Error("No Ofsted latest-inspections file found");
  if (st.ofstedUrl === best.url) { log.ofsted = "unchanged"; return; }
  const f = await fetch(best.url); if (!f.ok) throw new Error("Ofsted file " + f.status);
  const text = new TextDecoder("windows-1252").decode(await f.arrayBuffer());
  const rows = parseCsv(text); const head = rows[0].map((h) => h.trim()); const ix = (n) => head.indexOf(n);
  const C = { link: ix("Web Link (opens in new window)"), urn: ix("URN"), laestab: ix("LAESTAB"), name: ix("School name"), type: ix("Type of education"), start: ix("Inspection start date"), pub: ix("Publication date"), itype: ix("Inspection type"),
    concern: ix("Category of concern"), safe: ix("Safeguarding standards"), incl: ix("Inclusion"), oeif: ix("Latest OEIF overall effectiveness"), oeifDate: ix("Inspection start date of latest OEIF graded inspection"), ungraded: ix("Ungraded inspection overall outcome"), recent: ix("Most recent category of concern") };
  if (C.urn < 0 || C.incl < 0) throw new Error("Ofsted file columns changed");
  const asAt = best.dt.toISOString().slice(0, 10); const out = [];
  for (const row of rows.slice(1)) {
    const urn = clean(row[C.urn]); if (!urn) continue;
    out.push({ urn, la_code: (clean(row[C.laestab]) || "").slice(0, 3) || null, school_name: clean(row[C.name]), school_type: clean(row[C.type]),
      inspected_at: ukDate(row[C.start]), published_at: ukDate(row[C.pub]), inspection_type: clean(row[C.itype]),
      inclusion: clean(row[C.incl]), safeguarding: clean(row[C.safe]), category_of_concern: clean(row[C.concern]), recent_concern: clean(row[C.recent]),
      oeif_overall: clean(row[C.oeif]), oeif_date: ukDate(row[C.oeifDate]), ungraded_outcome: clean(row[C.ungraded]), report_url: clean(row[C.link]),
      file_as_at: asAt, updated_at: new Date().toISOString() });
  }
  for (let i = 0; i < out.length; i += 1000) { const { error } = await sb.from("send_inspections").upsert(out.slice(i, i + 1000), { onConflict: "urn" }); if (error) throw new Error(error.message); }
  st.ofstedUrl = best.url; st.ofstedAsAt = asAt; log.ofsted = out.length + " schools, file as at " + asAt;
}

async function stepFunding(sb, log) {
  const r = await fetch(SV_PAGE, { headers: { Accept: "application/json" } }); if (!r.ok) throw new Error("GOV.UK content " + r.status);
  const page = await r.json();
  const { data: las } = await sb.from("send_council_stats").select("la_code,la_name");
  const match = laMatcher((las || []).map((l) => ({ code: l.la_code, name: l.la_name })));
  const found = new Map();
  for (const a of (page.details && page.details.attachments) || []) {
    const m = String(a.title || "").match(/^(.+?): dedicated schools grant .safety valve. agreement (\d{4}-\d{4})/i);
    if (!m) continue; const code = match(m[1]); if (!code) { log.errors.push("Safety Valve name not matched: " + m[1]); continue; }
    if (!found.has(code) || found.get(code).year < m[2]) found.set(code, { year: m[2], url: a.url });
  }
  await sb.from("send_council_stats").update({ safety_valve: false, sv_year: null, sv_url: null }).eq("safety_valve", true);
  for (const [code, v] of found) await sb.from("send_council_stats").update({ safety_valve: true, sv_year: v.year, sv_url: v.url }).eq("la_code", code);
  log.safetyValve = found.size;
}

const money = (s) => Number(String(s || "").replace(/[£,]/g, ""));
async function stepHighNeeds(sb, log, budgetMs, started) {
  const due = new Date(Date.now() - 30 * DAY).toISOString();
  const { data: todo } = await sb.from("send_council_stats").select("la_code,la_name").or("hn_checked_at.is.null,hn_checked_at.lt." + due).order("hn_checked_at", { ascending: true, nullsFirst: true }).limit(12);
  let done = 0;
  for (const la of todo || []) {
    if (Date.now() - started > budgetMs) break;
    const now = new Date().toISOString();
    const hist = await politeFetch(ESFA + "/view-latest-funding/local-authority/allocation-history/dedicated-schools-grant/" + encodeURIComponent(la.la_code), { timeoutMs: 15000 });
    const links = [...String(hist.text || "").matchAll(/funding-breakdown\/(\d{4}-to-\d{4})\/\d+\/(\d{1,2}-\d{1,2}-\d{4})/g)].map((m) => ({ year: m[1], date: m[2] }));
    const years = [...new Set(links.map((l) => l.year))].sort(); const year = years[years.length - 1];
    const link = links.find((l) => l.year === year);
    if (!link) { await sb.from("send_council_stats").update({ hn_checked_at: now }).eq("la_code", la.la_code); log.errors.push("No DSG page for " + la.la_name); continue; }
    const url = ESFA + "/view-latest-funding/dedicated-schools-grant/funding-breakdown/" + link.year + "/" + la.la_code + "/" + link.date;
    const p = await politeFetch(url, { timeoutMs: 15000 });
    const txt = String(p.text || "").replace(/<[^>]+>/g, " ").replace(/&nbsp;|&#160;/g, " ").replace(/&pound;|&#163;|&#xA3;/gi, "£").replace(/&amp;/g, "&").replace(/\s+/g, " ");
    // Both figures exclude import and export adjustments and deductions, so they compare like for like.
    const prev = txt.match(/High needs allocations \d{4} to \d{4} Including hospital education annualisation, excluding import and export adjustments and deductions (£[\d,\.]+)/);
    const before = txt.match(/Before deductions(?: \([^)]*\))? (£[\d,\.]+)/);
    const imp = txt.match(/Import and export(?: \([^)]*\))? (-?)£([\d,\.]+)/);
    const row = { hn_checked_at: now, hn_url: url };
    if (prev && before) {
      const p0 = money(prev[1]); const b = money(before[1]); const ie = imp ? (imp[1] ? -1 : 1) * money(imp[2]) : 0;
      const nowExcl = b - ie;
      if (p0 > 0 && nowExcl > 0) Object.assign(row, { hn_prev: Math.round(p0), hn_now: Math.round(nowExcl), hn_growth: pct(nowExcl, p0) });
    } else log.errors.push("High needs figures not found for " + la.la_name);
    await sb.from("send_council_stats").update(row).eq("la_code", la.la_code); done++;
    await new Promise((r) => setTimeout(r, 800));
  }
  log.highNeeds = done;
}

export default async function handler(req, res) {
  if (!(await cronAllowed(req))) return res.status(401).json({ error: "Not allowed" });
  const sb = sbAdmin(); if (!sb) return res.status(500).json({ error: "Supabase not configured" });
  const started = Date.now(); const st = (await kvGet("shared", "send_council_state")) || {};
  const log = { at: new Date().toISOString(), errors: [] };
  const due = (k, days) => !st[k] || Date.now() - Date.parse(st[k]) > days * DAY;
  const force = String((req.query && req.query.step) || "");
  const step = async (name, days, fn) => {
    if (!(force === name || (!force && due(name, days)))) return;
    try { await fn(); st[name] = new Date().toISOString(); } catch (e) { log.errors.push(name + ": " + String(e.message || e)); }
  };
  await step("ehcp", 7, () => stepEhcp(sb, log));
  await step("ofsted", 1, () => stepOfsted(sb, st, log));
  await step("funding", 7, () => stepFunding(sb, log));
  if (!force || force === "highneeds") { try { await stepHighNeeds(sb, log, 200000, started); } catch (e) { log.errors.push("highneeds: " + String(e.message || e)); } }
  st.lastRun = log.at; st.lastLog = { ...log, errors: log.errors.slice(0, 15) };
  await kvSet("shared", "send_council_state", st);
  return res.status(200).json({ ok: true, log });
}
