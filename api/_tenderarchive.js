// Tender Intelligence Archive (1 October 2026, brief "Tender Snapshot and
// Intelligence Archive", v2, sections 8 and 9).
//
// Healthcare tenders are kept after they close, in two Supabase tables:
//   tenders        one row per tender (id "ft_" + ocid, the same id as the live
//                  feed), the original notice data, and a status:
//                    LIVE      still open for bids
//                    CLOSED    the deadline has passed, no award matched yet
//                    AWARDED   a published award notice has been matched
//                  status_override lets a founder correct it.
//   tender_awards  one row per supplier per award, linked to its tender.
//                  The advertised value lives on the tender and the awarded
//                  value on the award. One never overwrites the other.
//
// Awards are linked to tenders by the procurement identifier (the OCDS ocid),
// which the UK portals keep the same from tender notice to award notice. That
// is the only automatic match, so every automatic link is a confirmed one.
// Anything else would need a founder (match = "manual").
//
// The relevance rules are the same as the live feed's (api/refresh-tenders.js,
// relevant()), without the part that drops awards. They are copied here, not
// shared, so the live feed's code did not have to change. If one changes,
// change both.

export const FTS = "https://www.find-tender.service.gov.uk/api/1.0/ocdsReleasePackages";
export const CF = "https://www.contractsfinder.service.gov.uk/Published/Notices/OCDS/Search";

