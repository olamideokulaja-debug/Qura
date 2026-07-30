import { createClient } from "@supabase/supabase-js";
import { limited } from "./_ratelimit.js";
import { alertFounders } from "./_alert.js";

export const config = { maxDuration: 60 };

// Real public procurement notices, pulled daily into the demand feed.
//
// Two free government sources, no key required:
//   Find a Tender          higher value notices, above threshold
//   Contracts Finder       lower value notices, below threshold
//
// Both publish Open Contracting data. We keep only what a healthcare workforce
// supplier could actually pursue, normalise it into the same shape as the rest
// of the demand feed, and store it in Supabase for the API to read.
//
// This is Public Intelligence: everything here is verifiable at its source, and
// each record carries a link back to the original notice.

const FTS = "https://www.find-tender.service.gov.uk/api/1.0/ocdsReleasePackages";
const CF = "https://www.contractsfinder.service.gov.uk/Published/Notices/OCDS/Search";
// European Union, which covers Ireland and 26 other member states. Different
// format from the UK sources, so it is normalised separately below.
const TED = "https://api.ted.europa.eu/v3/notices/search";
const CANADA = "https://canadabuys.canada.ca/opendata/pub/openTenderNotice-ouvertAvisAppelOffres.csv";
// United States federal opportunities. Needs a free personal key from SAM.gov,
// set as SAMGOV_API_KEY in Vercel. Personal keys allow only about 10 calls a
// day, so this makes exactly one call per run and no retries.
const SAM = "https://api.sam.gov/opportunities/v2/search";

// Filtering, tuned against live data rather than guessed. A first attempt that
// matched on "medical" pulled in things like medical gas pipeline maintenance,
// which is not work a workforce supplier can bid for.
const CPV_PERSONNEL = ["796"];          // supply of personnel, always relevant
const CPV_HEALTH_SERVICES = ["85", "7512"];
const BUYER_PATTERNS = /\b(nhs|health board|healthcare|integrated care|hospital|hospice|ambulance|icb)\b/i;
// Words that mean people, or work delivered by people
const WORKFORCE_WORDS = /\b(staffing|locum|bank staff|agency staff|workforce|recruit\w*|nursing|nurses?|clinician\w*|insourc\w*|outsourc\w*|waiting list|radiograph\w*|sonograph\w*|endoscop\w*|theatre lists?|consultant\w*|physiotherap\w*|psychiatr\w*|dental|general practice|community health|domiciliary|care staff|allied health)\b/i;

function relevant(rel) {
  const t = rel.tender || {};
  // Buying equipment or supplies is not a workforce opportunity.
  if (t.mainProcurementCategory === "goods") return false;
  const buyer = ((rel.buyer || {}).name || "");
  const cpv = String(((t.classification || {}).id) || "");
  const text = ((t.title || "") + " " + (t.description || ""));
  const buyerHit = BUYER_PATTERNS.test(buyer);
  const wordHit = WORKFORCE_WORDS.test(text);
  if (CPV_PERSONNEL.some((p) => cpv.startsWith(p))) return true;
  if (CPV_HEALTH_SERVICES.some((p) => cpv.startsWith(p)) && (buyerHit || wordHit)) return true;
  return buyerHit && wordHit;
}

function region(rel) {
  const parties = rel.parties || [];
  for (const p of parties) {
    const loc = (p.address || {}).locality;
    if (loc) return loc;
  }
  const items = ((rel.tender || {}).items) || [];
  for (const it of items) {
    for (const a of (it.deliveryAddresses || [])) {
      if (a.postalCode) return "UK";
    }
  }
  return "UK";
}

function money(t) {
  const v = (t.value || {}).amount;
  if (!v || typeof v !== "number") return null;
  if (v >= 1000000) return "£" + (v / 1000000).toFixed(1) + "m";
  if (v >= 1000) return "£" + Math.round(v / 1000) + "k";
  return "£" + Math.round(v);
}

