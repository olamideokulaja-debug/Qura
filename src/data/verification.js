// How a clinician gets verified, and what "verified" is allowed to mean.
//
// Qura had one route: a person opens the official register, finds them, done.
// That works for a UK radiographer on the HCPC register. It does not work for a
// Brazilian biomedical scientist in clinical research, where registration is
// not mandatory, and it does not work for anyone moving into research from a
// non-regulated background.
//
// The wrong answer is to loosen "verified" until it covers everyone, because
// the badge is the only thing Qura sells that a hospital cannot get elsewhere.
// The other wrong answer is to exclude them, which quietly shuts out the exact
// group the career tracks were built for.
//
// So there are two routes, and the BASIS IS ALWAYS RECORDED AND ALWAYS SHOWN.
// A hospital sees not just that someone is verified, but what was checked. That
// is more useful than a badge alone, and it is the only version of this that
// stays honest as Qura grows.

export const VERIFICATION_ROUTES = {
  register: {
    id: "register",
    label: "Verified on the professional register",
    // What a hospital reads on the profile.
    shortLabel: "Register checked",
    blurb: "A member of the Qura team found this clinician on their regulator's public register and confirmed the number, name and registration status.",
    // What the founder must actually do before marking it verified.
    checks: [
      "Open the regulator's public register",
      "Find the registration number",
      "Confirm the name matches the profile",
      "Confirm the registration is current and unrestricted",
    ],
    requires: { regBody: true, regNumber: true },
  },

  credentials: {
    id: "credentials",
    label: "Verified by credentials",
    shortLabel: "Credentials checked",
    blurb: "This clinician works in a role or country where professional registration is not required. A member of the Qura team confirmed their qualifications and certifications directly with the awarding bodies.",
    // Deliberately harder than the register route, not easier. A register lookup
    // is one authoritative check; this replaces it with several, because no
    // single credential carries the same weight.
    checks: [
      "Confirm identity from a government-issued document",
      "Confirm the primary qualification with the awarding institution",
      "Confirm at least one current professional certification with its issuing body",
      "Confirm the stated reason for having no registration is accurate for that country and role",
    ],
    requires: { identity: true, qualification: true, certification: true },
    // Evidence that must be in the vault before this can even be assessed.
    requiredDocs: ["identity", "qualification", "research-certification"],
  },
};

export const routeFor = (profile) => {
  if (!profile) return null;
  if (profile.verificationRoute) return VERIFICATION_ROUTES[profile.verificationRoute] || null;
  // Inferred only for display where nothing was chosen: someone with a
  // registration number is on the register route by default.
  return profile.regNumber ? VERIFICATION_ROUTES.register : null;
};

/**
 * Can this profile be assessed yet, and what is missing?
 *
 * Returns readable gaps rather than a boolean, so a clinician is told what to
 * do next instead of being left at "not verified" with no explanation.
 */
export function verificationReadiness(profile, docs) {
  const route = routeFor(profile);
  if (!route) {
    return { route: null, ready: false, missing: ["Tell us whether you hold a professional registration"] };
  }
  const have = new Set((Array.isArray(docs) ? docs : []).map((d) => d && d.type).filter(Boolean));
  const missing = [];

  if (route.id === "register") {
    if (!profile.regBody) missing.push("Your regulator");
    if (!profile.regNumber) missing.push("Your registration number");
  } else {
    if (!have.has("identity")) missing.push("A government-issued identity document");
    if (!have.has("qualification")) missing.push("Your primary qualification");
    if (!have.has("research-certification") && !have.has("training")) {
      missing.push("At least one professional certification");
    }
    if (!profile.noRegistrationReason) missing.push("Why you do not hold a registration");
  }

  return { route, ready: missing.length === 0, missing };
}
