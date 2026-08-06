import { createClient } from "@supabase/supabase-js";
import { limited } from "./_ratelimit.js";
import { alertFounders } from "./_alert.js";
import { enrich } from "./_enrich.js";

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

// US notices are built and tested but off by default: the UK launch should not
// show an NHS supplier a Veterans Affairs contract. Set SOURCES_US=on in the
// environment to switch them back on, with no code change.
const US_ENABLED = String(process.env.SOURCES_US || "").toLowerCase() === "on";

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
    closes: daysLeft(t) || "",
    note: (t.description || "").replace(/\s+/g, " ").slice(0, 260),
    source,
    url: url || null,
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
      // EU fields arrive in 24 languages keyed by code. Without asking for
      // English, an Irish notice came back with a Hungarian title.
      const pick = (v) => {
        if (!v) return null;
        if (typeof v === "string") return v;
        const val = v.eng || Object.values(v)[0];
        return Array.isArray(val) ? val[0] : val;
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
        closes: "",
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
      closes: o.responseDeadLine ? String(o.responseDeadLine).slice(0, 10) : "",
      note: "US federal notice. Open the original for full detail.",
      source: "SAM.gov (US)",
      url: o.uiLink || "https://sam.gov/opp/" + (o.noticeId || ""),
      publishedAt: (o.postedDate || "").slice(0, 10),
      live: true,
    };
  });
}

// Both UK sources return one page at a time with a "next" link. Only reading
// the first page meant scanning 200 notices when there were thousands, so most
// UK opportunities were never seen. Neither source needs a key or rate limits
// us, so following a few pages is free.
async function getPaged(url, maxPages = 5) {
  const out = [];
  let next = url;
  for (let i = 0; i < maxPages && next; i++) {
    const d = await getJson(next);
    if (!d) break;
    const rel = d.releases || [];
    out.push(...rel);
    next = (d.links && d.links.next) || null;
    if (!rel.length) break;
  }
  return { releases: out };
}

