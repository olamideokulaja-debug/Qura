import { cronAllowed } from "./_cron.js";
import { sbAdmin, kvGet, kvSet } from "./_send.js";
import { politeFetch, robotsRules, robotsAllows } from "./_sendcrawl.js";
import { sendCategory } from "./_sendmarket.js";
import { candidateHosts, isChallenge, looksModernGov, planLists, latestEdition, planItems, planSend } from "./_sendplans.js";

export const config = { maxDuration: 300 };

// SEND Intelligence: council forward plans as early signals (10 October 2026).
// Every 2 hours (vercel.json). Two steps, both slow and polite:
//   1. find: for up to 12 councils not yet looked up, try the usual Modern.gov host names.
//      Robots.txt is read first. A challenge page or refusal marks the council
//      "blocked_by_site" (never worked around); no site found marks it "not_found".
//   2. read: for up to 8 found councils not read in the last 6 days, open the forward plan
//      home, the newest edition of up to 3 plans (cabinet first), and keep items whose title
//      is about SEND or names one of the council's special schools or alternative provision.
//      Kept items go into send_tenders as stage "planning" (the Early signals list).
// Officer names on these pages are never stored. No AI is used.

const FIND = 12, READ = 8, BUDGET_MS = 250000, GAP_MS = 1500, READ_EVERY_DAYS = 6;
const NATION_LABEL = { england: "England", scotland: "Scotland", wales: "Wales", northern_ireland: "Northern Ireland" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => String(s || "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

export async function findSite(c, log) {
  const tried = [];
  let blocked = null, robotsBlocked = null;
  for (const host of candidateHosts(c.la_name, c.nation)) {
    const origin = "https://" + host;
    const rb = await politeFetch(origin + "/robots.txt", { timeoutMs: 5000, maxBytes: 100000 });
    if (!rb.ok && !rb.status) { tried.push(host + ": no site"); continue; }     // DNS or connection failure
    if (isChallenge(rb)) { tried.push(host + ": challenge"); blocked = blocked || host; continue; }
    const rules = rb.ok ? robotsRules(rb.text) : [];
    if (!robotsAllows(rules, "/mgPlansHome.aspx")) { tried.push(host + ": robots"); robotsBlocked = robotsBlocked || host; continue; }
    await sleep(GAP_MS);
    const pg = await politeFetch(origin + "/mgPlansHome.aspx", { timeoutMs: 8000 });
    if (isChallenge(pg)) { tried.push(host + ": challenge"); blocked = blocked || host; continue; }
    if (pg.ok && looksModernGov(pg.text)) { tried.push(host + ": found"); return { status: "found", base_url: origin, tried }; }
    tried.push(host + ": " + (pg.status || "no answer"));
  }
  if (blocked) return { status: "blocked_by_site", base_url: "https://" + blocked, tried, note: "The council's site answered with a bot check, so Qura does not read it." };
  if (robotsBlocked) return { status: "robots_blocked", base_url: "https://" + robotsBlocked, tried, note: "robots.txt does not allow the forward plan pages." };
  return { status: "not_found", base_url: null, tried, note: "No Modern.gov forward plan found at the usual addresses." };
}

export async function readPlans(sb, c, log) {
  const base = c.base_url;
  const rb = await politeFetch(base + "/robots.txt", { timeoutMs: 5000, maxBytes: 100000 });
  if (isChallenge(rb)) return { status: "blocked_by_site", note: "Bot check on robots.txt" };
  const rules = rb.ok ? robotsRules(rb.text) : [];
  const allowed = (u) => { try { return robotsAllows(rules, new URL(u).pathname); } catch (e) { return false; } };
  const home = await politeFetch(base + "/mgPlansHome.aspx", { timeoutMs: 8000 });
  if (isChallenge(home)) return { status: "blocked_by_site", note: "Bot check on the forward plan page" };
  if (!home.ok) return { status: "found", note: "Forward plan page did not load (" + (home.status || home.error || "no answer") + ")" };
  // Special schools and alternative provision in this council, to catch items that name them.
  const { data: schools } = await sb.from("send_organisations").select("name").eq("org_kind", "school").eq("in_scope", true).eq("la_code", c.la_code).in("setting_group", ["special", "ap"]);
  const names = (schools || []).map((s) => norm(s.name)).filter((n) => n.split(" ").length >= 2 && n.length >= 10);
  let seen = 0, kept = 0, plans = 0;
  for (const pl of planLists(home.text, home.url)) {
    if (!allowed(pl.url)) continue;
    await sleep(GAP_MS);
    const lp = await politeFetch(pl.url, { timeoutMs: 8000 });
    if (isChallenge(lp)) return { status: "blocked_by_site", note: "Bot check on a plan page" };
    const ed = lp.ok ? latestEdition(lp.text, lp.url) : null;
    if (!ed || !allowed(ed.url)) continue;
    await sleep(GAP_MS);
    const ip = await politeFetch(ed.url, { timeoutMs: 10000 });
    if (isChallenge(ip)) return { status: "blocked_by_site", note: "Bot check on a plan page" };
    if (!ip.ok) continue;
    plans++;
    const rows = [];
    for (const it of planItems(ip.text, ip.url)) {
      seen++;
      const t = norm(it.title);
      const bySend = planSend(it.title), bySchool = !bySend && names.find((n) => t.includes(n));
      const why = bySend || (bySchool ? "names a special school or AP in this council" : null);
      if (!why) continue;
      const host = new URL(base).hostname;
      rows.push({
        id: "fp:" + host + ":" + (it.iid || it.url),
        nation: NATION_LABEL[c.nation] || null,
        source: "Council forward plan", stage: "planning", notice_tags: ["forward_plan"],
        title: it.title, description: [it.decision_maker ? "Decision maker: " + it.decision_maker + "." : "", it.decision_due ? "Decision due: " + it.decision_due + "." : "", "From " + ed.label + "."].filter(Boolean).join(" ").slice(0, 1500),
        buyer: c.la_name, la_code: c.la_code,
        category: bySchool ? "placements" : sendCategory(it.title, "", null), currency: "GBP",
        published_at: it.first_published ? it.first_published + "T00:00:00Z" : new Date().toISOString(),
        url: it.url, match_reason: String(why).slice(0, 120), suppliers: [], is_framework: false, is_dps: false,
        updated_at: new Date().toISOString(),
      });
    }
    if (rows.length) {
      const { error } = await sb.from("send_tenders").upsert(rows, { onConflict: "id" });
      if (error) log.errors.push(c.la_name + ": " + error.message); else kept += rows.length;
    }
  }
  log.itemsSeen += seen; log.signals += kept;
  return { status: "found", plans, seen, kept };
}

export default async function handler(req, res) {
  if (!(await cronAllowed(req))) return res.status(401).json({ error: "Not allowed" });
  const sb = sbAdmin(); if (!sb) return res.status(500).json({ error: "Supabase not configured" });
  const started = Date.now(); const now = () => new Date().toISOString();
  const log = { at: now(), looked_up: 0, found: 0, blocked: 0, not_found: 0, read: 0, itemsSeen: 0, signals: 0, errors: [] };

  const { data: toFind } = await sb.from("send_council_democracy").select("*").eq("status", "to_find").order("la_name").limit(FIND);
  for (const c of toFind || []) {
    if (Date.now() - started > BUDGET_MS / 2) break;
    const r = await findSite(c, log); log.looked_up++;
    if (r.status === "found") log.found++; else if (r.status === "blocked_by_site") log.blocked++; else log.not_found++;
    await sb.from("send_council_democracy").update({ status: r.status, base_url: r.base_url, tried: r.tried, note: r.note || null, last_checked_at: r.status === "found" ? null : now(), updated_at: now() }).eq("la_code", c.la_code);
  }

  const due = new Date(Date.now() - READ_EVERY_DAYS * 86400000).toISOString();
  const { data: toRead } = await sb.from("send_council_democracy").select("*").eq("status", "found").or("last_checked_at.is.null,last_checked_at.lt." + due).order("last_checked_at", { ascending: true, nullsFirst: true }).limit(READ);
  for (const c of toRead || []) {
    if (Date.now() - started > BUDGET_MS) break;
    const r = await readPlans(sb, c, log); log.read++;
    const upd = { status: r.status, note: r.note || null, last_checked_at: now(), updated_at: now() };
    if (r.plans != null) { upd.plans_read = (c.plans_read || 0) + r.plans; upd.items_seen = (c.items_seen || 0) + r.seen; upd.signals_found = (c.signals_found || 0) + r.kept; }
    await sb.from("send_council_democracy").update(upd).eq("la_code", c.la_code);
  }

  const state = (await kvGet("shared", "send_councilplans_state")) || {};
  const runs = (state.runs || []).slice(-20); runs.push(log);
  await kvSet("shared", "send_councilplans_state", { runs, lastRun: log.at });
  return res.status(200).json(log);
}
