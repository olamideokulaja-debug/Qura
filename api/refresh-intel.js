// Scheduled job (Vercel Cron) that refreshes the Public Sector Intelligence page.
// It fetches each public source, asks Anthropic to distil only Qura-relevant points,
// and writes the results to Supabase (shared rows) which the app reads on load.
// Falls back to a sensible baseline for any source it cannot read, so the page is never empty.
import { createClient } from "@supabase/supabase-js";

export const config = { maxDuration: 60 };

// Set exact board-paper / meeting URLs here as you confirm them; the job degrades
// gracefully to the baseline points below if a URL is missing or unreadable.
const SOURCES_ICB = [
  { name: "NHS West & North London ICB", url: "https://www.westandnorthlondon.icb.nhs.uk/", date: "Jun 2026", fallback: ["Formed on 1 April 2026 from the North Central and North West London merger", "Diagnostics recovery and new CDC capacity across 13 boroughs", "Workforce and running-cost reductions under way"] },
  { name: "NHS North East London ICB", url: "https://northeastlondon.icb.nhs.uk/about-us/about-nhs-north-east-london/our-board/board-meetings-and-papers/", date: "Jun 2026", fallback: ["Community diagnostics expansion under way", "Elective hub procurement moving to next stage", "Sonography vacancy rate cited as a delivery risk"] },
  { name: "NHS South East London ICB", url: "https://www.selondonics.org/icb/meetings-board-papers-reports/icb-meetings/", date: "8 Jul 2026", fallback: ["CDC throughput ahead of plan; ultrasound remains constrained", "Insourcing spend under review for value", "Digital diagnostics pilot extended"] },
  { name: "NHS South West London ICB", url: "https://www.southwestlondon.icb.nhs.uk/publications/", date: "Jun 2026", fallback: ["Elective long-waits reduction programme update", "Community services recommissioning timeline set", "Radiography workforce pipeline discussed"] },
  { name: "NHS Greater Manchester ICB", url: "https://gmintegratedcare.org.uk/", date: "Jun 2026", fallback: ["Imaging network business case approved", "Discharge-to-assess funding continued", "Running-cost reductions and redundancies noted"] },
  { name: "NHS West Yorkshire ICB", url: "https://www.westyorkshire.icb.nhs.uk/meetings/integrated-care-board", date: "Jun 2026", fallback: ["Diagnostic capacity plan: mobile MRI and CT procurement", "Complex care packages review commissioned", "Primary care access recovery focus"] },
  { name: "NHS Birmingham & Solihull ICB", url: "https://www.birminghamsolihull.icb.nhs.uk/about-us/our-committees/integrated-care-board/integrated-care-board-papers", date: "Jun 2026", fallback: ["CDC phase 2 approved with an insourcing partner", "Primary care estates investment", "Sonography and echo shortages noted"] },
];

const SOURCES_BODIES = [
  { name: "Care Quality Commission (CQC)", t: "Regulator", url: "https://www.cqc.org.uk/news", fallback: ["Single assessment framework rollout continues", "Focus on diagnostic imaging safety and staffing"] },
  { name: "NHS England", t: "National body", url: "https://www.england.nhs.uk/news/", fallback: ["Diagnostics and elective recovery priorities", "Agency price card and cap updates"] },
  { name: "Dept. of Health & Social Care", t: "Government", url: "https://www.gov.uk/government/organisations/department-of-health-and-social-care", fallback: ["Workforce plan refresh consultation", "Adult social care funding detail"] },
  { name: "London Borough of Camden", t: "Local council", url: "https://www.camden.gov.uk/", fallback: ["SEND transport and placement tenders", "Adult social care complex packages recommissioned"] },
  { name: "London Borough of Croydon", t: "Local council", url: "https://www.croydon.gov.uk/", fallback: ["Care home framework refresh", "Children's complex care commissioning update"] },
  { name: "Birmingham City Council", t: "Local council", url: "https://www.birmingham.gov.uk/", fallback: ["Large SEND capital programme progressing", "Domiciliary and complex care engagement"] },
];

async function fetchText(url) {
  if (!url) return "";
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 12000);
    const r = await fetch(url, { signal: ctrl.signal, headers: { "User-Agent": "QuraIntelBot/1.0 (+https://qura.health)" } });
    clearTimeout(t);
    if (!r.ok) return "";
    const html = await r.text();
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 6000);
  } catch {
    return "";
  }
}

async function distil(name, kind, text) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || !text || text.length < 400) return null;
  const prompt =
    'You are Qura\'s healthcare market-intelligence engine. From the public ' + kind +
    ' web text for "' + name + '", extract ONLY items relevant to healthcare workforce, diagnostics, imaging, insourcing, procurement, SEND and complex care. ' +
    'Return STRICT JSON only, no markdown: {"date":"<latest meeting or update date if clearly present, else empty>","points":["up to 3 concise British-English points, no preamble"]}. ' +
    'If nothing relevant is present, return {"date":"","points":[]}. Text: """' + text + '"""';
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 500, messages: [{ role: "user", content: prompt }] }),
    });
    const data = await r.json();
    const txt = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("").replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(txt);
    if (parsed && Array.isArray(parsed.points)) return parsed;
    return null;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
    const provided = auth || (req.query && req.query.key) || "";
    if (provided !== secret) return res.status(401).json({ error: "Unauthorised" });
  }

  const sbUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!sbUrl || !service) return res.status(500).json({ error: "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY." });
  const admin = createClient(sbUrl, service);

  async function build(list, kind) {
    return Promise.all(
      list.map(async (src) => {
        const text = await fetchText(src.url);
        const d = await distil(src.name, kind, text);
        const live = Boolean(d && d.points && d.points.length);
        const item = {
          date: (d && d.date) || src.date || "",
          pts: live ? d.points.slice(0, 3) : (src.fallback || []),
          url: src.url || "",
          live,
        };
        if (kind === "ICB") item.r = src.name; else { item.n = src.name; item.t = src.t; }
        return item;
      })
    );
  }

  try {
    const [icb, bodies] = await Promise.all([build(SOURCES_ICB, "ICB"), build(SOURCES_BODIES, "council or governing body")]);
    const updated = new Date().toISOString();
    const { error } = await admin.from("kv").upsert(
      [
        { owner: "shared", key: "psintel_icb", value: JSON.stringify(icb) },
        { owner: "shared", key: "psintel_bodies", value: JSON.stringify(bodies) },
        { owner: "shared", key: "psintel_updated", value: JSON.stringify(updated) },
      ],
      { onConflict: "owner,key" }
    );
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true, updated, icb: icb.length, bodies: bodies.length, liveIcb: icb.filter((x) => x.live).length });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
}
