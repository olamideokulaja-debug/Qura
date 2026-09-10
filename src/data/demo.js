// The on-demand demo.
//
// The problem it replaces: a prospect who wants to understand Qura has to book
// a call with a founder. That does not scale, it consumes the time the founders
// need for the deals that matter, and most people simply will not wait.
//
// One demo, branched by lens, with optional deeper chapters. NOT a separate
// demo product per specialist pathway: that is how you end up maintaining nine
// demos and updating none of them.
//
// THE RULE THIS FILE EXISTS TO ENFORCE. A demo shows three different kinds of
// thing and a prospect must always know which they are looking at:
//
//   live          genuine public intelligence, true right now
//   example       illustrative, clearly labelled, not a real organisation
//   subscriber    what this would show once they have an account and data
//
// Blurring those is how a demo becomes a misrepresentation. A prospect who
// signs up expecting the numbers they were shown, and finds an empty account,
// has been misled even if every screen was technically a mock-up.

export const SOURCE_KINDS = {
  live: {
    key: "live",
    label: "Live data",
    note: "Real, from public procurement sources, as at today.",
    tone: "teal",
  },
  example: {
    key: "example",
    label: "Example",
    note: "Illustrative. Not a real organisation or person.",
    tone: "amber",
  },
  subscriber: {
    key: "subscriber",
    label: "Your data once you join",
    note: "This fills with your own activity. It starts empty.",
    tone: "grey",
  },
};

// The spine every lens shares. Keeping one spine is what stops the demo
// fragmenting: a specialist pathway changes the examples, never the structure.
const SPINE = ["what", "proof", "journey", "next"];

export const DEMO = {
  clinician: {
    lens: "clinician",
    title: "Qura for clinicians",
    minutes: 4,
    chapters: [
      { id: "what", title: "What Qura is for you", source: "example",
        body: "One verified profile, seen by organisations across the NHS, private healthcare and internationally. Free, always." },
      { id: "proof", title: "How verification works", source: "live",
        body: "A person opens your regulator's public register and confirms your number before any organisation can see you. Where your role or country has no register, we confirm your identity, your qualification with the awarding institution, and a current certification with its issuing body." },
      { id: "journey", title: "Finding work you would not have found", source: "live",
        body: "Live procurement notices show where organisations are buying the kind of work you do, often months before a vacancy is advertised." },
      { id: "next", title: "What happens next", source: "subscriber",
        body: "Applications show what has actually happened to them. We never say an employer shortlisted you unless they told us." },
    ],
    // Deeper chapters, offered rather than imposed. The main demo stays short.
    optional: [
      { id: "abroad", title: "Working abroad", source: "live" },
      { id: "research", title: "Moving into clinical research", source: "example", pathway: "clinical_research" },
      { id: "documents", title: "Your document vault", source: "subscriber" },
    ],
    // Where the demo ends. Not a plan picker for a free user.
    cta: { action: "signup", label: "Create a free clinician profile", lens: "clinician" },
  },

  supplier: {
    lens: "supplier",
    title: "Qura for workforce and healthcare suppliers",
    minutes: 5,
    chapters: [
      { id: "what", title: "What Qura is for you", source: "example",
        body: "Live demand across five markets, the named decision-makers behind it, and the tools to act on both." },
      { id: "proof", title: "Where the intelligence comes from", source: "live",
        body: "Procurement notices refreshed daily from Find a Tender, Contracts Finder, TED and SAM.gov, against a register of named decision-makers. None of it is scraped from a mailing list." },
      { id: "journey", title: "Signal to conversation", source: "live",
        body: "A demand signal leads to the organisation, the people who make the decision, and one obvious next action." },
      { id: "next", title: "Your pipeline", source: "subscriber",
        body: "Everything you pursue is tracked here. It starts empty and fills with your own activity." },
    ],
    optional: [
      { id: "verified", title: "Becoming a verified supplier", source: "subscriber" },
      { id: "devices", title: "For medical device and diagnostics suppliers", source: "example", pathway: "diagnostics" },
      { id: "ai", title: "What the AI does, and what it does not", source: "example" },
    ],
    cta: { action: "plans", label: "See plans", lens: "supplier" },
  },

  healthcare_provider: {
    lens: "healthcare_provider",
    title: "Qura for hospitals and healthcare providers",
    minutes: 4,
    chapters: [
      { id: "what", title: "What Qura is for you", source: "example",
        body: "Verified clinicians, suppliers you can assess, and a view of what your own organisation is already doing." },
      { id: "proof", title: "What verified means", source: "live",
        body: "A person checked the register, or confirmed identity, qualification and certification directly. You see which of the two, on every profile." },
      { id: "journey", title: "Suppliers, assessed", source: "live",
        body: "Which suppliers hold NHS Workforce Alliance or HealthTrust Europe positions, which lots they cover, and whether a colleague in another department has already spoken to them." },
      { id: "next", title: "Your organisation", source: "subscriber",
        body: "Colleagues join the same organisation rather than creating separate accounts, so the picture is shared." },
    ],
    optional: [
      { id: "crossdept", title: "What other departments are doing", source: "subscriber" },
      { id: "gp", title: "For GP practices and primary care", source: "example", pathway: "primary_care" },
      { id: "care", title: "For care providers", source: "example" },
    ],
    cta: { action: "contact", label: "Talk to us about your organisation", lens: "healthcare_provider" },
  },
};

/**
 * Which demo to show, and which optional chapters to lead with.
 *
 * entryContext is where they arrived from. Someone who came in through a
 * clinical research page should get that chapter offered first rather than
 * having to hunt for it: losing that context is the most common way a
 * specialist journey turns generic.
 */
export function demoFor(lens, entryContext) {
  const demo = DEMO[lens];
  if (!demo) return null;
  const pathway = entryContext && entryContext.tag;
  const optional = pathway
    ? [...demo.optional].sort((a, b) => (b.pathway === pathway ? 1 : 0) - (a.pathway === pathway ? 1 : 0))
    : demo.optional;
  return { ...demo, optional };
}

// Every chapter must declare what kind of thing it is showing. A chapter with
// no source label is a bug, not a default, so this fails loudly rather than
// guessing.
export function validateDemo(demo) {
  const problems = [];
  const ids = (demo.chapters || []).map((c) => c.id);
  for (const s of SPINE) {
    if (ids.indexOf(s) < 0) problems.push("missing spine chapter: " + s);
  }
  for (const c of [...(demo.chapters || []), ...(demo.optional || [])]) {
    if (!SOURCE_KINDS[c.source]) problems.push(c.id + ": unknown or missing source kind");
  }
  if (!demo.cta || !demo.cta.action) problems.push("no closing action");
  return problems;
}
