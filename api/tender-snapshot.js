import crypto from "node:crypto";
import { getUser, kvGet, kvSet } from "./_auth.js";
import { limited } from "./_ratelimit.js";
import { planOf, ENTITLEMENTS } from "./_entitlements.js";
import { isFounderEmail } from "./_orgcheck.js";
import { bump } from "./_metrics.js";
import { adminClient } from "./_waitlist.js";

export const config = { maxDuration: 60 };

// Tender Snapshot (1 October 2026, brief "Tender Snapshot and Intelligence
// Archive", v2). The key commercial points of a live tender, as structured
// fields, so a supplier can judge it in seconds without leaving Qura.
//
// POST /api/tender-snapshot { id }                    the Snapshot
// POST /api/tender-snapshot { id, action: "source" }  counts a click through to the official notice
// POST /api/tender-snapshot { id, refresh: true }      founders: make it again
//
// What it reads, in this order:
//   1. the full notice as published: the copy kept in the tender archive
//      (api/_tenderarchive.js, table "tenders"), or else fetched from the
//      Find a Tender API. Contracts Finder has no per-notice API that works,
//      so a Contracts Finder notice the archive has not yet kept uses the
//      feed's own fields.
//   Archived tenders that have left the live feed (closed or awarded) can
//   have a Snapshot too; the notice is then rebuilt from the archive.
//   2. tender documents linked from the notice that are publicly downloadable
//      PDFs (at most 2). Most NHS tender packs sit behind a supplier login on
//      Atamis, Jaggaer or similar, so Qura cannot read them, and says so.
//
// Accuracy rules (from the brief): nothing is guessed. A field the sources do
// not state comes back null and shows as "Not stated in tender". Where sources
// disagree the field is flagged for a full-document check. Qura never says
// whether to bid. The deadline, title and buyer are taken straight from the
// notice data, never from the model.
//
// Cost: one model call per notice version. The Snapshot is kept under
// kv("tender_snapshot", id) with a version hash of what it was made from, so
// every later view is free. If the notice changes, the next view makes a new
// one and the old one is kept in its history (the brief: historic Snapshots
// must not silently change).
//
// Access: paid supplier plans (trials included). Everyone else gets 3
// different tenders free; reopening one of those 3 never counts again.

const FREE_SNAPSHOTS = 3;
const FREE_KEY = "snapshot_free";
const SNAP_OWNER = "tender_snapshot";
const DETAIL_OWNER = "tender_detail";
const MODEL = "claude-sonnet-4-6";
const PROMPT_VERSION = 2; // raise to remake every Snapshot after a prompt change
const MAX_DOCS = 2;
const MAX_DOC_BYTES = 4500000;

const FIELDS = [
  ["title", "Tender title"], ["buyer", "Buying organisation"], ["value", "Contract value"], ["term", "Contract term"],
  ["deadline", "Deadline"], ["service", "Service requirement"], ["geography", "Geography / sites"], ["lots", "Lots"],
  ["route", "Procurement route"], ["eligibility", "Eligibility"], ["volumes", "Volumes / deliverables"],
  ["pricing", "Pricing model"], ["evaluation", "Evaluation"], ["conditions", "Commercial conditions"],
];

const hash = (s) => crypto.createHash("sha256").update(s).digest("hex").slice(0, 20);
const clean = (v, n) => (v == null ? null : String(v).replace(/\s+/g, " ").trim().slice(0, n) || null);

async function fetchWithTimeout(url, ms, opts = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try { return await fetch(url, { ...opts, signal: ctrl.signal, headers: { "User-Agent": "QuraTenderBot/1.0 (+https://qurahealth.org)", ...(opts.headers || {}) } }); }
  finally { clearTimeout(timer); }
}

async function archived(id) {
  try {
    const sb = adminClient();
    if (!sb) return null;
    const { data } = await sb.from("tenders").select("id,title,buyer,region,advertised_value,currency,description,category,source,source_url,closing_date,detail").eq("id", id).maybeSingle();
    return data || null;
  } catch (e) { return null; }
}