function daysLeft(t) {
  const end = ((t.tenderPeriod || {}).endDate) || null;
  if (!end) return null;
  const d = Math.ceil((Date.parse(end) - Date.now()) / 86400000);
  if (isNaN(d) || d < 0) return null;
  return d === 0 ? "today" : d === 1 ? "1 day" : d + " days";
}

function normalise(rel, source, url) {
  const t = rel.tender || {};
  const buyer = ((rel.buyer || {}).name || "Unnamed buyer");
  return {
    id: "ft_" + (rel.ocid || rel.id),
    title: (t.title || "Untitled notice").slice(0, 140),
    buyer: buyer.replace(/\s+/g, " ").trim(),
    region: region(rel),
    market: BUYER_PATTERNS.test(buyer) ? "NHS" : "Private",
    profession: ((t.classification || {}).description) || "Healthcare services",
    rate: money(t) || "Value not stated",
    need: (t.mainProcurementCategory || "services"),
    start: ((t.contractPeriod || {}).startDate || "").slice(0, 10) || "Not stated",
    closes: daysLeft(t) || "See notice",
    note: (t.description || "").replace(/\s+/g, " ").slice(0, 260),
    source,
    url,
    publishedAt: rel.date || null,
    live: true,
  };
}

async function getJson(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    const r = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": "QuraTenderBot/1.0 (+https://qurahealth.org)", Accept: "application/json" },
    });
    if (!r.ok) return null;
    return await r.json();
  } catch (e) {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// The EU notice board publishes a different shape from the UK sources, so it
// gets its own reader. Ireland is here rather than in the UK feeds.
async function euTenders(sinceIso) {
  const day = sinceIso.slice(0, 10).replace(/-/g, "");
  const body = {
    query: "classification-cpv IN (85000000) AND publication-date>=" + day,
    limit: 100,
    fields: ["notice-title", "buyer-name", "publication-date", "place-of-performance", "publication-number", "deadline-receipt-tender-date-lot"],
  };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    const r = await fetch(TED, {
      method: "POST", signal: ctrl.signal,
      headers: { "Content-Type": "application/json", Accept: "application/json", "User-Agent": "QuraTenderBot/1.0 (+https://qurahealth.org)" },
      body: JSON.stringify(body),
    });
    if (!r.ok) return [];
    const d = await r.json();
    return ((d && d.notices) || []).map((n) => {
      const pick = (v) => {
        if (!v) return null;
        if (typeof v === "string") return v;
        const vals = Object.values(v);
        const first = vals[0];
        return Array.isArray(first) ? first[0] : first;
      };
      const num = n["publication-number"];
      const country = ((n["place-of-performance"] || [])[1]) || ((n["place-of-performance"] || [])[0]) || "EU";
      return {
        id: "ted_" + num,
        title: (pick(n["notice-title"]) || "Untitled notice").slice(0, 140),
        buyer: (pick(n["buyer-name"]) || "Unnamed buyer").slice(0, 120),
        region: country,
        market: "International",
        profession: "Health and social work services",
        rate: "Value not stated",
        need: "services",
        start: "Not stated",
        closes: "See notice",
        note: "Published on the EU notice board. Open the notice for full detail.",
        source: "TED (EU)",
        url: "https://ted.europa.eu/en/notice/" + num,
        publishedAt: (n["publication-date"] || "").slice(0, 10),
        live: true,
      };
    });
  } catch (e) {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

// US federal notices, narrowed to temporary staffing (NAICS 561320). Checked
// against live data: that code returns a small, high-quality set dominated by
// Veterans Affairs and Health and Human Services clinical staffing, which is
// exactly the work a healthcare workforce supplier bids for. Broader codes
// return thousands of records and would need paging the daily quota cannot pay
// for.
async function usTenders(sinceIso) {
  const key = process.env.SAMGOV_API_KEY;
  if (!key) return [];
  const us = (d) => {
    const x = new Date(d);
    return String(x.getMonth() + 1).padStart(2, "0") + "/" + String(x.getDate()).padStart(2, "0") + "/" + x.getFullYear();
  };
  const url = SAM + "?api_key=" + encodeURIComponent(key) +
    "&postedFrom=" + us(sinceIso) + "&postedTo=" + us(new Date().toISOString()) +
    "&ncode=561320&limit=100";
  const d = await getJson(url);
  const rows = (d && d.opportunitiesData) || [];
  return rows.map((o) => {
    const dept = (o.fullParentPathName || "").split(".")[0] || "US federal";
    const place = (o.placeOfPerformance || {});
    const state = (place.state || {}).name || (place.city || {}).name || "United States";
    return {
      id: "sam_" + (o.noticeId || o.solicitationNumber),
      title: (o.title || "Untitled notice").slice(0, 140),
      buyer: dept.replace(/\s+/g, " ").trim().slice(0, 120),
      region: state,
      market: "International",
      profession: "Temporary healthcare staffing",
      rate: "Value not stated",
      need: (o.type || "services"),
      start: (o.postedDate || "").slice(0, 10) || "Not stated",
      closes: o.responseDeadLine ? String(o.responseDeadLine).slice(0, 10) : "See notice",
      note: "US federal notice. Open the original for full detail.",
      source: "SAM.gov (US)",
      url: o.uiLink || "https://sam.gov/opp/" + (o.noticeId || ""),
      publishedAt: (o.postedDate || "").slice(0, 10),
      live: true,
    };
  });
}

export default async function handler(req, res) {
  // Scheduled job. Cron fires once a day, so a tight limit costs nothing and
  // stops anyone else triggering it repeatedly.
  if (await limited(req, res, null, { bucket: "cron-tenders", limit: 4, windowSec: 86400 })) return;

  const sbUrl = process.env.SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!sbUrl || !service) return res.status(500).json({ error: "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY." });

  try {
    const since = new Date(Date.now() - 21 * 86400000);
    const isoDay = since.toISOString().slice(0, 10);

    const [fts, cf, eu, us] = await Promise.all([
      getJson(FTS + "?updatedFrom=" + encodeURIComponent(since.toISOString().replace(/\.\d+Z$/, "Z")) + "&limit=100"),
      getJson(CF + "?publishedFrom=" + isoDay + "&size=100"),
      euTenders(since.toISOString()),
      usTenders(since.toISOString()),
    ]);

    // EU notices are already normalised; the UK ones still need mapping.
    const items = [...(Array.isArray(eu) ? eu : []), ...(Array.isArray(us) ? us : [])];
    for (const [pkg, source, base] of [
      [fts, "Find a Tender", "https://www.find-tender.service.gov.uk/Notice/"],
      [cf, "Contracts Finder", "https://www.contractsfinder.service.gov.uk/Notice/"],
    ]) {
      for (const rel of ((pkg && pkg.releases) || [])) {
        if (!relevant(rel)) continue;
        const ref = String(rel.ocid || rel.id || "").split("-").pop();
        items.push(normalise(rel, source, base + ref));
      }
    }

    // newest first, and never the same notice twice
    const seen = new Set();
    const unique = items
      .filter((i) => (seen.has(i.id) ? false : (seen.add(i.id), true)))
      .sort((a, b) => String(b.publishedAt || "").localeCompare(String(a.publishedAt || "")))
      .slice(0, 80);

    const sb = createClient(sbUrl, service, { auth: { persistSession: false } });
    const payload = { items: unique, refreshedAt: new Date().toISOString(), sources: ["Find a Tender", "Contracts Finder", "TED (EU)", "SAM.gov (US)"] };
    await sb.from("kv").upsert({ owner: "shared", key: "tenders", value: payload }, { onConflict: "owner,key" });

    return res.status(200).json({ ok: true, count: unique.length, scanned: ((fts && fts.releases) || []).length + ((cf && cf.releases) || []).length });
  } catch (e) {
    await alertFounders("cron-tenders", "Tender refresh failed", String((e && e.message) || e));
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
}
