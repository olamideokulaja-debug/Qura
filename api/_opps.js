// Qura Opportunity Engine (2 October 2026): shared helpers.
//
// Two kinds of opportunity reach a clinician:
//   Qura Direct    roles posted on Qura by a checked organisation
//                  (kv shared/demand_posted, api/demand.js). Apply on Qura.
//   Qura Discover  live healthcare vacancies Qura finds on approved public
//                  sources, stored in the `opportunities` table. Always labelled
//                  "Discovered by Qura", always name the source, always link to
//                  the original advert. Qura never says the employer posted on
//                  Qura unless they have claimed the listing.
//
// Sources (each one is a connector below; adding one does not touch the rest):
//   nhsjobs  NHS Jobs Self-Serve Job Adverts API (search_xml). Public, no key.
//            NHSBSA documents it as intended for developers who want to embed
//            results "or make use of the data in some other way". Only the
//            short description NHS Jobs itself returns is stored, never the
//            full advert. LIVE.
//   adzuna   Adzuna jobs API. Needs ADZUNA_APP_ID and ADZUNA_APP_KEY, and
//            Adzuna's terms allow commercial use only under a licence after a
//            14-day trial; every listing must show "Jobs by Adzuna". OFF until
//            the keys are set and the licence is in place.
//   reed     Reed.co.uk Jobseeker API. Needs REED_API_KEY; Reed's terms of use
//            for the API still need confirming. OFF until the key is set.
//
// Nothing is invented: a field the source does not give stays empty.

import { createClient } from "@supabase/supabase-js";

export const UA = "QuraOpportunityBot/1.0 (+https://www.qurahealth.org)";

