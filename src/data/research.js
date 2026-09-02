// Clinical research profile fields.
//
// These exist because professional registration says almost nothing useful
// about whether someone can run a trial site. A CRO assessing a CRA wants to
// know which phases they have monitored, in which therapeutic areas, whether
// they have run a site initiation or a close-out on their own, and whether they
// hold GCP. None of that is on an HCPC or GMC registration.
//
// Only shown to people whose target roles sit in the clinical research track,
// so a radiographer looking for locum shifts never sees any of it.

export const TRIAL_PHASES = [
  { id: "phase-1", label: "Phase I", hint: "First in human, healthy volunteers" },
  { id: "phase-2", label: "Phase II", hint: "Efficacy and dose finding" },
  { id: "phase-3", label: "Phase III", hint: "Large scale, comparative" },
  { id: "phase-4", label: "Phase IV", hint: "Post-marketing surveillance" },
  { id: "observational", label: "Observational / registry" },
  { id: "device", label: "Device trials" },
];

export const THERAPEUTIC_AREAS = [
  "Oncology", "Haematology", "Cardiology", "Neurology", "Psychiatry",
  "Respiratory", "Infectious disease", "Vaccines", "Rare disease",
  "Immunology", "Endocrinology and diabetes", "Dermatology",
  "Gastroenterology", "Nephrology", "Ophthalmology", "Paediatrics",
  "Women's health", "Musculoskeletal and rheumatology",
];

// The trial lifecycle. A CRA who has only monitored is a different proposition
// from one who has taken a site from qualification through to close-out, and
// this is the single most useful thing a CRO reads on a CV.
export const MONITORING_ACTIVITIES = [
  { id: "qualification", label: "Site qualification visits" },
  { id: "initiation", label: "Site initiation visits" },
  { id: "monitoring", label: "Interim monitoring visits" },
  { id: "close-out", label: "Close-out visits" },
  { id: "remote", label: "Remote and risk-based monitoring" },
  { id: "sdv", label: "Source data verification" },
  { id: "feasibility", label: "Feasibility and site selection" },
];

// Where someone has worked from matters as much as what they did. Site-side and
// sponsor-side experience are genuinely different jobs.
export const RESEARCH_SETTINGS = [
  { id: "cro", label: "CRO" },
  { id: "sponsor", label: "Sponsor / pharma" },
  { id: "site", label: "Trial site" },
  { id: "academic", label: "Academic research" },
  { id: "hospital", label: "Hospital research department" },
];

export const CERTIFICATIONS = [
  { id: "ich-gcp", label: "ICH-GCP", note: "Usually required before any monitoring role" },
  { id: "acrp-cca", label: "ACRP CCRA" },
  { id: "acrp-ccrc", label: "ACRP CCRC" },
  { id: "socra-ccrp", label: "SOCRA CCRP" },
  { id: "iata", label: "IATA dangerous goods" },
  { id: "hts", label: "Human subjects protection" },
];

export const EDC_SYSTEMS = [
  "Medidata Rave", "Veeva Vault CDMS", "Oracle Clinical / InForm",
  "IBM Clinical Development", "OpenClinica", "REDCap", "Castor EDC",
  "Florence eBinders", "Veeva SiteVault", "CTMS (other)",
];

export const TRAVEL_WILLINGNESS = [
  { id: "none", label: "No travel" },
  { id: "up-25", label: "Up to 25%" },
  { id: "up-50", label: "Up to 50%" },
  { id: "up-75", label: "Up to 75%" },
  { id: "full", label: "Fully travelling" },
];

// Which tracks these fields apply to. Asking a locum radiographer about trial
// phases is how a form gets abandoned.
export const RESEARCH_TRACKS = new Set(["clinical-research", "medical-devices"]);

/**
 * How complete is the research half of a profile?
 *
 * Shown to the clinician as a prompt, never used to rank them. Someone new to
 * clinical research has an empty profile by definition, and scoring them down
 * for it would defeat the purpose of the whole feature, which is to help people
 * move into the field.
 */
export function researchProfileStrength(r) {
  if (!r) return { pct: 0, missing: ["everything"] };
  const checks = [
    ["phases", Array.isArray(r.phases) && r.phases.length],
    ["therapeutic areas", Array.isArray(r.therapeuticAreas) && r.therapeuticAreas.length],
    ["monitoring experience", Array.isArray(r.activities) && r.activities.length],
    ["settings worked in", Array.isArray(r.settings) && r.settings.length],
    ["GCP or certifications", Array.isArray(r.certifications) && r.certifications.length],
    ["systems used", Array.isArray(r.systems) && r.systems.length],
    ["research experience", Number(r.researchYears) > 0],
    ["travel", Boolean(r.travel)],
  ];
  const done = checks.filter(([, ok]) => ok);
  return {
    pct: Math.round((done.length / checks.length) * 100),
    missing: checks.filter(([, ok]) => !ok).map(([l]) => l),
  };
}
