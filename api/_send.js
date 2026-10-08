// SEND Intelligence: shared helpers (week 1, 8 October 2026).
// SEND data lives in its own tables (send_*), so nothing here touches the
// healthcare tables or jobs. All reads and writes go through the service role;
// every send_* table has row level security switched on with no policies.
import { sbAdmin } from "./_opps.js";
import { getUser } from "./_auth.js";
import { owners } from "./_waitlist.js";
import { kvGet, kvSet } from "./_auth.js";

export { sbAdmin };

// ---------- GIAS (England) ----------
// Official bulk download, Open Government Licence v3.0. Never scrape the GIAS
// website itself (its acceptable use policy forbids it); use this file only.
export const GIAS_URL = (ymd) => "https://ea-edubase-api-prod.azurewebsites.net/edubase/downloads/public/edubasealldata" + ymd + ".csv";

const SPECIAL = new Set(["Other independent special school", "Community special school", "Academy special converter", "Free schools special", "Academy special sponsor led", "Foundation special school", "Non-maintained special school", "Special post 16 institution"]);
const AP = new Set(["Pupil referral unit", "Academy alternative provision converter", "Free schools alternative provision", "Academy alternative provision sponsor led"]);
const UNIT_TYPES = new Set(["Resourced provision", "SEN unit", "Resourced provision and SEN unit"]);
const LIVE_STATUS = new Set(["Open", "Open, but proposed to close", "Proposed to open"]);

export function settingGroup(row) {
  const t = row["TypeOfEstablishment (name)"];
  if (t === "Welsh establishment") return null;
  if (SPECIAL.has(t)) return "special";
  if (AP.has(t)) return "ap";
  if (UNIT_TYPES.has(row["TypeOfResourcedProvision (name)"])) return "mainstream_unit";
  return null;
}
export const inScope = (row) => LIVE_STATUS.has(row["EstablishmentStatus (name)"]) && !!settingGroup(row);

// Minimal CSV parser (quoted fields, doubled quotes, CRLF).
export function parseCsv(text) {
  const rows = []; let row = []; let f = ""; let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; }
      else f += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(f); f = ""; }
    else if (c === "\n") { row.push(f); rows.push(row); row = []; f = ""; }
    else if (c !== "\r") f += c;
  }
  if (f.length || row.length) { row.push(f); rows.push(row); }
  return rows;
}

