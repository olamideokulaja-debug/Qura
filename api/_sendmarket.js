// SEND Intelligence week 5: shared helpers for council intelligence and SEND tenders.
// Sources (all Open Government Licence v3.0):
//   DfE explore education statistics API (EHC plans), Ofsted state-funded schools management
//   information, ESFA dedicated schools grant allocations, GOV.UK Safety Valve agreements,
//   the DfE Delivering Better Value in SEND grant letter, Find a Tender and Contracts Finder.

// Council names vary between sources ("Metropolitan borough of Bury", "Bury Council",
// "Bury"). This reduces a name to its place so they can be matched to the GIAS council list.
const DROP = /\b(the|of|and|council|county|city|borough|metropolitan|district|london|royal|unitary|authority|mbc|cc|bc|lbc|lb|corporation|government|local)\b/g;
export function placeKey(name) {
  return String(name || "").toLowerCase()
    .replace(/&/g, " and ").replace(/['’.]/g, "")
    .replace(/[-\s,]+(upon|on)[-\s]+/g, " on ")
    .replace(/kingston on hull|hull city/g, "kingston on hull")
    .replace(/^hull$/, "kingston on hull")
    .replace(/[^a-z ]+/g, " ").replace(DROP, " ").replace(/\s+/g, " ").trim();
}
// Some places need a nudge: the GIAS name and the everyday name differ.
const ALIAS = {
  "hull": "kingston on hull", "kingston upon hull": "kingston on hull", "bristol": "bristol", "doncaster": "doncaster",
  "bournemouth christchurch poole": "bournemouth christchurch poole", "bcp": "bournemouth christchurch poole",
  "windsor maidenhead": "windsor maidenhead", "westmoreland furness": "westmorland furness", "westmorland furness": "westmorland furness",
  "herefordshire": "herefordshire", "durham": "county durham", "county durham": "county durham",
  "stoke": "stoke on trent", "southend": "southend on sea", "telford": "telford wrekin", "telford wrekin": "telford wrekin",
};
export function laMatcher(las) {
  const byKey = new Map();
  for (const l of las) {
    const k = placeKey(l.name);
    byKey.set(k, l.code);
    if (k === "durham") byKey.set("county durham", l.code);
    if (k === "kingston on hull") byKey.set("hull", l.code);
    if (k === "bristol") byKey.set("bristol", l.code);
  }
  return (name) => {
    let k = placeKey(name);
    if (ALIAS[k]) k = ALIAS[k];
    if (byKey.has(k)) return byKey.get(k);
    // Buyer names often carry a department ("Surrey County Council - Children's Services")
    const first = placeKey(String(name || "").split(/ [-–|(] |,/)[0]);
    if (byKey.has(ALIAS[first] || first)) return byKey.get(ALIAS[first] || first);
    // "Suffolk County Council Passenger Transport": keep the words up to "Council"
    const upTo = String(name || "").match(/^(.*?\bcouncil)\b/i);
    if (upTo) { const k2 = placeKey(upTo[1]); if (byKey.has(ALIAS[k2] || k2)) return byKey.get(ALIAS[k2] || k2); }
    return null;
  };
}

// Delivering Better Value in SEND grant recipients, tranches 1 and 2, as listed in Annex A of the
// DfE grant determination letter of 28 November 2023:
// https://www.gov.uk/government/publications/delivering-better-value-in-send-implementation-plans-grant-determination-letter
export const DBV_URL = "https://assets.publishing.service.gov.uk/media/6565b5d61524e60011a1019e/6953_DBV_Grant_Determination_Letter_Nov_2023.pdf";
export const DBV = {
  "1": ["Bournemouth, Christchurch and Poole", "Bracknell Forest", "Brent", "Bristol", "Cheshire East", "Cumberland", "Doncaster", "Dudley", "Hampshire", "Kensington and Chelsea", "Leicestershire", "North East Lincolnshire", "Oxfordshire", "Solihull", "Somerset", "South Tyneside", "Southampton", "Stockport", "Stockton-on-Tees", "Suffolk", "Westmorland and Furness"],
  "2": ["Central Bedfordshire", "Cornwall", "County Durham", "East Riding of Yorkshire", "Enfield", "Gloucestershire", "Hackney", "Havering", "Kingston upon Hull", "Middlesbrough", "Newham", "Oldham", "Reading", "Redcar and Cleveland", "Rochdale", "Rutland", "Sefton", "Swindon", "Tameside", "West Sussex", "Windsor and Maidenhead", "Worcestershire"],
};

// ----- SEND tenders -----
// Acronyms only count in capitals ("SEND", "SEN"), or "send away test" and "sent" creep in.
const ACRONYM = /\b(SEND|SEN|SEMH|ALN|ASN|EHCPs?|SENDIASS?|SENCOs?|PRUs?)\b/;
const PHRASE = /\b(special educational needs?|alternative provision|education,? health and care (plans?|needs)|special schools?|independent (non-maintained )?special|non-maintained special|resourced provision|specialist provision|high needs|post-?16 specialist|additional learning needs|additional support needs)\b/i;
// Therapy and psychology count when the notice is about children or schools.
const CHILD_WORK = /\b(speech (and|&) language|occupational therap\w*|physiotherap\w*|educational psycholog\w*|psycholog\w*|autis\w*|neurodevelopment\w*|ADHD|sensory|tuition|tutoring|teaching assistants?|learning support)\b/i;
const CHILD_CONTEXT = /\b(child(ren)?|young people|pupils?|schools?|education(al)?|nurser(y|ies)|early years|SEND|SEN|EHC)\b/i;
const NOT_SEND = /\b(send away|sending|data centre|cyber|vehicle parts?)\b/i;
// CPV 80340000 special education services; 80341000 is a sub-code.
const SEND_CPV = /^8034/;

// Returns the matched words (truthy) or null. Strong words in the title count on their own.
// In the description, an acronym or phrase only counts with a second SEND signal, because long
// notices often mention SEN in passing (playground equipment "suitable for SEN pupils").
export function sendRelevant(title, description, cpv) {
  const t = String(title || ""), d = String(description || "");
  if (SEND_CPV.test(String(cpv || ""))) return "cpv " + cpv;
  if (NOT_SEND.test(t) && !PHRASE.test(t)) return null;
  const tA = t.match(ACRONYM), tP = t.match(PHRASE);
  if (tA || tP) return (tA || tP)[0];
  if (CHILD_WORK.test(t) && CHILD_CONTEXT.test(t + " " + d)) return t.match(CHILD_WORK)[0];
  const hits = new Set([...(d.match(new RegExp(ACRONYM.source, "g")) || []), ...((d.match(new RegExp(PHRASE.source, "gi")) || []).map((x) => x.toLowerCase()))]);
  const count = (d.match(new RegExp(ACRONYM.source, "g")) || []).length + (d.match(new RegExp(PHRASE.source, "gi")) || []).length;
  if (count >= 2 && (hits.size >= 2 || count >= 3)) return [...hits].join(", ");
  return null;
}

const CATS = [
  ["transport", /\b(transport|travel assistance|passenger|taxi|minibus|escort)\b/i],
  ["therapy", /\b(speech (and|&) language|occupational therap\w*|physiotherap\w*|therap(y|ies|ist)s?|SALT|AAC)\b/i],
  ["psychology", /\b(psycholog\w*|EHC needs assessments?|assessments? for EHC)\b/i],
  ["alternative_provision", /\b(alternative provision|PRUs?|pupil referral)\b/i],
  ["placements", /\b(independent special|non-maintained|placements?|residential|specialist provision|school places)\b/i],
  ["staffing", /\b(staff(ing)?|agency|supply (teachers?|staff)|recruit\w*|workforce|personnel|teaching assistants?|locum)\b/i],
  ["tuition", /\b(tuition|tutor\w*|education other than at school|EOTAS)\b/i],
  ["advice", /\b(SENDIASS?|information,? advice|mediation|advocacy|disagreement resolution)\b/i],
];
export const CATEGORY_LABEL = { transport: "Transport", therapy: "Therapy", psychology: "Psychology and assessment", alternative_provision: "Alternative provision", placements: "Placements and places", staffing: "Staffing", tuition: "Tuition", advice: "Advice and mediation", other: "Other SEND" };
export function sendCategory(title, description, cpv) {
  const t = String(title || ""), all = t + " " + String(description || "");
  if (/^796/.test(String(cpv || ""))) return "staffing";
  for (const [k, re] of CATS) if (re.test(t)) return k;
  for (const [k, re] of CATS) if (re.test(all)) return k;
  // Transport services CPV (60xxxxxx). Surrey publishes each SEND home-to-school
  // route award as its own notice titled just "SEND" (856 of them from October 2023
  // to September 2024, all to taxi and car firms), which otherwise land in "Other".
  if (/^60/.test(String(cpv || ""))) return "transport";
  return "other";
}

const d10 = (v) => { if (!v) return null; const s = String(v).slice(0, 10); return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null; };
const num = (v) => (typeof v === "number" && isFinite(v) && v > 0 ? v : null);

// One OCDS release (Find a Tender or Contracts Finder) to one send_tenders row, or null.
export function tenderRow(rel, source, matchLa) {
  const t = rel.tender || {};
  const cpv = String(((t.classification || {}).id) || "");
  const why = sendRelevant(t.title, t.description, cpv);
  if (!why) return null;
  const tags = (Array.isArray(rel.tag) ? rel.tag : []).map((x) => String(x));
  const stage = tags.some((x) => /award|contract/i.test(x)) ? "award" : tags.some((x) => /planning/i.test(x)) ? "planning" : "tender";
  const lots = Array.isArray(t.lots) ? t.lots : [];
  const awards = Array.isArray(rel.awards) ? rel.awards : [];
  const contracts = Array.isArray(rel.contracts) ? rel.contracts : [];
  const periods = [t.contractPeriod, ...lots.map((l) => l.contractPeriod), ...awards.map((a) => a.contractPeriod), ...contracts.map((c) => c.period)].filter(Boolean);
  const ends = periods.map((p) => d10(p.endDate)).filter(Boolean).sort();
  const starts = periods.map((p) => d10(p.startDate)).filter(Boolean).sort();
  const maxes = periods.map((p) => d10(p.maxExtentDate)).filter(Boolean).sort();
  const value = num((t.value || {}).amount) || num((t.maxValue || {}).amount) || num(awards.reduce((a, x) => a + (((x.value || {}).amount) || 0), 0)) || num(lots.reduce((a, l) => a + (((l.value || {}).amount) || 0), 0));
  const tech = t.techniques || {};
  const text = String(t.title || "") + " " + String(t.description || "");
  const buyer = String(((rel.buyer || {}).name) || "").replace(/\s+/g, " ").trim();
  let url = null;
  if (source === "Find a Tender" && rel.id) url = "https://www.find-tender.service.gov.uk/Notice/" + String(rel.id).trim();
  if (source === "Contracts Finder") { const m = String(rel.ocid || "").match(/^ocds-[a-z0-9]+-(.+)$/i); if (m) url = "https://www.contractsfinder.service.gov.uk/notice/" + m[1]; }
  const suppliers = [...new Set(awards.flatMap((a) => (a.suppliers || []).map((s) => String(s.name || "").trim())).filter(Boolean))].slice(0, 10);
  const closing = (t.tenderPeriod || {}).endDate || null;
  return {
    id: (source === "Find a Tender" ? "fts:" : "cf:") + (rel.ocid || rel.id) + ":" + stage,
    source, ocid: rel.ocid || null, release_id: rel.id || null, stage, notice_tags: tags,
    title: String(t.title || "Untitled notice").slice(0, 300), description: String(t.description || "").replace(/\s+/g, " ").slice(0, 1500),
    buyer: buyer.slice(0, 200) || null, la_code: matchLa ? matchLa(buyer) : null,
    category: sendCategory(t.title, t.description, cpv), cpv: cpv || null,
    value_amount: value, currency: ((t.value || {}).currency) || "GBP",
    published_at: rel.date || null, closing_at: closing && !isNaN(Date.parse(closing)) ? closing : null,
    contract_start: starts[0] || null, contract_end: ends[ends.length - 1] || null, max_extent: maxes[maxes.length - 1] || null,
    is_framework: Boolean(tech.hasFrameworkAgreement) || /\bframework\b/i.test(text),
    is_dps: Boolean(tech.hasDynamicPurchasingSystem) || /\b(dynamic purchasing|DPS)\b/.test(text),
    suppliers, url, match_reason: String(why).slice(0, 120), updated_at: new Date().toISOString(),
  };
}
