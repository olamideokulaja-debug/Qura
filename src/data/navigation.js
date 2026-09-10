// Navigation configuration.
//
// Before this, NAVS in App.jsx was a flat array per role: 39 equal items for a
// supplier, 37 for an operator, 23 for a provider. Everything looked equally
// important, which is the same as nothing looking important. A new supplier
// landing on 39 tabs cannot tell what Qura is for.
//
// This file does not add features or remove them. It groups what already
// exists into 5 to 7 primary destinations per lens, with the rest nested
// underneath.
//
// THE RULE THAT MATTERS MOST: every existing navigation key still appears,
// exactly once. Consolidation nests, it never deletes. There is a test in
// navigation.test.js that checks this against the live NAVS object, because
// losing a route to a tidy-up would be worse than the crowding it fixed.
//
// And nesting changes nothing about authorization. Hiding a tab was never
// security. The server-side checks are untouched.

// Functional categories. Colour carries meaning across lenses: the same kind of
// function is the same colour wherever it appears, so someone who learns Qura
// in one lens can read another.
export const CATEGORIES = {
  core: { key: "core", label: "Home", token: "nav.core", colour: "var(--blue)" },
  workforce: { key: "workforce", label: "People", token: "nav.workforce", colour: "var(--teal)" },
  intelligence: { key: "intelligence", label: "Intelligence", token: "nav.intelligence", colour: "#7C5CFF" },
  opportunity: { key: "opportunity", label: "Opportunities", token: "nav.opportunity", colour: "#C2410C" },
  ai: { key: "ai", label: "AI", token: "nav.ai", colour: "#0891B2" },
  verification: { key: "verification", label: "Verification", token: "nav.verification", colour: "#0E6B4F" },
  admin: { key: "admin", label: "Account", token: "nav.utility", colour: "#5A6783" },
};

