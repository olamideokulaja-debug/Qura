import { cronAllowed } from "./_cron.js";
import { kvGet, kvSet, kvListByKey } from "./_auth.js";
import { shouldPush } from "./push-register.js";
import { sendMail, owners, SUPPORT } from "./_waitlist.js";
import { sbAdmin, NHS_GROUPS, nhsPage, nhsRow, adzunaOn, adzunaPage, adzunaRow, reedOn, REED_TERMS, reedPage, reedRow, alertHit, payLabel } from "./_opps.js";

export const config = { maxDuration: 300 };

// Fills Qura Discover (api/_opps.js). Runs every hour at :40 (vercel.json).
//
// Each run:
//   1. Fresh: the newest 100 adverts in each clinical NHS Jobs staff group,
//      so a new vacancy reaches Qura within the hour.
//   2. Sweep: carries on through every page of every group from where the last
//      run stopped. A full sweep takes a few hours. When a sweep finishes
//      cleanly, any NHS Jobs advert Qura still holds as LIVE that was not seen
//      during it, or the sweep before, has been withdrawn and becomes REMOVED.
//      This is the live check: an advert still on NHS Jobs is seen on every sweep.
//   3. Closes any LIVE advert whose closing date has passed.
//   4. Adzuna and Reed, only when their keys are set (see api/_opps.js).
//   5. Saved-search alerts for adverts first seen in this run and posted in
//      the last 3 days (older ones found while filling Qura are not news).
//
// Vercel Cron or a signed-in founder only (api/_cron.js).

const PAGE_CAP = 45;
const BUDGET_MS = 200000;
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

async function upsert(sb, rows, log) {
  // One advert can appear in two staff groups; keep the first.
  const seen = new Set();
  const list = rows.filter((r) => !seen.has(r.id) && seen.add(r.id));
  for (let i = 0; i < list.length; i += 100) {
    const { error } = await sb.from("opportunities").upsert(list.slice(i, i + 100), { onConflict: "id" });
    if (error) { log.errors.push("upsert: " + error.message); return false; }
    log.upserted += list.slice(i, i + 100).length;
  }
  return true;
}

export default async function handler(req, res) {
  if (!(await cronAllowed(req))) return res.status(401).json({ error: "Not allowed" });
  const sb = sbAdmin();
  if (!sb) return res.status(500).json({ error: "Supabase not configured" });
  const started = Date.now();
  const runStart = new Date(started - 1000).toISOString();
  const now = () => new Date().toISOString();
  const log = { at: runStart, fresh: 0, swept: 0, upserted: 0, removed: 0, closed: 0, adzuna: 0, reed: 0, duplicates: 0, alerts: 0, errors: [] };
  const state = (await kvGet("shared", "opps_state")) || {};
  const nhs = state.nhs && state.nhs.cycleStart ? state.nhs : { cycleStart: runStart, gi: 0, page: 1, failed: false };
  const left = () => BUDGET_MS - (Date.now() - started);

  // 1. Fresh
  for (const g of NHS_GROUPS) {
    if (left() < 60000) break;
    const p = await nhsPage(g, 1, 100);
    if (!p) { log.errors.push("fresh " + g); continue; }
    const t = now();
    await upsert(sb, p.items.filter((v) => v.id && v.title).map((v) => nhsRow(v, g, t)), log);
    log.fresh += p.items.length;
  }

  // 2. Sweep
  let pages = 0;
  while (nhs.gi < NHS_GROUPS.length && pages < PAGE_CAP && left() > 40000) {
    const g = NHS_GROUPS[nhs.gi];
    const p = await nhsPage(g, nhs.page, 100);
    pages++;
    if (!p) { nhs.failed = true; log.errors.push("sweep " + g + " p" + nhs.page); nhs.gi++; nhs.page = 1; continue; }
    const t = now();
    await upsert(sb, p.items.filter((v) => v.id && v.title).map((v) => nhsRow(v, g, t)), log);
    log.swept += p.items.length;
    if (!p.items.length || nhs.page >= p.totalPages) { nhs.gi++; nhs.page = 1; } else nhs.page++;
  }
  if (nhs.gi >= NHS_GROUPS.length) {
    // Not seen during 2 complete, error-free sweeps in a row: withdrawn on NHS
    // Jobs. Two, because adverts shift between pages while a sweep is running
    // and one sweep can step over an advert that is still live.
    if (!nhs.failed && nhs.prevCycleStart) {
      const { data, error } = await sb.from("opportunities").update({ status: "REMOVED", updated_at: now() })
        .eq("source", "nhsjobs").eq("status", "LIVE").lt("last_seen", nhs.prevCycleStart).select("id");
      if (error) log.errors.push("remove: " + error.message); else log.removed = (data || []).length;
    }
    log.sweepCompleted = true;
    state.nhs = { cycleStart: now(), prevCycleStart: nhs.failed ? null : nhs.cycleStart, gi: 0, page: 1, failed: false, lastComplete: now() };
  } else state.nhs = nhs;

  // 3. Close past deadlines
  {
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await sb.from("opportunities").update({ status: "CLOSED", updated_at: now() })
      .eq("status", "LIVE").lt("closing_date", today).select("id");
    if (error) log.errors.push("close: " + error.message); else log.closed = (data || []).length;
  }

  // 4. Other sources, newest only
  const others = [];
  if (adzunaOn()) {
    for (let page = 1; page <= 4 && left() > 30000; page++) {
      const d = await adzunaPage(page);
      if (!d || !Array.isArray(d.results)) { log.errors.push("adzuna p" + page); break; }
      const t = now();
      const rows = d.results.filter((j) => j.id && j.title && j.redirect_url).map((j) => adzunaRow(j, t));
      others.push(...rows); log.adzuna += rows.length;
      if (d.results.length < 50) break;
    }
  }
  if (reedOn()) {
    const day = new Date().getUTCHours();
    // A few profession searches per hour, rotating, to stay well inside Reed's limits.
    for (const term of REED_TERMS.filter((_, i) => i % 6 === day % 6)) {
      if (left() < 30000) break;
      const d = await reedPage(term, 0);
      if (!d || !Array.isArray(d.results)) { log.errors.push("reed " + term); continue; }
      const t = now();
      const rows = d.results.filter((j) => j.jobId && j.jobTitle && j.jobUrl).map((j) => reedRow(j, t));
      others.push(...rows); log.reed += rows.length;
    }
  }
  if (others.length) {
    await upsert(sb, others, log);
    // The same vacancy found again elsewhere is kept, but points at the copy we
    // already hold, so search shows it once (NHS Jobs is preferred).
    const keys = [...new Set(others.map((r) => r.dedupe_key).filter(Boolean))];
    for (let i = 0; i < keys.length; i += 100) {
      const { data: base } = await sb.from("opportunities").select("id,dedupe_key").in("dedupe_key", keys.slice(i, i + 100)).eq("source", "nhsjobs");
      for (const b of base || []) {
        const dups = others.filter((r) => r.dedupe_key === b.dedupe_key && r.id !== b.id).map((r) => r.id);
        if (dups.length) { await sb.from("opportunities").update({ duplicate_of: b.id }).in("id", dups); log.duplicates += dups.length; }
      }
    }
  }

  // 5. Saved-search alerts
  try {
    const { data: fresh } = await sb.from("opportunities").select("id,title,employer,profession,family,city,region,postcode,salary_min,salary_max,salary_period,salary_text,closing_date,source_name")
      .gte("first_seen", runStart).gte("posted_at", new Date(Date.now() - 3 * 86400000).toISOString()).eq("status", "LIVE").is("duplicate_of", null).limit(3000);
    if (fresh && fresh.length) log.alerts = await sendAlerts(fresh);
    log.newAdverts = (fresh || []).length;
  } catch (e) { log.errors.push("alerts: " + (e && e.message)); }

  await kvSet("shared", "opps_state", state);
  const runs = (await kvGet("shared", "opps_runs")) || [];
  log.ms = Date.now() - started;
  await kvSet("shared", "opps_runs", [log, ...(Array.isArray(runs) ? runs : [])].slice(0, 30));
  return res.status(200).json(log);
}

