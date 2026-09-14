import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PLANS, allPlans, lowestPaidMonthly } from "./data/pricing.js";

// Guards the one thing that must never drift: the prices in structured data
// against the prices on the page.
//
// App.jsx carries two duplicated pricing tables. src/data/pricing.js is the
// source used for Offer schema. If someone edits a price in one table and not
// the other, or not here, Google is told a number the page does not show, which
// is a rich-result penalty and a straightforward misrepresentation.
//
// This reads App.jsx as text rather than importing it, because it is a React
// component and cannot be loaded in a plain Node process. Crude, and it works:
// the thing being checked is a literal in the source.
//
// Run with `node src/pricing.test.js`.

const here = dirname(fileURLToPath(import.meta.url));
const app = readFileSync(join(here, "App.jsx"), "utf8");

let failures = 0;
const check = (name, ok, detail) => {
  if (ok) return;
  failures++;
  console.error("FAIL: " + name + (detail ? " -> " + detail : ""));
};

// Every { name: "X", mo: N, yr: M } the app renders.
const rendered = [];
const re = /name:\s*"([A-Za-z+ ]+)",\s*mo:\s*(\d+),\s*yr:\s*(\d+)/g;
let m;
while ((m = re.exec(app)) !== null) {
  rendered.push({ name: m[1].trim(), monthly: Number(m[2]), annualMonthly: Number(m[3]) });
}

check("found pricing tables in App.jsx", rendered.length > 0,
  "no { name, mo, yr } entries matched; the shape may have changed");

// Every paid plan here must appear in App.jsx with identical numbers.
for (const plan of allPlans()) {
  if (plan.monthly === 0) continue;
  const matches = rendered.filter((r) => r.name.toLowerCase() === plan.name.toLowerCase());
  check("App.jsx renders " + plan.name, matches.length > 0, "not found in App.jsx");
  for (const r of matches) {
    check(plan.name + " monthly matches", r.monthly === plan.monthly,
      "App.jsx says " + r.monthly + ", pricing.js says " + plan.monthly);
    check(plan.name + " annual matches", r.annualMonthly === plan.annualMonthly,
      "App.jsx says " + r.annualMonthly + ", pricing.js says " + plan.annualMonthly);
  }
}

// And the reverse: a plan rendered in the app but missing here would be absent
// from schema without anyone noticing.
const known = new Set(allPlans().map((p) => p.name.toLowerCase()));
for (const r of rendered) {
  check("pricing.js knows about " + r.name, known.has(r.name.toLowerCase()),
    "rendered in App.jsx but missing from pricing.js");
}

// The duplicated tables must agree with each other, which is the failure this
// whole file exists to catch.
const byName = {};
for (const r of rendered) {
  const k = r.name.toLowerCase();
  if (byName[k] && (byName[k].monthly !== r.monthly || byName[k].annualMonthly !== r.annualMonthly)) {
    check(r.name + ": duplicated tables agree", false,
      byName[k].monthly + "/" + byName[k].annualMonthly + " vs " + r.monthly + "/" + r.annualMonthly);
  }
  byName[k] = r;
}

check("lowest paid price is derived correctly", lowestPaidMonthly() === 12,
  "got " + lowestPaidMonthly());

check("clinician free plan is priced at zero, not omitted",
  PLANS.clinician.some((p) => p.monthly === 0));

if (failures) {
  console.error("\n" + failures + " pricing check(s) failed. Do not ship schema with a price the page does not show.");
  process.exit(1);
}
console.log("pricing: schema prices match every table rendered in App.jsx.");