// Groups per lens, all six of them. Operator, GP and care were left flat in the
// first pass so the three core lenses could be reviewed on their own; they are
// grouped here on the same rules, and the coverage test now runs across all
// 144 keys rather than the original 76.
//
// `k` on a group is the destination opened when the group itself is tapped, so
// a group is never a dead end on touch: tapping the parent goes somewhere
// useful rather than only expanding.
//
// Order within each lens is independent. A supplier's first destination is not
// a clinician's, and forcing one hierarchy on both is what produced the flat
// lists in the first place.
export const LENS_NAV = {
  clinician: [
    { key: "home", label: "Live feed", icon: "Rss", category: "core", k: "feed" },
    {
      key: "opportunities", label: "Opportunities", icon: "Target", category: "opportunity", k: "myopps",
      children: ["myopps", "myapps", "liveProjects"],
    },
    {
      key: "profile", label: "My profile", icon: "UserCheck", category: "verification", k: "profile",
      children: ["profile", "clinicianReg", "vault"],
    },
    {
      key: "network", label: "Network", icon: "Users", category: "workforce", k: "network",
      children: ["network", "messages"],
    },
    {
      key: "moving", label: "Working abroad", icon: "Globe", category: "intelligence", k: "relocation",
      children: ["relocation", "accommodation"],
    },
    {
      key: "learn", label: "Learn", icon: "GraduationCap", category: "admin", k: "academy",
      children: ["academy", "howto", "news"],
    },
  ],

  agency: [
    { key: "home", label: "Dashboard", icon: "LayoutDashboard", category: "core", k: "dashboard" },
    {
      key: "opportunities", label: "Opportunities", icon: "Target", category: "opportunity", k: "opportunities",
      children: ["opportunities", "savedOpps", "feed", "inbox", "proposals", "outreach", "meetings", "pipeline"],
    },
    {
      key: "intelligence", label: "Market intelligence", icon: "Radar", category: "intelligence", k: "intel",
      children: ["intel", "psintel", "marketmap", "decisionMakers", "execs", "clients", "analytics", "leaderboard"],
    },
    {
      key: "talent", label: "Talent", icon: "Users", category: "workforce", k: "talentpool",
      children: ["talentpool", "clinicians", "suppliers", "staffing", "mobileunits"],
    },
    {
      key: "ai", label: "AI tools", icon: "Sparkles", category: "ai", k: "aibot",
      children: ["aibot", "weekly", "playbook"],
    },
    {
      key: "standing", label: "Your standing", icon: "ShieldCheck", category: "verification", k: "standing",
      children: ["standing", "register", "casestudies", "whyqura", "whyswitch", "brand", "events"],
    },
    {
      key: "account", label: "Account", icon: "CreditCard", category: "admin", k: "pricing",
      children: ["pricing", "tariffs", "relocation", "accommodation", "news", "academy", "howto"],
    },
  ],

  hospital: [
    { key: "home", label: "Dashboard", icon: "LayoutDashboard", category: "core", k: "hdash" },
    {
      key: "workforce", label: "Find people", icon: "Stethoscope", category: "workforce", k: "clinicians",
      children: ["clinicians", "talentpool", "shortlists", "execs"],
    },
    {
      key: "suppliers", label: "Suppliers & services", icon: "Briefcase", category: "opportunity", k: "findAgencies",
      children: ["findAgencies", "staffing", "mobileunits", "tariffs"],
    },
    {
      key: "intelligence", label: "Market intelligence", icon: "Radar", category: "intelligence", k: "intel",
      children: ["intel", "psintel", "weekly", "feed"],
    },
    {
      key: "moving", label: "Relocation support", icon: "Globe", category: "intelligence", k: "relocation",
      children: ["relocation", "accommodation"],
    },
    {
      key: "account", label: "Account", icon: "CreditCard", category: "admin", k: "pricing",
      children: ["pricing", "meetings", "casestudies", "events", "whyqura", "news", "academy", "howto"],
    },
  ],

  operator: [
    {
      key: "home", label: "Command centre", icon: "Activity", category: "core", k: "command",
      children: ["command", "ops", "analytics", "leaderboard"],
    },
    {
      key: "opportunities", label: "Opportunities", icon: "Target", category: "opportunity", k: "opportunities",
      children: ["opportunities", "savedOpps", "feed", "inbox", "proposals", "pipeline"],
    },
    {
      key: "intelligence", label: "Market intelligence", icon: "Radar", category: "intelligence", k: "intel",
      children: ["intel", "psintel", "marketmap", "decisionMakers", "execs", "clients"],
    },
    {
      key: "talent", label: "Talent", icon: "Users", category: "workforce", k: "talentpool",
      children: ["talentpool", "clinicians", "suppliers", "staffing", "mobileunits"],
    },
    {
      key: "ai", label: "AI tools", icon: "Sparkles", category: "ai", k: "aibot",
      children: ["aibot", "weekly", "playbook"],
    },
    {
      key: "growth", label: "Growth & brand", icon: "Trophy", category: "verification", k: "whyqura",
      children: ["whyqura", "whyswitch", "casestudies", "events", "brand", "register"],
    },
    {
      key: "account", label: "Account", icon: "CreditCard", category: "admin", k: "pricing",
      children: ["pricing", "tariffs", "relocation", "accommodation", "news", "academy", "howto"],
    },
  ],

  gp: [
    { key: "home", label: "GP hub", icon: "Stethoscope", category: "core", k: "gpHub" },
    {
      key: "workforce", label: "Find people", icon: "UserCheck", category: "workforce", k: "clinicians",
      children: ["clinicians", "shortlists", "feed"],
    },
    {
      key: "suppliers", label: "Suppliers & rates", icon: "Briefcase", category: "opportunity", k: "findAgencies",
      children: ["findAgencies", "tariffs", "meetings"],
    },
    {
      key: "intelligence", label: "Market intelligence", icon: "Radar", category: "intelligence", k: "intel",
      children: ["intel", "psintel", "news"],
    },
    {
      key: "moving", label: "Relocation support", icon: "Globe", category: "intelligence", k: "relocation",
      children: ["relocation", "accommodation"],
    },
    {
      key: "account", label: "Account", icon: "CreditCard", category: "admin", k: "pricing",
      children: ["pricing", "casestudies", "academy", "howto"],
    },
  ],

  care: [
    { key: "home", label: "Care hub", icon: "Heart", category: "core", k: "careHub" },
    {
      key: "workforce", label: "Find people", icon: "Stethoscope", category: "workforce", k: "clinicians",
      children: ["clinicians", "shortlists", "feed"],
    },
    {
      key: "intelligence", label: "Market intelligence", icon: "Radar", category: "intelligence", k: "intel",
      children: ["intel", "psintel", "news"],
    },
    {
      key: "moving", label: "Relocation support", icon: "Globe", category: "intelligence", k: "relocation",
      children: ["relocation", "accommodation"],
    },
    {
      key: "account", label: "Account", icon: "CreditCard", category: "admin", k: "pricing",
      children: ["pricing", "tariffs", "meetings", "casestudies", "academy", "howto"],
    },
  ],
};

/**
 * Resolve the navigation for a lens.
 *
 * All six lenses are configured. An unknown lens returns null and the caller
 * falls back to the flat registry, which is the safe behaviour if a new role is
 * ever added before its grouping is designed.
 *
 * `allowed` is the set of keys this user may actually see, computed by whatever
 * already governs that. This function filters display only. It is not a
 * security boundary and must never be treated as one.
 */
export function resolveNav(lens, allowed, flags) {
  const groups = LENS_NAV[lens];
  if (!groups) return null;
  const can = (k) => (allowed ? allowed.has(k) : true);
  const flagOk = (g) => !g.flag || (flags && flags[g.flag]);

  return groups
    .filter(flagOk)
    .map((g) => {
      const children = (g.children || []).filter(can);
      // A group whose only remaining child is its own destination is shown as a
      // plain link rather than a dropdown containing one thing.
      const single = !g.children || children.length <= 1;
      return { ...g, children: single ? [] : children, category: CATEGORIES[g.category] || CATEGORIES.admin };
    })
    .filter((g) => can(g.k) || g.children.length);
}

// Every key a lens config references, for the coverage test.
export const keysFor = (lens) => {
  const groups = LENS_NAV[lens] || [];
  const out = [];
  for (const g of groups) {
    if (g.children && g.children.length) out.push(...g.children);
    else out.push(g.k);
  }
  return out;
};
