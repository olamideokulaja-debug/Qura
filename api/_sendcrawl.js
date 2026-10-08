// SEND Intelligence: polite fetching, robots.txt rules and careers-page discovery (week 2).
// Rules (claude/qura-send-master-prompt.md): respect robots.txt and site terms,
// never bypass logins, paywalls or anti-bot controls, identify ourselves, keep
// request rates low, and never use commercial job boards unless licensed.

export const UA = "QuraBot/1.0 (SEND Intelligence; +https://www.qurahealth.org/send-data.html; privacy@qurahealth.org)";

export async function politeFetch(url, { timeoutMs = 8000, maxBytes = 1500000 } = {}) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { redirect: "follow", signal: ctl.signal, headers: { "User-Agent": UA, Accept: "text/html,text/plain;q=0.9,*/*;q=0.5" } });
    const type = r.headers.get("content-type") || "";
    let text = "";
    if (r.ok && /text|html|xml|json/i.test(type || "text/html")) {
      const reader = r.body && r.body.getReader ? r.body.getReader() : null;
      if (reader) {
        const dec = new TextDecoder("utf-8"); let n = 0;
        for (;;) { const { done, value } = await reader.read(); if (done) break; n += value.length; text += dec.decode(value, { stream: true }); if (n > maxBytes) { try { ctl.abort(); } catch (e) {} break; } }
      } else text = await r.text();
    }
    return { ok: r.ok, status: r.status, url: r.url || url, type, text };
  } catch (e) {
    return { ok: false, status: 0, url, type: "", text: "", error: String(e && e.name === "AbortError" ? "timeout" : (e && e.message) || e) };
  } finally { clearTimeout(t); }
}

// robots.txt: honour the group for QuraBot, else "*". Longest matching rule wins; Allow beats Disallow on a tie.
export function robotsRules(txt) {
  const groups = []; let cur = null; let lastWasAgent = false;
  for (const raw of String(txt || "").split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, "").trim(); if (!line) continue;
    const m = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/); if (!m) continue;
    const k = m[1].toLowerCase(), v = m[2].trim();
    if (k === "user-agent") { if (!lastWasAgent || !cur) { cur = { agents: [], rules: [] }; groups.push(cur); } cur.agents.push(v.toLowerCase()); lastWasAgent = true; continue; }
    lastWasAgent = false;
    if (!cur) continue;
    if (k === "allow" || k === "disallow") cur.rules.push({ allow: k === "allow", path: v });
  }
  const mine = groups.filter((g) => g.agents.some((a) => a.includes("qurabot")));
  const star = groups.filter((g) => g.agents.includes("*"));
  return (mine.length ? mine : star).flatMap((g) => g.rules);
}
export function robotsAllows(rules, path) {
  let best = null;
  for (const r of rules || []) {
    if (!r.path) { if (!r.allow) continue; }
    const pat = "^" + r.path.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\\\$$/, "$");
    let re; try { re = new RegExp(pat); } catch (e) { continue; }
    if (r.path === "" || re.test(path)) { if (!best || r.path.length > best.path.length || (r.path.length === best.path.length && r.allow)) best = r; }
  }
  return !best || best.allow || best.path === "";
}

// Known recruitment hosts. "blocked": commercial boards or services Qura may not reuse without a licence or approval.
// "review": third-party recruitment systems used by schools and trusts; checked only after their terms are reviewed.
const PLATFORMS = [
  [/teaching-?vacancies\.service\.gov\.uk/i, "teaching_vacancies", "blocked", "Awaiting DfE API approval; do not fetch"],
  [/(^|\.)tes\.com$/i, "tes", "blocked", "Commercial job board"],
  [/(^|\.)eteach\.com$/i, "eteach", "blocked", "Commercial job board"],
  [/(^|\.)(indeed|reed|totaljobs|cv-library|guardianjobs|jobsgopublic|monster|glassdoor|linkedin)\./i, "job_board", "blocked", "Commercial job board"],
  [/(^|\.)mynewterm\.com$/i, "mynewterm", "review", "School platform; terms to review"],
  [/(^|\.)tal\.net$/i, "oleeo", "review", "Recruitment system; terms to review"],
  [/(^|\.)jobtrain\.co\.uk$/i, "jobtrain", "review", "Recruitment system; terms to review"],
  [/(^|\.)(webitrent|itrent|corehr)\./i, "itrent", "review", "HR system; terms to review"],
  [/(^|\.)eploy\./i, "eploy", "review", "Recruitment system; terms to review"],
  [/(^|\.)(networxrecruitment|networx)\./i, "networx", "review", "Recruitment system; terms to review"],
  [/(^|\.)(smartrecruiters|workable|teamtailor|greenhouse|lever|pinpointhq|recruitee|bamboohr|hireroad|vacancyfiller|applicationtrack|jobsinschools|schoolrecruitment)\./i, "ats_other", "review", "Recruitment system; terms to review"],
];
export function platformOf(url, siteHost) {
  let host = ""; try { host = new URL(url).hostname.toLowerCase(); } catch (e) { return { platform: "invalid", policy: "blocked", note: "Bad URL" }; }
  for (const [re, name, policy, note] of PLATFORMS) if (re.test(host)) return { platform: name, policy, note };
  if (/\.gov\.uk$/i.test(host) && host !== siteHost) return { platform: "la_portal", policy: "review", note: "Council job portal; terms to review" };
  const base = (h) => h.replace(/^www\./, "");
  if (siteHost && base(host) === base(siteHost)) return { platform: "own_site", policy: "allowed", note: null };
  return { platform: "external_site", policy: "review", note: "External site; terms to review" };
}

const KEY_TEXT = /\b(vacanc(y|ies)|jobs?|careers?|recruitment|work (for|with) us|join (our|the) team|current opportunities|employment opportunities|staff vacancies)\b/i;
const KEY_HREF = /(vacanc|\/jobs?\b|career|recruit|work-?for-?us|work-?with-?us|join-?(our|the)-?team|employment)/i;
const NOT = /(pupil|student|parent|admission|term-?dates|prospectus|news|blog|curriculum|ofsted|policy|policies|privacy|cookie)/i;

export function findCareersLinks(html, baseUrl) {
  const out = []; const seen = new Set();
  const re = /<a\b[^>]*href\s*=\s*["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi; let m;
  while ((m = re.exec(html || ""))) {
    const href = m[1].trim(); const text = m[2].replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim().slice(0, 120);
    if (/^(mailto|tel|javascript):/i.test(href)) continue;
    let abs; try { abs = new URL(href, baseUrl).toString(); } catch (e) { continue; }
    if (seen.has(abs)) continue;
    const tHit = KEY_TEXT.test(text), hHit = KEY_HREF.test(href);
    if (!tHit && !hHit) continue;
    if (NOT.test(text) && !/vacanc|job|career|recruit/i.test(text)) continue;
    seen.add(abs);
    const score = (tHit ? 2 : 0) + (hHit ? 1 : 0) + (/vacanc/i.test(text + href) ? 2 : 0) + (/\.pdf$/i.test(abs) ? -3 : 0);
    out.push({ url: abs, text, score });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, 5);
}

export async function pool(items, n, fn) {
  const out = new Array(items.length); let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k], k); } }));
  return out;
}
