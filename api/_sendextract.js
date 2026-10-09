// SEND Intelligence: vacancy extraction and classification (week 2).
// AI is used only when a careers page has changed and looks like it lists jobs,
// and only while the daily spend cut-off allows (api/_send.js budgetLeft).
import crypto from "node:crypto";

export const sha = (s) => crypto.createHash("sha256").update(String(s)).digest("hex");

export function pageText(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<(br|p|div|li|h[1-6]|tr)\b[^>]*>/gi, "\n").replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&rsquo;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&pound;|&#163;/g, "£").replace(/&ndash;|&mdash;/g, "-")
    .replace(/&#(\d{2,5});/g, (m, n) => String.fromCharCode(Number(n)))
    .replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n").trim();
}
export function pageLinks(html, baseUrl) {
  const out = []; const seen = new Set();
  const re = /<a\b[^>]*href\s*=\s*["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi; let m;
  while ((m = re.exec(html || "")) && out.length < 120) {
    const text = m[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (text.length < 3 || text.length > 140 || /^(mailto|tel|javascript):/i.test(m[1])) continue;
    let abs; try { abs = new URL(m[1], baseUrl).toString(); } catch (e) { continue; }
    if (seen.has(abs)) continue; seen.add(abs); out.push({ text, url: abs });
  }
  return out;
}

const NO_JOBS = /\b(no (current )?vacancies|there are (currently )?no (current )?vacancies|no vacancies at (this|the present) time|not currently recruiting|no positions available)\b/i;
const JOBISH = /\b(closing date|apply|application|salary|grade|scale|fte|hours per week|per annum|pro rata|vacanc(y|ies)|job description|start date|permanent|fixed[- ]term|teaching assistant|teacher|therapist|senco|lsa|hlta)\b/i;
export function looksLikeJobs(text) {
  if (!text || text.length < 80) return { jobs: false, reason: "empty" };
  if (NO_JOBS.test(text) && !/closing date/i.test(text)) return { jobs: false, reason: "no_vacancies_notice" };
  return JOBISH.test(text) ? { jobs: true } : { jobs: false, reason: "no_job_words" };
}

// Taxonomy: synonyms from send_job_taxonomy; special and AP settings turn a plain
// "teacher" or "teaching assistant" into the SEN version.
// Accuracy test set, 9 October 2026 (36 frozen careers pages, reference labels): extraction
// found 98% of jobs, but classification hid 40% of SEND jobs. Fixes: plurals match
// ("Teaching Assistants", "Learning Support Assistants"); care and residential support roles
// count in special schools and AP only (taxonomy care_worker); SRB, ARB and resource-base roles
// count as unit roles (taxonomy unit_teacher, and as SEN wording for assistants).
const SINGULAR = (s) => s.replace(/\b([a-z]{3,}[^s\s])s\b/g, "$1");
const SPECIAL_ONLY = new Set(["care_worker"]);
const SEN_WORDS = /(\bsen\b|\bsend\b|1:1|one to one|learning support|\blsa\b|pupil support|\barb\b|\bsrb\b|resource base|resourced|enhanced provision|specialist provision|\bunit\b|\bbase\b)/;
export function classify(title, taxonomy, settingGroup) {
  const t = " " + SINGULAR(String(title || "").toLowerCase().replace(/[^a-z0-9:&+ ]/g, " ").replace(/\s+/g, " ")) + " ";
  const specialish = settingGroup === "special" || settingGroup === "ap";
  let best = null;
  for (const row of taxonomy) {
    if (SPECIAL_ONLY.has(row.code) && !specialish) continue;
    for (const syn of row.synonyms || []) {
      const s = " " + SINGULAR(syn.toLowerCase().replace(/[^a-z0-9:&+ ]/g, " ").replace(/\s+/g, " ").trim()) + " ";
      if (s.trim().length >= 2 && t.includes(s) && (!best || s.length > best.len)) best = { code: row.code, family: row.family, len: s.length };
    }
  }
  if (!best && /\bteacher\b/.test(t) && specialish) best = { code: "sen_teacher", family: "send_teaching" };
  if (!best && /\bteacher\b/.test(t) && /\b(arb|srb|resource base|resourced provision|enhanced provision)\b/.test(t)) best = { code: "unit_teacher", family: "send_teaching" };
  if (best && best.code === "sen_ta" && !SEN_WORDS.test(t) && !(specialish || settingGroup === "mainstream_unit")) best = null;
  return best ? { taxonomy_code: best.code, profession_family: best.family } : { taxonomy_code: null, profession_family: "other" };
}

export const normTitle = (s) => String(s || "").replace(/\s+/g, " ").replace(/\s*[-|:]\s*(closing|apply).*$/i, "").trim().slice(0, 200);

function parseJsonArray(text) {
  const s = String(text || ""); const a = s.indexOf("["), b = s.lastIndexOf("]");
  if (a < 0 || b <= a) return null;
  try { const v = JSON.parse(s.slice(a, b + 1)); return Array.isArray(v) ? v : null; } catch (e) { return null; }
}

// Default model and estimated price per million tokens, in pence. Both can be set with
// SEND_AI_MODEL, SEND_AI_IN_PPM and SEND_AI_OUT_PPM. The rates are estimates used for the
// spend cut-off, and should be checked against the Anthropic bill in week 2.
// If the chosen model is not available to this API key, it falls back once to the model the
// rest of Qura already uses (claude-sonnet-4-6), priced at its higher estimated rates.
export async function aiExtract(text, links, pageUrl, fallback = false) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { ok: false, error: "AI not configured" };
  const model = fallback ? "claude-sonnet-4-6" : (process.env.SEND_AI_MODEL || "claude-haiku-4-5");
  const inP = fallback ? 240 : Number(process.env.SEND_AI_IN_PPM || 80), outP = fallback ? 1200 : Number(process.env.SEND_AI_OUT_PPM || 400);
  const system = "You extract job vacancies from a UK school's careers web page. Return ONLY a JSON array. Each item: {\"title\":string,\"closing_date\":\"YYYY-MM-DD\"|null,\"salary_text\":string|null,\"contract_type\":\"permanent\"|\"fixed_term\"|\"temporary\"|\"supply\"|null,\"working_pattern\":\"full_time\"|\"part_time\"|\"term_time\"|null,\"location\":string|null,\"detail_url\":string|null}. Include only vacancies the page actually advertises now. Never invent details: use null when the page does not say. detail_url must be one of the listed links or null. If there are no vacancies, return [].";
  const linkList = links.slice(0, 80).map((l) => "- " + l.text + " -> " + l.url).join("\n");
  const user = "Page: " + pageUrl + "\nToday: " + new Date().toISOString().slice(0, 10) + "\n\nPAGE TEXT:\n" + text.slice(0, 14000) + "\n\nLINKS:\n" + linkList;
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model, max_tokens: 1500, system, messages: [{ role: "user", content: user }] }),
    });
    const data = await r.json();
    if (!r.ok) {
      const msg = (data.error && data.error.message) || "AI request failed";
      if (!fallback && (r.status === 404 || /model/i.test(msg))) return aiExtract(text, links, pageUrl, true);
      return { ok: false, error: msg, status: r.status };
    }
    const out = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
    const u = data.usage || {};
    const pence = ((u.input_tokens || 0) * inP + (u.output_tokens || 0) * outP) / 1e6;
    const items = parseJsonArray(out);
    if (!items) return { ok: false, error: "Unreadable AI answer", pence };
    const allowed = new Set(links.map((l) => l.url));
    const clean = items.filter((x) => x && typeof x.title === "string" && x.title.trim().length > 2).slice(0, 60).map((x) => ({
      title: normTitle(x.title),
      closing_date: /^\d{4}-\d{2}-\d{2}$/.test(String(x.closing_date || "")) ? x.closing_date : null,
      salary_text: x.salary_text ? String(x.salary_text).slice(0, 200) : null,
      contract_type: x.contract_type || null, working_pattern: x.working_pattern || null,
      location: x.location ? String(x.location).slice(0, 200) : null,
      detail_url: x.detail_url && allowed.has(x.detail_url) ? x.detail_url : null,
    }));
    return { ok: true, items: clean, pence, model };
  } catch (e) { return { ok: false, error: String(e.message || e) }; }
}

export function salaryNumbers(s) {
  const nums = (String(s || "").replace(/,/g, "").match(/£\s?(\d{4,6}(\.\d+)?)/g) || []).map((x) => Number(x.replace(/[£\s]/g, ""))).filter((n) => n >= 5000 && n <= 200000);
  return nums.length ? { salary_min: Math.min(...nums), salary_max: Math.max(...nums), salary_period: "year" } : {};
}
