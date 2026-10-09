import { sbAdmin, sendAccess, kvGet } from "./_send.js";
import { CATEGORY_LABEL } from "./_sendmarket.js";

// SEND Intelligence week 5 read API: councils and tenders.
//   GET /api/send-market?view=councils                    every council: EHC plans, requests, timeliness,
//                                                         high needs, Safety Valve, DBV, Ofsted, vacancies, tenders
//   GET /api/send-market?view=council&code=936            one council in detail
//   GET /api/send-market?view=tenders&kind=open|signals|renewals|frameworks&category=therapy&page=1
// Founders, or suppliers with an active SEND entitlement.

const PAGE = 50, DAY = 86400000;
const iso = (d) => new Date(d).toISOString().slice(0, 10);
const CONCERN_GRADES = ["Needs attention", "Urgent improvement"];

async function pageAll(build) {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await build().range(from, from + 999);
    if (error) throw new Error(error.message);
    out.push(...(data || [])); if (!data || data.length < 1000) break;
  }
  return out;
}

function tenderQuery(sb, kind, category, la) {
  const today = iso(Date.now());
  let q = sb.from("send_tenders").select("id,source,stage,title,buyer,la_code,category,value_amount,currency,published_at,closing_at,contract_start,contract_end,max_extent,is_framework,is_dps,suppliers,url", { count: "exact" });
  if (kind === "signals") q = q.eq("stage", "planning").gte("published_at", new Date(Date.now() - 365 * DAY).toISOString()).order("published_at", { ascending: false });
  else if (kind === "renewals") q = q.eq("stage", "award").gte("contract_end", today).lte("contract_end", iso(Date.now() + 548 * DAY)).order("contract_end", { ascending: true });
  else if (kind === "frameworks") q = q.neq("stage", "planning").or(["is_framework", "is_dps"].flatMap((f) => ["and(" + f + ".eq.true,contract_end.is.null)", "and(" + f + ".eq.true,contract_end.gte." + today + ")"]).join(",")).order("published_at", { ascending: false });
  else q = q.eq("stage", "tender").or("closing_at.is.null,closing_at.gte." + new Date().toISOString()).gte("published_at", new Date(Date.now() - 120 * DAY).toISOString()).order("published_at", { ascending: false });
  if (category === "no_transport") q = q.neq("category", "transport");
  else if (category) q = q.eq("category", category);
  if (la) q = q.eq("la_code", la);
  return q;
}

