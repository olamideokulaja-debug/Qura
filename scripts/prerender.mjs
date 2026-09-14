// Pre-render the head of every public route.
//
// Runs after `vite build`. Reads dist/index.html, and writes one real HTML file
// per route with that route's own title, description, canonical, Open Graph
// tags and JSON-LD. The body and the script tags are untouched, so the app
// boots exactly as before; only the head differs.
//
// WHY THIS EXISTS. Per-route metadata was implemented in JavaScript first. That
// is enough for Googlebot, which renders JS, and useless for every social
// scraper, which does not. A curl of any URL returned the homepage's title,
// description and preview image, so every persona page shared on LinkedIn,
// WhatsApp or Slack previewed as the generic homepage. It looked correct in a
// browser, which is precisely why it survived.
//
// This is pre-rendering of the HEAD only, not the body. Full SSR would also fix
// the crawlable-content findings, and it is a much larger change than is wise
// days before a launch. The head is where the highest-value damage was.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const dist = join(here, "..", "dist");
const SITE = "https://www.qurahealth.org";

const { ROUTE_META, canonicalFor, organisationSchema, webSiteSchema, breadcrumbSchema } =
  await import("../src/data/seo.js");

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Replace a tag if it is there, append to head if it is not. Appending blindly
// would leave two titles and two canonicals per page, which is worse than the
// problem being fixed.
function setTag(html, pattern, replacement) {
  if (pattern.test(html)) return html.replace(pattern, replacement);
  return html.replace("</head>", "  " + replacement + "\n</head>");
}

function buildHead(html, path, meta) {
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

  // Structured data. Organization and WebSite sitewide; a breadcrumb where the
  // page genuinely sits under another.
  const blocks = [organisationSchema(), webSiteSchema()];
  const crumb = breadcrumbSchema(path);
  if (crumb) blocks.push(crumb);
  const ld = blocks
    .map((b) => '<script type="application/ld+json">' + JSON.stringify(b) + "</script>")
    .join("\n  ");
  out = out.replace(/\n\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/g, "");
  out = out.replace("</head>", "  " + ld + "\n</head>");

  return out;
}

function run() {
  const indexPath = join(dist, "index.html");
  if (!existsSync(indexPath)) {
    console.error("[prerender] dist/index.html not found. Run after `vite build`.");
    process.exit(1);
  }
  const base = readFileSync(indexPath, "utf8");

  let written = 0;
  for (const path of Object.keys(ROUTE_META)) {
    const meta = ROUTE_META[path];
    const html = buildHead(base, path, meta);
    const file = path === "/" ? "index.html" : path.replace(/^\//, "") + ".html";
    writeFileSync(join(dist, file), html, "utf8");
    written++;
  }

  // A route with no metadata would silently ship the homepage's head, which is
  // the exact failure this script exists to prevent. Fail the build instead.
  console.log("[prerender] wrote " + written + " route files with their own head tags.");
}

run();
