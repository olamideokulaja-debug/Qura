import { getUser, kvGet, kvSet } from "./_auth.js";
import { alertFounders } from "./_alert.js";

// GET  /api/account
//   -> { role, lens, supplierType, providerType, marketTags, entryContext, org, ... }
// POST /api/account { role | lens, supplierType, providerType, marketTags, entryContext, org, names }
//
// This used to accept exactly two roles, clinician and supplier, while the
// interface had six navigation lenses. A hospital could not register as a
// hospital: the provider lenses existed only for accounts a founder switched by
// hand. That is why healthcare_provider is now a first-class lens.
//
// The split that keeps this coherent:
//
//   lens    decides authorization. Three canonical values, validated here.
//   type    decides defaults and relevance only. Never permissions.
//   tags    specialist interests that cut across lenses. Filters, not accounts.
//
// Validation lives in this file rather than being imported from src/, because
// an API function reaching into the client bundle is a bundling risk. The lists
// must stay in step with src/data/lenses.js; there are few enough of them that
// this is safer than the alternative.
const KEY = "account";
const FOUNDERS = ["olamideokulaja@qurahealth.org", "olafolawiyo@qurahealth.org"];
const isFounder = (email) => FOUNDERS.includes((email || "").toLowerCase());

const LENSES = ["clinician", "supplier", "healthcare_provider"];
const SUPPLIER_TYPES = ["workforce", "medical_device", "healthcare_product_service"];
const PROVIDER_TYPES = ["nhs_trust", "private_provider", "gp_primary_care", "care_provider", "diagnostics"];
const MARKET_TAGS = ["send_slt", "clinical_research", "diagnostics", "mental_health", "oncology", "primary_care"];

// Accounts created before healthcare_provider existed stored a navigation role
// directly. Map them forward on read rather than rewriting stored data: a
// destructive migration for a refinement is never worth it, and an account
// saying "hospital" has a type we genuinely do not know.
function lensFromLegacy(role) {
  if (role === "clinician") return { lens: "clinician" };
  if (role === "agency" || role === "supplier") return { lens: "supplier" };
  if (role === "hospital") return { lens: "healthcare_provider", providerType: null };
  if (role === "gp") return { lens: "healthcare_provider", providerType: "gp_primary_care" };
  if (role === "care") return { lens: "healthcare_provider", providerType: "care_provider" };
  return {};
}

const clean = (v, n) => String(v == null ? "" : v).trim().slice(0, n || 80);

export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Sign in required" });

  if (req.method === "GET") {
    const a = (await kvGet(user.id, KEY)) || {};
    const legacy = a.lens ? {} : lensFromLegacy(a.role);
    return res.status(200).json({
      // role is still returned so nothing that reads it breaks.
      role: a.role || null,
      lens: a.lens || legacy.lens || null,
      supplierType: a.supplierType || null,
      providerType: a.providerType || legacy.providerType || null,
      marketTags: Array.isArray(a.marketTags) ? a.marketTags : [],
      entryContext: a.entryContext || null,
      org: a.org || null,
      firstName: a.firstName || null,
      lastName: a.lastName || null,
      email: user.email,
      isFounder: isFounder(user.email),
    });
  }

  if (req.method === "POST") {
    const { role, lens, supplierType, providerType, marketTags, entryContext, org, firstName, lastName } = req.body || {};

    if (role && !["clinician", "supplier"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }
    if (lens && LENSES.indexOf(lens) < 0) {
      return res.status(400).json({ error: "Invalid lens" });
    }
    if (supplierType && SUPPLIER_TYPES.indexOf(supplierType) < 0) {
      return res.status(400).json({ error: "Invalid supplier type" });
    }
    if (providerType && PROVIDER_TYPES.indexOf(providerType) < 0) {
      return res.status(400).json({ error: "Invalid provider type" });
    }

    const current = (await kvGet(user.id, KEY)) || {};
    const currentLens = current.lens || lensFromLegacy(current.role).lens || null;

    // The lens decides authorization, so changing it is still founder-only.
    // The TYPE is not a permission and a person may correct their own: a GP
    // practice that signed up as a private clinic should not need support.
    if (lens && currentLens && lens !== currentLens && !isFounder(user.email)) {
      return res.status(403).json({ error: "Lens change not permitted" });
    }
    if (role && current.role && role !== current.role && !isFounder(user.email)) {
      return res.status(403).json({ error: "Role change not permitted" });
    }

    const tags = Array.isArray(marketTags)
      ? marketTags.filter((t) => MARKET_TAGS.indexOf(t) >= 0).slice(0, 6)
      : undefined;

    const merged = {
      ...current,
      ...(role ? { role } : {}),
      ...(lens ? { lens } : {}),
      ...(supplierType !== undefined ? { supplierType } : {}),
      ...(providerType !== undefined ? { providerType } : {}),
      ...(tags !== undefined ? { marketTags: tags } : {}),
      // Where they came in from, kept so a specialist journey does not turn
      // generic the moment someone signs up. Recorded once and not overwritten
      // by later visits.
      ...(entryContext && !current.entryContext ? { entryContext: clean(entryContext, 40) } : {}),
      ...(org !== undefined ? { org } : {}),
      ...(firstName !== undefined ? { firstName } : {}),
      ...(lastName !== undefined ? { lastName } : {}),
      email: user.email,
      updatedAt: new Date().toISOString(),
    };
    const wrote = await kvSet(user.id, KEY, merged);
    // Read it back. This endpoint used to return the object it INTENDED to save
    // regardless of whether the save worked, so a failed write looked like a
    // success and the caller was told the role had changed when it had not.
    const after = (await kvGet(user.id, KEY)) || {};
    if (!wrote || (role && after.role !== role) || (lens && after.lens !== lens)) {
      await alertFounders("account-save", "Account change did not save", {
        user: user.id,
        attempted: lens || role || null,
        stored: after.lens || after.role || null,
      });
      return res.status(500).json({
        error: "save_failed",
        message: "We could not save that change. Please try again.",
        attempted: lens || role || null,
        stored: after.lens || after.role || null,
      });
    }
    return res.status(200).json({
      role: after.role || null,
      lens: after.lens || null,
      supplierType: after.supplierType || null,
      providerType: after.providerType || null,
      marketTags: Array.isArray(after.marketTags) ? after.marketTags : [],
      entryContext: after.entryContext || null,
      org: after.org || null,
      firstName: after.firstName || null,
      lastName: after.lastName || null,
      isFounder: isFounder(user.email),
    });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