export function sbAdmin() {
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

const low = (v) => String(v == null ? "" : v).toLowerCase();
const clean = (v, n = 300) => String(v == null ? "" : v).replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ")
  .replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/\\'/g, "'").replace(/\s+/g, " ").trim().slice(0, n);

// ------------------------------------------------------------------ taxonomy
// Order matters: the first match wins, so narrower titles come before the
// broad ones they would otherwise fall into (a research nurse is research, a
// therapeutic radiographer is not a diagnostic one).
export const TAXONOMY = [
  { family: "clinical research", profession: "Clinical Research", re: /clinical research|research (nurse|practitioner|associate|coordinator|co-ordinator|midwife|radiographer|physiotherapist|assistant|facilitator|manager|delivery)|clinical trials?\b|\bcra\b|trials? (coordinator|co-ordinator|practitioner|associate|manager)/,
    related: ["Clinical Research Associate", "Clinical Trials Associate", "Clinical Research Coordinator", "Research Practitioner", "Research Nurse", "Senior Clinical Research Associate"] },
  { family: "sonographer", profession: "Sonographer", re: /sonograph|ultrasound/, related: ["Sonographer", "Trainee Sonographer", "Advanced Practitioner Sonographer", "Obstetric Sonographer", "MSK Sonographer"] },
  { family: "therapeutic radiographer", profession: "Therapeutic Radiographer", re: /therapeutic radiograph|radiotherap/, related: ["Therapeutic Radiographer", "Radiotherapy Radiographer", "Treatment Radiographer"] },
  { family: "nuclear medicine", profession: "Nuclear Medicine", re: /nuclear medicine|\bpet[- ]?ct\b/, related: ["Nuclear Medicine Technologist", "PET-CT Radiographer"] },
  { family: "radiographer", profession: "Diagnostic Radiographer", re: /radiograph|mammograph|\bmri\b|\bct\b|x-?ray|imaging (assistant|practitioner)|cardiac cath/, related: ["Diagnostic Radiographer", "MRI Radiographer", "CT Radiographer", "Mammographer", "Assistant Practitioner Radiography"] },
  { family: "echocardiograph", profession: "Cardiac Physiologist", re: /echocardiograph|cardiac physiolog|cardiorespiratory|physiological scien|cardiac scien/, related: ["Echocardiographer", "Cardiac Physiologist", "Healthcare Science Practitioner"] },
  { family: "physiotherap", profession: "Physiotherapist", re: /physio/, related: ["Physiotherapist", "MSK Physiotherapist", "Rotational Physiotherapist", "Physiotherapy Assistant"] },
  { family: "occupational therap", profession: "Occupational Therapist", re: /occupational therap/, related: ["Occupational Therapist", "Community Occupational Therapist", "OT Assistant"] },
  { family: "speech", profession: "Speech and Language Therapist", re: /speech (and|&) language|\bslt\b|\bsalt\b/, related: ["Speech and Language Therapist", "SLT Assistant"] },
  { family: "podiatr", profession: "Podiatrist", re: /podiatr/, related: ["Podiatrist", "Podiatry Assistant"] },
  { family: "dietitian", profession: "Dietitian", re: /dietit|dietic/, related: ["Dietitian", "Dietetic Assistant"] },
  { family: "paramedic", profession: "Paramedic", re: /paramedic/, related: ["Paramedic", "Specialist Paramedic", "Emergency Care Assistant"] },
  { family: "operating department", profession: "Operating Department Practitioner", re: /operating department|\bodp\b|anaesthetic practitioner|scrub practitioner|theatre practitioner/, related: ["Operating Department Practitioner", "Theatre Practitioner", "Anaesthetic Practitioner"] },
  { family: "orthoptist", profession: "Orthoptist", re: /orthoptist/, related: ["Orthoptist"] },
  { family: "prosthetist", profession: "Prosthetist / Orthotist", re: /prosthetist|orthotist/, related: ["Prosthetist", "Orthotist"] },
  { family: "psycholog", profession: "Psychologist", re: /psycholog|cbt therapist|psychotherap|counsell?or|wellbeing practitioner/, related: ["Clinical Psychologist", "Psychological Wellbeing Practitioner", "CBT Therapist"] },
  { family: "pharmacy technician", profession: "Pharmacy Technician", re: /pharmacy technician|pharmacy assistant/, related: ["Pharmacy Technician", "Pharmacy Assistant"] },
  { family: "pharmacist", profession: "Pharmacist", re: /pharmacist/, related: ["Pharmacist", "Clinical Pharmacist", "Specialist Pharmacist"] },
  { family: "biomedical scientist", profession: "Biomedical Scientist", re: /biomedical scien|medical laboratory|laboratory assistant|phlebotom/, related: ["Biomedical Scientist", "Medical Laboratory Assistant", "Associate Practitioner (Pathology)"] },
  { family: "audiolog", profession: "Audiologist", re: /audiolog|hearing/, related: ["Audiologist", "Associate Audiologist"] },
  { family: "clinical scientist", profession: "Clinical Scientist", re: /clinical scien|healthcare scien|genomic|clinical physiolog|neurophysiolog|respiratory physiolog|medical physic|perfusion/, related: ["Clinical Scientist", "Healthcare Science Practitioner", "Genomic Scientist"] },
  { family: "midwife", profession: "Midwife", re: /midwi/, related: ["Midwife", "Community Midwife", "Specialist Midwife"] },
  { family: "nursing associate", profession: "Nursing Associate / Healthcare Assistant", re: /nursing associate|healthcare assistant|health care assistant|\bhca\b|support worker|nursing assistant|care assistant|assistant practitioner/, related: ["Healthcare Assistant", "Nursing Associate", "Clinical Support Worker"] },
  { family: "nurse", profession: "Nurse", re: /nurse|nursing|\brgn\b|\brmn\b|ward sister|ward manager|matron/, related: ["Staff Nurse", "Registered Nurse", "Community Nurse", "Mental Health Nurse", "Theatre Nurse"] },
  { family: "dental", profession: "Dental", re: /dental|dentist|orthodont|hygienist/, related: ["Dentist", "Dental Nurse", "Dental Hygienist"] },
  { family: "doctor", profession: "Doctor", re: /consultant|registrar|doctor|specialty (doctor|grade)|\bst[1-8]\b|\bfy[12]\b|physician|surgeon|psychiatrist|anaesthetist|radiologist|general practitioner|\bgp\b|clinical fellow|resident doctor/, related: ["Consultant", "Specialty Doctor", "Clinical Fellow", "Registrar"] },
];

export function classify(title, staffGroup) {
  const t = low(title);
  for (const x of TAXONOMY) if (x.re.test(t)) return x;
  return null;
}
// The family of a clinician's own profession, or a typed search term.
export function familyOf(text) { const x = classify(text); return x ? x.family : ""; }
export function relatedFor(text) {
  const x = classify(text);
  return x ? x.related.filter((r) => low(r) !== low(text)).slice(0, 5) : [];
}

export const normTitle = (t) => low(t).replace(/\(.*?\)/g, " ").replace(/[^a-z0-9 ]+/g, " ").replace(/\b(band|grade)\s*\d+[a-d]?\b/g, " ").replace(/\s+/g, " ").trim();
const normEmp = (e) => low(e).replace(/\b(nhs|foundation|trust|university|hospitals?|the|and|of)\b/g, " ").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
export function dedupeKey(r) {
  const pc = String(r.postcode || "").toUpperCase().split(" ")[0];
  return [normTitle(r.title), normEmp(r.employer), pc || low(r.city), r.closing_date || ""].join("|");
}

export function money(n) {
  const v = Number(String(n).replace(/[^0-9.]/g, ""));
  return isFinite(v) && v > 0 ? Math.round(v) : null;
}
// "£49387.00 to £56515.00" or "£24.50 an hour" -> min, max, period.
export function parseSalary(text) {
  const s = String(text || "");
  const nums = (s.match(/£\s?[\d,]+(?:\.\d+)?/g) || []).map(money).filter((x) => x != null);
  if (!nums.length) return { min: null, max: null, period: null };
  const hourly = /hour|ph\b|p\/h/i.test(s) || nums[0] < 200;
  const daily = /day|per diem/i.test(s) || (!hourly && nums[0] < 2000);
  return { min: nums[0], max: nums[1] || null, period: hourly ? "hour" : daily ? "day" : "year" };
}

const TYPE_MAP = [[/perman/i, "permanent"], [/fixed|second|training|apprentice|temporary|contract/i, "fixed_term"], [/locum|bank|reservist/i, "locum_bank"]];
export function employmentTypeOf(text) {
  for (const [re, k] of TYPE_MAP) if (re.test(String(text || ""))) return k;
  return null;
}

// ------------------------------------------------------------------ connectors
async function fetchText(url, headers = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 25000);
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { "User-Agent": UA, ...headers } });
    if (!r.ok) return { ok: false, status: r.status, text: "" };
    return { ok: true, status: r.status, text: await r.text() };
  } catch (e) { return { ok: false, status: 0, text: "" }; } finally { clearTimeout(timer); }
}

