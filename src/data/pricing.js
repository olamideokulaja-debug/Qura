// Published prices, in one place.
//
// These numbers already exist inline in App.jsx, in two duplicated pricing
// tables. That was tolerable while they were only rendered. It stops being
// tolerable the moment they go into structured data, because a price in schema
// that does not match the page is a rich-result penalty, and a price that has
// drifted is worse than no price at all.
//
// So this file is the source, and src/pricing.test.js compares it against what
// App.jsx actually renders. If someone changes a price in one place and not the
// others, the test fails rather than Google quietly being told the wrong
// number.
//
// Monthly figures are the headline price. The annual figure is the effective
// monthly cost when billed annually, which is how the pricing page presents it.

export const CURRENCY = "GBP";

export const PLANS = {
  supplier: [
    { key: "starter", name: "Starter", monthly: 450, annualMonthly: 375,
      blurb: "For small agencies winning their first NHS and private work." },
    { key: "growth", name: "Growth", monthly: 1200, annualMonthly: 999,
      blurb: "For growing teams selling across every market." },
  ],
  provider: [
    { key: "team", name: "Team", monthly: 350, annualMonthly: 290,
      blurb: "For a single department or practice." },
    { key: "intelligence", name: "Intelligence", monthly: 900, annualMonthly: 750,
      blurb: "For organisations buying across several services." },
  ],
  clinician: [
    // Free, and stated as a price of 0 rather than omitted. "Free" is a
    // commitment we make repeatedly and it belongs in the markup.
    { key: "free", name: "Free", monthly: 0, annualMonthly: 0,
      blurb: "Everything a clinician needs. Free, always." },
    { key: "career-plus", name: "Career+", monthly: 15, annualMonthly: 12,
      blurb: "Premium career tools for ambitious clinicians." },
  ],
};

export const allPlans = () => [
  ...PLANS.clinician, ...PLANS.supplier, ...PLANS.provider,
];

// The lowest price anyone pays for a paid plan, used in copy such as "from".
// Derived rather than typed, so it cannot contradict the table above.
export const lowestPaidMonthly = () =>
  Math.min(...allPlans().filter((p) => p.monthly > 0).map((p) => p.annualMonthly));
