// Where a contact's category comes from. One module, so adding a contact and
// re-categorising the register can never disagree about what a job title means.
//
// Order matters and is deliberate:
//   Chairs before Executive Leadership, because a Chair is not an executive.
//   Medical Leadership before Executive, because a Medical Director is clinical.
// Everything is decided from the job title. Where there is no title to read,
// the fallbacks say so rather than guessing a specialty.

export const CATEGORY_GROUP = {
  "Audiology": "Clinical",
  "Radiology & Imaging": "Clinical",
  "Diagnostics": "Clinical",
  "Medical Leadership": "Clinical",
  "Executive Leadership": "Executive",
  "Chairs": "Governance",
  "Procurement": "Non-clinical",
  "Workforce & Staffing": "Non-clinical",
  "Strategy & Transformation": "Non-clinical",
  "Operations": "Non-clinical",
  "NHS Managers": "Non-clinical",
  "NHS Contacts": "Non-clinical",
  "Independent Contacts": "Independent",
};

const RULES = [
  ["Chairs", /\bchair\b|\bchairman\b|\bchairwoman\b|non[- ]?executive (director|chair)/i],

  ["Medical Leadership",
    /\bmedical director\b|\bchief medical officer\b|\bcmo\b|\bclinical director\b|deputy medical director|national medical director|\bchief nurs\w*|\bdirector of nursing\b|\bclinical lead\b|\bnursing\b/i],

  ["Executive Leadership",
    /\bchief executive\b|\bceo\b|\bgroup chief\b|deputy chief executive|\bchief operating officer\b|\bcoo\b|\bchief financial officer\b|\bcfo\b|\bchief people officer\b|\bcpo\b|permanent secretary|national director|executive director|\bmanaging director\b|\bchief \w+ officer\b/i],

  ["Procurement",
    /\bprocurement\b|category manager|commercial \w*business partner|\bcommercial manager\b|\bcommercial director\b|\bcontract(s)? manager\b|\bsourcing\b|\btender\b|\bsupply chain\b|\bfinance\b|\bfinancial\b/i],

  ["Workforce & Staffing",
    /temporary staffing|\bmedical staffing\b|\bbank staff\w*|\bstaffing\b|\bworkforce\b|\brecruit\w*|\bresourcing\b|talent acquisition|\bpeople director\b|\bhead of people\b|\bhr director\b|\bhuman resources\b|\baccount manager\b|\bclient services\b|\bbusiness partner\b/i],

  ["Strategy & Transformation",
    /\bstrateg\w*|\bplanning\b|\bpartnership\w*|\btransformation\b|\bintegration\b|\bintegrated care\b|\bprogramme director\b|\bservice development\b|\bcommissioning\b|\bquality\b|\bimprovement\b|patient safety|\bgovernance\b|\bassurance\b|\bestates\b|capital project|\bfacilities\b|\bdigital\b|\binformatics\b|\bccio\b|\bcmio\b/i],

  ["Audiology", /\baudiolog\w*|\bhearing\b|\bENT\b/i],

  ["Radiology & Imaging",
    /\bradiolog\w*|\bimaging\b|\bradiograph\w*|\bsonograph\w*|\bultrasound\b|\bMRI\b|\bsuperintendent\b/i],

  ["Diagnostics",
    /\bdiagnostic\w*|\bCDC\b|\bpatholog\w*|\blaborator\w*|\bendoscop\w*|\bcardiolog\w*|\brespirator\w*|\becho\w*|\bcancer\b|\bscreening\b|primary care|general practice|\bresearch\b/i],

  ["Operations",
    /\boperations\b|\boperational\b|\bservice delivery\b|\bsite director\b|\bdivisional director\b|\bgeneral manager\b/i],
];

const MANAGERISH = /\bmanager\b|\bhead of\b|\blead\b|\bsupervisor\b|\bcoordinator\b|\bofficer\b/i;

const INDEPENDENT = /\b(spire|nuffield|circle health|hca|onewelbeck|welbeck|practice plus|care uk|bupa|aspen|alliance medical|inhealth|healthshare|connect health|ascenti|tic health|lycahealth|cobalt|unilabs|synlab|sonic healthcare|synnovis|medneo|cygnet|priory|elysium|retinue|csh surrey|first community|chcp|ramsay|magnit|cleveland clinic)\b/i;

// Organisation type, read from the organisation name.
export function orgTypeOf(org) {
  const o = String(org || "");
  if (/\bNHS England\b/i.test(o)) return "NHS England";
  if (/integrated care board|\bICB\b/i.test(o)) return "Integrated Care Board";
  if (/health board/i.test(o)) return "Health Board";
  if (/department of health/i.test(o)) return "Government";
  if (INDEPENDENT.test(o)) return "Independent";
  if (/\bNHS\b|\btrust\b|\bhospitals?\b|\binfirmary\b/i.test(o)) return "NHS Trust";
  return "Other";
}

// The category, and why, so an admin screen can show its reasoning.
export function categorise(role, org) {
  const title = String(role || "").trim();
  if (title && title.toLowerCase() !== "decision maker") {
    for (const [cat, pat] of RULES) {
      if (pat.test(title)) return { category: cat, group: CATEGORY_GROUP[cat], reason: "job title" };
    }
  }
  const independent = orgTypeOf(org) === "Independent";
  if (title && title.toLowerCase() !== "decision maker" && MANAGERISH.test(title)) {
    const cat = independent ? "Independent Contacts" : "NHS Managers";
    return { category: cat, group: CATEGORY_GROUP[cat], reason: "a manager, with no specialty stated" };
  }
  const cat = independent ? "Independent Contacts" : "NHS Contacts";
  return { category: cat, group: CATEGORY_GROUP[cat], reason: "no job title to read" };
}

// Initials, computed the same way everywhere.
export function initialsOf(name) {
  const parts = String(name || "")
    .split(/[\s.]+/)
    .filter((p) => p && /[A-Za-z]/.test(p[0]))
    .filter((p) => !["dr", "mr", "mrs", "ms", "miss", "prof", "professor", "sir", "dame"].includes(p.toLowerCase()));
  if (!parts.length) return "?";
  return (parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
