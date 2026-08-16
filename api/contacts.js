// Serves the decision-maker register to SIGNED-IN users only.
// This data contains named individuals, so it must never ship in the public
// browser bundle. It lives here, server-side, and is returned only when the
// caller presents a valid Supabase session token.
//
// Contact details are released by PLAN, not by the browser. The previous
// version returned every field to any signed-in user and left the paywall to
// the front end, which meant a free account with developer tools could take the
// whole register in one request. Names, organisations, roles and specialties are
// visible to everyone signed in, because that is the shop window. Email
// addresses and telephone numbers are only returned to plans that include
// decision-maker access, and are masked for everyone else.
//
// Internal business development notes from the source sheet are deliberately
// NOT included here. They are our commentary about these people, not data we
// should be handing to subscribers.

import { getUser, kvGet } from "./_auth.js";
import { ENTITLEMENTS, planOf } from "./_entitlements.js";
import { limited } from "./_ratelimit.js";

import { CONTACTS } from "./_contacts.js";
import { regionOf } from "./_regions.js";
import { categorise, orgTypeOf, initialsOf } from "./_categorise.js";

function maskEmail(e) {
  if (!e || e.indexOf("@") < 0) return "";
  const [u, d] = e.split("@");
  const dot = d.lastIndexOf(".");
  const host = dot > 0 ? d.slice(0, dot) : d;
  return u.slice(0, 1) + "•".repeat(Math.max(3, u.length - 1)) + "@" + host.slice(0, 1) + "•".repeat(3) + (dot > 0 ? d.slice(dot) : "");
}
function maskPhone(p) {
  if (!p) return "";
  const digits = String(p).replace(/\D/g, "");
  if (digits.length < 4) return "";
  return "•".repeat(Math.max(6, digits.length - 3)) + digits.slice(-3);
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Sign in to view the decision-maker register", contacts: [] });
  if (await limited(req, res, user, { bucket: "contacts", limit: 120, windowSec: 3600 })) return;

  // Honour the removal log: anyone a founder has removed stays removed, even
  // if a later import of the register brings the record back.
  let removedNames = new Set();
  try {
    const log = (await kvGet("shared", "contact_removals")) || [];
    removedNames = new Set((Array.isArray(log) ? log : []).map((r) => String(r.name || "").toLowerCase()));
  } catch (e) {}

  // Contacts added through the admin panel live in storage rather than in the
  // register file, so the directory can grow without a deploy. Merge them here,
  // and categorise anything that somehow arrived without a category.
  let added = [];
  try {
    const rows = (await kvGet("shared", "contact_additions")) || [];
    added = (Array.isArray(rows) ? rows : []).map((c) => {
      if (c.spec) return c;
      const cat = categorise(c.role, c.org);
      return { ...c, spec: cat.category, group: cat.group, orgType: c.orgType || orgTypeOf(c.org), initials: c.initials || initialsOf(c.name) };
    });
  } catch (e) {}

  // Contacts named on procurement notices, harvested daily from every source.
  // These sit IN the register and count towards the total: the product's value
  // is the assembly — one searchable place, deduplicated across thousands of
  // notices — not exclusive access to the underlying fact, which stays public
  // at its source. Every record carries where it came from and a link back.
  let noticeContacts = [];
  try {
    const rows = (await kvGet("shared", "notice_contacts")) || [];
    noticeContacts = (Array.isArray(rows) ? rows : []).map((c) => ({
      ...c,
      spec: c.spec || "Procurement & Commercial Leadership",
      group: c.group || "Commissioning",
      orgType: c.orgType || orgTypeOf(c.org),
      initials: c.initials || initialsOf(c.name),
      fromNotice: true,
    }));
  } catch (e) {}

  const plan = await planOf(user.id);
  // Decision-maker contact details sit with the same tier as the rest of the
  // commercial intelligence.
  const unlocked = ENTITLEMENTS.intelligence(plan);

  // Newest additions first, then the register.
  // Researched register first, so a person already in it is never displaced by
  // a notice-harvested duplicate of the same name at the same organisation.
  const seen = new Set([...added, ...CONTACTS].map((c) => (String(c.name || "").toLowerCase() + "|" + String(c.org || "").toLowerCase())));
  const harvested = noticeContacts.filter((c) => !seen.has(String(c.name || "").toLowerCase() + "|" + String(c.org || "").toLowerCase()));
  const ALL = [...added, ...CONTACTS, ...harvested];
  const contacts = ALL.filter((c) => !removedNames.has(c.name.toLowerCase())).map((c) => ({
    name: c.name,
    org: c.org,
    role: c.role,
    spec: c.spec,
    group: c.group,
    initials: c.initials,
    orgType: c.orgType || "",
    addedAt: c.addedAt || "",
    // Where this record came from, so the directory can be filtered by source
    // and every harvested entry can be traced to the notice that named them.
    source: c.source || "Founder research",
    sourceUrl: c.sourceUrl || null,
    noticeCount: c.noticeCount || 0,
    // Region is derived from the organisation name rather than stored, so it
    // stays correct if an organisation is renamed and never has to be
    // maintained by hand.
    region: regionOf(c.org + " " + (c.role || "")) || "",
    hasEmail: !!c.email,
    hasPhone: !!c.phone,
    email: unlocked ? c.email : maskEmail(c.email),
    phone: unlocked ? c.phone : maskPhone(c.phone),
  }));

  res.setHeader("Cache-Control", "private, no-store");
  return res.status(200).json({
    contacts,
    // How many of the total came from procurement notices rather than founder
    // research, so the front end can label the source filter honestly.
    harvested: harvested.length,
    total: contacts.length,
    removed: removedNames.size,
    withContactDetails: contacts.filter((c) => c.hasEmail || c.hasPhone).length,
    organisations: new Set(contacts.map((c) => (c.org || "").toLowerCase())).size,
    unlocked,
  });
}
