// Turning a tender notice into something Qura knows about.
//
// A notice on its own is a title, a buyer and a date, which anyone can get
// from the portal it came from. What Qura has that the portals do not is 777
// named decision-makers and a map of who sits where. This module joins the two:
// given a notice, it works out the trust, the ICB, the region, the procurement
// category, and which people already in the register are the ones to talk to.
//
// Everything here is deliberately conservative. Where a match cannot be made
// with confidence it returns null rather than guessing, because a wrong
// decision-maker attached to a live opportunity is worse than none.

import { CONTACTS } from "./_contacts.js";
import { regionOf } from "./_regions.js";

// ---------------------------------------------------------------- categories
// Ordered: the first match wins, so put the specific before the general.
// Note: these are STEMS, matched at a word boundary on the left only. A
// trailing \b would stop "patholog" ever matching "pathology", which is
// exactly the bug this file shipped with first time.
const CATEGORY_RULES = [
  ["Imaging & Radiology", /\b(?:radiolog|imaging|mri|ct scan|x-?ray|ultrasound|sonograph|mammograph|nuclear medicine|pacs|ris)/i],
  ["Pathology", /\b(?:patholog|histopath|cytolog|haematolog|biochemistr|microbiolog|laborator|lims|blood scienc|phlebotom)/i],
  ["Audiology", /\b(?:audiolog|hearing|ent |otolaryng|cochlear|tinnitus)/i],
  ["Endoscopy", /\b(?:endoscop|colonoscop|gastroscop|bowel scope|jag\b)/i],
  ["Community Diagnostics", /\b(?:community diagnostic|cdc\b|diagnostic centre|diagnostic hub)/i],
  ["Cardiology & Respiratory", /\b(?:cardiolog|echocardiograph|cardiac|ecg|spirometr|respiratory|sleep stud|lung function)/i],
  ["Cancer & Screening", /\b(?:cancer|oncolog|screening programme|breast screening|bowel screening|cervical)/i],
  ["Temporary Staffing", /\b(?:agency|locum|bank staff|temporary staff|insourc|outsourc|waiting list initiative|workforce suppl)/i],
  ["Digital & Data", /\b(?:digital|software|electronic patient record|epr\b|informatics|data platform|cyber|interoperab)/i],
  ["Estates & Facilities", /\b(?:estates|facilities|construction|refurbish|maintenance|cleaning|catering|decarbonis)/i],
  ["Pharmacy & Medicines", /\b(?:pharmac|medicine|drug|dispens|homecare medicines)/i],
  ["Consultancy & Transformation", /\b(?:consultanc|transformation|programme management|advisory|business case)/i],
];

export function categoryOf(text) {
  const t = String(text || "");
  for (const [name, re] of CATEGORY_RULES) if (re.test(t)) return name;
  return null;
}

// The categories in the register that are worth showing against each
// procurement category. Procurement and executive leads are appended to every
// notice separately, because they matter whatever the subject is.
const CATEGORY_TO_SPEC = {
  "Imaging & Radiology": ["Imaging & Radiology Leadership", "Community Diagnostics Leadership"],
  "Pathology": ["Pathology Leadership"],
  "Audiology": ["Audiology Leadership"],
  "Endoscopy": ["Endoscopy Leadership"],
  "Community Diagnostics": ["Community Diagnostics Leadership", "Diagnostics Transformation"],
  "Cardiology & Respiratory": ["Cardiology & Respiratory Diagnostics"],
  "Cancer & Screening": ["Cancer Diagnostics Leadership", "Community Diagnostics Leadership"],
  "Temporary Staffing": ["Workforce & Temporary Staffing Leadership"],
  "Digital & Data": ["Digital Diagnostics Leadership"],
  "Estates & Facilities": ["Operations Leadership"],
  "Pharmacy & Medicines": ["Clinical Leadership"],
  "Consultancy & Transformation": ["Diagnostics Transformation", "Executive Leadership"],
};

// --------------------------------------------------------------- organisation
const STOP = /\b(nhs|foundation|trust|university|hospitals?|hospital|the|and|of|integrated|care|board|icb|ics|group|services?)\b/gi;

