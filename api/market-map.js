import { getUser, kvGet } from "./_auth.js";
import { CONTACTS } from "./_contacts.js";
import { limited } from "./_ratelimit.js";
import { regionOf, UK_REGIONS } from "./_regions.js";

// The market map, computed rather than asserted.
//
// It used to be a fixed table of 8 regions written into the front end, showing
// the same numbers forever under a heading that said "updated continuously".
// Every figure here is now counted from something real:
//
//   Opportunities   procurement notices from the live tender feed, grouped by
//                   the region on the notice
//   Decision-makers the register in api/contacts.js, grouped by the region we
//                   can infer from the organisation name
//   Suppliers       subscribers. Zero until they arrive, and shown as zero
//                   rather than filled in with a plausible number
//
// Where a figure cannot be computed it is returned as null, and the page says
// so, which is the honest alternative to inventing one.

// Rough regional mapping from organisation and place names. Deliberately
// conservative: anything unmatched falls to "Not mapped" rather than being
// pushed into the nearest region to make a chart look fuller.




export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Sign in to view the market map" });
  if (await limited(req, res, user, { bucket: "marketmap", limit: 120, windowSec: 3600 })) return;

  // Live procurement notices, refreshed daily by api/refresh-tenders.js
  const tenders = (await kvGet("shared", "tenders")) || {};
  const notices = Array.isArray(tenders.items) ? tenders.items : [];
  // Demand posted by subscribers
  const posted = (await kvGet("shared", "demand_posted")) || [];

  const rows = {};
  const row = (name) => (rows[name] = rows[name] || { region: name, opportunities: 0, decisionMakers: 0, suppliers: 0, international: 0 });
  UK_REGIONS.forEach(row);
  row("International");

  for (const n of notices) {
    if (n.market === "International") { row("International").opportunities += 1; continue; }
    const reg = regionOf((n.region || "") + " " + (n.buyer || ""));
    row(reg || "Not mapped").opportunities += 1;
  }
  for (const d of (Array.isArray(posted) ? posted : [])) {
    const reg = regionOf((d.region || "") + " " + (d.buyer || ""));
    row(reg || "Not mapped").opportunities += 1;
  }

  // Decision-makers, from the same register the Decision makers page uses.
  for (const c of CONTACTS) {
    const reg = regionOf(c.org + " " + (c.role || ""));
    row(reg || "Not mapped").decisionMakers += 1;
  }

  const totals = {
    opportunities: Object.values(rows).reduce((a, r) => a + r.opportunities, 0),
    decisionMakers: CONTACTS.length,
    suppliers: 0,
    regionsWithActivity: Object.values(rows).filter((r) => r.opportunities > 0 || r.decisionMakers > 0).length,
  };

  res.setHeader("Cache-Control", "private, max-age=300");
  return res.status(200).json({
    rows: Object.values(rows).sort((a, b) => (b.opportunities - a.opportunities) || (b.decisionMakers - a.decisionMakers)),
    totals,
    refreshedAt: tenders.refreshedAt || null,
    sources: tenders.sources || [],
    // Told plainly so the page can say so rather than imply otherwise.
    notComputed: ["Open vacancies", "Suppliers mapped"],
  });
}
