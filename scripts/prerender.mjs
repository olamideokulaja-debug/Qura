// Pre-render the head, and a crawlable skeleton, for every public route.
//
// Runs after `vite build`. Reads dist/index.html and writes one real HTML file
// per route with that route's own title, description, canonical, Open Graph
// tags and JSON-LD, plus a static navigation block a crawler can follow without
// executing JavaScript.
//
// WHY THIS EXISTS. Per-route metadata was implemented in JavaScript first. That
// is enough for Googlebot, which renders JS, and useless for every social
// scraper, which does not. A curl of any URL returned the homepage's title,
// description and preview image, so every persona page shared on LinkedIn,
// WhatsApp or Slack previewed as the generic homepage. It looked correct in a
// browser, which is precisely why it survived.
//
// TWO DELIBERATE CONSTRAINTS, because this runs days before a launch:
//
//   The static block sits OUTSIDE #root, so React hydration can never collide
//   with it. Anything placed inside #root would be wiped the moment the app
//   mounts, and might flicker before it was.
//
//   It is wrapped in <noscript>, which is the honest construction rather than a
//   hidden div. It serves exactly the clients that cannot run JavaScript, which
//   is the audience being served. A visually-hidden block containing links a
//   user never sees is the shape of cloaking, and not worth the risk for a
//   signal the sitemap already provides.
//
// A DELIBERATE OMISSION: there is no JobPosting schema. The SEO audit
// recommended it, assuming Qura is a job board. It is not: the marketplace
// carries procurement notices, which are demand signals rather than vacancies.
// Marking them up as JobPosting would tell Google we are publishing jobs that
// do not exist, which is the kind of thing Google for Jobs removes sites for.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const dist = join(here, "..", "dist");

const { ROUTE_META, canonicalFor, organisationSchema, webSiteSchema, breadcrumbSchema, faqSchema, offersSchema } =
  await import("../src/data/seo.js");

// Both of these are optional. If either module moves, the build should still
// succeed without that markup rather than failing the deploy: a missing rich
// result is a small loss, a broken deploy days before launch is not.
let PRICING = null;
try {
  const mod = await import("../src/data/pricing.js");
  PRICING = mod.PLANS ? mod : null;
} catch (e) {
  console.warn("[prerender] pricing data not found; skipping Offer schema.");
}

let FAQ_GROUPS = null;
try {
  const mod = await import("../src/data/faqs.js");
  FAQ_GROUPS = mod.FAQ_GROUPS || null;
} catch (e) {
  console.warn("[prerender] FAQ data not found; skipping FAQ content and schema.");
}

