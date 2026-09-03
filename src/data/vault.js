// The clinician document vault.
//
// Two categories, and the split is the whole design:
//
//   DOCUMENT   the file is stored. Registration certificates, right to work,
//              qualifications, indemnity, mandatory training, research
//              certifications, identity.
//   METADATA   only the facts are stored, never the file. DBS and occupational
//              health.
//
// Why DBS is metadata: storing a DBS certificate makes Qura a controller of
// criminal offence data, which needs an Article 6 basis, a DPA 2018 Schedule 1
// condition and an appropriate policy document. A hospital verifies the number
// on the DBS update service anyway — that is what they are obliged to do rather
// than trust a copy held by a third party. The number gives them everything and
// costs a fraction of the exposure.
//
// Why occupational health is different again: the fit-to-work status is
// shareable, the report is not. An OH report is Article 9 health data and a
// hospital's own OH function handles the clinical detail. So the report may be
// stored if the clinician wants it, but it is never released with an
// introduction. It is the one type where sharing defaults to off.

export const DOC_TYPES = [
  {
    id: "registration",
    label: "Professional registration certificate",
    hint: "GMC, NMC, HCPC, GPhC or your equivalent regulator",
    stores: "document",
    shareable: true,
    expires: true,
    required: true,
  },
  {
    id: "right-to-work",
    label: "Right to work",
    hint: "Passport, visa or a Home Office share code",
    stores: "document",
    shareable: true,
    expires: true,
    required: true,
  },
  {
    // Added after a clinician sent a passport and a driving licence with
    // nowhere to put either. Right to work is a legal status; identity is a
    // different question, and it is the first check on the credentials
    // verification route.
    id: "identity",
    label: "Identity document",
    hint: "Passport, national ID or driving licence. Needed if you do not hold a professional registration.",
    stores: "document",
    // Identity documents are checked by Qura and never released to an
    // organisation. A hospital needs to know we confirmed identity, not to hold
    // a copy of someone's passport.
    shareable: false,
    expires: true,
  },
  {
    id: "qualification",
    label: "Qualifications",
    hint: "Degree, diploma or specialty certificates",
    stores: "document",
    shareable: true,
    expires: false,
    multiple: true,
  },
  {
    // GCP, ACRP, SOCRA and similar. The research profile told people to upload
    // these "under My documents" when no such type existed, so they had
    // nowhere to go but the mandatory training slot, which is described as BLS
    // and safeguarding and would never occur to anyone.
    id: "research-certification",
    label: "Research and professional certifications",
    hint: "ICH-GCP, ACRP, SOCRA, IATA and similar. Add each one separately.",
    stores: "document",
    shareable: true,
    expires: true,
    multiple: true,
  },
  {
    id: "indemnity",
    label: "Indemnity insurance",
    hint: "Your current certificate of cover",
    stores: "document",
    shareable: true,
    expires: true,
  },
  {
    id: "training",
    label: "Mandatory training",
    hint: "BLS, safeguarding, information governance and similar",
    stores: "document",
    shareable: true,
    expires: true,
    multiple: true,
  },
  {
    id: "dbs",
    label: "DBS check",
    // Said in the interface, not just in a policy. A clinician who expects to
    // upload a certificate and is asked for a number deserves the reason.
    hint: "We record the certificate number, not the certificate. Organisations verify it themselves on the DBS update service.",
    stores: "metadata",
    shareable: true,
    expires: true,
    fields: [
      { id: "number", label: "Certificate number", required: true },
      { id: "level", label: "Level", options: ["Basic", "Standard", "Enhanced", "Enhanced with barred lists"] },
      { id: "issued", label: "Issue date", type: "date", required: true },
      { id: "updateService", label: "On the DBS update service", type: "boolean" },
    ],
  },
  {
    id: "occupational-health",
    label: "Occupational health",
    hint: "Only your fit-to-work status and its date are shared. Any report you upload stays private to you.",
    stores: "metadata",
    // The status is shareable. The report, if uploaded, is not — enforced in
    // the API, not just hidden in the interface.
    shareable: true,
    reportPrivate: true,
    expires: true,
    fields: [
      { id: "status", label: "Fit to work", options: ["Fit", "Fit with adjustments", "Assessment pending"], required: true },
      { id: "assessedOn", label: "Date assessed", type: "date", required: true },
    ],
  },
];

export const docType = (id) => DOC_TYPES.find((d) => d.id === id) || null;

// Retention, in one place so the API and the interface can never state
// different periods to a clinician.
export const RETENTION = {
  // After an account is deleted: visibility ends at once, files go at 30 days.
  // The gap exists so an account deleted by mistake can be restored, which is
  // the common case.
  afterDeletionDays: 30,
  // An expired document has no purpose. This applies continuously, not only
  // when someone leaves, and does more for data minimisation than anything
  // else here.
  afterExpiryMonths: 12,
};

// Is this document past the point where it should have been removed?
export function expiredBeyondRetention(doc) {
  if (!doc || !doc.expiresOn) return false;
  const t = Date.parse(doc.expiresOn);
  if (!isFinite(t)) return false;
  return Date.now() > t + RETENTION.afterExpiryMonths * 30 * 86400000;
}

// Expired, but still inside the window. Hidden from organisations rather than
// deleted: an expired DBS shown as current is worse than no DBS at all.
export function isExpired(doc) {
  if (!doc || !doc.expiresOn) return false;
  const t = Date.parse(doc.expiresOn);
  return isFinite(t) && Date.now() > t;
}
