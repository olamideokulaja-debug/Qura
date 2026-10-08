import { cronAllowed } from "./_cron.js";
import { sbAdmin, GIAS_URL, parseCsv, inScope, schoolRecord, slug, personName, kvGet, kvSet } from "./_send.js";

export const config = { maxDuration: 300 };

// SEND Intelligence: school master sync for England (job sync_send_school_master).
// Runs hourly at :50 (vercel.json) but only does work when the last good sync
// is over 7 days old, or a founder adds ?force=1. One run:
//   1. downloads the newest official GIAS file (Open Government Licence),
//   2. keeps open, opening-soon and closing-soon special schools, alternative
//      provision and PRUs, and mainstream schools with an SEN unit or resourced provision,
//   3. upserts schools, academy trusts, local authorities and independent proprietors,
//      and links each school to them, recording new schools, trust moves and status changes,
//   4. registers each school website in the source register for careers-page discovery,
//   5. marks schools that dropped out of scope (closed or no longer SEN) as out of scope.
// Vercel Cron or a signed-in founder only (api/_cron.js).

const WEEK = 7 * 24 * 3600 * 1000;

async function upsertOrgs(sb, rows, log) {
  const ids = new Map();
  for (let i = 0; i < rows.length; i += 400) {
    const chunk = rows.slice(i, i + 400);
    const { data, error } = await sb.from("send_organisations").upsert(chunk, { onConflict: "nation,org_kind,official_id" }).select("id,org_kind,official_id");
    if (error) { log.errors.push("orgs: " + error.message); return null; }
    for (const d of data || []) ids.set(d.org_kind + ":" + d.official_id, d.id);
    log.upserted += chunk.length;
  }
  return ids;
}