const esc = (s) => String(s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Replace a tag if it is there, append to head if it is not. Appending blindly
// would leave two titles and two canonicals per page, which is worse than the
// problem being fixed.
function setTag(html, pattern, replacement) {
  if (pattern.test(html)) return html.replace(pattern, replacement);
  return html.replace("</head>", "  " + replacement + "\n</head>");
}

// The same links the footer renders, as real anchors. Kept in step with
// FOOTER_LINKS in App.jsx by hand; there are ten of them and they change about
// once a quarter, which is safer than reaching into the bundle at build time.
const NAV = Object.keys(ROUTE_META)
  .filter((p) => p !== "/")
  .map((p) => ({ href: p, label: ROUTE_META[p].title.split(" | ")[0] }));

function staticBlock(path) {
  const links = [{ href: "/", label: "Home" }, ...NAV]
    .filter((l) => l.href !== path)
    .map((l) => '<li><a href="' + l.href + '">' + esc(l.label) + "</a></li>")
    .join("");

  let faq = "";
  // The FAQ page's questions and answers, so they are present for a client that
  // cannot run JavaScript and so the FAQPage schema describes content that is
  // genuinely on the page. Structured data that marks up content the page does
  // not contain is a rich-result penalty.
  if (path === "/faq" && FAQ_GROUPS) {
    faq = FAQ_GROUPS.map((g) =>
      "<h2>" + esc(g.label) + "</h2>" +
      (g.items || []).map((q) =>
        "<h3>" + esc(q.q) + "</h3>" + (q.a || []).map((p) => "<p>" + esc(p) + "</p>").join("")
      ).join("")
    ).join("");
  }

  return "\n    <noscript>\n      <nav aria-label=\"Site\"><ul>" + links + "</ul></nav>\n" +
    (faq ? "      " + faq + "\n" : "") +
    "    </noscript>";
}

function buildPage(html, path, meta) {
  const canonical = canonicalFor(path);
  const title = esc(meta.title);
  const desc = esc(meta.description);

  let out = html;
  out = setTag(out, /<title>[\s\S]*?<\/title>/, "<title>" + title + "</title>");
  out = setTag(out, /<meta\s+name="description"[^>]*>/, '<meta name="description" content="' + desc + '" />');
  out = setTag(out, /<link\s+rel="canonical"[^>]*>/, '<link rel="canonical" href="' + canonical + '" />');
  out = setTag(out, /<meta\s+property="og:title"[^>]*>/, '<meta property="og:title" content="' + title + '" />');
  out = setTag(out, /<meta\s+property="og:description"[^>]*>/, '<meta property="og:description" content="' + desc + '" />');
  out = setTag(out, /<meta\s+property="og:url"[^>]*>/, '<meta property="og:url" content="' + canonical + '" />');
  out = setTag(out, /<meta\s+name="twitter:title"[^>]*>/, '<meta name="twitter:title" content="' + title + '" />');
  out = setTag(out, /<meta\s+name="twitter:description"[^>]*>/, '<meta name="twitter:description" content="' + desc + '" />');

  const blocks = [organisationSchema(), webSiteSchema()];
  const crumb = breadcrumbSchema(path);
  if (crumb) blocks.push(crumb);
  if (path === "/faq" && FAQ_GROUPS) {
    const f = faqSchema(FAQ_GROUPS);
    if (f) blocks.push(f);
  }
  if (path === "/pricing" && PRICING) {
    // Prices come from src/data/pricing.js, and src/pricing.test.js checks them
    // against what App.jsx actually renders. A price in schema that the page
    // does not show is a penalty rather than a win.
    const plans = PRICING.allPlans().map((p) => ({
      name: p.name,
      price: p.annualMonthly,
      currency: PRICING.CURRENCY,
      period: "P1M",
    }));
    const o = offersSchema(plans);
    if (o) blocks.push(o);
  }
  const ld = blocks
    .map((b) => '<script type="application/ld+json">' + JSON.stringify(b) + "</script>")
    .join("\n  ");
  out = out.replace(/\n\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/g, "");
  out = out.replace("</head>", "  " + ld + "\n</head>");

  // After the root div, never inside it. React owns #root; this must not be
  // anywhere it will be replaced on mount.
  out = out.replace('<div id="root"></div>', '<div id="root"></div>' + staticBlock(path));

  return out;
}

function run() {
  const indexPath = join(dist, "index.html");
  if (!existsSync(indexPath)) {
    console.error("[prerender] dist/index.html not found. Run after `vite build`.");
    process.exit(1);
  }
  const base = readFileSync(indexPath, "utf8");

  if (base.indexOf('<div id="root"></div>') < 0) {
    // The anchor changed, so the static block would be dropped silently and the
    // crawlable-links fix would quietly stop working. Fail loudly instead.
    console.error("[prerender] could not find <div id=\"root\"></div> to anchor the static block.");
    process.exit(1);
  }

  let written = 0;
  for (const path of Object.keys(ROUTE_META)) {
    const html = buildPage(base, path, ROUTE_META[path]);
    const file = path === "/" ? "index.html" : path.replace(/^\//, "") + ".html";
    writeFileSync(join(dist, file), html, "utf8");
    written++;
  }
  console.log("[prerender] wrote " + written + " route files with their own head tags and a crawlable nav.");
}

run();
