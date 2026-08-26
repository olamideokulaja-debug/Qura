// UK healthcare workforce frameworks.
//
// From the founder's backend guide. Seven principal routes plus a required
// catch-all, deliberately not the full list of every framework in existence:
// presenting fifty options to an agency at sign-up guarantees they pick nothing.
//
// Stored relationally, not as permanent booleans on the supplier record. An
// agency's framework position changes — awards expire, lots are added, RM6397
// replaces what came before — and a boolean cannot express any of that.
//
// NHS Professionals is deliberately NOT one of the options. It is a staff bank
// and neutral vendor rather than a framework an agency is awarded a place on,
// so it belongs under Other, described as what it is.

export const FRAMEWORKS = [
  {
    id: "nwa-clinical",
    provider: "NHS Workforce Alliance",
    name: "Clinical & Healthcare Staffing",
    priority: "essential",
    why: "Core national route for clinical and healthcare agency staffing.",
  },
  {
    id: "nwa-non-clinical",
    provider: "NHS Workforce Alliance",
    name: "Non-Clinical Staffing",
    priority: "essential",
    why: "Administrative, corporate, IT, technical, estates and other non-clinical staffing.",
  },
  {
    id: "nwa-hws",
    provider: "NHS Workforce Alliance",
    name: "Health Workforce Solutions",
    priority: "essential",
    why: "Strategic workforce route including banks, supply-chain management and managed services.",
  },
  {
    id: "hte-tws",
    provider: "HealthTrust Europe",
    name: "Total Workforce Solutions",
    priority: "essential",
    why: "Major national alternative covering temporary, permanent and international staffing.",
  },
  {
    id: "nwa-international",
    provider: "NHS Workforce Alliance",
    name: "International Recruitment",
    priority: "important",
    why: "For agencies recruiting healthcare professionals internationally.",
  },
  {
    id: "nwa-insourced",
    provider: "NHS Workforce Alliance",
    name: "Insourced Services",
    priority: "important",
    why: "Where suppliers provide additional clinical capacity or managed insourcing.",
  },
  {
    id: "nhs-sbs",
    provider: "NHS Shared Business Services",
    name: "Workforce and associated frameworks",
    priority: "include",
    why: "Workforce, health-service, insourcing and associated NHS SBS routes.",
  },
  {
    id: "other",
    provider: "Other",
    name: "Framework, DPS or regional procurement agreement",
    priority: "catch-all",
    why: "Local, regional, specialist or future arrangements, including staff banks and neutral vendors such as NHS Professionals.",
    freeText: true,
  },
];

// Where an agency actually stands on a framework. "Awarded" is the only status
// that should read as a credential to a hospital; the rest are context, and
// showing them plainly is more useful than hiding everything that is not a win.
export const FRAMEWORK_STATUS = [
  { id: "awarded", label: "Awarded", counts: true },
  { id: "subcontractor", label: "Subcontractor", counts: true },
  { id: "tendering", label: "Currently tendering", counts: false },
  { id: "previously", label: "Previously awarded", counts: false },
  { id: "not-awarded", label: "Not currently awarded", counts: false },
];

export const frameworkById = (id) => FRAMEWORKS.find((f) => f.id === id) || null;
export const statusById = (id) => FRAMEWORK_STATUS.find((s) => s.id === id) || null;

// A framework entry earns the "Framework approved" signal only when a founder
// has verified it AND the status is one that genuinely counts. An agency that
// is merely tendering has not been awarded anything.
export const entryCounts = (e) =>
  Boolean(e && e.verifiedAt && (statusById(e.status) || {}).counts);

export const frameworkLabel = (e) => {
  const f = frameworkById(e && e.frameworkId);
  if (!f) return "Unknown framework";
  if (f.freeText) return (e.otherName || "Other framework").slice(0, 120);
  return f.provider + " — " + f.name;
};