export default async function handler(req, res) {
  // Scheduled job. The cron fires once a day, but founders need to re-run it
  // by hand after any change to how notices are fetched or shaped, since the
  // stored feed is what the product reads. A 4-a-day cap locked us out for 23
  // hours mid-fix, so the window is now hourly: still cheap, still protected
  // against anyone hammering it, but a rebuild is never more than an hour away.
  if (await limited(req, res, null, { bucket: "cron-tenders", limit: 6, windowSec: 3600 })) return;

  const sbUrl = process.env.SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!sbUrl || !service) return res.status(500).json({ error: "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY." });

  try {
    const since = new Date(Date.now() - 21 * 86400000);
    const isoDay = since.toISOString().slice(0, 10);

    const [fts, cf, eu, us] = await Promise.all([
      getPaged(FTS + "?updatedFrom=" + encodeURIComponent(since.toISOString().replace(/\.\d+Z$/, "Z")) + "&limit=100"),
      getPaged(CF + "?publishedFrom=" + isoDay + "&size=100"),
      euTenders(since.toISOString()),
      US_ENABLED ? usTenders(since.toISOString()) : Promise.resolve([]),
    ]);

    // Per-source caps. The EU board carries roughly a hundred times the volume
    // of the UK sources, so without a cap it swallows the feed and an NHS
    // supplier sees mostly Polish and Spanish notices. UK first, since that is
    // the primary market.
    // The US allowance is additive. The old cap of 80 meant every American
    // notice displaced a British one, so switching the US on quietly cost a
    // UK supplier a fifth of what they came for. The ceiling now rises by
    // more than the American allowance.
    const CAP = { eu: 20, us: 20 };
    const FEED_CAP = US_ENABLED ? 120 : 100;
    let items = [
      ...(Array.isArray(eu) ? eu : []).slice(0, CAP.eu),
      ...(Array.isArray(us) ? us : []).slice(0, CAP.us),
    ];
    // Notice URLs, verified against the live sites. The identifier differs by
    // source and neither is the ocid: Find a Tender uses the release id
    // ("072957-2026"), Contracts Finder uses the uuid embedded in its ocid.
    // An earlier version derived the reference from the ocid's last segment
    // and produced 404s on every link.
    for (const [pkg, source] of [[fts, "Find a Tender"], [cf, "Contracts Finder"]]) {
      for (const rel of ((pkg && pkg.releases) || [])) {
        if (!relevant(rel)) continue;
        let url = null;
        if (source === "Find a Tender") {
          const id = String(rel.id || "").trim();
          if (id) url = "https://www.find-tender.service.gov.uk/Notice/" + id;
        } else {
          const m = String(rel.ocid || "").match(/^ocds-[a-z0-9]+-(.+)$/i);
          if (m) url = "https://www.contractsfinder.service.gov.uk/notice/" + m[1];
        }
        items.push(normalise(rel, source, url));
      }
    }

    // newest first, and never the same notice twice
    // Portals republish amendments as separate notices, so the same contract
    // arrives several times. Collapse on buyer + title, keeping the newest.
    const byContract = new Map();
    for (const it of items) {
      const k = (it.buyer + "|" + it.title).toLowerCase().replace(/\s+/g, " ").trim();
      const prev = byContract.get(k);
      if (!prev || String(it.publishedAt || "") > String(prev.publishedAt || "")) byContract.set(k, it);
    }
    items = [...byContract.values()];

    const seen = new Set();
    const homeFirst = (x) =>
      (x.source === "Find a Tender" || x.source === "Contracts Finder") ? 0
      : x.source === "TED (EU)" ? 1 : 2;
    const unique = items
      .filter((i) => (seen.has(i.id) ? false : (seen.add(i.id), true)))
      .sort((a, b) => (homeFirst(a) - homeFirst(b)) ||
        String(b.publishedAt || "").localeCompare(String(a.publishedAt || "")))
      .slice(0, FEED_CAP)
      // Everything above this line any portal could give you. This is the part
      // that is Qura's: the trust matched against the register, the ICB, the
      // region, the procurement category, the platform the bid will run
      // through, and the named people already in the directory who decide it.
      .map((it) => {
        try {
          const e = enrich({ title: it.title, description: it.note, buyer: it.buyer, url: it.url });
          return {
            ...it,
            category: e.category,
            platform: e.platform,
            organisation: e.organisation,
            orgType: e.orgType,
            inRegister: e.inRegister,
            icb: e.icb,
            region: it.region || e.region,
            contacts: e.contacts,
          };
        } catch (err) {
          // Enrichment must never cost us the feed itself.
          return it;
        }
      });

    const sb = createClient(sbUrl, service, { auth: { persistSession: false } });
    const kvRead = async (owner, key) => {
      const { data } = await sb.from("kv").select("value").eq("owner", owner).eq("key", key).maybeSingle();
      if (!data) return null;
      try { return JSON.parse(data.value); } catch { return data.value; }
    };

    // Which of today's notices are actually NEW? Alerts fire on those only,
    // or a supplier would be pinged daily about the same notice.
    const prev = (await kvRead("shared", "tenders")) || {};
    const prevIds = new Set(((prev && prev.items) || []).map((i) => i.id));
    const fresh = unique.filter((i) => !prevIds.has(i.id));

    const payload = { items: unique, refreshedAt: new Date().toISOString(), sources: ["Find a Tender", "Contracts Finder", "TED (EU)", "SAM.gov (US)"] };
    await sb.from("kv").upsert({ owner: "shared", key: "tenders", value: JSON.stringify(payload) }, { onConflict: "owner,key" });

    // Saved alerts: match new notices against each subscriber's saved searches
    // and push at most ONE notification per person per day, naming the count.
    let alerted = 0;
    if (fresh.length) {
      const users = (await kvRead("shared", "tender_alert_users")) || [];
      for (const uid of (Array.isArray(users) ? users : []).slice(0, 500)) {
        try {
          const alerts = (await kvRead(uid, "tender_alerts")) || [];
          const hits = fresh.filter((n) => (Array.isArray(alerts) ? alerts : []).some((a) => {
            const mOk = a.market === "All" || n.market === a.market;
            const q = String(a.query || "").toLowerCase();
            const qOk = !q || (n.title + " " + n.buyer + " " + n.profession + " " + n.note).toLowerCase().includes(q);
            return mOk && qOk;
          }));
          if (!hits.length) continue;
          const reg = await kvRead(uid, "push_registration");
          // Respect the user's push preferences and quiet hours. Duplicated
          // from push-register.shouldPush because this cron builds its own
          // client; keep the two in step.
          const prefs = (reg && reg.prefs) || {};
          if (!reg || !reg.token || prefs.tenders === false) continue;
          if (prefs.quiet) {
            const from = prefs.quietFrom || "22:00", to = prefs.quietTo || "07:00";
            const now = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Europe/London" });
            if (from <= to ? (now >= from && now < to) : (now >= from || now < to)) continue;
          }
          const first = hits[0];
          await fetch("https://exp.host/--/api/v2/push/send", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              to: reg.token,
              title: hits.length === 1 ? "New tender matches your alert" : hits.length + " new tenders match your alerts",
              body: first.title.slice(0, 120) + (hits.length > 1 ? " and more" : ""),
              data: { screen: "Demand" },
            }),
          });
          alerted++;
        } catch (e) {}
      }
    }

    return res.status(200).json({ ok: true, count: unique.length, fresh: fresh.length, alerted, scanned: { uk: ((fts && fts.releases) || []).length + ((cf && cf.releases) || []).length, eu: (eu || []).length, us: (us || []).length } });
  } catch (e) {
    await alertFounders("cron-tenders", "Tender refresh failed", String((e && e.message) || e));
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
}