const tag = (xml, name) => { const m = xml.match(new RegExp("<" + name + ">([\\s\\S]*?)</" + name + ">")); return m ? m[1] : ""; };

// NHS Jobs: the clinical staff groups only. Administrative and estates roles
// are left out because Qura is for clinicians.
export const NHS_GROUPS = ["ALLIED_HEALTH_PROF", "NURSING_AND_MIDWIFERY_REGD", "MEDICAL_AND_DENTAL", "HEALTHCARE_SCIENTISTS", "PROF_SCIENTIFIC_AND_TECHNICAL", "CLINICAL_SERVICES"];
export const NHS_BASE = "https://www.jobs.nhs.uk/api/v1/search_xml";

export async function nhsPage(group, page, limit = 100) {
  const url = NHS_BASE + "?staffGroup=" + group + "&sort=publicationDateDesc&limit=" + limit + "&page=" + page;
  const r = await fetchText(url, { Accept: "application/xml" });
  if (!r.ok) return null;
  const xml = r.text;
  const items = (xml.match(/<vacancyDetails>[\s\S]*?<\/vacancyDetails>/g) || []).map((v) => ({
    id: clean(tag(v, "id"), 40), reference: clean(tag(v, "reference"), 60), title: clean(tag(v, "title"), 200),
    description: clean(tag(v, "description"), 400), employer: clean(tag(v, "employer"), 200), type: clean(tag(v, "type"), 60),
    salary: clean(tag(v, "salary"), 120), closeDate: clean(tag(v, "closeDate"), 20), postDate: clean(tag(v, "postDate"), 40),
    url: clean(tag(v, "url"), 300), locations: (v.match(/<location>([\s\S]*?)<\/location>/g) || []).map((l) => clean(l, 120)).slice(0, 6),
  }));
  return { items, totalPages: Number(tag(xml, "totalPages")) || 0, totalResults: Number(tag(xml, "totalResults")) || 0 };
}