export default async function handler(req, res) {
  if (!(await cronAllowed(req))) return res.status(401).json({ error: "Not allowed" });
  const sb = sbAdmin();
  if (!sb) return res.status(500).json({ error: "Supabase not configured" });
  const state = (await kvGet("shared", "send_schools_state")) || {};
  const force = String((req.query && req.query.force) || "") === "1";
  if (!force && state.lastSuccess && Date.now() - new Date(state.lastSuccess).getTime() < WEEK) {
    return res.status(200).json({ ok: true, skipped: "fresh", lastSuccess: state.lastSuccess });
  }
  const runAt = new Date().toISOString();
  const log = { at: runAt, file: null, rows: 0, inScope: 0, upserted: 0, links: 0, sources: 0, outOfScope: 0, errors: [] };

  // 1. Newest file (GIAS publishes daily; try today and the 6 days before)
  let text = null;
  for (let d = 0; d < 7 && !text; d++) {
    const ymd = new Date(Date.now() - d * 86400000).toISOString().slice(0, 10).replace(/-/g, "");
    try {
      const r = await fetch(GIAS_URL(ymd));
      if (r.ok) { text = new TextDecoder("windows-1252").decode(await r.arrayBuffer()); log.file = ymd; }
    } catch (e) { log.errors.push("fetch " + ymd + ": " + e.message); }
  }
  if (!text) { await kvSet("shared", "send_schools_state", { ...state, lastRun: runAt, lastLog: log }); return res.status(502).json({ error: "GIAS file not available", log }); }

  // 2. Parse and filter
  const table = parseCsv(text); text = null;
  const head = table.shift() || [];
  const rows = [];
  for (const cells of table) {
    if (cells.length < head.length - 2) continue;
    const r = {}; head.forEach((h, i) => { r[h] = cells[i]; });
    log.rows++;
    if (inScope(r)) rows.push(r);
  }
  log.inScope = rows.length;
  if (rows.length < 3000) { log.errors.push("too few in-scope rows; file may be partial, nothing changed"); await kvSet("shared", "send_schools_state", { ...state, lastRun: runAt, lastLog: log }); return res.status(500).json({ error: "Sanity check failed", log }); }

  // 3. Parents first (trusts, local authorities, proprietors), then schools
  const parents = new Map();
  for (const r of rows) {
    const tc = (r["Trusts (code)"] || "").trim(), tn = (r["Trusts (name)"] || "").trim();
    if (tc && tn) parents.set("trust:" + tc, { nation: "england", org_kind: "trust", official_id: tc, name: tn, status: "Open", in_scope: true, setting_group: "trust", source: "gias", last_seen_at: runAt, last_verified_at: runAt });
    const lc = (r["LA (code)"] || "").trim(), ln = (r["LA (name)"] || "").trim();
    if (lc && ln) parents.set("local_authority:" + lc, { nation: "england", org_kind: "local_authority", official_id: lc, name: ln, status: "Open", in_scope: true, setting_group: "local_authority", la_code: lc, la_name: ln, region: (r["GOR (name)"] || "").trim() || null, source: "gias", last_seen_at: runAt, last_verified_at: runAt });
    const pn = (r.PropsName || "").trim();
    if (pn && !personName(pn) && /independent|non-maintained/i.test(r["TypeOfEstablishment (name)"])) parents.set("proprietor:" + slug(pn), { nation: "england", org_kind: "proprietor", official_id: slug(pn), name: pn, status: "Open", in_scope: true, setting_group: "proprietor", source: "gias", last_seen_at: runAt, last_verified_at: runAt });
  }
  // Before writing, remember each school's trust and status so changes can be recorded (idea 9)
  const before = new Map();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from("send_organisations").select("id,official_id,trust_code,trust_name,status").eq("nation", "england").eq("org_kind", "school").range(from, from + 999);
    if (error) { log.errors.push("before: " + error.message); break; }
    for (const d of data || []) before.set(d.official_id, d);
    if (!data || data.length < 1000) break;
  }
  const pIds = await upsertOrgs(sb, [...parents.values()], log);
  const schools = rows.map((r) => schoolRecord(r, runAt));
  const sIds = pIds && await upsertOrgs(sb, schools, log);
  if (!pIds || !sIds) { await kvSet("shared", "send_schools_state", { ...state, lastRun: runAt, lastLog: log }); return res.status(500).json({ error: "Upsert failed", log }); }

  // Changes since the last sync: new schools, trust moves, status changes (skipped on the very first sync)
  log.events = 0;
  if (before.size > 100) {
    const events = [];
    for (const sc of schools) {
      const id = sIds.get("school:" + sc.official_id); if (!id) continue;
      const b = before.get(sc.official_id);
      if (!b) { events.push({ organisation_id: id, event: "new_in_scope", detail: { status: sc.status, setting: sc.setting_group } }); continue; }
      if ((b.trust_code || null) !== (sc.trust_code || null)) events.push({ organisation_id: id, event: "trust_change", detail: { from: b.trust_name || null, to: sc.trust_name || null } });
      if ((b.status || null) !== (sc.status || null)) events.push({ organisation_id: id, event: "status_change", detail: { from: b.status || null, to: sc.status || null } });
    }
    for (let i = 0; i < events.length; i += 500) {
      const { error } = await sb.from("send_org_events").insert(events.slice(i, i + 500));
      if (error) { log.errors.push("events: " + error.message); break; }
      log.events += events.slice(i, i + 500).length;
    }
  }

  // Links
  const links = [];
  for (const r of rows) {
    const child = sIds.get("school:" + r.URN); if (!child) continue;
    const t = pIds.get("trust:" + (r["Trusts (code)"] || "").trim()); if (t) links.push({ parent_id: t, child_id: child, kind: "trust_member", source: "gias", updated_at: runAt });
    const l = pIds.get("local_authority:" + (r["LA (code)"] || "").trim()); if (l) links.push({ parent_id: l, child_id: child, kind: "la_area", source: "gias", updated_at: runAt });
    const p = pIds.get("proprietor:" + slug((r.PropsName || "").trim())); if (p && (r.PropsName || "").trim() && !personName(r.PropsName)) links.push({ parent_id: p, child_id: child, kind: "proprietor_of", source: "gias", updated_at: runAt });
  }
  for (let i = 0; i < links.length; i += 1000) {
    const { error } = await sb.from("send_organisation_relationships").upsert(links.slice(i, i + 1000), { onConflict: "parent_id,child_id,kind" });
    if (error) { log.errors.push("links: " + error.message); break; }
    log.links += links.slice(i, i + 1000).length;
  }

  // 4. Source register: one school_website row per school with a site (discovery fills careers pages)
  const srcs = schools.filter((s) => s.website).map((s) => ({ organisation_id: sIds.get("school:" + s.official_id), kind: "school_website", url: s.website, status: "to_discover", priority: s.setting_group === "mainstream_unit" ? 6 : 4 }));
  for (let i = 0; i < srcs.length; i += 1000) {
    const { error } = await sb.from("send_sources").upsert(srcs.slice(i, i + 1000), { onConflict: "kind,url", ignoreDuplicates: true });
    if (error) { log.errors.push("sources: " + error.message); break; }
    log.sources += srcs.slice(i, i + 1000).length;
  }

  // 5. Anything from GIAS not seen in this file is now out of scope
  const { data: gone, error: goneErr } = await sb.from("send_organisations").update({ in_scope: false }).eq("source", "gias").eq("nation", "england").lt("last_seen_at", runAt).eq("in_scope", true).select("id");
  if (goneErr) log.errors.push("out of scope: " + goneErr.message); else log.outOfScope = (gone || []).length;
  await sb.from("send_organisations").delete().eq("source", "test");

  await kvSet("shared", "send_schools_state", { lastRun: runAt, lastSuccess: log.errors.length ? state.lastSuccess || null : runAt, lastLog: log });
  return res.status(200).json({ ok: true, log });
}
