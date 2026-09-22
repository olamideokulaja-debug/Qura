import { getUser, kvGet } from "./_auth.js";
import { CONTACTS } from "./_contacts.js";
import { limited } from "./_ratelimit.js";
import { regionOf, UK_REGIONS } from "./_regions.js";
import { buildRegister } from "./_register.js";

// The market map, computed rather than asserted.
//
// Every figure here is counted from something real:
//
//   Opportunities   procurement notices from the live tender feed, grouped by
//                   the region on the notice
//   Decision-makers the SAME register the Decision makers page uses: the base
//                   file, plus contacts added through the admin panel, plus
//                   contacts harvested from procurement notices, deduplicated,
//                   minus anyone a founder has removed
//   Suppliers       subscribers. Zero until they arrive, and shown as zero
//                   rather than filled in with a plausible number
//
// THE DECISION-MAKER COUNT USED TO DISAGREE WITH THE DECISION MAKERS PAGE. This
// file counted only the static base file (3,836 people) while the register page
// counted base + additions + notice contacts - removals (4,058). The comment
// here claimed they were the same register; they were not. Both now build the
// list through buildRegister, so two screens can no longer show two totals.
//
// Where a figure cannot be computed it is returned as null, and the page says
// so, which is the honest alternative to inventing one.

async function loadRegister() {
  let removed = new Set();
  try {
    const log = (await kvGet("shared", "contact_removals")) || [];
    removed = new Set((Array.isArray(log) ? log : []).map((r) => String(r.name || "").toLowerCase()));
  } catch (e) {}
  let added = [];
  try {
    const rows = (await kvGet("shared", "contact_additions")) || [];
    added = Array.isArray(rows) ? rows : [];
  } catch (e) {}
  let harvested = [];
  try {
    const rows = (await kvGet("shared", "notice_contacts")) || [];
    harvested = Array.isArray(rows) ? rows : [];
  } catch (e) {}
  const built = buildRegister(CONTACTS, added, harvested);
  return built.list.filter((c) => c && c.name && !removed.has(String(c.name).toLowerCase()));
}

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

  const register = await loadRegister();
  for (const c of register) {
    const reg = regionOf((c.org || "") + " " + (c.role || ""));
    row(reg || "Not mapped").decisionMakers += 1;
  }

  const totals = {
    opportunities: Object.values(rows).reduce((a, r) => a + r.opportunities, 0),
    decisionMakers: register.length,
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
