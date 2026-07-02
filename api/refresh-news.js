// Scheduled job (Vercel Cron) that refreshes the regional Industry News feed.
// Pulls public healthcare news per region from Google News RSS (no API key needed),
// and writes the results to Supabase (shared rows) which the app reads on load.
// Falls back silently: if a region cannot be fetched, its baseline in the app is kept.
import { createClient } from "@supabase/supabase-js";

export const config = { maxDuration: 60 };

const REGIONS = [
  { k: "uk", q: "healthcare OR NHS OR clinicians workforce", hl: "en-GB", gl: "GB", ceid: "GB:en" },
  { k: "ng", q: "healthcare Nigeria OR hospital Nigeria", hl: "en-NG", gl: "NG", ceid: "NG:en" },
  { k: "me", q: "healthcare Gulf OR hospital UAE OR Saudi health", hl: "en", gl: "AE", ceid: "AE:en" },
  { k: "intl", q: "healthcare workforce OR clinician shortage", hl: "en", gl: "US", ceid: "US:en" },
];

function decode(x) {
  return String(x || "")
    .replace(/<!\[CDATA\[|\]\]>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, " ")
    .trim();
}

function ago(pubDate) {
  const t = Date.parse(pubDate);
  if (!t) return "";
  const h = Math.round((Date.now() - t) / 3.6e6);
  if (h < 1) return "just now";
  if (h < 24) return h + "h";
  const d = Math.round(h / 24);
  return d + "d";
}

async function fetchRegion(r) {
  const url = "https://news.google.com/rss/search?q=" + encodeURIComponent(r.q + " when:7d") +
    "&hl=" + r.hl + "&gl=" + r.gl + "&ceid=" + encodeURIComponent(r.ceid);
  try {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 12000);
    const res = await fetch(url, { signal: ctrl.signal, headers: { "User-Agent": "QuraNewsBot/1.0" } });
    clearTimeout(to);
    if (!res.ok) return [];
    const xml = await res.text();
    const items = xml.split("<item>").slice(1, 9);
    return items.map((block) => {
      const title = decode((block.match(/<title>([\s\S]*?)<\/title>/) || [])[1]);
      const link = decode((block.match(/<link>([\s\S]*?)<\/link>/) || [])[1]);
      const src = decode((block.match(/<source[^>]*>([\s\S]*?)<\/source>/) || [])[1]);
      const pub = decode((block.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1]);
      // Google News appends " - Source" to titles; strip it for a clean headline
      const clean = title.replace(/\s-\s[^-]+$/, "");
      return { t: clean || title, s: src || "News", ago: ago(pub), url: link };
    }).filter((x) => x.t);
  } catch {
    return [];
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

  try {
    const results = await Promise.all(REGIONS.map((r) => fetchRegion(r)));
    const rows = [];
    let any = 0;
    REGIONS.forEach((r, i) => {
      const items = results[i];
      if (items && items.length) { any += items.length; rows.push({ owner: "shared", key: "qura_news_" + r.k, value: JSON.stringify(items) }); }
    });
    rows.push({ owner: "shared", key: "qura_news_updated", value: JSON.stringify(new Date().toISOString()) });
    const { error } = await admin.from("kv").upsert(rows, { onConflict: "owner,key" });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true, items: any });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
}