// One message per person per run at most, listing up to 5 new adverts, and no
// more than one message per alert every 6 hours.
async function sendAlerts(fresh) {
  const rows = await kvListByKey("opp_alerts");
  const regs = await kvListByKey("push_registration");
  const regOf = {};
  for (const r of regs) regOf[r.owner] = r.value;
  let sent = 0;
  for (const { owner, value } of rows) {
    const list = Array.isArray(value) ? value : [];
    if (!list.length) continue;
    const hits = new Map();
    let changed = false;
    for (const a of list) {
      if (a.lastSentAt && Date.now() - Date.parse(a.lastSentAt) < 6 * 3600000) continue;
      const m = fresh.filter((r) => alertHit(a, r));
      if (!m.length) continue;
      for (const r of m) hits.set(r.id, r);
      a.lastSentAt = new Date().toISOString(); a.lastCount = m.length; changed = true;
    }
    if (!hits.size) continue;
    const top = [...hits.values()].slice(0, 5);
    const reg = regOf[owner];
    const title = hits.size === 1 ? "New role: " + top[0].title : hits.size + " new roles match your alerts";
    const body = hits.size === 1 ? [top[0].employer, top[0].city].filter(Boolean).join(" · ") : top.slice(0, 3).map((r) => r.title).join(", ");
    try {
      if (reg && reg.token && shouldPush(reg, "matches")) {
        await fetch("https://exp.host/--/api/v2/push/send", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify([{ to: reg.token, sound: "default", channelId: "default", title, body, data: { type: "role", id: top[0].id } }]) });
        sent++;
      } else {
        const email = (list.find((a) => a.email) || {}).email;
        if (email) {
          const html = '<div style="font-family:Inter,Arial,sans-serif;color:#0A1730;line-height:1.6;max-width:600px"><p>Hello,</p><p>New roles match a search you saved on Qura:</p>' +
            top.map((r) => '<div style="border:1px solid #E3E8F2;border-radius:12px;padding:12px 16px;margin:10px 0"><div style="font-weight:700">' + esc(r.title) + '</div><div style="font-size:13.5px;color:#5A6783">' +
              esc([r.employer, r.city].filter(Boolean).join(" · ")) + '</div><div style="font-size:13px;margin-top:4px">' + esc([payLabel(r), r.closing_date ? "Closes " + r.closing_date : ""].filter(Boolean).join(" · ")) +
              '</div><div style="font-size:12px;color:#8A96AD;margin-top:4px">Discovered by Qura · Source: ' + esc(r.source_name) + "</div></div>").join("") +
            (hits.size > 5 ? "<p>And " + (hits.size - 5) + " more.</p>" : "") +
            '<p style="margin:20px 0"><a href="https://www.qurahealth.org" style="background:#00C2B8;color:#04231F;font-weight:700;padding:12px 24px;border-radius:999px;text-decoration:none;display:inline-block">See them on Qura</a></p>' +
            '<p style="font-size:12px;color:#8A96AD">You receive this because you saved a search on Qura. Turn the alert off in Opportunities, or reply "stop". Qura Ltd, company number 17310951.</p></div>';
          const r = await sendMail([email], title, html, owners()[0] || SUPPORT);
          if (r && r.ok) sent++;
        }
      }
    } catch (e) {}
    if (changed) await kvSet(owner, "opp_alerts", list);
  }
  return sent;
}