// The notice in full: the archive copy if there is one, otherwise fetched
// from the Find a Tender public API.
async function noticeDetail(notice) {
  const kept = await kvGet(DETAIL_OWNER, notice.id);
  if (kept && typeof kept === "object") return kept;
  const row = notice._archive || (await archived(notice.id));
  if (row && row.detail && typeof row.detail === "object") return row.detail;
  const m = String(notice.url || "").match(/find-tender\.service\.gov\.uk\/Notice\/([0-9]{6}-[0-9]{4})/);
  if (!m) return null;
  try {
    const r = await fetchWithTimeout("https://www.find-tender.service.gov.uk/api/1.0/ocdsReleasePackages/" + m[1], 12000, { headers: { Accept: "application/json" } });
    if (!r.ok) return null;
    const rel = ((await r.json()).releases || [])[0];
    return rel ? { source: "Find a Tender", releaseId: rel.id, date: rel.date, buyer: (rel.buyer || {}).name, tender: rel.tender || {} } : null;
  } catch (e) { return null; }
}

// Publicly downloadable PDFs linked from the notice. Anything behind a login,
// not a PDF, or too large is listed as not read.
async function publicDocs(detail) {
  const docs = ((detail && detail.tender && detail.tender.documents) || []).filter((d) => d && /^https?:\/\//i.test(String(d.url || "")));
  const read = [], notRead = [];
  for (const d of docs) {
    const label = clean(d.title || d.documentType || "Tender document", 80);
    if (read.length >= MAX_DOCS) { notRead.push({ title: label, url: d.url, why: "limit" }); continue; }
    try {
      const r = await fetchWithTimeout(d.url, 10000, { redirect: "follow" });
      const type = String(r.headers.get("content-type") || "");
      const len = Number(r.headers.get("content-length") || 0);
      if (!r.ok || !/pdf/i.test(type) || len > MAX_DOC_BYTES) { notRead.push({ title: label, url: d.url, why: !r.ok ? "not public" : !/pdf/i.test(type) ? "not a PDF" : "too large" }); continue; }
      const buf = Buffer.from(await r.arrayBuffer());
      if (buf.length > MAX_DOC_BYTES || buf.slice(0, 4).toString() !== "%PDF") { notRead.push({ title: label, url: d.url, why: "not a readable PDF" }); continue; }
      read.push({ title: label, url: d.url, data: buf.toString("base64") });
    } catch (e) { notRead.push({ title: label, url: d.url, why: "could not be reached" }); }
  }
  return { read, notRead };
}

const fmtMoney = (v) => {
  if (!v || v.amount == null || !isFinite(Number(v.amount))) return null;
  const n = Number(v.amount), sym = String(v.currency || "GBP").toUpperCase() === "GBP" ? "£" : String(v.currency).toUpperCase() + " ";
  return sym + (n >= 1e6 ? (n / 1e6).toFixed(n >= 1e7 ? 1 : 2).replace(/\.?0+$/, "") + "m" : n >= 1e3 ? Math.round(n / 1e3) + "k" : String(n));
};
const ukDateTime = (iso) => {
  const d = new Date(iso);
  if (isNaN(d)) return null;
  return d.toLocaleString("en-GB", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" });
};

const SYSTEM =
  "You extract the commercial facts of a public healthcare tender for workforce suppliers (agencies, insourcing and staffing firms). " +
  "Use ONLY the sources provided: the notice data and any attached documents. Never estimate, infer or fill gaps from general knowledge. " +
  "If a fact is not stated in the sources, the text must be JSON null: never write a sentence saying it is not stated. If two sources disagree, give both values in the field text and add a short note in 'flag' saying the documents should be checked. " +
  "Never tell the supplier whether to bid. Plain British English, no jargon, no em dashes, figures as numerals. " +
  "Reply with ONLY a JSON object, no markdown, in exactly this shape:\n" +
  '{"fields":{' + FIELDS.map(([k]) => '"' + k + '":{"text":string|null,"flag":string|null}').join(",") + "}," +
  '"overview":string,"considerations":[string]}\n' +
  "Field guidance: value = total value, and annual value only if stated; term = initial duration plus any extensions; " +
  "service = the workforce or service area (for example radiology, nursing, AHP, insourcing, permanent recruitment); " +
  "lots = number of lots and a short line on each relevant one; route = framework, DPS, open or competitive procedure and so on, as stated; " +
  "eligibility = mandatory requirements, accreditations, insurance levels, turnover thresholds or framework membership; " +
  "volumes = staffing, activity or service volumes; pricing = rate card, fixed price, capped rates or other model; " +
  "evaluation = quality and price weighting and other material criteria; conditions = mobilisation, performance, payment or contract terms that matter commercially. " +
  "Keep each field under 300 characters. overview: 3 to 5 short sentences on what the opportunity is. " +
  "considerations: 2 to 5 short points a supplier should check before deciding, drawn only from the sources (requirements or potential barriers). Never write 'you should bid' or 'do not bid'.";

const NOT_STATED = /^(not (stated|specified|available|provided|given|included)\b[^.]*|no [^.]{0,90}\b(is |are )?(stated|specified|provided|given|available)\b[^.]*)\.?$/i;

function parseJson(text) {
  const t = String(text || "").replace(/^```(?:json)?/i, "").replace(/```\s*$/, "").trim();
  const start = t.indexOf("{"), end = t.lastIndexOf("}");
  if (start < 0 || end < start) return null;
  try { return JSON.parse(t.slice(start, end + 1)); } catch (e) { return null; }
}

async function generate(notice, detail, docs) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { ok: false, error: "AI is not configured." };
  const t = (detail && detail.tender) || {};
  const data = {
    noticeFields: {
      title: notice.title, buyer: notice.buyer, region: notice.region, value: notice.rate, closes: notice.closes,
      description: notice.note, category: notice.category || notice.profession, source: notice.source, biddingPlatform: notice.platform,
    },
    fullNotice: detail ? { buyer: detail.buyer, tender: t } : "Not available for this notice.",
  };
  let body = JSON.stringify(data);
  if (body.length > 60000) body = body.slice(0, 60000) + " [truncated]";
  const content = [
    ...docs.map((d) => ({ type: "document", source: { type: "base64", media_type: "application/pdf", data: d.data }, title: d.title })),
    { type: "text", text: "Sources: the notice data below" + (docs.length ? " and the " + docs.length + " attached tender document" + (docs.length === 1 ? "" : "s") : " (no tender documents could be read)") + ".\n\n" + body },
  ];
  try {
    const r = await fetchWithTimeout("https://api.anthropic.com/v1/messages", 50000, {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: MODEL, max_tokens: 2000, system: SYSTEM, messages: [{ role: "user", content }] }),
    });
    const j = await r.json();
    if (!r.ok) return { ok: false, error: (j.error && j.error.message) || "The AI service did not answer." };
    const out = parseJson((j.content || []).filter((b) => b.type === "text").map((b) => b.text).join(""));
    if (!out || !out.fields) return { ok: false, error: "The summary came back in the wrong shape. Please try again." };
    return { ok: true, out };
  } catch (e) { return { ok: false, error: "The AI service took too long. Please try again." }; }
}

