// The lens taxonomy.
//
// Qura had two account roles, clinician and supplier, while the interface had
// six navigation lenses: operator, agency, hospital, clinician, gp and care. A
// hospital could not register as a hospital, because the API refused any role
// but those two. The provider lenses existed only for people a founder switched
// manually.
//
// This fixes the shape without inventing a third system:
//
//   account_lens     what kind of organisation or person this is. Canonical,
//                    three values, stable, used for authorization.
//   type             what kind of supplier or provider, within the lens. Drives
//                    defaults and relevance, never permissions.
//   market tags      specialist interests (SEND, clinical research, diagnostics)
//                    that cut across lenses and are filters, not accounts.
//
// The rule that keeps this from becoming another sprawl: SPECIALIST PATHWAYS
// ARE NOT NEW ACCOUNT TYPES. A SEND therapy provider and an NHS trust are both
// healthcare_provider; they differ in defaults and in what they are shown, not
// in what they are.

export const LENSES = {
  clinician: {
    key: "clinician",
    label: "Healthcare professional",
    // Which navigation configuration this lens renders.
    nav: "clinician",
  },
  supplier: {
    key: "supplier",
    label: "Supplier or employer",
    nav: "agency",
  },
  healthcare_provider: {
    key: "healthcare_provider",
    label: "Hospital or healthcare provider",
    nav: "hospital",
  },
};

export const LENS_KEYS = Object.keys(LENSES);

// Within the supplier lens. A workforce agency and a device company share the
// same authorization and the same core screens; what differs is which defaults
// and which intelligence lead.
export const SUPPLIER_TYPES = [
  { id: "workforce", label: "Workforce or recruitment", defaultView: "opportunities" },
  { id: "medical_device", label: "Medical devices or diagnostics", defaultView: "intel" },
  { id: "healthcare_product_service", label: "Healthcare products or services", defaultView: "intel" },
];

// Within the provider lens. GP and care are types here rather than separate
// accounts, which is why they can keep their own navigation without needing
// their own authorization model.
export const PROVIDER_TYPES = [
  { id: "nhs_trust", label: "NHS trust or ICB", nav: "hospital", defaultView: "hdash" },
  { id: "private_provider", label: "Private hospital or clinic", nav: "hospital", defaultView: "hdash" },
  { id: "gp_primary_care", label: "GP practice or primary care", nav: "gp", defaultView: "gpHub" },
  { id: "care_provider", label: "Care home or domiciliary care", nav: "care", defaultView: "careHub" },
  { id: "diagnostics", label: "Diagnostics or imaging service", nav: "hospital", defaultView: "hdash" },
];

// Specialist interests. These are TAGS, not accounts: a SEND therapy service is
// a healthcare_provider with a send tag, and a CRO is a supplier with a
// clinical_research tag. Treating them as account types is how a platform ends
// up with fourteen sign-up paths and no coherent permissions.
export const MARKET_TAGS = [
  { id: "send_slt", label: "SEND and speech & language" },
  { id: "clinical_research", label: "Clinical research" },
  { id: "diagnostics", label: "Diagnostics and imaging" },
  { id: "mental_health", label: "Mental health" },
  { id: "oncology", label: "Cancer services" },
  { id: "primary_care", label: "Primary care" },
];

// Where someone arrived from. A person who came in through a SEND landing page
// should not have to explain that again after signing up, and losing that
// context is the most common way a specialist journey turns generic.
export const ENTRY_CONTEXTS = {
  send: { tag: "send_slt", suggestLens: null },
  research: { tag: "clinical_research", suggestLens: null },
  diagnostics: { tag: "diagnostics", suggestLens: null },
  clinicians: { tag: null, suggestLens: "clinician" },
  suppliers: { tag: null, suggestLens: "supplier" },
};

const typeById = (list, id) => list.filter((t) => t.id === id)[0] || null;

/**
 * Which navigation configuration and default screen this account should get.
 *
 * The lens decides authorization. The type only decides what someone sees
 * first, which is why a GP practice can have its own navigation without its own
 * permission model.
 */
export function resolveLens(account) {
  const lens = LENSES[(account && account.lens) || ""] || null;
  if (!lens) return null;

  if (lens.key === "healthcare_provider") {
    const t = typeById(PROVIDER_TYPES, account.providerType);
    return { lens, type: t, nav: (t && t.nav) || lens.nav, defaultView: (t && t.defaultView) || "hdash" };
  }
  if (lens.key === "supplier") {
    const t = typeById(SUPPLIER_TYPES, account.supplierType);
    return { lens, type: t, nav: lens.nav, defaultView: (t && t.defaultView) || "dashboard" };
  }
  return { lens, type: null, nav: lens.nav, defaultView: "feed" };
}

// Older accounts stored the navigation role directly. Map them forward rather
// than migrating data destructively: an account that says "hospital" is a
// healthcare_provider whose type we do not know yet, and asking is better than
// guessing.
export function lensFromLegacyRole(role) {
  if (role === "clinician") return { lens: "clinician" };
  if (role === "agency" || role === "supplier") return { lens: "supplier" };
  if (role === "hospital") return { lens: "healthcare_provider", providerType: null };
  if (role === "gp") return { lens: "healthcare_provider", providerType: "gp_primary_care" };
  if (role === "care") return { lens: "healthcare_provider", providerType: "care_provider" };
  return null;
}

export const isValidLens = (l) => LENS_KEYS.indexOf(l) >= 0;
export const isValidSupplierType = (t) => SUPPLIER_TYPES.some((x) => x.id === t);
export const isValidProviderType = (t) => PROVIDER_TYPES.some((x) => x.id === t);
export const isValidTag = (t) => MARKET_TAGS.some((x) => x.id === t);
