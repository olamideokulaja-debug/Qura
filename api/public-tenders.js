import { kvGet } from "./_auth.js";

// GET /api/public-tenders
//
// The live tenders shown on the public homepage, before anyone signs in.
//
// Every field here is already public on the official notice: the title, the
// buying organisation, where the work is, and when bids close. Nothing else
// leaves this endpoint. The named buyer contacts, notice links, values and
// descriptions stay behind sign-in, which is what a supplier creates an
// account for.
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
const SHOW = 12;

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
