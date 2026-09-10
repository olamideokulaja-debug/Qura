import { LENS_NAV, keysFor, resolveNav, CATEGORIES } from "./data/navigation.js";
import { NAVS } from "./navs.js";

// Coverage test for the navigation consolidation.
//
// The risk in grouping 39 flat tabs into 7 is not that it looks wrong. It is
// that a route quietly disappears, nobody notices for weeks, and a feature
// someone paid for becomes unreachable. Reviewing that by eye across six
// lenses and 144 keys is exactly the kind of check a person does badly.
//
// So: every key in the live NAVS must appear in the config exactly once, and
// the config must never invent a key that has no route behind it.
//
// Run with `node src/navigation.test.js`; it is plain assertions with no
// framework, so it works wherever it is pointed.

const LENSES = ["clinician", "agency", "hospital", "operator", "gp", "care"];
let failures = 0;

const check = (name, ok, detail) => {
  if (ok) return;
  failures++;
  console.error("FAIL: " + name + (detail ? " -> " + detail : ""));
};

// Every lens in the live registry must be configured. Without this, adding a
// role and forgetting to group it would pass silently.
for (const lens of Object.keys(NAVS)) {
  check("registry lens " + lens + " is configured", LENSES.indexOf(lens) >= 0);
}

for (const lens of LENSES) {
  const live = (NAVS[lens] || []).map((i) => i.k);
  const config = keysFor(lens);
  const liveSet = new Set(live);
  const configSet = new Set(config);

  const missing = live.filter((k) => !configSet.has(k));
  const invented = config.filter((k) => !liveSet.has(k));
  const duplicated = config.filter((k, i) => config.indexOf(k) !== i);

  check(lens + ": no route lost", missing.length === 0, missing.join(", "));
  check(lens + ": no key invented", invented.length === 0, invented.join(", "));
  check(lens + ": no key duplicated", duplicated.length === 0, duplicated.join(", "));

  // The whole point of the exercise. If a lens creeps back above 7 primary
  // destinations, this fails and someone has to justify it.
  const primary = LENS_NAV[lens].length;
  check(lens + ": 5-7 primary destinations", primary >= 5 && primary <= 7, "has " + primary);

  // Every group must resolve to a real category, or the colour system silently
  // falls back to grey and the cross-lens consistency is lost.
  for (const g of LENS_NAV[lens]) {
    check(lens + "/" + g.key + ": known category", Boolean(CATEGORIES[g.category]), g.category);
    check(lens + "/" + g.key + ": has a destination", Boolean(g.k), "no k");
  }
}

// A group with one visible child collapses to a plain link rather than a
// dropdown holding a single item.
{
  const only = new Set(["myopps", "feed", "profile", "network", "relocation", "academy"]);
  const resolved = resolveNav("clinician", only);
  const withDropdowns = resolved.filter((g) => g.children.length);
  check("single-child groups collapse", withDropdowns.length === 0,
    withDropdowns.map((g) => g.key).join(", "));
}

// An unknown lens returns null so the caller keeps the flat registry. That is
// the safe behaviour if a role is ever added before its grouping is designed.
check("unknown lens falls through", resolveNav("nosuchlens", null) === null);

if (failures) {
  console.error("\n" + failures + " navigation check(s) failed.");
  process.exit(1);
}
console.log("navigation: all " + LENSES.length + " lenses covered, no routes lost.");
