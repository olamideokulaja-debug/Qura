// Career direction, separate from professional background.
//
// The problem this fixes: Qura treated a clinician's current profession as the
// thing that defines them. Tiago is a Biomedical Scientist who wants to be a
// Clinical Research Associate, and the platform kept matching him to laboratory
// work because that is what his registration said.
//
// A profession is where someone has come from. It should inform matching, and
// it must never cap it. Most moves into pharma, CRO and device careers are made
// by exactly these people, and a platform that only shows them their own past
// is worse than useless to them.
//
// So a profile now carries three separate things:
//
//   background     what they are registered or qualified as
//   targetRoles    what they want to do next, which may be nothing like it
//   markets        where they want to work, with eligibility per country

export const CAREER_TRACKS = [
  {
    id: "clinical-research",
    label: "Clinical research and pharma",
    blurb: "Trials, monitoring, regulatory and drug safety, in pharma, biotech and CROs.",
    roles: [
      "Clinical Research Associate",
      "CRA II",
      "Senior Clinical Research Associate",
      "Clinical Research Coordinator",
      "Clinical Trial Assistant",
      "Clinical Trial Manager",
      "Clinical Project Manager",
      "Study Start-Up Specialist",
      "Site Activation Specialist",
      "Regulatory Affairs",
      "Pharmacovigilance and Drug Safety",
      "Clinical Data Management",
      "Medical Affairs",
      "Medical Science Liaison",
      "Quality Assurance",
      "Laboratory and Biomarker roles",
    ],
  },
  {
    id: "medical-devices",
    label: "Medical devices and diagnostics",
    blurb: "Clinical support, applications, field service and device trials.",
    roles: [
      "Clinical Applications Specialist",
      "Clinical Support Specialist",
      "Field Clinical Engineer",
      "Product Specialist",
      "Clinical Affairs",
      "Device Regulatory Affairs",
    ],
  },
  {
    id: "digital-health",
    label: "Digital health and informatics",
    blurb: "Clinical safety, informatics and implementation in health technology.",
    roles: [
      "Clinical Safety Officer",
      "Clinical Informatics Specialist",
      "Implementation Consultant",
      "Clinical Product Specialist",
      "Health Data Analyst",
    ],
  },
  {
    id: "clinical-practice",
    label: "Clinical practice",
    blurb: "Continuing in direct patient care, substantive, bank or locum.",
    roles: [
      "Substantive clinical post",
      "Bank or locum work",
      "Specialist or advanced practice",
      "Clinical leadership",
    ],
  },
];

export const SECTORS = [
  "Pharmaceutical",
  "Biotechnology",
  "Contract research organisation (CRO)",
  "Hospital research",
  "Academic research",
  "Medical devices",
  "NHS",
  "Private healthcare",
  "Health technology",
];

// Eligibility is per country, because it genuinely differs per country. A
// clinician eligible to work in Canada and needing sponsorship for the United
// States is the normal case, not an edge case, and collapsing that into one
// field is how a platform ends up implying someone can work somewhere they
// cannot.
export const WORK_AUTH = [
  { id: "eligible", label: "Eligible to work here" },
  { id: "sponsorship", label: "Would need visa sponsorship" },
  { id: "in-progress", label: "Application or registration in progress" },
  { id: "unknown", label: "Not sure yet" },
];

export const WORK_PATTERNS = ["Remote", "Hybrid", "On-site", "Travelling / field-based"];
export const CONTRACT_TYPES = ["Permanent", "Fixed-term", "Contract", "Freelance"];

export const allTargetRoles = () => CAREER_TRACKS.flatMap((t) => t.roles);
export const trackForRole = (role) => CAREER_TRACKS.find((t) => t.roles.includes(role)) || null;

// Terms that identify each track in an opportunity's text, so a target role can
// be matched against real demand rather than only against a job title someone
// typed. Kept tight: a loose match teaches people to ignore the feed.
export const TRACK_TERMS = {
  "clinical-research": ["clinical research", "clinical trial", "cra ", "monitoring",
    "gcp", "pharmacovigilance", "regulatory affairs", "study start", "site activation",
    "data management", "medical affairs", "investigational", "sponsor"],
  "medical-devices": ["medical device", "clinical application", "field clinical",
    "device trial", "clinical affairs"],
  "digital-health": ["clinical safety", "informatics", "digital health", "ehr",
    "electronic patient record", "clinical systems"],
  "clinical-practice": ["locum", "bank staff", "substantive", "clinical post", "ward", "clinic"],
};
