import { cronAllowed } from "./_cron.js";
import { sbAdmin, kvGet, kvSet, budgetLeft, recordUsage } from "./_send.js";
import { politeFetch, robotsRules, robotsAllows, platformOf, findCareersLinks, pool } from "./_sendcrawl.js";

export const config = { maxDuration: 300 };

// SEND Intelligence: careers-page discovery (job discover_send_recruitment_sources), week 2.
// Every 10 minutes (vercel.json) it takes the next batch of school websites still
// "to_discover" and, for each one:
//   1. reads robots.txt and records whether Qura may fetch the home page (terms register),
//   2. fetches the home page once and finds links to vacancies, jobs or careers,
//   3. records the best link as a careers source, with the recruitment platform it runs on,
//      and a policy: own-site pages are allowed; commercial job boards and Teaching
//      Vacancies are blocked; third-party systems and council portals wait for a terms review,
//   4. marks the website discovered, no link found, blocked by robots, or failed.
// At most 2 requests per school per discovery. No AI is used, so cost is function time only.
// Within the first 10 minutes of each hour it also refreshes coverage by council (send_area_metrics).
// Vercel Cron or a signed-in founder only.

const BATCH = 70, CONCURRENCY = 8, BUDGET_MS = 240000;

async function refreshCoverage(sb, log) {
  const orgs = [], srcs = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from("send_organisations").select("id,la_code,la_name,region,setting_group,sen_ehcp,sen_support").eq("org_kind", "school").eq("in_scope", true).range(from, from + 999);
    if (error) { log.errors.push("coverage orgs: " + error.message); return; }
    orgs.push(...(data || [])); if (!data || data.length < 1000) break;
  }
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from("send_sources").select("organisation_id,kind,status,platform").range(from, from + 999);
    if (error) { log.errors.push("coverage sources: " + error.message); return; }
    srcs.push(...(data || [])); if (!data || data.length < 1000) break;
  }
  const site = new Set(srcs.filter((s) => s.kind === "school_website").map((s) => s.organisation_id));
  const monitored = new Set(srcs.filter((s) => (s.kind === "careers_page" || s.kind === "trust_careers") && s.status === "active").map((s) => s.organisation_id));
  const by = new Map();
  for (const o of orgs) {
    const k = o.la_code || "unknown";
    const a = by.get(k) || { nation: "england", area_kind: "local_authority", area_code: k, area_name: o.la_name || "Unknown", schools: 0, special: 0, ap: 0, mainstream_units: 0, sen_ehcp: 0, sen_support: 0, sources_total: 0, sources_monitored: 0 };
    a.schools++; if (o.setting_group === "special") a.special++; else if (o.setting_group === "ap") a.ap++; else a.mainstream_units++;
    a.sen_ehcp += o.sen_ehcp || 0; a.sen_support += o.sen_support || 0;
    if (site.has(o.id)) a.sources_total++; if (monitored.has(o.id)) a.sources_monitored++;
    by.set(k, a);
  }
  const rows = [...by.values()].map((a) => ({ ...a, coverage_pct: a.schools ? Math.round((a.sources_monitored / a.schools) * 1000) / 10 : 0, computed_at: new Date().toISOString() }));
  for (let i = 0; i < rows.length; i += 200) {
    const { error } = await sb.from("send_area_metrics").upsert(rows.slice(i, i + 200), { onConflict: "nation,area_kind,area_code" });
    if (error) { log.errors.push("coverage upsert: " + error.message); return; }
  }
  log.coverageAreas = rows.length;
}

