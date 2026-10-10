import { sbAdmin, sendAccess, recordUsage } from "./_send.js";
import { limited } from "./_ratelimit.js";

// SEND Intelligence exports (idea 26, week 6). CSV downloads with the source and licence
// wording in the first lines of every file.
//   GET /api/send-export?what=vacancies&family=speech_language&la=341,340
//   GET /api/send-export?what=schools&setting=special&la=341
//   GET /api/send-export?what=tenders&kind=open|signals|renewals|frameworks&nation=scotland
//   GET /api/send-export?what=councils
// Founders, or suppliers with SEND switched on. 20 exports an hour, 5,000 rows each.

const MAX = 5000, DAY = 86400000;
const iso = (d) => new Date(d).toISOString().slice(0, 10);
const cell = (v) => {
  if (v == null) return "";
  let s = Array.isArray(v) ? v.join("; ") : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;          // stop spreadsheet formulas running
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};
const toCsv = (lines, cols, rows) => [...lines.map((l) => cell(l)), "", cols.map((c) => cell(c[0])).join(","), ...rows.map((r) => cols.map((c) => cell(c[1](r))).join(","))].join("\r\n");

const LICENCE = {
  qura: "Exported from Qura SEND Intelligence (Qura Ltd, company number 17310951) for the internal use of the account holder's organisation. Do not resell or republish this file.",
  ogl: "Contains public sector information licensed under the Open Government Licence v3.0 (https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/).",
};

async function pageAll(build, limit) {
  const out = [];
  for (let from = 0; from < limit; from += 1000) {
    const { data, error } = await build().range(from, Math.min(from + 999, limit - 1));
    if (error) throw new Error(error.message);
    out.push(...(data || [])); if (!data || data.length < 1000) break;
  }
  return out;
}
const list = (v, re) => String(v || "").split(",").map((x) => x.trim()).filter((x) => re.test(x)).slice(0, 60);

