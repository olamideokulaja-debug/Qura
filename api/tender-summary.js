import { getUser, kvGet } from "./_auth.js";
import { askAI } from "./_ai.js";
import { limited } from "./_ratelimit.js";

// One-tap plain-English summary of a procurement notice.
//
// Raw tender text is written for procurement lawyers, not for the workforce
// supplier deciding in 20 seconds whether it is worth a look. This takes the
// notice as we already hold it from the daily feed and answers the four things
// that matter: what is being bought, who is buying it, when it closes, and
// whether it is workforce-shaped.
//
// Grounding rules: the model sees ONLY the fields of the stored notice, so it
// cannot invent detail about the contract. Summaries are cached by prompt hash
// in _ai.js, so any one notice costs at most one model call ever, however many
// subscribers read it.

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Sign in required" });
  if (await limited(req, res, user, { bucket: "tender-summary", limit: 60, windowSec: 3600 })) return;

  const { id } = req.body || {};
  if (!id) return res.status(400).json({ error: "id required" });

  // Only real notices from the live feed can be summarised. Illustrative
  // records have nothing behind them worth a model call.
  const tenders = (await kvGet("shared", "tenders")) || {};
  const items = Array.isArray(tenders.items) ? tenders.items : [];
  const notice = items.find((n) => n.id === id);
  if (!notice) return res.status(404).json({ error: "Notice not found. It may have left the feed since you loaded it." });

  const system =
    "You summarise public procurement notices for healthcare workforce suppliers. " +
    "Use ONLY the notice fields provided. If a detail is not in the fields, say it is not stated rather than guessing. " +
    "Plain British English, no jargon, no preamble. Format exactly:\n" +
    "WHAT: one sentence on what is being bought.\n" +
    "WHO: the buyer and what kind of organisation it is.\n" +
    "WHEN: the closing information as given.\n" +
    "FIT: one sentence on whether this looks like clinical workforce, insourcing, or something adjacent, and for which professions if stated.\n" +
    "ROUTE: if a bidding platform is given, name it in one short sentence. If it is not given, omit this line entirely.\n" +
    "WHO TO APPROACH: if named contacts are given, list up to three as Name (role). If none are given, omit this line entirely.";

  const userMsg =
    "Notice fields:\n" +
    "Title: " + (notice.title || "Not stated") + "\n" +
    "Buyer: " + (notice.buyer || "Not stated") + "\n" +
    "Region: " + (notice.region || "Not stated") + "\n" +
    "Market: " + (notice.market || "Not stated") + "\n" +
    // notice.category is the enriched one (Pathology, Imaging & Radiology).
    // notice.profession is the raw OCDS classification, which is usually the
    // generic "Healthcare services", so the enriched value leads.
    "Category: " + (notice.category || notice.profession || "Not stated") + "\n" +
    "Value: " + (notice.rate || "Not stated") + "\n" +
    "Closes: " + (notice.closes || "Not stated") + "\n" +
    "Description: " + (notice.note || "Not stated") + "\n" +
    "Source: " + (notice.source || "Not stated") + "\n" +
    // The enrichment. This is the part no portal could tell them.
    "Organisation: " + (notice.organisation || notice.buyer || "Not stated") + "\n" +
    "Bidding platform: " + (notice.platform || "Not stated") + "\n" +
    "Named contacts at this organisation: " +
      (Array.isArray(notice.contacts) && notice.contacts.length
        ? notice.contacts.slice(0, 3).map((c) => c.name + " (" + (c.role || c.spec || "decision maker") + ")").join("; ")
        : "None held");

  const out = await askAI(system, userMsg, 300);
  if (!out.ok) return res.status(502).json({ error: out.error || "Could not summarise this notice." });

  return res.status(200).json({
    id,
    summary: out.text,
    cached: !!out.cached,
    source: notice.source || null,
    url: notice.url || null,
    category: notice.category || null,
    platform: notice.platform || null,
    contacts: Array.isArray(notice.contacts) ? notice.contacts.slice(0, 3) : [],
  });
}