export default async function handler(req, res) {
  const access = await sendAccess(req);
  if (!access.user) return res.status(401).json({ error: "Sign in required" });
  if (!access.ok) return res.status(403).json({ error: "SEND Intelligence is not switched on for this account" });
  const sb = sbAdmin(); if (!sb) return res.status(500).json({ error: "Supabase not configured" });
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const view = String(req.query.view || "councils");
  const category = String(req.query.category || "").replace(/[^a-z_]/g, "") || null;

  try {
    if (view === "tenders") {
      const kind = ["open", "signals", "renewals", "frameworks"].includes(req.query.kind) ? req.query.kind : "open";
      const page = Math.max(1, Math.min(200, Number(req.query.page) || 1));
      const { data, count, error } = await tenderQuery(sb, kind, category, null).range((page - 1) * PAGE, page * PAGE - 1);
      if (error) throw new Error(error.message);
      const st = (await kvGet("shared", "send_tender_state")) || {};
      return res.status(200).json({ kind, items: data || [], total: count || 0, page, pageSize: PAGE, categories: CATEGORY_LABEL,
        progress: { find_a_tender_read_to: st.fts && st.fts.doneTo || null, contracts_finder_read_to: st.cf && st.cf.doneTo || null },
        note: kind === "renewals" ? "Contracts whose published end date falls in the next 18 months. A forecast: buyers may extend, re-procure early or stop buying." : kind === "signals" ? "Pipeline, market engagement and planned procurement notices from the last 12 months. Early signals; not every one becomes a tender." : "From Find a Tender and Contracts Finder (Open Government Licence). Always read the original notice." });
    }

    // Only councils that exist today: the DfE series still carries councils since merged
    // (Northamptonshire, Bournemouth, Poole and others), whose last figures would look current.
    const { data: current } = await sb.from("send_organisations").select("la_code").eq("org_kind", "local_authority").eq("in_scope", true);
    const live = new Set((current || []).map((c) => c.la_code));
    const stats = (await pageAll(() => sb.from("send_council_stats").select("*").order("la_name"))).filter((s) => !live.size || live.has(s.la_code));
    if (view === "councils") {
      const schools = await pageAll(() => sb.from("send_organisations").select("id,official_id,la_code").eq("org_kind", "school").eq("in_scope", true));
      const urnLa = new Map(schools.map((s) => [String(s.official_id), s.la_code]));
      const insp = await pageAll(() => sb.from("send_inspections").select("urn,la_code,inclusion,recent_concern").or("inclusion.in.(\"Needs attention\",\"Urgent improvement\"),recent_concern.in.(SM,SWK)"));
      const concerns = new Map(); for (const i of insp) { if (!urnLa.has(i.urn)) continue; const la = urnLa.get(i.urn); concerns.set(la, (concerns.get(la) || 0) + 1); }
      const liveVac = await pageAll(() => sb.from("send_vacancies").select("organisation_id").eq("status", "LIVE"));
      const orgLa = new Map(schools.map((s) => [s.id, s.la_code])); const vac = new Map();
      for (const v of liveVac) { const la = orgLa.get(v.organisation_id); if (la) vac.set(la, (vac.get(la) || 0) + 1); }
      const today = iso(Date.now());
      const tend = await pageAll(() => sb.from("send_tenders").select("la_code,stage,closing_at,contract_end,published_at,category").not("la_code", "is", null).neq("category", "transport"));
      const t = new Map(); const bump = (la, k) => { const o = t.get(la) || { open: 0, signals: 0, renewals: 0 }; o[k]++; t.set(la, o); };
      for (const x of tend) {
        if (x.stage === "tender" && (!x.closing_at || x.closing_at >= new Date().toISOString())) bump(x.la_code, "open");
        if (x.stage === "planning" && x.published_at >= new Date(Date.now() - 365 * DAY).toISOString()) bump(x.la_code, "signals");
        if (x.stage === "award" && x.contract_end && x.contract_end >= today && x.contract_end <= iso(Date.now() + 548 * DAY)) bump(x.la_code, "renewals");
      }
      const { data: areas } = await sb.from("send_area_metrics").select("area_code,coverage_pct").eq("area_kind", "local_authority");
      const cov = new Map((areas || []).map((a) => [a.area_code, a.coverage_pct]));
      const st = (await kvGet("shared", "send_council_state")) || {};
      return res.status(200).json({
        councils: stats.map((s) => ({ code: s.la_code, name: s.la_name, ehcp: s.ehcp_latest, ehcp_growth_1y: s.ehcp_growth_1y, ehcp_growth_5y: s.ehcp_growth_5y, ehcp_special: s.ehcp_special, ehcp_indep_special: s.ehcp_indep_special,
          requests: s.requests_latest, requests_growth_1y: s.requests_growth_1y, pct_20wk: s.pct_20wk, hn_now: s.hn_now, hn_growth: s.hn_growth, safety_valve: s.safety_valve, sv_year: s.sv_year, dbv: s.dbv,
          inclusion_concerns: concerns.get(s.la_code) || 0, live_vacancies: vac.get(s.la_code) || 0, coverage_pct: cov.get(s.la_code) ?? null, tenders: t.get(s.la_code) || { open: 0, signals: 0, renewals: 0 } })),
        sources: { ehcp: "DfE, Education, health and care plans (June 2026 release)", ofsted: st.ofstedAsAt ? "Ofsted management information, latest inspections as at " + st.ofstedAsAt : "Ofsted management information", high_needs: "ESFA dedicated schools grant 2026 to 2027 (provisional), compared with 2025 to 2026, both before import and export adjustments and deductions", safety_valve: "GOV.UK list of Safety Valve agreements (councils that have had one; not proof of a current agreement)", dbv: "DfE Delivering Better Value in SEND grant letter, November 2023 (tranches 1 and 2)" },
        updated: st.lastRun || null,
      });
    }

    if (view === "council") {
      const code = String(req.query.code || "").replace(/[^0-9]/g, "").slice(0, 4);
      const s = stats.find((x) => x.la_code === code); if (!s) return res.status(404).json({ error: "Council not found" });
      const schools = await pageAll(() => sb.from("send_organisations").select("official_id,name,setting_group").eq("org_kind", "school").eq("in_scope", true).eq("la_code", code));
      const byUrn = new Map(schools.map((x) => [String(x.official_id), x]));
      const urns = [...byUrn.keys()]; const insp = [];
      for (let i = 0; i < urns.length; i += 200) { const { data } = await sb.from("send_inspections").select("urn,inspected_at,published_at,inclusion,safeguarding,category_of_concern,recent_concern,oeif_overall,ungraded_outcome,report_url").in("urn", urns.slice(i, i + 200)); insp.push(...(data || [])); }
      const all = insp.map((i) => ({ ...i, school: (byUrn.get(i.urn) || {}).name, setting: (byUrn.get(i.urn) || {}).setting_group }))
        .sort((a, b) => String(b.published_at || "").localeCompare(String(a.published_at || "")));
      const lists = {};
      for (const kind of ["open", "signals", "renewals", "frameworks"]) { const { data } = await tenderQuery(sb, kind, category || "no_transport", code).limit(30); lists[kind] = data || []; }
      return res.status(200).json({ council: s, inspections: all.slice(0, 60), concerns: all.filter((i) => CONCERN_GRADES.includes(i.inclusion) || ["SM", "SWK"].includes(i.recent_concern)), tenders: lists, categories: CATEGORY_LABEL });
    }
    return res.status(400).json({ error: "Unknown view" });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