export function nhsRow(v, group, now) {
  const first = v.locations[0] || "";
  const m = first.match(/^(.*?),\s*([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})$/i);
  const pay = parseSalary(v.salary);
  const x = classify(v.title, group);
  const row = {
    id: "nhsjobs:" + v.id, source: "nhsjobs", source_name: "NHS Jobs", external_id: v.id,
    source_url: v.url && /^https:\/\/(beta\.|www\.)?jobs\.nhs\.uk\//.test(v.url) ? v.url : "https://www.jobs.nhs.uk/candidate/jobadvert/" + encodeURIComponent(v.reference),
    attribution: "Source: NHS Jobs", title: v.title, normalised_title: normTitle(v.title), employer: v.employer || null,
    employer_type: /nhs|trust|health board|ambulance|integrated care/i.test(v.employer) ? "NHS" : null,
    profession: x ? x.profession : null, family: x ? x.family : null, staff_group: group, country: "United Kingdom",
    city: m ? m[1] : (first || null), postcode: m ? m[2].toUpperCase() : null, locations: v.locations,
    employment_type: employmentTypeOf(v.type), contract_type: v.type || null, salary_text: v.salary || null,
    salary_min: pay.min, salary_max: pay.max, salary_period: pay.period, currency: pay.min ? "GBP" : null,
    summary: v.description || null, posted_at: v.postDate ? new Date(v.postDate.slice(0, 23) + "Z").toISOString() : null,
    closing_date: /^\d{4}-\d{2}-\d{2}$/.test(v.closeDate) ? v.closeDate : null,
    last_seen: now, last_verified_at: now, status: "LIVE", updated_at: now,
    raw: { reference: v.reference, type: v.type, salary: v.salary },
  };
  if (row.posted_at && isNaN(Date.parse(row.posted_at))) row.posted_at = null;
  row.dedupe_key = dedupeKey(row);
  return row;
}

// Adzuna (off until licensed). Healthcare & Nursing category, UK, newest first.
export const adzunaOn = () => Boolean(process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY);
export async function adzunaPage(page) {
  const url = "https://api.adzuna.com/v1/api/jobs/gb/search/" + page + "?app_id=" + encodeURIComponent(process.env.ADZUNA_APP_ID) +
    "&app_key=" + encodeURIComponent(process.env.ADZUNA_APP_KEY) + "&results_per_page=50&category=healthcare-nursing-jobs&sort_by=date&max_days_old=3&content-type=application/json";
  const r = await fetchText(url, { Accept: "application/json" });
  if (!r.ok) return null;
  try { return JSON.parse(r.text); } catch (e) { return null; }
}
export function adzunaRow(j, now) {
  const x = classify(j.title);
  const area = Array.isArray(j.location && j.location.area) ? j.location.area : [];
  const row = {
    id: "adzuna:" + j.id, source: "adzuna", source_name: "Adzuna", external_id: String(j.id),
    source_url: j.redirect_url, attribution: "Jobs by Adzuna", title: clean(j.title, 200), normalised_title: normTitle(clean(j.title, 200)),
    employer: clean(j.company && j.company.display_name, 200) || null, profession: x ? x.profession : null, family: x ? x.family : null,
    country: "United Kingdom", region: area[1] || null, city: area[area.length - 1] || null, locations: [clean(j.location && j.location.display_name, 120)].filter(Boolean),
    employment_type: j.contract_type === "permanent" ? "permanent" : j.contract_type === "contract" ? "fixed_term" : null,
    contract_type: [j.contract_type, j.contract_time].filter(Boolean).join(", ") || null,
    salary_min: money(j.salary_min), salary_max: money(j.salary_max), salary_period: j.salary_min ? "year" : null, currency: j.salary_min ? "GBP" : null,
    salary_text: null, summary: clean(j.description, 300) || null,
    posted_at: j.created || null, closing_date: null, last_seen: now, last_verified_at: now, status: "LIVE", updated_at: now,
    raw: { category: j.category && j.category.tag },
  };
  // Adzuna's predicted salaries are estimates, not the employer's figure.
  if (j.salary_is_predicted === "1") { row.salary_min = null; row.salary_max = null; row.salary_period = null; row.currency = null; }
  row.dedupe_key = dedupeKey(row);
  return row;
}

// Reed (off until the key is set and terms confirmed).
export const reedOn = () => Boolean(process.env.REED_API_KEY);
export const REED_TERMS = ["nurse", "radiographer", "sonographer", "physiotherapist", "occupational therapist", "midwife", "paramedic", "pharmacist", "clinical research", "biomedical scientist", "speech and language therapist", "operating department practitioner"];
export async function reedPage(keywords, skip) {
  const url = "https://www.reed.co.uk/api/1.0/search?keywords=" + encodeURIComponent(keywords) + "&resultsToTake=100&resultsToSkip=" + skip;
  const auth = "Basic " + Buffer.from(process.env.REED_API_KEY + ":").toString("base64");
  const r = await fetchText(url, { Accept: "application/json", Authorization: auth });
  if (!r.ok) return null;
  try { return JSON.parse(r.text); } catch (e) { return null; }
}
export function reedRow(j, now) {
  const x = classify(j.jobTitle);
  const exp = String(j.expirationDate || "").match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  const posted = String(j.date || "").match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  const row = {
    id: "reed:" + j.jobId, source: "reed", source_name: "reed.co.uk", external_id: String(j.jobId), source_url: j.jobUrl,
    attribution: "Source: reed.co.uk", title: clean(j.jobTitle, 200), normalised_title: normTitle(clean(j.jobTitle, 200)),
    employer: clean(j.employerName, 200) || null, profession: x ? x.profession : null, family: x ? x.family : null,
    country: "United Kingdom", city: clean(j.locationName, 120) || null, locations: [clean(j.locationName, 120)].filter(Boolean),
    salary_min: money(j.minimumSalary), salary_max: money(j.maximumSalary), salary_period: j.minimumSalary ? (Number(j.minimumSalary) < 200 ? "hour" : "year") : null,
    currency: j.minimumSalary ? "GBP" : null, summary: clean(j.jobDescription, 300) || null,
    posted_at: posted ? posted[3] + "-" + posted[2] + "-" + posted[1] + "T00:00:00Z" : null,
    closing_date: exp ? exp[3] + "-" + exp[2] + "-" + exp[1] : null,
    last_seen: now, last_verified_at: now, status: "LIVE", updated_at: now, raw: {},
  };
  row.dedupe_key = dedupeKey(row);
  return row;
}

