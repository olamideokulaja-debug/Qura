import { getUser, kvGet, kvSet } from "./_auth.js";
import { CONTACTS } from "./_contacts.js";
import { regionOf } from "./_regions.js";
import { buildRegister } from "./_register.js";
import { ENTITLEMENTS, planOf } from "./_entitlements.js";
import { limited } from "./_ratelimit.js";
import { alertFounders } from "./_alert.js";

// CSV export of the decision-maker directory.
//
// This hands over the asset the whole subscription is built on, so it is
// deliberately tighter than anything else in the product:
//
//   - Only plans that include directory access. Everyone else gets a 402.
//   - Two exports a day, and a row cap, so nobody drains the register in one
//     sitting or scripts a nightly copy.
//   - Every export is logged with who, when and how many rows, and the
//     founders are alerted. If the file ever turns up somewhere it should not,
//     the log says who had it.
//   - Each file carries a watermark row naming the account it was issued to.
//     A leaked copy is traceable to a person rather than to "a subscriber".
//   - Removed contacts are honoured, exactly as they are in the directory.

const MAX_ROWS = 500;
const PER_DAY = 2;

function csvCell(v) {
  const s = String(v == null ? "" : v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Sign in required" });
  if (await limited(req, res, user, { bucket: "dm-export", limit: 6, windowSec: 3600 })) return;

  const plan = await planOf(user.id);
  if (!ENTITLEMENTS.intelligence(plan)) {
    return res.status(402).json({ error: "Exporting the directory needs a plan that includes decision-maker access." });
  }

  // Two a day, counted per account.
  const today = new Date().toISOString().slice(0, 10);
  const usage = (await kvGet(user.id, "dm_export_usage")) || {};
  const used = usage.date === today ? (usage.count || 0) : 0;
  if (used >= PER_DAY) {
    return res.status(429).json({ error: "You have used today's exports. The limit is " + PER_DAY + " a day." });
  }

  // Honour the removal log, as the directory itself does.
  let removed = new Set();
  try {
    const log = (await kvGet("shared", "contact_removals")) || [];
    removed = new Set((Array.isArray(log) ? log : []).map((r) => String(r.name || "").toLowerCase()));
  } catch (e) {}

  // The export used to read CONTACTS alone, so the CSV held fewer people than
  // the screen it was downloaded from — manual additions and everyone named on
  // a procurement notice were missing. Same builder as contacts.js now, so the
  // two can no longer drift.
  let additions = [];
  try {
    const a = (await kvGet("shared", "contact_additions")) || [];
    additions = Array.isArray(a) ? a : [];
  } catch (e) {}
  let harvested = [];
  try {
    const h = (await kvGet("shared", "notice_contacts")) || [];
    harvested = Array.isArray(h) ? h : [];
  } catch (e) {}
  const built = buildRegister(CONTACTS, additions, harvested);

  const rows = built.list
    .filter((c) => !removed.has(String(c.name || "").toLowerCase()))
    .slice(0, MAX_ROWS)
    .map((c) => [
      c.name, c.role, c.org, c.orgType || "",
      c.region || regionOf(c.org + " " + (c.role || "")) || "",
      c.market || "United Kingdom",
      c.spec || "", c.email || "", c.phone || "",
    ]);

  const header = ["Name", "Job title", "Organisation", "Organisation type", "Region", "Market", "Category", "Email", "Phone"];
  const stamp = new Date().toISOString();
  const lines = [
    header.map(csvCell).join(","),
    ...rows.map((r) => r.map(csvCell).join(",")),
    "",
    // The watermark. Plain text, on purpose: anyone opening the file sees who
    // it was issued to, which is most of the deterrent.
    csvCell("Issued to " + (user.email || user.id) + " on " + stamp +
      " by Qura. Provided for legitimate business communication under the terms at qurahealth.org/terms.html. Not for resale or redistribution."),
  ];

  await kvSet(user.id, "dm_export_usage", { date: today, count: used + 1, last: stamp });
  const audit = (await kvGet("shared", "dm_export_log")) || [];
  await kvSet("shared", "dm_export_log",
    [{ user: user.email || user.id, at: stamp, rows: rows.length }, ...(Array.isArray(audit) ? audit : [])].slice(0, 500));
  try {
    await alertFounders("dm-export", "Directory exported",
      (user.email || user.id) + " exported " + rows.length + " contacts at " + stamp + ".");
  } catch (e) {}

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="qura-decision-makers-' + today + '.csv"');
  res.setHeader("Cache-Control", "private, no-store");
  return res.status(200).send(lines.join("\n"));
}