// The model's answer, cleaned and with the hard facts taken from the notice.
function shape(out, notice, detail) {
  const t = (detail && detail.tender) || {};
  const fields = {};
  for (const [k, label] of FIELDS) {
    const f = (out.fields && out.fields[k]) || {};
    let text = clean(f.text, 400);
    // The model sometimes writes "Not stated in the notice" as text instead of
    // null. One sentence saying only that becomes null, so every app shows the
    // same "Not stated in tender".
    if (text && NOT_STATED.test(text)) text = null;
    fields[k] = { label, text, flag: clean(f.flag, 200) };
  }
  // Hard facts from the notice data, never from the model.
  fields.title.text = clean(t.title || notice.title, 300);
  fields.buyer.text = clean((detail && detail.buyer) || notice.buyer, 200);
  const end = (t.tenderPeriod || {}).endDate;
  const deadlineISO = end && !isNaN(Date.parse(end)) ? new Date(end).toISOString() : null;
  if (deadlineISO) fields.deadline.text = ukDateTime(deadlineISO);
  else if (notice.closes) fields.deadline.text = "About " + notice.closes + " left when the feed last refreshed. The exact date and time are on the official notice.";
  const noticeValue = fmtMoney(t.value);
  if (noticeValue && !fields.value.text) fields.value.text = noticeValue + " (from the notice)";
  const considerations = (Array.isArray(out.considerations) ? out.considerations : []).map((x) => clean(x, 300)).filter(Boolean).slice(0, 5);
  return { fields, overview: clean(out.overview, 900), considerations, deadlineISO };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Sign in required" });
  if (await limited(req, res, user, { bucket: "tender-snapshot", limit: 40, windowSec: 3600 })) return;
  const body = req.body || {};
  const id = String(body.id || "");
  if (!id) return res.status(400).json({ error: "id required" });

  const feed = (await kvGet("shared", "tenders")) || {};
  let notice = (Array.isArray(feed.items) ? feed.items : []).find((n) => n.id === id && !n.seeded);
  if (!notice && body.action !== "source") {
    // Not in the live feed: an archived tender, closed or awarded.
    const row = await archived(id);
    if (row) notice = {
      id: row.id, title: row.title, buyer: row.buyer, region: row.region, note: row.description, category: row.category,
      rate: row.advertised_value != null ? (row.currency && row.currency !== "GBP" ? row.currency + " " : "£") + Number(row.advertised_value).toLocaleString("en-GB") : "Value not stated",
      closes: "", source: row.source, url: row.source_url, _archive: row,
    };
  }
  const stored = await kvGet(SNAP_OWNER, id);

  if (body.action === "source") {
    if (stored && typeof stored === "object") { stored.sourceClicks = (stored.sourceClicks || 0) + 1; await kvSet(SNAP_OWNER, id, stored); }
    await bump("snapshot_source_clicked");
    return res.status(200).json({ ok: true });
  }

  if (!notice && !(stored && stored.snapshot)) return res.status(404).json({ error: "This notice has left the feed since you loaded it." });

  // Who may open it.
  const founder = isFounderEmail(user.email);
  const paid = founder || ENTITLEMENTS.supplierRank(await planOf(user.id)) >= 1;
  let free = [];
  if (!paid) {
    const f = await kvGet(user.id, FREE_KEY);
    free = Array.isArray(f) ? f : [];
    if (!free.includes(id) && free.length >= FREE_SNAPSHOTS) {
      return res.status(402).json({ locked: true, freeLeft: 0, error: "You have used your " + FREE_SNAPSHOTS + " free Tender Snapshots. Tender Snapshot is included in every paid plan." });
    }
  }

  let snap = stored && stored.snapshot ? stored : null;
  let cached = Boolean(snap);
  // A Snapshot checked against its notice in the last 6 hours opens at once,
  // without asking Find a Tender again.
  const fresh = snap && Date.now() - Date.parse(snap.checkedAt || snap.generatedAt || 0) < 6 * 3600000;
  if (notice && !(fresh && !(body.refresh === true && founder))) {
    const detail = await noticeDetail(notice);
    const docLinks = ((detail && detail.tender && detail.tender.documents) || []).map((d) => d && d.url).filter(Boolean);
    const version = hash(JSON.stringify([PROMPT_VERSION, notice.title, notice.buyer, notice.rate, notice.note, detail && detail.tender, docLinks]));
    const remake = !snap || snap.version !== version || (body.refresh === true && founder);
    if (snap) snap.checkedAt = new Date().toISOString();
    if (remake) {
      const { read, notRead } = await publicDocs(detail);
      const g = await generate(notice, detail, read);
      if (!g.ok) {
        if (snap) cached = true; // an older Snapshot is better than none
        else return res.status(502).json({ error: g.error });
      } else {
        const history = snap ? [{ version: snap.version, generatedAt: snap.generatedAt, snapshot: snap.snapshot }, ...(snap.history || [])].slice(0, 5) : [];
        snap = {
          version, generatedAt: new Date().toISOString(), checkedAt: new Date().toISOString(), snapshot: shape(g.out, notice, detail),
          sourcesRead: { notice: true, fullNotice: Boolean(detail), documents: read.map((d) => ({ title: d.title, url: d.url })), notRead: notRead.slice(0, 10) },
          url: notice.url || null, source: notice.source || null, opens: (stored && stored.opens) || 0, sourceClicks: (stored && stored.sourceClicks) || 0, history,
        };
        cached = false;
      }
    }
  }

  snap.opens = (snap.opens || 0) + 1;
  await kvSet(SNAP_OWNER, id, snap);
  await bump("snapshot_opened");
  if (!paid && !free.includes(id)) { free = [...free, id]; await kvSet(user.id, FREE_KEY, free); }

  return res.status(200).json({
    id, snapshot: snap.snapshot, sourcesRead: snap.sourcesRead, generatedAt: snap.generatedAt, cached,
    url: snap.url || (notice && notice.url) || null, source: snap.source || (notice && notice.source) || null,
    freeLeft: paid ? null : Math.max(0, FREE_SNAPSHOTS - free.length),
  });
}
