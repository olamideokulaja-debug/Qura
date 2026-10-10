// SEND Intelligence: council forward plans (key decisions) as early signals, 10 October 2026.
// Most councils publish a forward plan of key decisions 28 days or more before they are
// taken: new special school places, SEND transport contracts, high needs strategies.
// Many run it on Modern.gov, which has the same page layout everywhere, so one reader works.
//
// Rules: respect robots.txt; read only sites that serve their pages without a challenge.
// A Cloudflare or Azure "checking your browser" page, a captcha or a 401/403 is an
// anti-bot control, so the council is marked "blocked_by_site" and never retried by force.
// Only the item title, decision maker (a role), decision due text, first published date and
// link are kept. Lead officer names on the same pages are never stored.

const clean = (s) => String(s || "")
  .replace(/<[^>]+>/g, " ")
  .replace(/&#(\d+);/g, (m, n) => String.fromCharCode(Number(n)))
  .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/\s+/g, " ").trim();

// Host names to try for a council's Modern.gov site, from its name.
export function candidateHosts(name, nation) {
  let n = String(name || "").toLowerCase()
    .replace(/,\s*(city|county) of$/, "").replace(/^city of\s+/, "").replace(/\bcity$/, "")
    .replace(/&/g, " and ").replace(/\bst\.\s*/g, "st ").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
  const slugs = new Set([n.replace(/ /g, ""), n.replace(/ /g, "-")]);
  if (/^county /.test(n)) slugs.add(n.replace(/^county /, "").replace(/ /g, ""));
  const hosts = [];
  for (const s of slugs) {
    if (!s) continue;
    hosts.push("democracy." + s + ".gov.uk", "moderngov." + s + ".gov.uk", "committees." + s + ".gov.uk", s + ".moderngov.co.uk", "councillors." + s + ".gov.uk");
    if (nation === "england") hosts.push("democracy." + s + "cc.gov.uk");
    if (nation === "wales") hosts.push("democracy." + s + ".gov.wales");
  }
  return [...new Set(hosts)].slice(0, 9);
}

// A challenge page or refusal is an anti-bot control: stop, do not retry around it.
export function isChallenge(page) {
  if (!page) return false;
  if (page.status === 401 || page.status === 403 || page.status === 429 || page.status === 503) return true;
  return /just a moment\.\.\.|cf-chl|challenge-platform|azure waf|\.azwaf|captcha|access denied|request blocked/i.test(String(page.text || "").slice(0, 20000));
}

export const looksModernGov = (html) => /mgListPlans\.aspx|mgListPlanItems\.aspx|mgPlansHome\.aspx/i.test(String(html || ""));

// mgPlansHome: the plans (usually Cabinet or Executive first).
export function planLists(html, base) {
  const out = []; const re = /<a\s[^>]*href="([^"]*mgListPlans\.aspx\?[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi; let m;
  while ((m = re.exec(html || ""))) {
    const label = clean(m[2]); let url; try { url = new URL(m[1].replace(/&amp;/g, "&"), base).toString(); } catch (e) { continue; }
    if (!out.some((x) => x.url === url)) out.push({ url, label });
  }
  // Executive and cabinet plans first; scrutiny and health board lists last.
  const rank = (l) => (/cabinet|executive|key decision|forward plan|forthcoming/i.test(l) ? 0 : /health|wellbeing|scrutiny|licens|planning committee/i.test(l) ? 2 : 1);
  return out.sort((a, b) => rank(a.label) - rank(b.label)).slice(0, 3);
}

// mgListPlans: the editions of one plan, newest first. We read the newest.
export function latestEdition(html, base) {
  const m = /<a\s[^>]*href="([^"]*mgListPlanItems\.aspx\?[^"]*)"[^>]*>([\s\S]*?)<\/a>/i.exec(html || "");
  if (!m) return null;
  try { return { url: new URL(m[1].replace(/&amp;/g, "&"), base).toString(), label: clean(m[2]) }; } catch (e) { return null; }
}

// mgListPlanItems: one plan edition. Returns items without any officer names.
export function planItems(html, base) {
  const items = [];
  const parts = String(html || "").split(/<a\s[^>]*class="mgPlanItemTitle"/i).slice(1);
  for (const part of parts) {
    const href = (/href="([^"]+)"/i.exec(part) || [])[1];
    const title = clean((/>([\s\S]*?)<\/a>/i.exec(part) || [])[1]);
    if (!href || !title) continue;
    const field = (label) => { const r = new RegExp(label + "[\\s\\S]*?<\\/span>([\\s\\S]*?)<\\/p>", "i").exec(part); return r ? clean(r[1]).slice(0, 200) : null; };
    const iid = (/IId=(\d+)/i.exec(href) || [])[1] || null;
    let url; try { url = new URL(href.replace(/&amp;/g, "&"), base).toString(); } catch (e) { continue; }
    const pub = field("first published");
    const d = pub && /(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(pub);
    items.push({
      iid, url, title: title.slice(0, 300),
      decision_maker: field("Decision maker"),
      decision_due: field("Decision due"),
      first_published: d ? d[3] + "-" + d[2].padStart(2, "0") + "-" + d[1].padStart(2, "0") : null,
    });
  }
  return items;
}

// Forward plan titles are short, so SEND wording is checked in the title alone, plus a few
// phrases that only appear in council decisions about SEND provision.
const PLAN_ACR = /\b(SEND|SEN|EHCPs?|PRUs?|ALN|ASN)\b/;
const PLAN_PHR = /\b(special educational needs|special schools?|specialist (provision|school|places|education)|resourced provision|SEN units?|alternative provision|pupil referral|high needs|home to school transport|travel assistance|safety valve|delivering better value|additional learning needs|additional support needs|inclusion)\b/i;
export function planSend(title) {
  const t = String(title || "");
  const m = t.match(PLAN_ACR) || t.match(PLAN_PHR);
  if (!m) return null;
  // "Inclusion" alone is too broad (financial or digital inclusion).
  if (/^inclusion$/i.test(m[0]) && !/\b(school|education|pupil|children|SEND|learning)\b/i.test(t)) return null;
  return m[0];
}