function key(s) {
  return String(s || "").toLowerCase().replace(STOP, " ").replace(/[^a-z]/g, "");
}

// Built once from the register: every distinct organisation and its key.
const ORGS = (() => {
  const m = new Map();
  for (const c of CONTACTS) {
    const k = key(c.org);
    if (k.length < 4) continue;
    if (!m.has(k)) m.set(k, { org: c.org, orgType: c.orgType, key: k });
  }
  return [...m.values()];
})();

// Match a buyer name from a notice against an organisation we hold. Exact key
// first, then containment either way, which handles "Barts Health" against
// "Barts Health NHS Trust" without matching every trust with a common word.
export function organisationOf(buyer) {
  const k = key(buyer);
  if (k.length < 4) return null;
  const exact = ORGS.find((o) => o.key === k);
  if (exact) return exact;
  const partial = ORGS.filter((o) => (o.key.length >= 5 && k.includes(o.key)) || (k.length >= 5 && o.key.includes(k)));
  if (partial.length === 1) return partial[0];
  if (partial.length > 1) {
    // prefer the longest key, which is the most specific organisation
    return partial.sort((a, b) => b.key.length - a.key.length)[0];
  }
  return null;
}

// ---------------------------------------------------------------- the sources
// Atamis is the eCommercial system most of the NHS runs its tendering through,
// but its Health Family portal is a registration gateway: opportunities are
// only visible to suppliers who have registered and been notified, so there is
// nothing public to pull. What can be done honestly is recognise notices that
// originate there, because above-threshold notices still have to be published
// on Find a Tender and below-threshold ones on Contracts Finder. So the notice
// arrives through a portal we can read, and the response link points back at
// Atamis. Tagging that gives suppliers the one thing they need to know: which
// system they will have to bid through.
const PLATFORM_RULES = [
  ["Atamis", /(health-family\.force\.com|atamis|my\.site\.com\/s\/Welcome|healthfamily)/i],
  ["Jaggaer", /(jaggaer|bravosolution|delta-esourcing|due-north|proactis)/i],
  ["In-Tend", /in-?tend/i],
  ["Crown Commercial Service", /(crowncommercial|ccs framework|\bccs\b)/i],
];

export function platformOf(notice) {
  const hay = [notice && notice.url, notice && notice.link, notice && notice.description,
               notice && notice.title, notice && notice.buyer].filter(Boolean).join(" ");
  for (const [name, re] of PLATFORM_RULES) if (re.test(hay)) return name;
  return null;
}

// ----------------------------------------------------------------- the people
// Who to talk to about this notice: the subject-matter leads at that
// organisation, then its procurement leads, then its executives. Capped, and
// only ever people already in the register.
export function decisionMakersFor(org, category, limit = 6) {
  if (!org) return [];
  const k = key(org);
  const at = CONTACTS.filter((c) => key(c.org) === k);
  if (!at.length) return [];
  const wanted = CATEGORY_TO_SPEC[category] || [];
  const rank = (c) => {
    if (wanted.includes(c.spec)) return 0;
    if (c.spec === "Procurement & Commercial Leadership") return 1;
    if (c.group === "Executive") return 2;
    if (c.group === "Clinical") return 3;
    return 4;
  };
  return at
    .map((c) => ({ c, r: rank(c) }))
    .sort((a, b) => a.r - b.r)
    .slice(0, limit)
    .map(({ c }) => ({ name: c.name, role: c.role, spec: c.spec, initials: c.initials, org: c.org }));
}

// ------------------------------------------------------------------- the join
export function enrich(notice) {
  const text = [notice && notice.title, notice && notice.description, notice && notice.buyer]
    .filter(Boolean).join(" ");
  const match = organisationOf(notice && notice.buyer);
  const category = categoryOf(text);
  const org = match ? match.org : (notice && notice.buyer) || null;
  return {
    ...notice,
    category,
    platform: platformOf(notice),
    organisation: org,
    orgType: match ? match.orgType : null,
    inRegister: Boolean(match),
    region: regionOf(org || text),
    icb: match && match.orgType === "Integrated Care Board" ? org : null,
    contacts: decisionMakersFor(match ? match.org : null, category),
  };
}

export default enrich;