export default async function handler(req, res) {
  const access = await sendAccess(req);
  if (!access.user) return res.status(401).json({ error: "Sign in required" });
  if (!access.ok) return res.status(403).json({ error: "SEND Intelligence is not switched on for this account" });
  if (await limited(req, res, access.user, { bucket: "send_export", limit: 20, windowSec: 3600 })) return;
  const sb = sbAdmin(); if (!sb) return res.status(500).json({ error: "Supabase not configured" });
  const what = String(req.query.what || "");
  const las = list(req.query.la, /^(\d{3}|W\d{3}|[SN]:[A-Za-z' &.-]{2,40})$/);
  const today = iso(Date.now());
  let lines, cols, rows;

  try {
    if (what === "vacancies") {
      const fam = String(req.query.family || "").replace(/[^a-z_]/g, "");
      rows = await pageAll(() => {
        let q = sb.from("send_vacancies").select("original_title,profession_family,taxonomy_code,salary_text,contract_type,working_pattern,closing_at,first_seen_at,last_verified_at,source_url,send_organisations!inner(name,setting_group,la_name,la_code,region,postcode,urn:official_id)").eq("status", "LIVE").order("first_seen_at", { ascending: false });
        if (fam) q = q.eq("profession_family", fam);
        if (las.length) q = q.in("send_organisations.la_code", las);
        return q;
      }, MAX);
      lines = [LICENCE.qura, "Vacancies seen on school, trust and council websites Qura is allowed to check. Coverage is partial; always confirm details on the original advert.", "School details: Get Information about Schools, Department for Education. " + LICENCE.ogl, "Exported " + today + "."];
      const o = (r) => r.send_organisations || {};
      cols = [["Role", (r) => r.original_title], ["Profession", (r) => r.profession_family], ["School", (r) => o(r).name], ["URN", (r) => o(r).urn], ["Setting", (r) => o(r).setting_group], ["Council", (r) => o(r).la_name], ["Region", (r) => o(r).region], ["Postcode", (r) => o(r).postcode], ["Pay", (r) => r.salary_text], ["Contract", (r) => r.contract_type], ["Pattern", (r) => r.working_pattern], ["Closes", (r) => r.closing_at && r.closing_at.slice(0, 10)], ["First seen", (r) => r.first_seen_at && r.first_seen_at.slice(0, 10)], ["Last checked", (r) => r.last_verified_at && r.last_verified_at.slice(0, 10)], ["Advert", (r) => r.source_url]];
    } else if (what === "schools") {
      const setting = ["special", "ap", "mainstream_unit"].includes(req.query.setting) ? req.query.setting : null;
      rows = await pageAll(() => {
        let q = sb.from("send_organisations").select("official_id,nation,name,setting_group,establishment_type,status,la_name,region,town,postcode,website,phone,trust_name,pupils,sen_ehcp,sen_support,resourced_provision_type,open_date,source_ref").eq("org_kind", "school").eq("in_scope", true).order("name");
        if (setting) q = q.eq("setting_group", setting);
        if (["england", "scotland", "wales", "northern_ireland"].includes(req.query.nation)) q = q.eq("nation", req.query.nation);
        if (las.length) q = q.in("la_code", las);
        return q;
      }, MAX);
      lines = [LICENCE.qura, "Sources: Get Information about Schools (Department for Education, England); School contact details (Scottish Government); Address list of schools (Welsh Government); School enrolment school-level data (Department of Education, Northern Ireland). " + LICENCE.ogl, "The Scottish Government asks commercial callers to seek permission from the local authority before contacting schools directly.", "Pupil figures are totals published in official school records. Qura holds no data about individual pupils.", "Exported " + today + "."];
      cols = [["Official ID", (r) => r.official_id], ["Nation", (r) => ({ england: "England", scotland: "Scotland", wales: "Wales", northern_ireland: "Northern Ireland" })[r.nation] || r.nation], ["School", (r) => r.name], ["Setting", (r) => r.setting_group], ["Type", (r) => r.establishment_type], ["Status", (r) => r.status], ["Council", (r) => r.la_name], ["Region", (r) => r.region], ["Town", (r) => r.town], ["Postcode", (r) => r.postcode], ["Website", (r) => r.website], ["Phone", (r) => r.phone], ["Trust", (r) => r.trust_name], ["Pupils", (r) => r.pupils], ["Pupils with an EHC plan", (r) => r.sen_ehcp], ["Pupils on SEN support", (r) => r.sen_support], ["Resourced provision", (r) => r.resourced_provision_type], ["Opens", (r) => r.open_date], ["Official record", (r) => r.source_ref]];
    } else if (what === "tenders") {
      const kind = ["open", "signals", "renewals", "frameworks"].includes(req.query.kind) ? req.query.kind : "open";
      rows = await pageAll(() => {
        let q = sb.from("send_tenders").select("source,nation,stage,title,buyer,category,value_amount,currency,published_at,closing_at,contract_start,contract_end,max_extent,is_framework,is_dps,suppliers,url");
        if (kind === "signals") q = q.eq("stage", "planning").gte("published_at", new Date(Date.now() - 365 * DAY).toISOString());
        else if (kind === "renewals") q = q.eq("stage", "award").gte("contract_end", today).lte("contract_end", iso(Date.now() + 548 * DAY));
        else if (kind === "frameworks") q = q.neq("stage", "planning").or(["is_framework", "is_dps"].flatMap((f) => ["and(" + f + ".eq.true,contract_end.is.null)", "and(" + f + ".eq.true,contract_end.gte." + today + ")"]).join(","));
        else q = q.eq("stage", "tender").or("closing_at.is.null,closing_at.gte." + new Date().toISOString()).gte("published_at", new Date(Date.now() - 120 * DAY).toISOString());
        if (las.length) q = q.in("la_code", las);
        const nation = { england: "England", scotland: "Scotland", wales: "Wales", northern_ireland: "Northern Ireland" }[String(req.query.nation || "")];
        if (nation) q = q.eq("nation", nation);
        return q.order("published_at", { ascending: false });
      }, MAX);
      lines = [LICENCE.qura, "Source: Find a Tender and Contracts Finder (Cabinet Office); Public Contracts Scotland (Scottish Government); Sell2Wales (Welsh Government). " + LICENCE.ogl, kind === "renewals" ? "Contracts ending in the next 18 months: a forecast, since buyers may extend, re-procure early or stop buying." : "Always read the original notice before acting.", "Exported " + today + "."];
      cols = [["Notice", (r) => r.title], ["Stage", (r) => r.stage], ["Buyer", (r) => r.buyer], ["Nation", (r) => r.nation], ["Category", (r) => r.category], ["Value", (r) => r.value_amount], ["Currency", (r) => r.currency], ["Published", (r) => r.published_at && r.published_at.slice(0, 10)], ["Closes", (r) => r.closing_at && r.closing_at.slice(0, 10)], ["Contract start", (r) => r.contract_start], ["Contract end", (r) => r.contract_end], ["Latest end with extensions", (r) => r.max_extent], ["Framework", (r) => (r.is_framework ? "Yes" : "")], ["DPS", (r) => (r.is_dps ? "Yes" : "")], ["Suppliers", (r) => r.suppliers], ["Source", (r) => r.source], ["Link", (r) => r.url]];
    } else if (what === "councils") {
      const { data: current } = await sb.from("send_organisations").select("la_code").eq("org_kind", "local_authority").eq("in_scope", true);
      const live = new Set((current || []).map((c) => c.la_code));
      rows = (await pageAll(() => sb.from("send_council_stats").select("la_code,la_name,ehcp_latest,ehcp_growth_1y,ehcp_growth_5y,ehcp_note,ehcp_special,ehcp_mainstream,ehcp_ap,ehcp_indep_special,requests_latest,requests_growth_1y,pct_20wk,hn_prev,hn_now,hn_growth,safety_valve,sv_year,dbv,dbv_tranche,area_send_outcome,area_send_published,area_send_url").order("la_name"), 500)).filter((r) => !live.size || live.has(r.la_code));
      lines = [LICENCE.qura, "Sources: Department for Education (EHC plans, January 2026); Education and Skills Funding Agency (dedicated schools grant 2026 to 2027, provisional); GOV.UK Safety Valve agreements; DfE Delivering Better Value in SEND grant letter, November 2023. " + LICENCE.ogl, "High needs growth compares 2026 to 2027 with 2025 to 2026, both before import and export adjustments and deductions. Safety Valve means the council has had an agreement, not that one is current.", "Exported " + today + "."];
      cols = [["Council code", (r) => r.la_code], ["Council", (r) => r.la_name], ["EHC plans", (r) => r.ehcp_latest], ["1-year growth %", (r) => r.ehcp_growth_1y], ["5-year growth %", (r) => r.ehcp_growth_5y], ["Data note", (r) => r.ehcp_note], ["In special schools", (r) => r.ehcp_special], ["In mainstream", (r) => r.ehcp_mainstream], ["In alternative provision", (r) => r.ehcp_ap], ["In independent special", (r) => r.ehcp_indep_special], ["Assessment requests", (r) => r.requests_latest], ["Requests 1-year growth %", (r) => r.requests_growth_1y], ["Issued within 20 weeks %", (r) => r.pct_20wk], ["High needs 2025-26 £", (r) => r.hn_prev], ["High needs 2026-27 £", (r) => r.hn_now], ["High needs growth %", (r) => r.hn_growth], ["Safety Valve", (r) => (r.safety_valve ? r.sv_year : "")], ["DBV tranche", (r) => r.dbv_tranche], ["Area SEND inspection outcome", (r) => r.area_send_outcome], ["Area SEND report published", (r) => r.area_send_published], ["Area SEND report", (r) => r.area_send_url]];
    } else return res.status(400).json({ error: "Choose vacancies, schools, tenders or councils" });

    await recordUsage(sb, "exports", 1, 0);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="qura-send-' + what + "-" + today + '.csv"');
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).send("﻿" + toCsv(lines, cols, rows.slice(0, MAX)));
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
