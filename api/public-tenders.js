import { kvGet } from "./_auth.js";

// GET /api/public-tenders
//
// The live tenders shown on the public homepage, before anyone signs in.
//
// The homepage shows a teaser, not the notice. A visitor sees the category,
// the opening words of the title, the place, the source and how long is left.
// The rest of the title and the buying organisation are sent only as lengths,
// so the page can draw a blurred stand-in of the right size: blurring real
// text in the browser would still leave it readable in the page data. The
// full title, buyer, contacts, links, values and descriptions stay behind
// sign-in, which is what a supplier creates an account for.
//
// It reads the same stored feed the signed-in demand screen reads, refreshed
// daily by api/refresh-tenders.js, so the homepage count and the in-app count
// always agree.

const UK_SOURCES = new Set(["Find a Tender", "Contracts Finder"]);

// The EU board gives places as 3-letter country codes ("SWE"), regional codes
// ("EE008") or "00" when unstated. Country codes become names; anything else
// is left blank rather than shown to a visitor as an unexplained code.
const COUNTRY = {
  AUT: "Austria", BEL: "Belgium", BGR: "Bulgaria", HRV: "Croatia", CYP: "Cyprus", CZE: "Czechia",
  DNK: "Denmark", EST: "Estonia", FIN: "Finland", FRA: "France", DEU: "Germany", GRC: "Greece",
  HUN: "Hungary", IRL: "Ireland", ITA: "Italy", LVA: "Latvia", LTU: "Lithuania", LUX: "Luxembourg",
  MLT: "Malta", NLD: "Netherlands", POL: "Poland", PRT: "Portugal", ROU: "Romania", SVK: "Slovakia",
  SVN: "Slovenia", ESP: "Spain", SWE: "Sweden", NOR: "Norway", ISL: "Iceland", LIE: "Liechtenstein",
  CHE: "Switzerland", GBR: "United Kingdom", USA: "United States", CAN: "Canada",
};
const place = (v) => {
  const s = String(v || "").trim();
  if (/^[A-Z]{3}$/.test(s)) return COUNTRY[s] || "";
  if (/^[A-Z]{2}[0-9A-Z]{1,3}$/.test(s) || /^0+$/.test(s)) return "";
  return s.slice(0, 60);
};
const SHOW = 20;

// Reference codes at the front of a title ("CPH158", "R/WP - 26/27") say
// nothing to a visitor, so the teaser starts at the first real word. EU
// titles arrive as "Country - service type - name"; the country is already
// shown as the place, so the teaser is the service type.
const CODE = /^(?=.*[\d/])[A-Z0-9./_-]+$/i;
const DASH = /^[-–—:|]+$/;
const SMALL = /^(?:of|the|a|an|and|for|to|in|on|at|with|by|&|\(\d+\))$/i;
const COUNTRIES = new Set(Object.values(COUNTRY));
const teaser = (title) => {
  let words = String(title || "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const total = words.join(" ").length;
  let i = 0;
  while (i < words.length - 1 && (CODE.test(words[i]) || DASH.test(words[i]))) i++;
  words = words.slice(i);
  if (words.length > 2 && COUNTRIES.has(words[0]) && DASH.test(words[1])) words = words.slice(2);
  // Never more than 3 real words, and never most of a short title.
  const most = Math.max(1, Math.floor(words.length * 0.6));
  const lead = [];
  let content = 0;
  for (const w of words) {
    if (DASH.test(w) || lead.length >= 5 || lead.length >= most || content >= 3) break;
    lead.push(w);
    if (!SMALL.test(w)) content++;
  }
  while (lead.length > 1 && SMALL.test(lead[lead.length - 1])) lead.pop();
  const text = lead.join(" ").replace(/[,:;(]+$/, "").slice(0, 40);
  return { lead: text, restLen: Math.max(14, Math.min(80, total - text.length)) };
};

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  let stored = null;
  try { stored = await kvGet("shared", "tenders"); } catch (e) { stored = null; }
  const all = Array.isArray(stored && stored.items) ? stored.items : [];

  // A second guard on closed notices, in case the daily refresh has not run
  // since a closing date passed.
  const today = new Date().toISOString().slice(0, 10);
  const open = all.filter((i) => !(/^\d{4}-\d{2}-\d{2}$/.test(String(i.closes || "")) && String(i.closes) < today));

  const shape = (i) => ({
    id: String(i.id || ""),
    ...teaser(i.title),
    category: String(i.category || "").slice(0, 60),
    buyerLen: Math.max(10, Math.min(60, String(i.buyer || "").length)),
    // Kept only until the new homepage is live; the old one still reads them.
    title: String(i.title || "Untitled notice").slice(0, 140),
    buyer: String(i.buyer || "").slice(0, 120),
    where: place(i.region),
    closes: String(i.closes || ""),
    source: String(i.source || ""),
    lens: UK_SOURCES.has(i.source) ? "uk" : "intl",
    publishedAt: i.publishedAt || null,
  });

  const uk = open.filter((i) => UK_SOURCES.has(i.source));
  const intl = open.filter((i) => !UK_SOURCES.has(i.source));

  // Cached at the edge for 15 minutes: the feed changes once a day, and this
  // is the most visited request on the site.
  res.setHeader("Cache-Control", "public, s-maxage=900, stale-while-revalidate=3600");
  return res.status(200).json({
    count: open.length,
    counts: { uk: uk.length, intl: intl.length },
    refreshedAt: (stored && stored.refreshedAt) || null,
    items: {
      global: open.slice(0, SHOW).map(shape),
      uk: uk.slice(0, SHOW).map(shape),
      intl: intl.slice(0, SHOW).map(shape),
    },
  });
}