const int = (v) => { const n = parseInt(String(v || "").replace(/[^0-9-]/g, ""), 10); return Number.isFinite(n) ? n : null; };
const txt = (v) => { const s = String(v == null ? "" : v).trim(); return s && s !== "Not applicable" ? s : null; };
// GIAS dates are dd-mm-yyyy
const date = (v) => { const m = String(v || "").match(/^(\d{2})-(\d{2})-(\d{4})/); return m ? m[3] + "-" + m[2] + "-" + m[1] : null; };
export const website = (v) => { let s = txt(v); if (!s) return null; s = s.replace(/\s+/g, ""); if (!/^https?:\/\//i.test(s)) s = "https://" + s; try { const u = new URL(s); return u.origin + (u.pathname === "/" ? "" : u.pathname); } catch (e) { return null; } };
// Independent schools can be owned by a private individual. Their name is personal
// data, so Qura keeps only company and charity proprietors.
export const personName = (s) => /^(mr|mrs|ms|miss|dr|prof|rev)\b\.?/i.test(String(s || "").trim());
export const slug = (s) => String(s || "").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

export function schoolRecord(r, seenAt) {
  const sen = [];
  for (let i = 1; i <= 13; i++) { const v = txt(r["SEN" + i + " (name)"]); if (v) sen.push(v); }
  const head = [txt(r["HeadTitle (name)"]), txt(r["HeadFirstName"]), txt(r["HeadLastName"])].filter(Boolean).join(" ") || null;
  return {
    nation: "england", org_kind: "school", official_id: String(r.URN), name: txt(r.EstablishmentName) || "Unnamed",
    status: txt(r["EstablishmentStatus (name)"]), in_scope: true, setting_group: settingGroup(r),
    establishment_type: txt(r["TypeOfEstablishment (name)"]), phase: txt(r["PhaseOfEducation (name)"]),
    age_low: int(r.StatutoryLowAge), age_high: int(r.StatutoryHighAge),
    street: txt(r.Street), locality: txt(r.Locality), town: txt(r.Town), county: txt(r["County (name)"]), postcode: txt(r.Postcode),
    la_code: txt(r["LA (code)"]), la_name: txt(r["LA (name)"]), region: txt(r["GOR (name)"]),
    website: website(r.SchoolWebsite), phone: txt(r.TelephoneNum),
    head_name: head, head_job_title: txt(r.HeadPreferredJobTitle),
    trust_code: txt(r["Trusts (code)"]), trust_name: txt(r["Trusts (name)"]), proprietor_name: personName(r.PropsName) ? null : txt(r.PropsName),
    sen_provision: sen.length ? sen : null, resourced_provision_type: txt(r["TypeOfResourcedProvision (name)"]),
    rp_capacity: int(r.ResourcedProvisionCapacity), rp_on_roll: int(r.ResourcedProvisionOnRoll),
    unit_capacity: int(r.SenUnitCapacity), unit_on_roll: int(r.SenUnitOnRoll),
    pupils: int(r.NumberOfPupils), capacity: int(r.SchoolCapacity), sen_ehcp: int(r.SENStat), sen_support: int(r.SENNoStat),
    open_date: date(r.OpenDate), close_date: date(r.CloseDate), last_inspection: date(r.DateOfLastInspectionVisit),
    easting: int(r.Easting), northing: int(r.Northing),
    source: "gias", source_ref: "https://get-information-schools.service.gov.uk/Establishments/Establishment/Details/" + r.URN,
    last_seen_at: seenAt, last_verified_at: seenAt,
  };
}

// ---------- Access ----------
// Founders always; otherwise an active SEND entitlement (supplier_sector_entitlements).
export async function sendAccess(req) {
  const user = await getUser(req);
  if (!user || user._preview) return { user: null, ok: false };
  const email = String(user.email || "").toLowerCase();
  if (owners().includes(email)) return { user, ok: true, founder: true };
  const sb = sbAdmin(); if (!sb) return { user, ok: false };
  const { data } = await sb.from("supplier_sector_entitlements").select("status,expires_at").eq("user_id", user.id).eq("sector_code", "SEND").maybeSingle();
  const live = data && (data.status === "active" || data.status === "pilot") && (!data.expires_at || new Date(data.expires_at) > new Date());
  return { user, ok: !!live, founder: false };
}

// ---------- Cost guard (daily AI and crawl spend cut-off) ----------
// Default ceiling 500p a day (about £150 a month). Founders can change it in
// kv shared/send_budget { dailyPence }.
export async function budgetLeft(sb) {
  const cfg = (await kvGet("shared", "send_budget")) || {};
  const cap = Number(cfg.dailyPence) > 0 ? Number(cfg.dailyPence) : 500;
  const day = new Date().toISOString().slice(0, 10);
  const { data } = await sb.from("send_usage_daily").select("cost_pence").eq("day", day);
  const spent = (data || []).reduce((a, r) => a + Number(r.cost_pence || 0), 0);
  return { cap, spent, left: cap - spent, stop: spent >= cap };
}
export async function recordUsage(sb, kind, units, pence) {
  const day = new Date().toISOString().slice(0, 10);
  const { data } = await sb.from("send_usage_daily").select("units,cost_pence").eq("day", day).eq("kind", kind).maybeSingle();
  await sb.from("send_usage_daily").upsert({ day, kind, units: Number((data && data.units) || 0) + units, cost_pence: Number((data && data.cost_pence) || 0) + pence }, { onConflict: "day,kind" });
}

export { kvGet, kvSet };