export default async function handler(req, res) {
  if (!(await cronAllowed(req))) return res.status(401).json({ error: "Not allowed" });
  const sb = sbAdmin(); if (!sb) return res.status(500).json({ error: "Supabase not configured" });
  const started = Date.now();
  const log = { at: new Date().toISOString(), checked: 0, discovered: 0, noLink: 0, robotsBlocked: 0, failed: 0, blockedPlatform: 0, reviewPlatform: 0, errors: [] };
  const budget = await budgetLeft(sb);
  if (budget.stop) return res.status(200).json({ ok: true, skipped: "daily budget reached", budget });

  const { data: batch, error } = await sb.from("send_sources").select("id,organisation_id,url,consecutive_failures").eq("kind", "school_website").eq("active", true).in("status", ["to_discover", "retry"]).order("priority").order("created_at").limit(BATCH);
  if (error) return res.status(500).json({ error: error.message });

  const robotsCache = new Map();
  await pool(batch || [], CONCURRENCY, async (s) => {
    if (Date.now() - started > BUDGET_MS) return;
    log.checked++;
    const now = new Date().toISOString();
    let origin, host; try { const u = new URL(s.url); origin = u.origin; host = u.hostname.toLowerCase(); } catch (e) { await sb.from("send_sources").update({ status: "error", active: false, terms_note: "Invalid URL", last_checked_at: now }).eq("id", s.id); log.failed++; return; }
    // 1. robots.txt
    let rules = robotsCache.get(origin);
    if (!rules) {
      const r = await politeFetch(origin + "/robots.txt", { timeoutMs: 6000, maxBytes: 200000 });
      rules = r.ok ? robotsRules(r.text) : [];
      robotsCache.set(origin, rules);
    }
    const path = new URL(s.url).pathname || "/";
    if (!robotsAllows(rules, path)) {
      await sb.from("send_sources").update({ status: "robots_blocked", allowed: false, robots_checked_at: now, last_checked_at: now }).eq("id", s.id);
      log.robotsBlocked++; return;
    }
    // 2. home page
    const page = await politeFetch(s.url);
    if (!page.ok || !page.text) {
      const fails = (s.consecutive_failures || 0) + 1;
      await sb.from("send_sources").update({ status: fails >= 3 ? "error" : "retry", allowed: true, robots_checked_at: now, last_checked_at: now, last_http_status: page.status || null, consecutive_failures: fails, terms_note: page.error || null }).eq("id", s.id);
      log.failed++; return;
    }
    let finalHost = host; try { finalHost = new URL(page.url).hostname.toLowerCase(); } catch (e) {}
    // careers pages already found to be pupil careers education are not picked again
    const { data: rej } = await sb.from("send_sources").select("url").eq("organisation_id", s.organisation_id).eq("status", "pupil_careers");
    const links = findCareersLinks(page.text, page.url, new Set((rej || []).map((x) => x.url)));
    if (!links.length) {
      await sb.from("send_sources").update({ status: "no_careers_link", allowed: true, robots_checked_at: now, last_checked_at: now, last_http_status: page.status, consecutive_failures: 0 }).eq("id", s.id);
      log.noLink++; return;
    }
    // 3. best link becomes a careers source
    const best = links[0];
    const p = platformOf(best.url, finalHost);
    let status = p.policy === "allowed" ? "active" : p.policy === "blocked" ? "blocked_platform" : "pending_terms";
    if (p.policy === "allowed") {
      let bp = "/"; try { bp = new URL(best.url).pathname; } catch (e) {}
      if (!robotsAllows(rules, bp)) status = "robots_blocked";
    }
    if (p.policy === "blocked") log.blockedPlatform++; if (p.policy === "review") log.reviewPlatform++;
    const kind = p.platform === "la_portal" ? "la_portal" : "careers_page";
    const { error: e1 } = await sb.from("send_sources").upsert({ organisation_id: s.organisation_id, kind, url: best.url, platform: p.platform, allowed: status === "active", robots_checked_at: now, terms_note: p.note || ("Found on " + finalHost + ": \"" + best.text + "\""), status, priority: 4 }, { onConflict: "kind,url", ignoreDuplicates: true });
    if (e1) log.errors.push("careers upsert: " + e1.message);
    await sb.from("send_sources").update({ status: "discovered", allowed: true, platform: p.platform, robots_checked_at: now, last_checked_at: now, last_http_status: page.status, consecutive_failures: 0 }).eq("id", s.id);
    log.discovered++;
  });

  await recordUsage(sb, "discovery_requests", log.checked * 2, 0);
  if (new Date().getUTCMinutes() < 10) await refreshCoverage(sb, log);
  const state = (await kvGet("shared", "send_discover_state")) || {};
  const totals = state.totals || {};
  for (const k of ["checked", "discovered", "noLink", "robotsBlocked", "failed", "blockedPlatform", "reviewPlatform"]) totals[k] = (totals[k] || 0) + log[k];
  await kvSet("shared", "send_discover_state", { lastRun: log.at, lastLog: log, totals });
  return res.status(200).json({ ok: true, log });
}
