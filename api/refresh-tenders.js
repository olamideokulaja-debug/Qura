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
const TODAY_ISO = new Date().toISOString().slice(0, 10);

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

// Independent healthcare providers, so the feed is not NHS-only. These are
// buyers of clinical services in their own right.
const INDEPENDENT_HEALTH = /\b(spire|nuffield|circle health|hca healthcare|ramsay|bmi healthcare|practice plus|inhealth|alliance medical|care uk|bupa|priory|cygnet|elysium|st andrew'?s healthcare|benenden|king edward vii|london clinic|cleveland clinic|medicare|vita health|totally plc|medinet)\b/i;

// Buyers that are not healthcare organisations however health-adjacent the
// wording gets. A county council commissioning a children's programme and a
// procurement publisher running a staffing framework both used to slip in
// through the personnel CPV code, which does not look at who is buying.
const NOT_HEALTH_BUYER = /\b(county council|city council|borough council|district council|parish council|\bcouncil\b|police|fire and rescue|university of|college|academy trust|school|housing association|bip solutions|ministry of defence|home office|dwp|hmrc)\b/i;

function healthBuyer(name) {
  const b = String(name || "");
  if (NOT_HEALTH_BUYER.test(b)) return false;
  return BUYER_PATTERNS.test(b) || INDEPENDENT_HEALTH.test(b);
}
// Words that mean people, or work delivered by people
const WORKFORCE_WORDS = /\b(staffing|locum|bank staff|agency staff|workforce|recruit\w*|nursing|nurses?|clinician\w*|insourc\w*|outsourc\w*|waiting list|radiograph\w*|sonograph\w*|endoscop\w*|theatre lists?|consultant\w*|physiotherap\w*|psychiatr\w*|dental|general practice|community health|domiciliary|care staff|allied health)\b/i;

function relevant(rel) {
  const t = rel.tender || {};
  // Buying equipment or supplies is not a workforce opportunity.
  if (t.mainProcurementCategory === "goods") return false;

  // Nor is a contract that has already been awarded. OCDS tags the release:
  // "tender" is an open opportunity, "award" and "contract" mean it is done.
  // Find a Tender's F03 award notices were arriving as live opportunities, so
  // a supplier could open a notice, read it, and only then discover the work
  // was given to someone else last week. NHS South Yorkshire ICB publishes one
  // award notice per pharmacy contractor, which is why several nearly
  // identical ones appeared at once.
  const tags = Array.isArray(rel.tag) ? rel.tag.map((x) => String(x).toLowerCase()) : [];
  if (tags.some((x) => /award|contract|implementation/.test(x))) return false;
  if (Array.isArray(rel.awards) && rel.awards.length) return false;
  if (/\bcontract award notice\b/i.test(String(t.title || "") + " " + String(t.description || ""))) return false;
  const buyer = ((rel.buyer || {}).name || "");
  const cpv = String(((t.classification || {}).id) || "");
  const text = ((t.title || "") + " " + (t.description || ""));
  // Who is buying decides first. The personnel CPV code used to admit anything
  // about temporary staff regardless of buyer, which is how a council's
  // business support contract and a procurement publisher's framework reached
  // a healthcare feed.
  if (!healthBuyer(buyer)) return false;
  const wordHit = WORKFORCE_WORDS.test(text);
  if (CPV_PERSONNEL.some((p) => cpv.startsWith(p))) return true;
  if (CPV_HEALTH_SERVICES.some((p) => cpv.startsWith(p))) return true;
  return wordHit;
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

const SYMBOL = { GBP: "£", EUR: "€", USD: "$", CAD: "C$", AUD: "A$" };

// Format any figure once, so every source prints the same way.
function fmt(v, cur) {
  if (!v || typeof v !== "number" || v <= 0) return null;
  const s = SYMBOL[(cur || "GBP").toUpperCase()] || ((cur || "") + " ");
  if (v >= 1000000) return s + (v / 1000000).toFixed(1) + "m";
  if (v >= 1000) return s + Math.round(v / 1000) + "k";
  return s + Math.round(v);
}

// OCDS puts the figure in whichever field the buyer filled in. Reading only
// tender.value.amount left 7 of 9 Find a Tender notices saying "Value not
// stated" when the number was published a field away. Checked in order of how
// firm the figure is: an agreed value beats an estimate, which beats a range.

// ------------------------------------------------------- notice contacts
// Every portal publishes who to approach; each does it differently. These
// helpers put them all into one shape so the directory does not care where a
// contact came from.
//
// Measured on live data: 40 of 40 UK OCDS releases carry a NAMED buyer contact
// with an email. SAM names the contracting officer. TED usually gives a
// departmental mailbox rather than a person.
const ORG_WORDS = /\b(team|department|departement|direction|service|services|unit|office|bureau|procurement|purchasing|contracts?|tender|admin|enquiries|helpdesk|mailbox|group|division|council|trust|nhs|ltd|limited|plc|gmbh|sarl|university|hospital)\b/i;

// A directory of decision-makers should hold people, not shared inboxes. A
// departmental contact is still worth showing on the notice, but importing it
// as a named decision-maker would quietly degrade the register.
function isPerson(name) {
  const n = String(name || "").trim();
  if (n.length < 4 || n.length > 60) return false;
  if (ORG_WORDS.test(n)) return false;
  const parts = n.split(/\s+/).filter(Boolean);
  if (parts.length < 2 || parts.length > 5) return false;
  return parts.every((w) => /^[A-Z\u00C0-\u00DE][A-Za-z\u00C0-\u024F'".-]*$/.test(w));
}

function initialsOfName(n) {
  return String(n || "?").split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "??";
}

function contactRecord({ name, role, org, email, phone, source, url }) {
  const person = isPerson(name);
  return {
    name: person ? String(name).trim() : (String(name || "").trim() || "Procurement contact"),
    role: String(role || "").trim() || (person ? "Named on procurement notice" : "Procurement contact point"),
    org: String(org || "").trim().slice(0, 140),
    email: String(email || "").trim() || null,
    phone: String(phone || "").trim() || null,
    initials: initialsOfName(person ? name : org),
    source, sourceUrl: url || null,
    // Only named individuals join the register. Shared inboxes stay on the
    // notice where they belong.
    directory: person && Boolean(String(email || "").trim() || String(phone || "").trim()),
  };
}

// UK: Find a Tender and Contracts Finder, OCDS parties[].contactPoint.
function ukContacts(rel, url, source) {
  const out = [];
  for (const p of (rel.parties || [])) {
    const roles = (p.roles || []).map((r) => String(r).toLowerCase());
    if (!roles.includes("buyer") && !roles.includes("procuringentity")) continue;
    const cp = p.contactPoint || {};
    if (!cp.name && !cp.email) continue;
    out.push(contactRecord({
      name: cp.name, role: "", org: p.name || (rel.buyer || {}).name,
      email: cp.email, phone: cp.telephone, source, url,
    }));
  }
  return out.slice(0, 4);
}

function money(t, rel) {
  const cur = (t.value || {}).currency || (t.minValue || {}).currency ||
              (t.maxValue || {}).currency || "GBP";
  const direct = [
    (t.value || {}).amount,
    (t.maxValue || {}).amount,
    (t.minValue || {}).amount,
  ];
  for (const v of direct) { const f = fmt(v, cur); if (f) return f; }

  // Awards carry the figure once a contract is let.
  for (const a of ((rel && rel.awards) || [])) {
    const f = fmt((a.value || {}).amount, (a.value || {}).currency || cur);
    if (f) return f;
  }

  // Lot-level values: sum them, since the notice as a whole is what a supplier
  // is sizing up. Only summed when every lot carries a figure, or the total
  // would understate the contract and that is worse than saying nothing.
  const lots = t.lots || [];
  if (lots.length) {
    const amounts = lots.map((l) => (l.value || {}).amount).filter((x) => typeof x === "number" && x > 0);
    if (amounts.length === lots.length) {
      const f = fmt(amounts.reduce((a, b) => a + b, 0), ((lots[0].value || {}).currency) || cur);
      if (f) return f;
    }
  }
  return null;
}

function daysLeft(t) {
  // Same problem as the value: the closing date is not always on tenderPeriod.
  const end = ((t.tenderPeriod || {}).endDate) ||
              ((t.enquiryPeriod || {}).endDate) ||
              ((t.awardPeriod || {}).startDate) || null;
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
    rate: money(t, rel) || "Value not stated",
    need: (t.mainProcurementCategory || "services"),
    start: ((t.contractPeriod || {}).startDate || "").slice(0, 10) || "Not stated",
    closes: daysLeft(t) || "",
    note: (t.description || "").replace(/\s+/g, " ").slice(0, 260),
    source,
    url: url || null,
    publishedAt: rel.date || null,
    noticeContacts: ukContacts(rel, url, source),
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
    fields: ["notice-title", "buyer-name", "publication-date", "place-of-performance",
             "publication-number", "deadline-receipt-tender-date-lot",
             "total-value", "total-value-cur", "estimated-value-lot", "estimated-value-cur-lot",
             "organisation-email-buyer", "organisation-contact-point-buyer"],
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
      // TED returns most things as arrays, and dates carry a UTC offset.
      const one = (v) => (Array.isArray(v) ? v[0] : v);
      const tedDate = (v) => {
        const d = one(v);
        return d ? String(d).slice(0, 10) : "";
      };
      const tedMoney = () => {
        const pairs = [[n["total-value"], n["total-value-cur"]],
                       [n["estimated-value-lot"], n["estimated-value-cur-lot"]]];
        for (const [amt, cur] of pairs) {
          const a = one(amt);
          const f = fmt(typeof a === "string" ? Number(a) : a, one(cur) || "EUR");
          if (f) return f;
        }
        return null;
      };
      const deadline = tedDate(n["deadline-receipt-tender-date-lot"]);
      const country = ((n["place-of-performance"] || [])[1]) || ((n["place-of-performance"] || [])[0]) || "EU";
      return {
        id: "ted_" + num,
        title: (pick(n["notice-title"]) || "Untitled notice").slice(0, 140),
        buyer: (pick(n["buyer-name"]) || "Unnamed buyer").slice(0, 120),
        region: country,
        market: "International",
        profession: "Health and social work services",
        rate: tedMoney() || "Value not stated",
        need: "services",
        start: "Not stated",
        closes: deadline,
        note: "Published on the EU notice board. Open the notice for full detail.",
        source: "TED (EU)",
        url: "https://ted.europa.eu/en/notice/" + num,
        publishedAt: (n["publication-date"] || "").slice(0, 10),
        // TED usually publishes a departmental mailbox rather than a person,
        // so most of these will show on the notice without joining the
        // register. contactRecord decides, not this call site.
        noticeContacts: [contactRecord({
          name: pick(n["organisation-contact-point-buyer"]),
          org: pick(n["buyer-name"]),
          email: one(n["organisation-email-buyer"]),
          source: "TED (EU)",
          url: "https://ted.europa.eu/en/notice/" + num,
        })].filter((c) => c.email || c.phone),
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
    // SAM publishes the contracting officer on the notice itself: name, title,
    // email and phone. Nothing else in the feed carries this, and until now it
    // was being discarded. Primary contact first, secondary after.
    const poc = (Array.isArray(o.pointOfContact) ? o.pointOfContact : [])
      .filter((c) => c && (c.fullName || c.email))
      .sort((a, b) => (a.type === "primary" ? -1 : 0) - (b.type === "primary" ? -1 : 0))
      .slice(0, 4)
      .map((c) => contactRecord({
        name: c.fullName, role: c.title,
        org: dept.replace(/\s+/g, " ").trim(),
        email: c.email, phone: c.phone,
        source: "SAM.gov (US)",
        url: o.uiLink || ("https://sam.gov/opp/" + (o.noticeId || "")),
      }));

    return {
      id: "sam_" + (o.noticeId || o.solicitationNumber),
      noticeContacts: poc,
      title: (o.title || "Untitled notice").slice(0, 140),
      buyer: dept.replace(/\s+/g, " ").trim().slice(0, 120),
      region: state,
      market: "International",
      profession: "Temporary healthcare staffing",
      // US solicitations usually publish no figure until award, but awarded
      // notices carry one. Read it where it exists rather than hardcoding.
      rate: fmt(Number((o.award || {}).amount), "USD") || "Value not stated",
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
    // 21 days was too short once award notices were excluded: a healthcare
    // tender is typically open for four to six weeks, so a three-week window
    // was missing opportunities that are still live and still biddable. 45
    // days captures the full response period without dragging in stale ones,
    // and closed notices fall out on their closing date anyway.
    const since = new Date(Date.now() - 45 * 86400000);
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
          // noticeContacts must be passed through or enrich never sees the
          // contracting officers the notice published, and falls back to a
          // register lookup that has no US entries.
          const e = enrich({ title: it.title, description: it.note, buyer: it.buyer, url: it.url,
                             source: it.source, noticeContacts: it.noticeContacts });
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

    // ---------------------------------------------------------------------
    // Contacts named on procurement notices, from EVERY source.
    //
    // These are people the buyer has published as the route in on a specific
    // piece of work. Qura's value here is the assembly: one place, deduplicated
    // across thousands of notices, searchable next to the register. Anyone can
    // still go and read the original notice for nothing.
    //
    // Only NAMED INDIVIDUALS are imported. contactRecord sets `directory` and
    // shared departmental inboxes are excluded, because a register of
    // decision-makers full of procurement@ addresses is worth less than one
    // without them.
    try {
      const prior = (await kvRead("shared", "notice_contacts")) || [];
      const byKey = new Map();
      for (const c of (Array.isArray(prior) ? prior : [])) {
        byKey.set(String(c.email || (c.name + "|" + c.org)).toLowerCase(), c);
      }
      let fresh = 0;
      for (const it of unique) {
        for (const c of (it.noticeContacts || [])) {
          if (!c.directory) continue;
          const k = String(c.email || (c.name + "|" + c.org)).toLowerCase();
          if (!k || k === "|") continue;
          const existing = byKey.get(k);
          if (existing) {
            existing.lastSeenAt = TODAY_ISO;
            existing.noticeCount = (existing.noticeCount || 1) + 1;
            existing.lastNotice = c.sourceUrl || existing.lastNotice || null;
            if (!existing.email && c.email) existing.email = c.email;
            if (!existing.phone && c.phone) existing.phone = c.phone;
            continue;
          }
          byKey.set(k, {
            name: c.name, role: c.role, org: c.org,
            email: c.email || null, phone: c.phone || null,
            initials: c.initials,
            spec: "Procurement & Commercial Leadership",
            group: "Commissioning",
            source: c.source,
            sourceUrl: c.sourceUrl,
            lastNotice: c.sourceUrl,
            noticeCount: 1,
            addedAt: TODAY_ISO,
            lastSeenAt: TODAY_ISO,
          });
          fresh++;
        }
      }
      const list = [...byKey.values()];
      await sb.from("kv").upsert({ owner: "shared", key: "notice_contacts", value: JSON.stringify(list) }, { onConflict: "owner,key" });
      console.log("[tenders] notice_contacts: " + list.length + " total, " + fresh + " new this run");
    } catch (e) {
      console.error("[tenders] notice_contacts write failed: " + (e && e.message));
    }
      console.error("[tenders] us_contacts write failed: " + (e && e.message));
    }

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
