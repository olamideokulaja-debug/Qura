import { getUser, kvGet, kvSet } from "./_auth.js";
import { limited } from "./_ratelimit.js";

// Saved tender alerts.
//
// A supplier saves the search they care about ("radiography", NHS market) and
// the daily tender refresh tells them the moment a matching notice lands,
// instead of them remembering to come and look. This is what turns the feed
// from interesting into indispensable.
//
// Storage: per-user list at "tender_alerts", plus a shared index of every
// user with alerts at shared/"tender_alert_users", so the daily job knows who
// to check without scanning every account.

const KEY = "tender_alerts";
const INDEX = "tender_alert_users";
const MAX_ALERTS = 10;

export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Sign in required" });
  if (await limited(req, res, user, { bucket: "alerts", limit: 60, windowSec: 3600 })) return;

  if (req.method === "GET") {
    const alerts = (await kvGet(user.id, KEY)) || [];
    return res.status(200).json({ alerts: Array.isArray(alerts) ? alerts : [] });
  }

  if (req.method === "POST") {
    const { action, id, query, market, category } = req.body || {};
    const alerts = (await kvGet(user.id, KEY)) || [];
    const list = Array.isArray(alerts) ? alerts : [];

    if (action === "remove") {
      const next = list.filter((a) => a.id !== id);
      await kvSet(user.id, KEY, next);
      if (next.length === 0) {
        const idx = (await kvGet("shared", INDEX)) || [];
        await kvSet("shared", INDEX, (Array.isArray(idx) ? idx : []).filter((u) => u !== user.id));
      }
      return res.status(200).json({ ok: true, alerts: next });
    }

    // create
    const q = String(query || "").trim().slice(0, 60);
    const m = ["All", "NHS", "Private", "International"].includes(market) ? market : "All";
    // Category comes from the enrichment, so an alert can now be set to
    // Pathology rather than hoping the word appears in a title. Validated
    // against the list the enrichment actually produces.
    const CATEGORIES = ["All", "Imaging & Radiology", "Pathology", "Audiology", "Endoscopy",
      "Community Diagnostics", "Cardiology & Respiratory", "Cancer & Screening",
      "Temporary Staffing", "Digital & Data", "Estates & Facilities",
      "Pharmacy & Medicines", "Consultancy & Transformation"];
    const c = CATEGORIES.includes(category) ? category : "All";
    if (!q && m === "All" && c === "All") {
      return res.status(400).json({ error: "Give the alert a search word, a market or a category." });
    }
    if (list.length >= MAX_ALERTS) return res.status(409).json({ error: "You have " + MAX_ALERTS + " alerts already. Remove one first." });
    if (list.some((a) => a.query.toLowerCase() === q.toLowerCase() && a.market === m && (a.category || "All") === c)) {
      return res.status(200).json({ ok: true, alerts: list, existed: true });
    }
    const entry = { id: "al_" + Date.now(), query: q, market: m, category: c, at: new Date().toISOString() };
    const next = [entry, ...list];
    await kvSet(user.id, KEY, next);
    const idx = (await kvGet("shared", INDEX)) || [];
    const arr = Array.isArray(idx) ? idx : [];
    if (!arr.includes(user.id)) await kvSet("shared", INDEX, [...arr, user.id]);
    return res.status(200).json({ ok: true, alerts: next });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
