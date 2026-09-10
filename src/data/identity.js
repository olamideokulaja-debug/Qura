// Three contexts that look like one person and must not be treated as one.
//
// Qura holds Amanda Pritchard in two entirely different senses:
//
//   SUPPLIER INTELLIGENCE   a decision-maker record in the register, built from
//                           public procurement notices and published sources. It
//                           exists whether or not she has ever heard of Qura.
//
//   PROVIDER PROFILE        an account she created, belonging to an
//                           organisation, with colleagues and permissions.
//
//   PERSON IDENTITY         the login itself: email, password, MFA.
//
// Collapsing these is the single most damaging mistake available here, in two
// directions:
//
//   Merge on name and a supplier is shown "she is on Qura" when she is not, or
//   worse, a different Amanda Pritchard's account is linked to a trust she has
//   no connection to.
//
//   Merge the lifecycles and hiding a provider profile silently deletes a
//   lawfully-held intelligence record, or deleting an account leaves the
//   register claiming she still works somewhere.
//
// So the contexts stay separate, linking is evidence-based and reversible, and
// erasure is its own decision.

export const CONTEXTS = {
  identity: "identity",
  providerProfile: "provider_profile",
  supplierIntelligence: "supplier_intelligence",
};

// What counts as evidence that an account and a register record are the same
// person. Weighted, because no single one of these is sufficient and the
// tempting one — the name — is the weakest.
const SIGNALS = {
  // A verified work email at the organisation's own domain is the strongest
  // thing available short of asking.
  verifiedWorkEmailDomain: 45,
  // They claimed the organisation and a founder approved that claim.
  approvedOrgClaim: 30,
  // Job title matches closely.
  titleMatch: 15,
  // Department or specialty matches.
  departmentMatch: 10,
  // Name matches. Deliberately worth little on its own: there are many people
  // called David Jones working in the NHS, and a wrong link here is a data
  // breach rather than an inconvenience.
  nameMatch: 10,
};

// Below this, no link is offered at all. Above it, a link is SUGGESTED to a
// person. Nothing in this file ever links automatically.
const SUGGEST_AT = 70;

const norm = (v) => String(v || "").trim().toLowerCase();

function domainOf(email) {
  const e = norm(email);
  const at = e.indexOf("@");
  return at > 0 ? e.slice(at + 1) : "";
}

/**
 * Should we suggest that this account and this register record are the same
 * person?
 *
 * Returns the evidence rather than a verdict, so whoever decides can see what
 * it rests on. A score alone would invite exactly the automatic linking this
 * exists to prevent.
 */
export function assessIdentityLink(account, record, orgDomains) {
  if (!account || !record) return { score: 0, evidence: [], suggest: false };
  const evidence = [];
  let score = 0;

  const add = (key, label, ok) => {
    if (!ok) return;
    score += SIGNALS[key];
    evidence.push({ key, label, weight: SIGNALS[key] });
  };

  const domain = domainOf(account.email);
  const known = (Array.isArray(orgDomains) ? orgDomains : []).map(norm);
  add("verifiedWorkEmailDomain", "Signed in with a verified " + domain + " address",
    Boolean(account.emailVerified && domain && known.indexOf(domain) >= 0));

  add("approvedOrgClaim", "Their organisation claim was approved by Qura",
    Boolean(account.orgClaimApproved));

  add("titleMatch", "Job title matches the register record",
    Boolean(account.title && record.role && norm(account.title) === norm(record.role)));

  add("departmentMatch", "Department matches",
    Boolean(account.department && record.spec && norm(account.department) === norm(record.spec)));

  const fullName = norm([account.firstName, account.lastName].filter(Boolean).join(" "));
  add("nameMatch", "Name matches", Boolean(fullName && fullName === norm(record.name)));

  return {
    score,
    evidence,
    suggest: score >= SUGGEST_AT,
    // Stated explicitly so no caller can mistake this for a decision.
    automatic: false,
    note: score >= SUGGEST_AT
      ? "Enough evidence to ask a person to confirm. Never link without confirmation."
      : "Not enough evidence to suggest a link.",
  };
}

/**
 * Name-only matching, refused.
 *
 * Exported so the rule is testable and so anyone tempted to add it later finds
 * this instead. There is no configuration that turns it on.
 */
export function matchOnNameAlone() {
  return { suggest: false, reason: "A name is not identification. Qura never links records on name alone." };
}

/**
 * What happens to each context when a provider hides or closes their profile.
 *
 * The trap: treating "hide my profile" as "delete everything about me". A
 * register record built from published procurement notices has its own lawful
 * basis and its own removal route. Deleting it because someone hid an account
 * would be as wrong as refusing to delete it when they actually ask.
 */
export function applyProfileVisibility(action) {
  if (action === "hide") {
    return {
      provider_profile: "hidden",
      // The link goes with the profile: nothing should still say "this account
      // belongs to that record" while the account is hidden.
      identity_link: "suspended",
      supplier_intelligence: "unchanged",
      explain: "Your profile is hidden from organisations. Any public-record entry about your role is separate and unchanged; you can ask us to remove that too.",
    };
  }
  if (action === "close") {
    return {
      provider_profile: "deleted",
      identity_link: "removed",
      supplier_intelligence: "unchanged",
      explain: "Your account and profile are deleted. Entries built from published procurement records are held separately; tell us if you want those removed as well.",
    };
  }
  if (action === "erase") {
    // The only action that reaches everything, and it must be asked for
    // explicitly rather than inferred from closing an account.
    return {
      provider_profile: "deleted",
      identity_link: "removed",
      supplier_intelligence: "deleted",
      explain: "Everything Qura holds about you is removed, including entries built from published records.",
    };
  }
  return null;
}