const CPV_PERSONNEL = ["796"];
const CPV_HEALTH_SERVICES = ["85", "7512"];
const BUYER_PATTERNS = /\b(nhs|health board|healthcare|integrated care|hospital|hospice|ambulance|icb)\b/i;
const INDEPENDENT_HEALTH = /\b(spire|nuffield|circle health|hca healthcare|ramsay|bmi healthcare|practice plus|inhealth|alliance medical|care uk|bupa|priory|cygnet|elysium|st andrew'?s healthcare|benenden|king edward vii|london clinic|cleveland clinic|medicare|vita health|totally plc|medinet)\b/i;
const NOT_HEALTH_BUYER = /\b(county council|city council|borough council|district council|parish council|\bcouncil\b|police|fire and rescue|university of|college|academy trust|school|housing association|bip solutions|ministry of defence|home office|dwp|hmrc)\b/i;
const COUNCIL_BUYER = /\b(council|combined authority|scotland excel)\b/i;
const NEVER_BUYER = /\b(police|fire and rescue|university of|college|academy trust|school|housing association|bip solutions|ministry of defence|home office|dwp|hmrc)\b/i;
const CPV_COUNCIL_OK = ["851", "796"];
const COUNCIL_HEALTH_WORDS = /\b(health|substance|drugs?|alcohol|addiction|harm reduction|recovery|mental|psycholog\w*|therap\w*|nurs(e|es|ing)|clinical|care at home|home care|domiciliary|reablement|care workers?|agency workers|staffing|hospice|dementia)\b/i;
const NOT_CARE_WORK = /\b(early learning|childcare|nursery|school|education|transport|catering)\b/i;
const WORKFORCE_WORDS = /\b(staffing|locum|bank staff|agency staff|workforce|recruit\w*|nursing|nurses?|clinician\w*|insourc\w*|outsourc\w*|waiting list|radiograph\w*|sonograph\w*|endoscop\w*|theatre lists?|consultant\w*|physiotherap\w*|psychiatr\w*|dental|general practice|community health|domiciliary|care staff|allied health)\b/i;

function councilHealthNotice(buyer, cpv, title) {
  const b = String(buyer || ""), c = String(cpv || "");
  if (!COUNCIL_BUYER.test(b) || NEVER_BUYER.test(b)) return false;
  if (CPV_COUNCIL_OK.some((p) => c.startsWith(p))) return true;
  const t = String(title || "");
  return c.startsWith("85") && COUNCIL_HEALTH_WORDS.test(t) && !NOT_CARE_WORK.test(t);
}
function healthBuyer(name) {
  const b = String(name || "");
  if (NOT_HEALTH_BUYER.test(b)) return false;
  return BUYER_PATTERNS.test(b) || INDEPENDENT_HEALTH.test(b);
}
export function relevant(rel) {
  const t = rel.tender || {};
  if (t.mainProcurementCategory === "goods") return false;
  const buyer = (rel.buyer || {}).name || "";
  const cpv = String((t.classification || {}).id || "");
  if (!healthBuyer(buyer)) return councilHealthNotice(buyer, cpv, t.title);
  if (CPV_PERSONNEL.some((p) => cpv.startsWith(p))) return true;
  if (CPV_HEALTH_SERVICES.some((p) => cpv.startsWith(p))) return true;
  return WORKFORCE_WORDS.test((t.title || "") + " " + (t.description || ""));
}

// ------------------------------------------------------------ shaping
export const normKey = (s) => String(s || "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").replace(/\b(the|ltd|limited|plc|llp)\b/g, " ").replace(/\s+/g, " ").trim();
const day = (v) => { const s = String(v || "").slice(0, 10); return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null; };
const ts = (v) => (v && !isNaN(Date.parse(v)) ? new Date(v).toISOString() : null);
const num = (v) => (v != null && v !== "" && isFinite(Number(v)) ? Number(v) : null);
const pick = (o, keys) => { const out = {}; for (const k of keys) if (o && o[k] != null) out[k] = o[k]; return out; };

export function noticeUrl(rel, source) {
  if (source === "Find a Tender") { const id = String(rel.id || "").trim(); return id ? "https://www.find-tender.service.gov.uk/Notice/" + id : null; }
  const m = String(rel.ocid || "").match(/^ocds-[a-z0-9]+-(.+)$/i);
  return m ? "https://www.contractsfinder.service.gov.uk/notice/" + m[1] : null;
}
const sourceNoticeId = (rel, source) => (source === "Find a Tender" ? String(rel.id || "") : (String(rel.ocid || "").match(/^ocds-[a-z0-9]+-(.+)$/i) || [])[1] || null);

function region(rel) {
  for (const p of rel.parties || []) { const loc = (p.address || {}).locality; if (loc) return loc; }
  return "UK";
}

// The full notice, kept for Tender Snapshot and the record page.
export function compactDetail(rel, source) {
  const t = rel.tender || {};
  const tender = pick(t, ["title", "description", "status", "classification", "mainProcurementCategory", "value", "minValue",
    "procurementMethod", "procurementMethodDetails", "procurementMethodRationale", "techniques", "submissionMethodDetails",
    "selectionCriteria", "awardCriteria", "awardCriteriaDetails", "eligibilityCriteria", "otherRequirements", "submissionTerms",
    "tenderPeriod", "enquiryPeriod", "contractPeriod", "awardPeriod", "coveredBy", "hasRecurrence", "recurrence", "hasRenewal", "renewal"]);
  tender.lots = (t.lots || []).slice(0, 30).map((l) => pick(l, ["id", "title", "description", "value", "contractPeriod", "awardCriteria", "hasRenewal", "renewal", "hasOptions", "options", "status"]));
  tender.items = (t.items || []).slice(0, 20).map((i) => ({ classification: (i.classification || {}).description, deliveryAddresses: i.deliveryAddresses, relatedLot: i.relatedLot }));
  tender.documents = (t.documents || []).slice(0, 30).map((d) => pick(d, ["id", "documentType", "title", "description", "url", "format", "datePublished"]));
  const out = { ocid: rel.ocid, releaseId: rel.id, date: rel.date, source, buyer: (rel.buyer || {}).name, tender };
  if (JSON.stringify(out).length > 60000) { out.tender.items = []; out.tender.description = String(out.tender.description || "").slice(0, 8000); }
  return out;
}

function extensionText(t) {
  const bits = [];
  for (const l of [t, ...(t.lots || [])]) {
    const r = l && l.renewal;
    if (r && (r.description || r.maximumRenewals)) bits.push((l.title ? l.title + ": " : "") + (r.description || r.maximumRenewals + " renewals"));
    if (l && l.options && l.options.description) bits.push((l.title ? l.title + ": " : "") + l.options.description);
  }
  return bits.length ? bits.join(" | ").slice(0, 600) : null;
}

export function tenderRow(rel, source, isAward) {
  const t = rel.tender || {};
  const buyer = ((rel.buyer || {}).name || "").replace(/\s+/g, " ").trim() || null;
  const buyerId = (rel.buyer || {}).id || null;
  const cp = t.contractPeriod || {};
  const closing = ts((t.tenderPeriod || {}).endDate);
  const value = t.value || {};
  return {
    id: "ft_" + rel.ocid, ocid: rel.ocid, source, source_notice_id: sourceNoticeId(rel, source), source_url: noticeUrl(rel, source),
    title: String(t.title || "Untitled notice").slice(0, 300), description: String(t.description || "").slice(0, 4000) || null,
    buyer, buyer_id: buyerId, buyer_key: buyerId ? "id:" + buyerId : (buyer ? "n:" + normKey(buyer) : null),
    category: (t.classification || {}).description || null, cpv: (t.classification || {}).id || null, region: region(rel),
    published_at: ts(rel.date), opening_date: day((t.tenderPeriod || {}).startDate) || day(rel.date), closing_date: closing,
    advertised_value: num(value.amount), advertised_value_max: num((t.maxValue || {}).amount), currency: value.currency || (t.minValue || {}).currency || null,
    contract_start: day(cp.startDate), contract_end: day(cp.endDate), duration_days: num(cp.durationInDays),
    extension_options: extensionText(t),
    lots: (t.lots || []).slice(0, 30).map((l) => ({ id: l.id, title: l.title || null, value: num((l.value || {}).amount) })),
    procurement_route: t.procurementMethodDetails || t.procurementMethod || null,
    status: isAward ? "AWARDED" : closing && Date.parse(closing) < Date.now() ? "CLOSED" : "LIVE",
    detail: isAward ? null : compactDetail(rel, source),
    updated_at: new Date().toISOString(),
  };
}

// One row per supplier per active award.
export function awardRows(rel, source) {
  const out = [];
  const contracts = rel.contracts || [];
  for (const a of rel.awards || []) {
    if (a.status && !/active|pending/i.test(a.status)) continue;
    const c = contracts.find((x) => x.awardID === a.id) || {};
    const value = (a.value && a.value.amount != null ? a.value : c.value) || {};
    const period = a.contractPeriod || c.period || {};
    const doc = (a.documents || []).find((d) => d && d.url);
    const suppliers = (a.suppliers || []).length ? a.suppliers : [{ name: null, id: null }];
    suppliers.forEach((s, i) => {
      out.push({
        id: (source === "Find a Tender" ? "fts:" : "cf:") + a.id + (suppliers.length > 1 ? "#" + i : ""),
        tender_id: "ft_" + rel.ocid, ocid: rel.ocid, lot_id: (a.relatedLots || [])[0] || null,
        supplier_name: s.name || null, supplier_id: s.id || null, supplier_key: s.id ? "id:" + s.id : (s.name ? "n:" + normKey(s.name) : null),
        award_date: day(a.date) || day(c.dateSigned) || day(rel.date), awarded_value: num(value.amount), currency: value.currency || null,
        contract_start: day(period.startDate), contract_end: day(period.endDate),
        award_source_url: (doc && doc.url) || noticeUrl(rel, source), match: "ocid", confirmed: true,
      });
    });
  }
  return out;
}

// ------------------------------------------------------------ intelligence
// Likely reprocurement window: only from a verified contract end date (from an
// award, or from the tender's own contract period plus a published award), and
// always labelled as a Qura estimate. Extension options make the end uncertain,
// so the window says so rather than guessing which way it will go.
export function reprocurementEstimate(tender, awards) {
  const confirmed = (awards || []).filter((a) => a.confirmed !== false);
  let end = null, basis = null;
  const awardEnd = confirmed.map((a) => a.contract_end).filter(Boolean).sort().pop();
  if (awardEnd) { end = awardEnd; basis = "contract end date in the award notice"; }
  else if (confirmed.length && tender.contract_end) { end = tender.contract_end; basis = "contract end date in the original tender notice"; }
  else if (confirmed.length && tender.duration_days) {
    const start = confirmed.map((a) => a.contract_start || a.award_date).filter(Boolean).sort()[0];
    if (start) { const d = new Date(start); d.setUTCDate(d.getUTCDate() + Number(tender.duration_days)); end = d.toISOString().slice(0, 10); basis = "award date plus the contract duration in the tender notice"; }
  }
  if (!end) return null;
  const e = new Date(end);
  const from = new Date(e); from.setUTCMonth(from.getUTCMonth() - 12);
  const to = new Date(e); to.setUTCMonth(to.getUTCMonth() - 4);
  return {
    estimated: true, contractEnd: end, windowFrom: from.toISOString().slice(0, 10), windowTo: to.toISOString().slice(0, 10), basis,
    caveat: (tender.extension_options ? "The contract has extension options, so it may run longer. " : "") +
      "Qura estimate: buyers usually go back to market 4 to 12 months before a contract ends. This is not a confirmed tender date.",
  };
}
