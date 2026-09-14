// Per-route SEO metadata and structured data.
//
// One source, read by two things: the build-time pre-render that writes real
// HTML files, and the client-side updater that keeps the head correct when
// someone navigates within the app.
//
// WHY PRE-RENDERING AND NOT JUST JAVASCRIPT. The client-side version was
// written first and it was half a fix. Googlebot renders JavaScript and would
// eventually see it, but LinkedIn, WhatsApp, Slack and every other social
// scraper do not run JS at all. So every persona page shared at launch
// previewed as the generic homepage, and a `curl` of any URL returned identical
// head tags. Testing it in a browser hid that completely.
//
// A DELIBERATE OMISSION: there is no JobPosting schema here, and there should
// not be. The SEO audit recommended it, assuming Qura is a job board. It is
// not: the marketplace carries procurement notices, which are demand signals
// rather than vacancies. Marking them up as JobPosting would tell Google we are
// publishing jobs that do not exist, which is the kind of thing Google for Jobs
// removes sites for, and it would contradict the one claim the whole product
// rests on.

const SITE = "https://www.qurahealth.org";

export const ROUTE_META = {
  "/": {
    view: "home",
    title: "Qura — The 24/7 Healthcare Marketplace & Growth CRM",
    description: "Qura connects clinicians, healthcare providers, workforce suppliers and medical suppliers in one live healthcare marketplace and growth CRM.",
  },
  "/for-clinicians": {
    view: "clinicians",
    title: "Get Verified Once, Be Seen Everywhere | Qura for Clinicians",
    description: "One verified profile puts NHS, private and international healthcare organisations in front of you. Free to join, always.",
  },
  "/for-suppliers": {
    view: "suppliers-app",
    title: "Healthcare Workforce CRM for Suppliers | Qura",
    description: "Run your healthcare recruitment pipeline, business development and outreach from one place: live opportunities, named decision-makers, AI-drafted proposals.",
  },
  "/marketplace": {
    view: "market",
    title: "Live Healthcare Demand — Roles & Tenders | Qura",
    description: "See NHS, private and international healthcare demand, tenders and insourcing projects as they are published, across five markets.",
  },
  "/how-it-works": {
    view: "how", section: "walk",
    title: "How Qura Works | Verified Clinicians & Live Market Intelligence",
    description: "From a verified profile to live opportunity intelligence and introductions organisations actually act on. How Qura works, lens by lens.",
  },
  "/inside-the-platform": {
    view: "how", section: "gallery",
    title: "Inside the Qura Platform | A Look at Every Lens",
    description: "A walkthrough of the Qura platform: what a clinician, a workforce supplier and a healthcare provider each see.",
  },
  "/solutions": {
    view: "solutions",
    title: "Healthcare Workforce & Procurement Solutions | Qura",
    description: "Workforce, procurement and market intelligence for hospitals, GP practices, care providers and healthcare suppliers.",
  },
  "/fragile-professions": {
    view: "fragile",
    title: "Sonography, Radiography & Fragile Profession Recruitment | Qura",
    description: "Specialist recruitment intelligence for the roles healthcare struggles most to fill: sonography, echocardiography, audiology, biomedical science and more.",
  },
  "/pricing": {
    view: "pricing",
    title: "Pricing | Qura Healthcare Growth CRM",
    description: "Free for clinicians, always. Plans for workforce suppliers, hospitals and healthcare providers.",
  },
  "/our-story": {
    view: "story",
    title: "Our Story | Why We Built Qura",
    description: "Why Qura exists, and the problem in healthcare recruitment and procurement it was built to solve.",
  },
  "/faq": {
    view: "faq",
    title: "Questions Answered | Qura FAQs",
    description: "Detailed answers on how Qura works for clinicians, workforce suppliers, hospitals and medical suppliers, including what Qura decides and what it never decides for you.",
  },
};

export const canonicalFor = (path) => SITE + (path === "/" ? "/" : path);

/**
 * The canonical for a VIEW, which is where the bug was.
 *
 * The client-side code looked up ROUTES by view alone, and two paths share the
 * view "how". The first match always won, so /inside-the-platform declared its
 * canonical as /how-it-works, telling Google to drop it from the index in
 * favour of a different page.
 *
 * A view is not enough to identify a route. The section discriminates, and
 * where it is absent the first route for that view is genuinely correct.
 */
export function canonicalForView(view, section) {
  const entries = Object.keys(ROUTE_META).filter((p) => ROUTE_META[p].view === view);
  if (!entries.length) return canonicalFor("/");
  if (entries.length === 1) return canonicalFor(entries[0]);
  const exact = entries.filter((p) => ROUTE_META[p].section === section)[0];
  return canonicalFor(exact || entries[0]);
}

// ---------------------------------------------------------------- schema

export const organisationSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Qura Healthcare",
  url: SITE,
  logo: SITE + "/icon-512.png",
  description: "A healthcare marketplace and growth CRM connecting clinicians, healthcare providers, workforce suppliers and medical suppliers.",
  sameAs: ["https://www.linkedin.com/company/qura-health"],
  contactPoint: [{
    "@type": "ContactPoint",
    contactType: "customer support",
    email: "support@qurahealth.org",
    availableLanguage: ["English"],
  }],
});

export const webSiteSchema = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Qura",
  url: SITE,
});

export function breadcrumbSchema(path) {
  const meta = ROUTE_META[path];
  if (!meta || path === "/") return null;
  const items = [{ "@type": "ListItem", position: 1, name: "Home", item: SITE + "/" }];
  // /inside-the-platform genuinely sits under /how-it-works, which is what the
  // canonical was clumsily trying to express. A breadcrumb says it correctly:
  // related, not duplicate.
  if (path === "/inside-the-platform") {
    items.push({ "@type": "ListItem", position: 2, name: ROUTE_META["/how-it-works"].title.split(" | ")[0], item: SITE + "/how-it-works" });
  }
  items.push({
    "@type": "ListItem",
    position: items.length + 1,
    name: meta.title.split(" | ")[0],
    item: canonicalFor(path),
  });
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items };
}

/**
 * FAQPage schema, built from the real FAQ data.
 *
 * Google requires the marked-up answers to be visible on the page. They are:
 * the FAQ renders every question and answer, collapsed rather than absent,
 * which satisfies the guideline. Only the main-site FAQ is marked up.
 */
export function faqSchema(groups) {
  const items = [];
  for (const g of (Array.isArray(groups) ? groups : [])) {
    for (const q of (g.items || [])) {
      items.push({
        "@type": "Question",
        name: q.q,
        acceptedAnswer: { "@type": "Answer", text: (q.a || []).join(" ") },
      });
    }
  }
  if (!items.length) return null;
  return { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: items };
}

/**
 * Plans on /pricing.
 *
 * Only marked up where a price is genuinely public and current. A price in
 * schema that does not match the page is a rich-result penalty, and marking up
 * a plan whose price is "on application" as though it had one would be
 * inventing a number.
 */
export function offersSchema(plans) {
  const offers = (Array.isArray(plans) ? plans : [])
    .filter((p) => typeof p.price === "number" && p.price >= 0)
    .map((p) => ({
      "@type": "Offer",
      name: p.name,
      price: String(p.price),
      priceCurrency: p.currency || "GBP",
      ...(p.period ? { eligibleDuration: p.period } : {}),
      url: SITE + "/pricing",
    }));
  if (!offers.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Qura Healthcare Growth CRM",
    provider: { "@type": "Organization", name: "Qura Healthcare", url: SITE },
    areaServed: ["GB", "US", "AU", "AE", "NG"],
    offers,
  };
}