export const SOURCES = [
  { key: "nhsjobs", name: "NHS Jobs", on: () => true },
  { key: "adzuna", name: "Adzuna", on: adzunaOn },
  { key: "reed", name: "reed.co.uk", on: reedOn },
];

// ------------------------------------------------------------------ for clinicians
export const TYPE_LABEL = { permanent: "Permanent", fixed_term: "Fixed-term", locum_bank: "Locum / Bank", contract_insourcing: "Contract / Insourcing" };

export function payLabel(r) {
  if (!r.salary_min) return r.salary_text || "";
  const f = (n) => "£" + Number(n).toLocaleString("en-GB", { maximumFractionDigits: r.salary_period === "hour" ? 2 : 0 });
  const per = r.salary_period === "hour" ? " an hour" : r.salary_period === "day" ? " a day" : " a year";
  return f(r.salary_min) + (r.salary_max && r.salary_max !== r.salary_min ? " to " + f(r.salary_max) : "") + per;
}

export function daysTo(date) {
  if (!date) return null;
  const t = Date.parse(date + "T23:59:59Z");
  return isFinite(t) ? Math.ceil((t - Date.now()) / 86400000) : null;
}

// A Discover row, shaped like a Direct role so both lists render the same way.
export function asDiscover(r) {
  const d = daysTo(r.closing_date);
  return {
    id: r.id, kind: "discover", role: r.title, employer: r.employer || "Employer not named", country: r.country || "United Kingdom",
    region: [r.city, r.postcode].filter(Boolean).join(", "), market: r.employer_type === "NHS" ? "NHS" : "",
    profession: r.profession || "", employmentType: r.employment_type || "", employmentLabel: TYPE_LABEL[r.employment_type] || r.contract_type || "",
    salaryMin: r.salary_period === "year" ? r.salary_min : null, salaryMax: r.salary_period === "year" ? r.salary_max : null,
    salaryLabel: payLabel(r), rate: payLabel(r), summary: r.summary || "", start: "",
    closes: d == null ? "" : d <= 0 ? "today" : d + (d === 1 ? " day" : " days"), closingDate: r.closing_date,
    postedAt: r.posted_at, source: r.source, sourceName: r.source_name, attribution: r.attribution, sourceUrl: r.source_url,
    label: "Discovered by Qura", claimStatus: r.claim_status, claimedBy: r.claim_status === "CLAIMED" ? r.claimed_by : null,
    seeded: false,
  };
}

// Prefix search on whole words, all words required ("clinical research
// associate" -> clinical:* & research:* & associate:*).
export function tsQuery(q) {
  const words = low(q).match(/[a-z0-9]+/g) || [];
  return words.slice(0, 8).map((w) => w + ":*").join(" & ");
}

// Does an opportunity match a saved alert? Same rules as search: every word
// of the query in the title, profession, employer or place.
export function alertHit(alert, r) {
  const hay = low([r.title, r.profession, r.employer, r.city, r.region, r.postcode].join(" "));
  const words = low(alert.q).match(/[a-z0-9]+/g) || [];
  if (words.length && !words.every((w) => hay.split(/[^a-z0-9]+/).some((h) => h.startsWith(w)))) return false;
  if (alert.family && r.family !== alert.family) return false;
  if (alert.place && !low([r.city, r.region, r.postcode].join(" ")).includes(low(alert.place))) return false;
  if (!words.length && !alert.family) return false;
  return true;
}
