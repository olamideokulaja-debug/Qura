import React, { useEffect, useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

/* ------------------------------------------------------------------ *
 * Forte Compass — Stages 1 to 3
 * Single-file app. Runs in seeded demo mode with no keys. When Supabase
 * and the AI proxy are configured, auth, tenancy and the outcome engine
 * upgrade to the live backend automatically.
 * ------------------------------------------------------------------ */

const SB_URL = import.meta.env.VITE_SUPABASE_URL
const SB_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = SB_URL && SB_KEY ? createClient(SB_URL, SB_KEY) : null
const LIVE = !!supabase

/* ---------------------------- Tenants ----------------------------- */
// Imade Forte Holdings Limited is the parent. Its operating subsidiaries are the four
// companies below. Head-office functions (Chairman, MD, EA, HR, Finance) sit at Corporate.
const LEGAL = {
  Genesys: 'Genesys Health Information Limited',
  Girard: 'Girard Property Limited',
  Yostrat: 'Yostrat Business Services',
  Realms: 'Realms Healthcare Services Consulting Limited',
  Corporate: 'Imade Forte Holdings, Head Office',
}
const ORG_LABEL = { Group: 'Holding company' }
const orgLabel = (o) => ORG_LABEL[o] || o
const legalName = (o) => LEGAL[o] || o

const TENANTS = {
  'imade-forte': {
    id: 'imade-forte',
    name: 'Imade Forte Holdings Ltd.',
    logo: '/imade-forte-logo.png',
    brand: { navy: '#0E2240', gold: '#B8924A' },
    subsidiaries: ['Genesys', 'Girard', 'Yostrat', 'Realms'],
    priorities: [
      { rank: 'P1', name: 'Girard' },
      { rank: 'P2', name: 'Genesys' },
      { rank: 'P3', name: 'Realms' },
      { rank: 'P4', name: 'Yostrat' },
    ],
  },
  demo: {
    id: 'demo',
    name: 'Demo Company',
    logo: null,
    brand: { navy: '#1B2A3A', gold: '#7C8AA0' },
    subsidiaries: ['Sales', 'Product', 'Operations', 'Finance'],
    priorities: [
      { rank: 'P1', name: 'Sales' },
      { rank: 'P2', name: 'Product' },
      { rank: 'P3', name: 'Operations' },
      { rank: 'P4', name: 'Finance' },
    ],
  },
}

const ROLES = {
  chairman: 'Chairman',
  md: 'Managing Director',
  lead: 'Subsidiary Lead',
  staff: 'Staff',
  hr: 'HR Manager',
  admin: 'Tenant Admin',
}
const uid = () => Math.random().toString(36).slice(2, 10)

/* ------------------------ Seeded cohort --------------------------- */
// Real May 2026 cohort. Bands seed the group board; a subset carries full OKRs.
const STAFF = [
  { id: 's_jen', name: 'Jennifer Kaja', role: 'md', sub: 'Corporate', tier: 'leadership', band: 'green', score: 8.4 },
  { id: 's_ose', name: 'Osemeke Anyirah', role: 'lead', sub: 'Genesys', tier: 'leadership', band: 'green', score: 8.0 },
  { id: 's_ebi', name: 'Ebime Abari', role: 'lead', sub: 'Genesys', tier: 'leadership', band: 'green', score: 8.1 },
  { id: 's_sol', name: 'Solomon C. Nweke', role: 'lead', sub: 'Realms', tier: 'leadership', band: 'green', score: 7.6 },
  { id: 's_tha', name: 'Thaddeus U. Oparaocha', role: 'staff', sub: 'Realms', tier: 'ops', band: 'green', score: 7.2 },
  { id: 's_ojo', name: 'Ojuma Joy Ndidi', role: 'staff', sub: 'Realms', tier: 'ops', band: 'green', score: 7.3 },
  { id: 's_gud', name: 'Goodness Udoka', role: 'staff', sub: 'Corporate', tier: 'leadership', band: 'green', score: 7.6 },
  { id: 's_chi', name: 'Chinonso (surname pending)', role: 'staff', sub: 'Genesys', tier: 'ops', band: 'green', score: 8.0 },
  { id: 's_ade', name: 'Adebayo (surname pending)', role: 'lead', sub: 'Corporate', tier: 'leadership', band: 'green', score: 7.6 },
  { id: 's_sun', name: 'Sunday Orimoyegun', role: 'staff', sub: 'Genesys', tier: 'ops', band: 'amber', score: 6.2 },
  { id: 's_kit', name: 'Kitunde Abayomi', role: 'staff', sub: 'Genesys', tier: 'ops', band: 'amber', score: 5.8 },
  { id: 's_goo', name: 'Goodnews Anele', role: 'staff', sub: 'Realms', tier: 'ops', band: 'amber', score: 6.5 },
  { id: 's_tiw', name: 'Tiwalola E. Omosuwa', role: 'staff', sub: 'Genesys', tier: 'ops', band: 'amber', score: 6.0 },
  { id: 's_god', name: 'Godwin Idiong', role: 'lead', sub: 'Genesys', tier: 'leadership', band: 'amber', score: 6.5 },
]
// A Chairman and an HR seat, for role coverage.
STAFF.push({ id: 's_chair', name: 'Office of the Chairman', role: 'chairman', sub: 'Corporate', tier: 'leadership', band: 'green', score: 0 })
STAFF.push({ id: 's_hr', name: 'Ijeoma Balogun', role: 'hr', sub: 'Corporate', tier: 'leadership', band: 'green', score: 0 })
// Prior-cycle standing (April 2026), used to show movement.
const PREV = { s_jen: 8.1, s_ose: 8.2, s_ebi: 7.5, s_sol: 7.4, s_tha: 7.0, s_ojo: 7.3, s_gud: 7.8, s_chi: 7.7, s_ade: 7.6, s_sun: 6.6, s_kit: 5.5, s_goo: 6.2, s_tiw: 6.4, s_god: 6.3 }
// Reporting lines. Chairman at the top; each subsidiary head reports to the MD.
const MGR = {
  s_jen: 's_chair', s_gud: 's_chair', s_hr: 's_jen', s_ade: 's_jen',
  s_ose: 's_jen', s_ebi: 's_ose', s_god: 's_ose', s_sun: 's_ebi', s_kit: 's_ebi', s_chi: 's_ebi', s_tiw: 's_ose',
  s_sol: 's_jen', s_tha: 's_sol', s_ojo: 's_sol', s_goo: 's_sol',
}
STAFF.forEach((s) => { s.prev = PREV[s.id] ?? s.score; s.managerId = MGR[s.id] ?? null })

const KR = (statement, kr_type, measure, baseline, target, unit, opts = {}) => ({
  id: uid(), statement, kr_type, measure, baseline, target, unit,
  current: opts.current ?? '', confidence: opts.confidence ?? 60,
  due: opts.due ?? '2026-05-31', override_reason: opts.override_reason ?? null,
  checkins: opts.checkins ?? [],
})

function seedObjectives() {
  return [
    {
      id: uid(), owner: 's_jen', sub: 'Girard', priority: 'P1', cycle: 'May 2026',
      status: 'approved',
      title: 'Execute and close priority real estate transactions',
      description: 'Move the priority developments from intent to signed, funded delivery.',
      krs: [
        KR('Execute the Bourdillon JV or MOU on agreed commercial and legal terms', 'output', 'Agreement executed', 'MOU drafted', 'JV or MOU signed', 'milestone'),
        KR('Execute the Maiyegun Beach development agreement with a delivery timeline', 'output', 'Agreement executed', 'Terms sheet', 'Signed with timeline', 'milestone'),
        KR('Commence LASMIIZO with defined milestones by Iron Capital', 'output', 'Project commenced', 'Not started', 'Milestones agreed and begun', 'milestone'),
        KR('Complete the valuation of all Girard properties', 'output', 'Valuations complete', '0%', '100%', '%', { current: '60' }),
      ],
    },
    {
      id: uid(), owner: 's_ebi', sub: 'Genesys', priority: 'P2', cycle: 'May 2026',
      status: 'approved',
      title: 'Platform migration and modernisation',
      description: 'Consolidate every client on the unified Version 2 platform.',
      krs: [
        KR('Migrate all remaining Version 1 clients to Version 2 with a signed data-validation report per client', 'outcome', 'Clients migrated', '0 of remaining', 'All remaining', 'clients', { current: '40', confidence: 70 }),
        KR('Cut client-specific bug-fix effort by 25 to 30 percent', 'outcome', 'Support hours on forked patches', 'Baseline hours', '25 to 30% lower', '%', { confidence: 55 }),
        KR('Hold every Version 2 deployment within a 99.9 percent stability benchmark', 'outcome', 'Monthly uptime', '99.4%', '99.9%', '%', { current: '99.7', checkins: [{ at: '2026-05-08', value: 99.5, confidence: 60 }, { at: '2026-05-15', value: 99.6, confidence: 65 }, { at: '2026-05-22', value: 99.7, confidence: 70 }] }),
      ],
    },
    {
      id: uid(), owner: 's_tha', sub: 'Realms', priority: 'P3', cycle: 'May 2026',
      status: 'approved',
      title: 'Expand facility monitoring coverage',
      description: 'Systematic monitoring of all assigned HEFAMAA facilities.',
      krs: [
        KR('Achieve 95 percent completion of the HEFAMAA monitoring checklist on each visit', 'outcome', 'Checklist completion', '88%', '95%', '%', { current: '92', checkins: [{ at: '2026-05-07', value: 89, confidence: 55 }, { at: '2026-05-14', value: 91, confidence: 60 }, { at: '2026-05-21', value: 92, confidence: 65 }] }),
        KR('Reduce average interval between facility re-visits to 45 days', 'outcome', 'Re-visit interval', '68 days', '45 days', 'days', { current: '58', checkins: [{ at: '2026-05-07', value: 64, confidence: 50 }, { at: '2026-05-14', value: 60, confidence: 55 }, { at: '2026-05-21', value: 58, confidence: 60 }] }),
        KR('Complete physical inspections of all assigned facilities this cycle', 'output', 'Inspections done', '0%', '100%', '%', { current: '70' }),
      ],
    },
    {
      id: uid(), owner: 's_goo', sub: 'Realms', priority: 'P3', cycle: 'May 2026',
      status: 'approved',
      title: 'Improve facility regulatory compliance',
      description: 'Educate, correct and follow up so compliance holds.',
      krs: [
        KR('Reduce repeat non-compliance cases by 20 percent over 2 months', 'outcome', 'Repeat non-compliance', 'Baseline count', '20% lower', '%', { confidence: 50 }),
        KR('Ensure 90 percent of flagged facilities receive follow-up within 2 to 4 weeks', 'outcome', 'Follow-up rate', '65%', '90%', '%', { current: '74', checkins: [{ at: '2026-05-07', value: 68, confidence: 45 }, { at: '2026-05-14', value: 71, confidence: 50 }, { at: '2026-05-21', value: 74, confidence: 55 }] }),
        KR('Submit monitoring reports weekly to HEFAMAA', 'output', 'Reports submitted', 'Irregular', '100% weekly', '%', { current: '80' }),
      ],
    },
    {
      id: uid(), owner: 's_tiw', sub: 'Genesys', priority: 'P2', cycle: 'May 2026',
      status: 'submitted',
      title: 'Schedule appointments for Genesys clients',
      description: 'Turn client contact into booked, attended appointments.',
      krs: [
        KR('Contact assigned Genesys clients weekly', 'activity', 'Clients contacted', 'Ad hoc', 'Weekly, all assigned', 'cadence'),
        KR('Book appointments with contacted clients', 'output', 'Appointments booked', 'Untracked', '40 to 60% of contacted', '%'),
        KR('Record all bookings and client responses within 24 hours', 'output', 'Records logged', 'Same week', 'Within 24 hours', 'hours'),
      ],
    },
    {
      id: uid(), owner: 's_gud', sub: 'Corporate', priority: 'P4', cycle: 'May 2026',
      status: 'draft',
      title: 'Executive calendar optimisation and time efficiency',
      description: 'Protect the Chairman’s time and remove scheduling friction.',
      krs: [
        KR('Deliver the daily meeting schedule before 7:00 AM', 'activity', 'On-time delivery', 'Varies', 'Before 7:00 AM daily', 'cadence'),
        KR('Maintain zero scheduling conflicts', 'outcome', 'Conflicts per week', '2 to 3', '0', 'count'),
        KR('Confirm all meetings at least 24 hours in advance', 'activity', 'Confirmed ahead', 'Same day', '24 hours ahead', 'hours'),
      ],
    },
  ]
}

/* --------------------- Outcome engine (heuristic) ------------------ */
const OUT = /(reduce|cut|increase|decrease|improve|raise|lower|shorten|grow|convert|retain|achieve|reach|maintain zero|from .* to )/i
const OUTPUT = /(submit|deliver|produce|publish|create|build|launch|release|book|complete|develop|prepare|generate|deploy|roll ?out|provision|finalis|finaliz)/i
const ACTIVITY = /(attend|contact|conduct|hold|review|follow[ -]?up|maintain|coordinate|monitor|track|engage|liaise|respond|participate|meet|call|visit|update|support|sensitis|sensitiz)/i
const INPUT = /(hire|recruit|allocate|budget|procure|purchase|acquire|onboard)/i
const hasMetric = (s, m, b, t) =>
  /\d/.test(t || '') || /%/.test(s) || /\d/.test(s) || (!!b && !!t)

function heuristicClassify(kr) {
  const s = (kr.statement || '').trim()
  const measurable = hasMetric(s, kr.measure, kr.baseline, kr.target)
  let type = 'activity'
  if (INPUT.test(s)) type = 'input'
  if (ACTIVITY.test(s)) type = 'activity'
  if (OUTPUT.test(s)) type = 'output'
  const changey = OUT.test(s) && (measurable || /%/.test(s))
  if (changey) type = 'outcome'
  // a bare "achieve N%" or "reduce ... by N%" is an end-state
  if (/(reduce|cut|increase|decrease|lower|raise|improve).*\d/i.test(s)) type = 'outcome'
  if (/achieve\s+\d|maintain\s+zero|\bfrom\b.*\bto\b.*\d/i.test(s)) type = 'outcome'

  const rewrites = []
  if (type !== 'outcome') {
    const base = kr.baseline || 'today’s level'
    const tgt = kr.target || 'a defined target'
    const metric = kr.measure || 'the result this drives'
    rewrites.push(`Move ${metric.toLowerCase()} from ${base} to ${tgt} by the cycle end`)
    if (/book|appointment/i.test(s))
      rewrites.push('Convert 40 to 60 percent of contacted clients into confirmed, attended appointments')
    else if (/report|submit/i.test(s))
      rewrites.push('Cut management decision turnaround by a set percent through reliable reporting')
    else if (/contact|follow|call|visit/i.test(s))
      rewrites.push('Lift the responded or resolved client rate to a set percent through consistent contact')
    else
      rewrites.push(`Express this as the change it produces, with a baseline and a target, not the task itself`)
  }
  const note =
    type === 'outcome'
      ? 'Reads as an outcome. Confirm the baseline and target are real.'
      : `Reads as ${type}. Coach toward the change it should create.`
  return { type, measurable, rewrites: rewrites.slice(0, 2), note }
}

async function analyzeKR(kr) {
  // Try the AI proxy; fall back to the heuristic engine.
  try {
    const r = await fetch('/api/anthropic', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        max_tokens: 400,
        system:
          'You classify an OKR key result as input, activity, output or outcome. ' +
          'Reply ONLY as JSON: {"type":"...","measurable":true/false,"rewrites":["...","..."],"note":"..."}. ' +
          'An outcome is a measurable change in state. Coach non-outcomes toward outcomes.',
        messages: [{ role: 'user', content: JSON.stringify(kr) }],
      }),
    })
    if (!r.ok) throw new Error('ai off')
    const data = await r.json()
    const clean = (data.text || '').replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    if (parsed && parsed.type) return { ...parsed, source: 'ai' }
    throw new Error('bad')
  } catch {
    return { ...heuristicClassify(kr), source: 'heuristic' }
  }
}

const outcomeRatio = (objectives) => {
  const krs = objectives.flatMap((o) => o.krs)
  if (!krs.length) return 0
  return Math.round((krs.filter((k) => k.kr_type === 'outcome').length / krs.length) * 100)
}

/* ------------------------- Rubric scoring (Stage 4) --------------- */
// House rubric: SMART 30, Strategic Alignment 30, Ambition 20, Ownership 20.
const RUBRIC = { smart: 0.3, align: 0.3, ambition: 0.2, ownership: 0.2 }
const RUBRIC_LABEL = { smart: 'SMART quality', align: 'Strategic alignment', ambition: 'Ambition', ownership: 'Ownership' }
const PRIO_ALIGN = { P1: 10, P2: 8.5, P3: 7, P4: 5.5, P5: 4 }
const r1 = (x) => Math.round(x * 10) / 10
const hasNum = (s) => /\d/.test(String(s || ''))
const bandOf = (t) => (t >= 7 ? 'green' : t >= 4 ? 'amber' : 'red')

function scoreAuto(obj) {
  const krs = obj.krs || []
  const n = krs.length || 1
  const smart = (10 * krs.reduce((a, k) => a + ((k.measure ? 1 : 0) + (k.baseline ? 1 : 0) + (k.target ? 1 : 0) + (hasNum(k.target) || /%/.test(k.target || '') ? 1 : 0)) / 4, 0)) / n
  const align = PRIO_ALIGN[obj.priority] ?? 6
  const oratio = krs.length ? krs.filter((k) => k.kr_type === 'outcome').length / krs.length : 0
  const stretch = krs.some((k) => /\d+\s*%/.test(k.target || '') || /\bto\b/.test(k.target || '')) ? 0.5 : 0
  const ambition = Math.min(10, 4 + 6 * oratio + stretch)
  const ownership = (10 * krs.reduce((a, k) => a + ((k.measure ? 1 : 0) + (k.due ? 1 : 0) + ((k.confidence || 0) > 0 ? 1 : 0)) / 3, 0)) / n
  return { smart: r1(smart), align: r1(align), ambition: r1(ambition), ownership: r1(ownership) }
}

// Merge the auto score with any human adjustments held on obj.score.
function finalScore(obj) {
  const auto = (obj.score && obj.score.auto) || scoreAuto(obj)
  const adj = (obj.score && obj.score.adj) || {}
  const dims = {
    smart: adj.smart ?? auto.smart,
    align: adj.align ?? auto.align,
    ambition: adj.ambition ?? auto.ambition,
    ownership: adj.ownership ?? auto.ownership,
  }
  const total = r1(dims.smart * RUBRIC.smart + dims.align * RUBRIC.align + dims.ambition * RUBRIC.ambition + dims.ownership * RUBRIC.ownership)
  return { auto, adj, dims, total, band: bandOf(total), log: (obj.score && obj.score.log) || [] }
}

// A person's standing: the mean of their approved objectives, else their seeded cycle score.
function personScore(data, id) {
  const objs = data.objectives.filter((o) => o.owner === id && o.status === 'approved')
  if (!objs.length) {
    const s = data.staff.find((x) => x.id === id)
    return { total: s ? s.score : 0, band: s ? s.band : 'red', computed: false }
  }
  const t = r1(objs.reduce((a, o) => a + finalScore(o).total, 0) / objs.length)
  return { total: t, band: bandOf(t), computed: true }
}
// Movement against the prior cycle.
function movementOf(data, s) {
  const cur = personScore(data, s.id).total
  const prev = s.prev ?? cur
  return r1(cur - prev)
}

// Visibility: never peers. Own always; lead within subsidiary; md, hr, chairman everywhere.
const canViewScore = (me, o) =>
  o.owner === me.id || me.role === 'md' || me.role === 'hr' || me.role === 'chairman' || (me.role === 'lead' && o.sub === me.sub)
const canAdjustScore = (me, o) =>
  me.role === 'md' || me.role === 'hr' || (me.role === 'lead' && o.sub === me.sub)

/* ------------------ Stage 5: suggestions and stalls --------------- */
const SUGGEST = {
  Genesys: [
    { title: 'Cut client-reported defects', description: 'Fewer defects reaching production merchants.', kr: ['Reduce client-reported defects reaching production', 'Defects per month', 'baseline count', '30% lower', '%'] },
    { title: 'Lift platform uptime to benchmark', description: 'Hold Version 2 within the stability benchmark.', kr: ['Raise monthly uptime to the benchmark', 'Monthly uptime', '99.4%', '99.9%', '%'] },
    { title: 'Grow migrated-client adoption', description: 'More active use of the unified platform.', kr: ['Increase weekly active merchants on Version 2', 'Weekly active merchants', 'baseline', '25% higher', '%'] },
  ],
  Realms: [
    { title: 'Reduce repeat non-compliance', description: 'Compliance that holds after follow-up.', kr: ['Reduce repeat non-compliance cases', 'Repeat cases', 'baseline', '20% lower', '%'] },
    { title: 'Raise checklist completion', description: 'Complete HEFAMAA checks on every visit.', kr: ['Raise checklist completion on each visit', 'Checklist completion', '88%', '95%', '%'] },
    { title: 'Shorten re-visit interval', description: 'Faster monitoring cycles per facility.', kr: ['Shorten average re-visit interval', 'Re-visit interval', '68 days', '45 days', 'days'] },
  ],
  Girard: [
    { title: 'Lift on-time rent collection', description: 'Collect more of billed rent on time.', kr: ['Raise on-time rent collection', 'Collection rate', 'baseline', '95%', '%'] },
    { title: 'Close priority transactions', description: 'Move priority developments to signed.', kr: ['Execute priority development agreements', 'Agreements executed', '0', 'all priority', 'count'] },
    { title: 'Complete Girard valuations', description: 'Finish the property valuations.', kr: ['Complete property valuations', 'Valuations complete', '0%', '100%', '%'] },
  ],
  Yostrat: [
    { title: 'Grow serviced client accounts', description: 'Expand the active client base.', kr: ['Increase active serviced accounts', 'Active accounts', 'baseline', '25% higher', '%'] },
    { title: 'Reduce service turnaround', description: 'Deliver client requests faster.', kr: ['Cut average service turnaround time', 'Turnaround', 'baseline', '30% lower', '%'] },
    { title: 'Lift client retention', description: 'Keep more clients year on year.', kr: ['Raise client retention rate', 'Retention', 'baseline', '90%', '%'] },
  ],
  Corporate: [
    { title: 'Reduce process turnaround', description: 'Faster approvals and fewer delays.', kr: ['Cut approval turnaround time', 'Turnaround', 'baseline', '30% lower', '%'] },
    { title: 'Raise on-time reporting', description: 'Reliable reporting for decisions.', kr: ['Raise on-time report delivery', 'On-time rate', 'baseline', '100%', '%'] },
    { title: 'Cut scheduling conflicts', description: 'Protect the executive calendar.', kr: ['Reduce weekly scheduling conflicts', 'Conflicts per week', '2 to 3', '0', 'count'] },
  ],
}
function heuristicSuggest({ sub, existingTitles = [] }) {
  const pool = SUGGEST[sub] || SUGGEST.Corporate
  return pool.filter((s) => !existingTitles.includes(s.title)).slice(0, 3).map((s) => ({
    title: s.title, description: s.description,
    krs: [{ statement: s.kr[0], measure: s.kr[1], baseline: s.kr[2], target: s.kr[3], unit: s.kr[4], kr_type: 'outcome' }],
  }))
}
async function suggestObjectives(ctx) {
  try {
    const r = await fetch('/api/anthropic', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        max_tokens: 700,
        system: 'Suggest 3 outcome-based OKR objectives for the given role and subsidiary. Reply ONLY as a JSON array: [{"title","description","krs":[{"statement","measure","baseline","target","unit","kr_type":"outcome"}]}].',
        messages: [{ role: 'user', content: JSON.stringify(ctx) }],
      }),
    })
    if (!r.ok) throw new Error('ai off')
    const data = await r.json()
    const items = JSON.parse((data.text || '').replace(/```json|```/g, '').trim())
    if (Array.isArray(items) && items.length) return { source: 'ai', items: items.slice(0, 3) }
    throw new Error('bad')
  } catch {
    return { source: 'heuristic', items: heuristicSuggest(ctx) }
  }
}

const toNum = (s) => { const m = String(s ?? '').match(/-?\d+(\.\d+)?/); return m ? parseFloat(m[0]) : null }
const krHistory = (k) => k.checkins || []
const krLatestVal = (k) => { const h = krHistory(k); return h.length ? h[h.length - 1].value : (k.current !== '' && k.current != null ? k.current : null) }
const krConf = (k) => { const h = krHistory(k); return h.length ? h[h.length - 1].confidence : (k.confidence || 0) }
function krProgress(k) {
  const b = toNum(k.baseline), t = toNum(k.target), c = toNum(krLatestVal(k))
  if (b == null || t == null || c == null || t === b) return null
  return Math.max(0, Math.min(1, (c - b) / (t - b)))
}
const STALL_LOWCONF = 60
const STALL_BEHIND = 0.4
function stallReason(k) {
  const conf = krConf(k)
  if (k.kr_type === 'outcome' && conf > 0 && conf < STALL_LOWCONF) return 'Low confidence'
  const p = krProgress(k)
  if (p != null && p < STALL_BEHIND) return 'Behind target'
  return null
}
function stalledIn(objs) {
  const out = []
  objs.forEach((o) => (o.krs || []).forEach((k) => { const r = stallReason(k); if (r) out.push({ obj: o, k, reason: r }) }))
  return out
}
function nudgeText(name, objTitle, k, reason) {
  return `Hi ${name.split(' ')[0]}, a quick nudge from Forte Compass. The key result "${k.statement}" under "${objTitle}" is flagged ${reason.toLowerCase()}. Could you update progress or confidence this week?`
}
const waLink = (text) => `https://wa.me/?text=${encodeURIComponent(text)}`

/* ----------------------------- Store ------------------------------ */
const LKEY = (t) => `fc:data:${t}`
const SKEY = (t) => `fc:session:${t}`

async function loadData(tenantId) {
  if (LIVE) {
    try {
      const { data } = await supabase.from('kv').select('value').eq('tenant_id', tenantId).eq('key', 'dataset').maybeSingle()
      if (data && data.value) return data.value
    } catch { /* fall through */ }
  }
  try {
    const raw = localStorage.getItem(LKEY(tenantId))
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  const seeded = { staff: STAFF.map((s) => ({ ...s })), objectives: tenantId === 'imade-forte' ? seedObjectives() : [] }
  return seeded
}

async function saveData(tenantId, data) {
  if (LIVE) {
    try { await supabase.from('kv').upsert({ tenant_id: tenantId, key: 'dataset', value: data, updated_at: new Date().toISOString() }) } catch { /* ignore */ }
  }
  try { localStorage.setItem(LKEY(tenantId), JSON.stringify(data)) } catch { /* ignore */ }
}

/* ------------------------------ Atoms ----------------------------- */
function Pill({ kind, children }) {
  return <span className={`fc-pill fc-pill-${kind}`}>{children}</span>
}
function TypeTag({ t }) {
  const label = { input: 'Input', activity: 'Activity', output: 'Output', outcome: 'Outcome' }[t] || t
  return <span className={`fc-type fc-type-${t}`}>{label}</span>
}
function Band({ b }) {
  const m = { green: 'Green', amber: 'Amber', red: 'Red' }
  return <span className={`fc-band fc-band-${b}`}>{m[b] || '—'}</span>
}
function Avatar({ name }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
  return <span className="fc-avatar">{initials}</span>
}
function Move({ v }) {
  if (!v) return <span className="fc-move fc-move-flat" title="No change">—</span>
  const up = v > 0
  return <span className={`fc-move ${up ? 'up' : 'down'}`} title="Versus last cycle">{up ? '▲' : '▼'} {Math.abs(v).toFixed(1)}</span>
}
function Sparkline({ values }) {
  if (!values || values.length < 2) return <span className="fc-spark-empty">no history</span>
  const w = 96, h = 26, pad = 3
  const min = Math.min(...values), max = Math.max(...values), span = (max - min) || 1
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - 2 * pad)
    const y = h - pad - ((v - min) / span) * (h - 2 * pad)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  const last = pts.split(' ').pop().split(',')
  return (
    <svg className="fc-spark" viewBox={`0 0 ${w} ${h}`} width={w} height={h} role="img" aria-label="trend">
      <polyline points={pts} fill="none" stroke="var(--gold)" strokeWidth="1.5" />
      <circle cx={last[0]} cy={last[1]} r="2" fill="var(--gold-lit)" />
    </svg>
  )
}
function ProgressBar({ k }) {
  const p = krProgress(k)
  if (p == null) return <span className="fc-muted fc-prog-na">tracked qualitatively</span>
  const pct = Math.round(p * 100)
  return (
    <div className="fc-progress" title={`${pct}% to target`}>
      <div className={`fc-progress-fill ${pct >= 67 ? 'ok' : pct >= 34 ? 'mid' : 'low'}`} style={{ width: `${pct}%` }} />
      <span className="fc-progress-pct">{pct}%</span>
    </div>
  )
}

/* ------------------------- Gateway (Stage 1) ---------------------- */
function Gateway({ tenant, onSignIn }) {
  const [revealed, setRevealed] = useState(false)
  const rungs = [
    ['Input', 'resources committed', false],
    ['Activity', 'actions taken', false],
    ['Output', 'things produced', false],
    ['Outcome', 'change delivered', true],
  ]
  const caps = [
    ['Author', 'Draft objectives with an engine that coaches every key result toward an outcome, and asks for a reason before it lets a weaker measure through.'],
    ['Track', 'Log progress on a cadence that fits the role, weekly for operations and monthly for leadership, against a baseline and a target.'],
    ['Score', 'Auto-score against the house rubric, adjustable by a human and logged every time, banded green, amber or red.'],
    ['Coach', 'See the next OKRs suggested for a role, and get a nudge on WhatsApp the moment a key result stalls.'],
  ]
  return (
    <>
      <header className="fc-top">
        <a className="fc-brand" href="#top">
          {tenant.logo && <img className="fc-brand-logo" src={tenant.logo} alt={tenant.name} />}
          <span className="fc-wordmark">Forte <em>Compass</em></span>
        </a>
        <button className="fc-btn fc-btn-ghost" onClick={onSignIn}>Sign in</button>
      </header>
      <main id="top" className="fc-hero">
        <div className="fc-hero-copy">
          <p className="fc-eyebrow">Office of the Chairman · OKR &amp; Performance</p>
          <h1 className="fc-headline">Manage to <span className="fc-gold">outcomes</span>.</h1>
          <p className="fc-sub">Forte Compass holds every team to the change it creates, not the hours it logs or the reports it files. Objectives are authored, tracked, scored and coached against outcomes, right across the group.</p>
          <div className="fc-cta-row">
            <button className="fc-btn fc-btn-gold" onClick={onSignIn}>Sign in</button>
            <a className="fc-link" href="#how" onClick={() => setRevealed(true)}>See how it works</a>
          </div>
        </div>
        <aside className="fc-ladder">
          <ol className="fc-ladder-list">
            {rungs.map((r, i) => (
              <li key={r[0]} className={`fc-rung ${r[2] ? 'is-lit' : ''}`}>
                <span className="fc-rung-index">{i + 1}</span>
                <span className="fc-rung-body"><span className="fc-rung-label">{r[0]}</span><span className="fc-rung-note">{r[1]}</span></span>
                {r[2] && <span className="fc-rung-flag">counts</span>}
              </li>
            ))}
          </ol>
          <p className="fc-ladder-caption">Effort climbs. Only the outcome is scored.</p>
        </aside>
      </main>
      <section id="how" className="fc-how">
        <p className="fc-eyebrow fc-eyebrow-dark">What it does</p>
        <div className="fc-cap-grid">
          {caps.map((c, i) => (
            <article key={c[0]} className="fc-cap">
              <span className="fc-cap-index">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="fc-cap-title">{c[0]}</h3>
              <p className="fc-cap-body">{c[1]}</p>
            </article>
          ))}
        </div>
      </section>
      <footer className="fc-foot">
        <div className="fc-foot-left">
          {tenant.logo && <img className="fc-foot-logo" src={tenant.logo} alt={tenant.name} />}
          <span className="fc-foot-tenant">Tenant one</span>
        </div>
        <span className="fc-foot-right">Forte Compass is tenant-aware and can be licensed to other firms.</span>
      </footer>
    </>
  )
}

/* --------------------------- Auth screen -------------------------- */
function AuthScreen({ tenant, staff, onEnter, onBack }) {
  const [mode, setMode] = useState('pick')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [msg, setMsg] = useState('')

  async function liveAuth(kind) {
    setMsg('')
    try {
      const creds = { email: email.trim(), password: pw }
      const { error } = kind === 'up'
        ? await supabase.auth.signUp(creds)
        : await supabase.auth.signInWithPassword(creds)
      if (error) setMsg(error.message)
      else if (kind === 'up') setMsg('Account created. If email confirmation is on, confirm then sign in.')
    } catch (e) { setMsg(String(e && e.message ? e.message : e)) }
  }

  return (
    <div className="fc-auth">
      <div className="fc-auth-card">
        <button className="fc-back" onClick={onBack}>← Back</button>
        {tenant.logo && <img className="fc-auth-logo" src={tenant.logo} alt={tenant.name} />}
        <h2 className="fc-auth-title">Sign in to Forte Compass</h2>
        <p className="fc-auth-sub">{tenant.name}{!LIVE && <span className="fc-demo-tag">Demo mode</span>}</p>

        {LIVE ? (
          <div className="fc-auth-form">
            <input className="fc-input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className="fc-input" placeholder="Password" type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
            <div className="fc-cta-row">
              <button className="fc-btn fc-btn-gold" onClick={() => liveAuth('in')}>Sign in</button>
              <button className="fc-btn fc-btn-ghost" onClick={() => liveAuth('up')}>Create account</button>
            </div>
            {msg && <p className="fc-auth-msg">{msg}</p>}
          </div>
        ) : (
          <>
            <p className="fc-auth-hint">Pick who you are to enter. Every role sees its own view.</p>
            <div className="fc-identity-list">
              {staff.filter((s) => s.role !== undefined).map((s) => (
                <button key={s.id} className="fc-identity" onClick={() => onEnter(s)}>
                  <Avatar name={s.name} />
                  <span className="fc-identity-body">
                    <span className="fc-identity-name">{s.name}</span>
                    <span className="fc-identity-role">{ROLES[s.role]} · {s.sub}</span>
                  </span>
                </button>
              ))}
            </div>
            <button className="fc-link fc-add-new" onClick={() => setMode('new')}>+ Create a new person</button>
            {mode === 'new' && <RolePicker tenant={tenant} onCreate={(p) => onEnter(p)} />}
          </>
        )}
      </div>
    </div>
  )
}

/* ------------------ Role picker (which best describes you) -------- */
function RolePicker({ tenant, onCreate }) {
  const [name, setName] = useState('')
  const [role, setRole] = useState('staff')
  const [sub, setSub] = useState(tenant.subsidiaries[0])
  const cards = [['staff', 'Staff'], ['lead', 'Subsidiary Lead'], ['md', 'Managing Director'], ['hr', 'HR Manager'], ['chairman', 'Chairman'], ['admin', 'Tenant Admin']]
  return (
    <div className="fc-rolepick">
      <p className="fc-rp-q">Which best describes you?</p>
      <div className="fc-rp-grid">
        {cards.map((c) => (
          <button key={c[0]} className={`fc-rp-card ${role === c[0] ? 'is-on' : ''}`} onClick={() => setRole(c[0])}>{c[1]}</button>
        ))}
      </div>
      <input className="fc-input" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
      <select className="fc-input" value={sub} onChange={(e) => setSub(e.target.value)}>
        {tenant.subsidiaries.map((s) => <option key={s}>{s}</option>)}
      </select>
      <button className="fc-btn fc-btn-gold" disabled={!name.trim()}
        onClick={() => onCreate({ id: uid(), name: name.trim(), role, sub, tier: role === 'staff' ? 'ops' : 'leadership', band: 'green', score: 0 })}>
        Enter Forte Compass
      </button>
    </div>
  )
}

/* ----------------------------- App shell -------------------------- */
function AppShell({ tenant, me, data, setData, onSwitchTenant, onSignOut }) {
  const [tab, setTab] = useState(me.role === 'chairman' ? 'cockpit' : 'dashboard')
  const [editing, setEditing] = useState(null) // objective being authored

  const myObjectives = data.objectives.filter((o) => o.owner === me.id)
  const canReview = me.role === 'lead' || me.role === 'md' || me.role === 'hr'
  const canSeeAll = me.role !== 'staff'
  const canAdmin = me.role === 'admin' || me.role === 'md' || me.role === 'hr'
  const canOrg = me.role === 'chairman' || me.role === 'md' || me.role === 'hr' || me.role === 'admin'

  function addStaff(s) { setData((d) => ({ ...d, staff: [...d.staff, s] })) }
  function updateStaff(id, patch) { setData((d) => ({ ...d, staff: d.staff.map((x) => (x.id === id ? { ...x, ...patch } : x)) })) }
  function removeStaff(id) { setData((d) => ({ ...d, staff: d.staff.filter((x) => x.id !== id), objectives: d.objectives.filter((o) => o.owner !== id) })) }

  function upsertObjective(obj) {
    setData((d) => {
      const exists = d.objectives.some((o) => o.id === obj.id)
      const objectives = exists ? d.objectives.map((o) => (o.id === obj.id ? obj : o)) : [...d.objectives, obj]
      return { ...d, objectives }
    })
  }
  function setStatus(id, status) {
    setData((d) => ({ ...d, objectives: d.objectives.map((o) => (o.id === id ? { ...o, status } : o)) }))
  }
  function adjustScore(objId, changes, reason) {
    setData((d) => ({
      ...d,
      objectives: d.objectives.map((o) => {
        if (o.id !== objId) return o
        const auto = (o.score && o.score.auto) || scoreAuto(o)
        const prevAdj = (o.score && o.score.adj) || {}
        const log = [...((o.score && o.score.log) || [])]
        const adj = { ...prevAdj }
        Object.entries(changes).forEach(([dim, to]) => {
          const from = prevAdj[dim] ?? auto[dim]
          if (from === to) return
          adj[dim] = to
          log.push({ by: me.name, role: me.role, at: new Date().toISOString().slice(0, 16).replace('T', ' '), dim, from, to, reason: reason || '' })
        })
        return { ...o, score: { auto, adj, log } }
      }),
    }))
  }
  function useSuggestion(sugg) {
    setEditing({
      id: uid(), owner: me.id, sub: me.sub, priority: tenant.priorities[0].rank, cycle: 'May 2026', status: 'draft',
      title: sugg.title || '', description: sugg.description || '',
      krs: (sugg.krs || []).map((k) => ({ id: uid(), statement: k.statement || '', kr_type: k.kr_type || null, measure: k.measure || '', baseline: k.baseline || '', target: k.target || '', unit: k.unit || '', current: '', confidence: 60, due: '2026-05-31', override_reason: null })),
    })
    setTab('objectives')
  }

  function logCheckin(objId, krId, entry) {
    setData((d) => ({
      ...d,
      objectives: d.objectives.map((o) => (o.id !== objId ? o : {
        ...o,
        krs: o.krs.map((k) => (k.id !== krId ? k : {
          ...k,
          checkins: [...(k.checkins || []), { ...entry, by: me.name }],
          current: String(entry.value),
          confidence: entry.confidence,
        })),
      })),
    }))
  }

  const tabs = me.role === 'chairman'
    ? [['cockpit', 'Cockpit'], ['organisations', 'Organisations'], ['organogram', 'Organogram'], ['scorecards', 'Scorecards']]
    : [
        ['dashboard', 'Dashboard'],
        ['objectives', 'My OKRs'],
        ['checkins', 'Check-ins'],
        ['scorecards', 'Scorecards'],
        canReview && ['review', 'Review & approve'],
        canSeeAll && ['organisations', 'Organisations'],
        canOrg && ['organogram', 'Organogram'],
        canAdmin && ['admin', 'Roster'],
      ].filter(Boolean)

  return (
    <div className="fc-app">
      <header className="fc-appbar">
        <div className="fc-appbar-left">
          {tenant.logo && <img className="fc-appbar-logo" src={tenant.logo} alt={tenant.name} />}
          <span className="fc-appbar-word">Forte <em>Compass</em></span>
        </div>
        <nav className="fc-nav">
          {tabs.map((t) => (
            <button key={t[0]} className={`fc-nav-btn ${tab === t[0] ? 'is-on' : ''}`} onClick={() => { setTab(t[0]); setEditing(null) }}>{t[1]}</button>
          ))}
        </nav>
        <div className="fc-appbar-right">
          {me.role === 'admin' && (
            <select className="fc-tenant-switch" value={tenant.id} onChange={(e) => onSwitchTenant(e.target.value)}>
              {Object.values(TENANTS).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          )}
          <span className="fc-me"><Avatar name={me.name} /><span className="fc-me-body"><b>{me.name}</b><i>{ROLES[me.role]}</i></span></span>
          <button className="fc-btn fc-btn-ghost fc-btn-sm" onClick={onSignOut}>Switch</button>
        </div>
      </header>

      <main className="fc-main">
        {tab === 'dashboard' && <Dashboard tenant={tenant} me={me} data={data} onAuthor={() => { setTab('objectives') }} />}
        {tab === 'cockpit' && <Cockpit tenant={tenant} data={data} />}
        {tab === 'objectives' && !editing && (
          <Objectives me={me} objectives={myObjectives} tenant={tenant}
            onNew={() => setEditing({ id: uid(), owner: me.id, sub: me.sub, priority: tenant.priorities[0].rank, cycle: 'May 2026', status: 'draft', title: '', description: '', krs: [] })}
            onEdit={(o) => setEditing(o)} onSubmit={(id) => setStatus(id, 'submitted')} onUseSuggestion={useSuggestion} />
        )}
        {tab === 'objectives' && editing && (
          <Author tenant={tenant} objective={editing} onCancel={() => setEditing(null)}
            onSave={(o) => { upsertObjective(o); setEditing(null) }} />
        )}
        {tab === 'review' && <Review data={data} me={me} onApprove={(id) => setStatus(id, 'approved')} onReturn={(id) => setStatus(id, 'draft')} />}
        {tab === 'scorecards' && <Scorecards data={data} me={me} onAdjust={adjustScore} />}
        {tab === 'checkins' && <CheckIns me={me} objectives={myObjectives} onLog={logCheckin} />}
        {tab === 'organisations' && <Organisations tenant={tenant} data={data} me={me} />}
        {tab === 'organogram' && <Organogram tenant={tenant} data={data} me={me} />}
        {tab === 'admin' && <AdminConsole tenant={tenant} data={data} onAdd={addStaff} onUpdate={updateStaff} onRemove={removeStaff} />}
      </main>
    </div>
  )
}

/* ----------------------------- Dashboard -------------------------- */
function Dashboard({ tenant, me, data, onAuthor }) {
  const scored = data.staff.filter((s) => s.score > 0).map((s) => ({ s, ...personScore(data, s.id) }))
  const green = scored.filter((x) => x.band === 'green').length
  const amber = scored.filter((x) => x.band === 'amber').length
  const red = scored.filter((x) => x.band === 'red').length
  const avg = scored.length ? (scored.reduce((a, x) => a + x.total, 0) / scored.length).toFixed(1) : '—'
  const ratio = outcomeRatio(data.objectives)
  const mine = data.objectives.filter((o) => o.owner === me.id)

  return (
    <div className="fc-dash">
      <div className="fc-dash-head">
        <h2>Good day, {me.name.split(' ')[0]}.</h2>
        <p className="fc-muted">{ROLES[me.role]} · {me.sub} · {me.tier === 'ops' ? 'Weekly check-ins' : 'Monthly check-ins'}</p>
      </div>
      <div className="fc-board-grid fc-dash-metrics">
        <Metric value={`${ratio}%`} label="Group outcome ratio" />
        <Metric value={avg} unit="/10" label="Weighted average" />
        <div className="fc-metric"><span className="fc-rag"><b className="fc-rag-g">{green}</b><b className="fc-rag-a">{amber}</b><b className="fc-rag-r">{red}</b></span><span className="fc-metric-label">Green · Amber · Red</span></div>
        <Metric value={scored.length} label={`Staff · ${tenant.subsidiaries.length} subsidiaries`} />
      </div>

      <div className="fc-dash-cols">
        <section className="fc-panel">
          <div className="fc-panel-head"><h3>Your objectives</h3><button className="fc-btn fc-btn-gold fc-btn-sm" onClick={onAuthor}>Open My OKRs</button></div>
          {mine.length === 0 && <p className="fc-empty">No objectives yet. Open My OKRs to author your first.</p>}
          {mine.map((o) => (
            <div key={o.id} className="fc-obj-row">
              <div><b>{o.title || 'Untitled objective'}</b><span className="fc-muted"> · {o.krs.length} key results</span></div>
              <div className="fc-obj-row-right"><OutcomeChip objectives={[o]} /><StatusTag s={o.status} /></div>
            </div>
          ))}
        </section>
        <section className="fc-panel">
          <div className="fc-panel-head"><h3>Strategic priorities</h3></div>
          {tenant.priorities.map((p) => (
            <div key={p.rank} className="fc-prio"><span className="fc-prio-rank">{p.rank}</span><span>{p.name}</span></div>
          ))}
        </section>
      </div>
      <MyStalls objectives={mine} />
      <CheckinNudge objectives={mine} />
    </div>
  )
}
function CheckinNudge({ objectives }) {
  const items = objectives.filter((o) => o.status === 'approved').flatMap((o) => o.krs.map((k) => ({ o, k }))).filter((x) => krHistory(x.k).length === 0)
  if (items.length === 0) return null
  return (
    <section className="fc-panel fc-stallpanel">
      <div className="fc-panel-head"><h3>Awaiting a check-in</h3><span className="fc-muted">{items.length} key results</span></div>
      {items.slice(0, 6).map(({ o, k }, i) => (
        <div key={i} className="fc-stall"><div className="fc-stall-body"><b>{k.statement}</b><span className="fc-muted">{o.title}</span></div></div>
      ))}
    </section>
  )
}
function MyStalls({ objectives }) {
  const stalls = stalledIn(objectives.filter((o) => o.status === 'approved' || o.status === 'submitted'))
  if (stalls.length === 0) return null
  return (
    <section className="fc-panel fc-stallpanel">
      <div className="fc-panel-head"><h3>Needs your attention</h3><span className="fc-muted">{stalls.length} flagged</span></div>
      {stalls.map(({ obj, k, reason }, i) => (
        <div key={i} className="fc-stall">
          <div className="fc-stall-body"><span className="fc-stall-reason">{reason}</span><b>{k.statement}</b><span className="fc-muted">{obj.title}</span></div>
        </div>
      ))}
    </section>
  )
}
function Metric({ value, unit, label }) {
  return <div className="fc-metric"><span className="fc-metric-value">{value}{unit && <span className="fc-metric-unit">{unit}</span>}</span><span className="fc-metric-label">{label}</span></div>
}
function OutcomeChip({ objectives }) {
  const r = outcomeRatio(objectives)
  return <span className={`fc-ochip ${r >= 60 ? 'ok' : r >= 30 ? 'mid' : 'low'}`}>{r}% outcome</span>
}
function StatusTag({ s }) {
  const m = { draft: 'Draft', submitted: 'Submitted', approved: 'Approved', active: 'Active', closed: 'Closed' }
  return <span className={`fc-status fc-status-${s}`}>{m[s] || s}</span>
}

/* --------------------------- Objectives list ---------------------- */
function Objectives({ me, objectives, tenant, onNew, onEdit, onSubmit, onUseSuggestion }) {
  const [suggesting, setSuggesting] = useState(false)
  return (
    <div className="fc-objlist">
      <div className="fc-panel-head fc-objlist-head">
        <div><h2>My OKRs</h2><p className="fc-muted">Author objectives and hold each key result to an outcome.</p></div>
        <div className="fc-cta-row">
          <button className="fc-btn fc-btn-ghost" onClick={() => setSuggesting((s) => !s)}>{suggesting ? 'Hide suggestions' : 'Suggest next OKRs'}</button>
          <button className="fc-btn fc-btn-gold" onClick={onNew}>+ New objective</button>
        </div>
      </div>
      {suggesting && <SuggestPanel me={me} objectives={objectives} onUse={(s) => onUseSuggestion(s)} />}
      {objectives.length === 0 && <p className="fc-empty">Nothing here yet. Create your first objective.</p>}
      {objectives.map((o) => (
        <div key={o.id} className="fc-objcard">
          <div className="fc-objcard-head">
            <div><h3>{o.title || 'Untitled objective'}</h3><p className="fc-muted">{o.sub} · {o.priority} · {o.cycle}</p></div>
            <div className="fc-objcard-tags"><OutcomeChip objectives={[o]} /><StatusTag s={o.status} /></div>
          </div>
          <ul className="fc-krlist">
            {o.krs.map((k) => (
              <li key={k.id}><TypeTag t={k.kr_type} /><span className="fc-kr-st">{k.statement}</span>{k.override_reason && <Pill kind="warn">override</Pill>}</li>
            ))}
          </ul>
          <div className="fc-objcard-actions">
            <button className="fc-btn fc-btn-ghost fc-btn-sm" onClick={() => onEdit(o)}>Edit</button>
            {o.status === 'draft' && <button className="fc-btn fc-btn-gold fc-btn-sm" onClick={() => onSubmit(o.id)}>Submit for approval</button>}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ------------------------- Suggest next OKRs ---------------------- */
function SuggestPanel({ me, objectives, onUse }) {
  const [state, setState] = useState({ loading: true, items: [], source: '' })
  useEffect(() => {
    let live = true
    const existingTitles = objectives.map((o) => o.title)
    suggestObjectives({ role: me.role, sub: me.sub, existingTitles }).then((r) => { if (live) setState({ loading: false, items: r.items, source: r.source }) })
    return () => { live = false }
  }, [me.id])
  return (
    <div className="fc-suggest">
      <p className="fc-suggest-title">Suggested next objectives for {me.sub}{state.source === 'heuristic' ? ' (offline engine)' : state.source === 'ai' ? ' (AI)' : ''}</p>
      {state.loading && <p className="fc-muted">Thinking…</p>}
      {!state.loading && state.items.length === 0 && <p className="fc-muted">No fresh suggestions right now.</p>}
      <div className="fc-suggest-grid">
        {state.items.map((s, i) => (
          <div key={i} className="fc-suggest-card">
            <h4>{s.title}</h4>
            <p className="fc-muted">{s.description}</p>
            <ul className="fc-suggest-krs">
              {(s.krs || []).map((k, j) => <li key={j}><TypeTag t={k.kr_type || 'outcome'} /> {k.statement}</li>)}
            </ul>
            <button className="fc-btn fc-btn-gold fc-btn-sm" onClick={() => onUse(s)}>Use this</button>
          </div>
        ))}
      </div>
    </div>
  )
}


/* ------------------------------ Check-ins ------------------------- */
function CheckIns({ me, objectives, onLog }) {
  const active = objectives.filter((o) => o.status === 'approved')
  return (
    <div className="fc-checkins">
      <div className="fc-panel-head">
        <div><h2>Check-ins</h2><p className="fc-muted">Log progress against baseline and target. {me.tier === 'ops' ? 'Weekly cadence.' : 'Monthly cadence.'}</p></div>
      </div>
      {active.length === 0 && <p className="fc-empty">Check-ins open once an objective is approved.</p>}
      {active.map((o) => (
        <div key={o.id} className="fc-objcard">
          <div className="fc-objcard-head"><div><h3>{o.title}</h3><p className="fc-muted">{o.sub} · {o.priority}</p></div></div>
          <div className="fc-ci-list">
            {o.krs.map((k) => <CheckInRow key={k.id} k={k} onLog={(entry) => onLog(o.id, k.id, entry)} />)}
          </div>
        </div>
      ))}
    </div>
  )
}

function CheckInRow({ k, onLog }) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const [confidence, setConfidence] = useState(krConf(k) || 60)
  const [note, setNote] = useState('')
  const hist = krHistory(k)
  const values = hist.map((h) => Number(h.value))
  const latest = krLatestVal(k)

  function save() {
    const v = parseFloat(value)
    if (isNaN(v)) { setOpen(false); return }
    onLog({ at: new Date().toISOString().slice(0, 10), value: v, confidence: Number(confidence), note })
    setOpen(false); setValue(''); setNote('')
  }

  return (
    <div className="fc-ci-row">
      <div className="fc-ci-main">
        <div className="fc-ci-statement"><TypeTag t={k.kr_type || 'outcome'} /> <span>{k.statement}</span></div>
        <div className="fc-ci-metrics">
          <div className="fc-ci-prog"><ProgressBar k={k} /></div>
          <Sparkline values={values} />
          <span className="fc-ci-latest">{latest != null ? `${latest}${/%/.test(k.unit || '') || /%/.test(k.target || '') ? '%' : ''}` : '—'}<span className="fc-muted"> now</span></span>
          <span className="fc-ci-conf">conf {krConf(k)}%</span>
          <button className="fc-btn fc-btn-ghost fc-btn-sm" onClick={() => setOpen((o) => !o)}>{open ? 'Close' : 'Log check-in'}</button>
        </div>
      </div>
      <div className="fc-ci-meta"><span className="fc-muted">Baseline {k.baseline || '—'} · Target {k.target || '—'}{hist.length ? ` · ${hist.length} updates` : ''}</span></div>
      {open && (
        <div className="fc-ci-form">
          <label className="fc-field"><span>New value</span><input className="fc-input" placeholder={`e.g. ${k.target || '90'}`} value={value} onChange={(e) => setValue(e.target.value)} /></label>
          <label className="fc-field"><span>Confidence {confidence}%</span><input type="range" min="0" max="100" value={confidence} onChange={(e) => setConfidence(e.target.value)} /></label>
          <label className="fc-field fc-ci-note"><span>Note (optional)</span><input className="fc-input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="What moved this week?" /></label>
          <button className="fc-btn fc-btn-gold fc-btn-sm" onClick={save}>Save check-in</button>
        </div>
      )}
    </div>
  )
}

/* ------------------------- Author + outcome engine ---------------- */
function Author({ tenant, objective, onSave, onCancel }) {
  const [obj, setObj] = useState(objective)
  const set = (patch) => setObj((o) => ({ ...o, ...patch }))

  function addKR() {
    setObj((o) => ({ ...o, krs: [...o.krs, { id: uid(), statement: '', kr_type: null, measure: '', baseline: '', target: '', unit: '', current: '', confidence: 60, due: '2026-05-31', override_reason: null }] }))
  }
  function patchKR(id, patch) {
    setObj((o) => ({ ...o, krs: o.krs.map((k) => (k.id === id ? { ...k, ...patch } : k)) }))
  }
  function removeKR(id) { setObj((o) => ({ ...o, krs: o.krs.filter((k) => k.id !== id) })) }

  const ratio = outcomeRatio([{ ...obj, krs: obj.krs.filter((k) => k.kr_type) }])
  const blocked = obj.krs.some((k) => k.kr_type && k.kr_type !== 'outcome' && !k.override_reason && !k._accepted)
  const incomplete = !obj.title.trim() || obj.krs.length === 0 || obj.krs.some((k) => !k.statement.trim() || !k.measure.trim() || !k.baseline.trim() || !k.target.trim())

  return (
    <div className="fc-author">
      <div className="fc-panel-head">
        <div><h2>{objective.title ? 'Edit objective' : 'New objective'}</h2><p className="fc-muted">Every key result is coached toward an outcome before it can be saved.</p></div>
        <OutcomeChip objectives={[{ ...obj, krs: obj.krs.filter((k) => k.kr_type) }]} />
      </div>

      <div className="fc-field-grid">
        <label className="fc-field fc-col2"><span>Objective</span><input className="fc-input" value={obj.title} placeholder="What change are you committing to?" onChange={(e) => set({ title: e.target.value })} /></label>
        <label className="fc-field"><span>Subsidiary</span>
          <select className="fc-input" value={obj.sub} onChange={(e) => set({ sub: e.target.value })}>{tenant.subsidiaries.map((s) => <option key={s}>{s}</option>)}</select></label>
        <label className="fc-field"><span>Strategic priority</span>
          <select className="fc-input" value={obj.priority} onChange={(e) => set({ priority: e.target.value })}>{tenant.priorities.map((p) => <option key={p.rank} value={p.rank}>{p.rank} · {p.name}</option>)}</select></label>
        <label className="fc-field fc-col2"><span>Description</span><input className="fc-input" value={obj.description} placeholder="One line of context" onChange={(e) => set({ description: e.target.value })} /></label>
      </div>

      <div className="fc-kr-head"><h3>Key results</h3><button className="fc-btn fc-btn-ghost fc-btn-sm" onClick={addKR}>+ Add key result</button></div>
      {obj.krs.map((k, i) => <KRRow key={k.id} k={k} n={i + 1} onPatch={(p) => patchKR(k.id, p)} onRemove={() => removeKR(k.id)} />)}
      {obj.krs.length === 0 && <p className="fc-empty">Add at least one key result. The engine will classify it as you go.</p>}

      <div className="fc-author-foot">
        <div className="fc-author-status">
          {blocked && <Pill kind="warn">Resolve each non-outcome, or record a reason to keep it</Pill>}
          {!blocked && incomplete && <Pill kind="mut">Fill in statement, measure, baseline and target for every key result</Pill>}
          {!blocked && !incomplete && <Pill kind="ok">Ready. {ratio}% of key results are outcomes</Pill>}
        </div>
        <div className="fc-cta-row">
          <button className="fc-btn fc-btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="fc-btn fc-btn-gold" disabled={blocked || incomplete} onClick={() => onSave(obj)}>Save objective</button>
        </div>
      </div>
    </div>
  )
}

function KRRow({ k, n, onPatch, onRemove }) {
  const [analysis, setAnalysis] = useState(() => (k.kr_type ? { ...heuristicClassify(k), type: k.kr_type, source: 'seed' } : null))
  const [busy, setBusy] = useState(false)

  async function analyse() {
    if (!k.statement.trim() || k._accepted) return
    setBusy(true)
    const a = await analyzeKR(k)
    setAnalysis(a)
    onPatch({ kr_type: a.type })
    setBusy(false)
  }

  const needsCoach = k.kr_type && k.kr_type !== 'outcome' && !k.override_reason && !k._accepted

  return (
    <div className={`fc-krrow ${k.kr_type ? `is-${k.kr_type}` : ''}`}>
      <div className="fc-krrow-top">
        <span className="fc-krrow-n">{n}</span>
        <input className="fc-input fc-kr-statement" placeholder="Key result" value={k.statement}
          onChange={(e) => onPatch({ statement: e.target.value, kr_type: null, _accepted: false })} onBlur={analyse} />
        {k.kr_type && <TypeTag t={k.kr_type} />}
        <button className="fc-icon-btn" title="Remove" onClick={onRemove}>✕</button>
      </div>
      <div className="fc-kr-measures">
        <input className="fc-input" placeholder="Measure" value={k.measure} onChange={(e) => onPatch({ measure: e.target.value })} />
        <input className="fc-input" placeholder="Baseline" value={k.baseline} onChange={(e) => onPatch({ baseline: e.target.value })} />
        <input className="fc-input" placeholder="Target" value={k.target} onChange={(e) => onPatch({ target: e.target.value })} />
        <input className="fc-input" placeholder="Unit" value={k.unit} onChange={(e) => onPatch({ unit: e.target.value })} />
      </div>
      {busy && <p className="fc-kr-note">Checking…</p>}
      {analysis && analysis.source && analysis.source !== 'seed' && <p className="fc-kr-note">{analysis.note}{analysis.source === 'heuristic' ? ' (offline engine)' : ''}</p>}

      {needsCoach && (
        <div className="fc-coach">
          <p className="fc-coach-title">Coach toward an outcome</p>
          {analysis && analysis.rewrites && analysis.rewrites.length > 0 && (
            <div className="fc-coach-rewrites">
              {analysis.rewrites.map((rw, i) => (
                <button key={i} className="fc-coach-rw" onClick={() => onPatch({ statement: rw, kr_type: 'outcome', _accepted: true })}>{rw}</button>
              ))}
            </div>
          )}
          <div className="fc-coach-override">
            <input className="fc-input" placeholder="Or record a reason to keep it as is" value={k.override_reason || ''} onChange={(e) => onPatch({ override_reason: e.target.value || null })} />
          </div>
        </div>
      )}
      {k.kr_type && k.kr_type !== 'outcome' && k.override_reason && <p className="fc-kr-note fc-warn-note">Kept as {k.kr_type}. Reason logged: “{k.override_reason}”</p>}
    </div>
  )
}

/* ------------------------- Review and approve --------------------- */
function Review({ data, me, onApprove, onReturn }) {
  const scope = me.role === 'lead' ? data.objectives.filter((o) => o.sub === me.sub) : data.objectives
  const pending = scope.filter((o) => o.status === 'submitted')
  const staffName = (id) => (data.staff.find((s) => s.id === id) || {}).name || 'Unknown'
  return (
    <div className="fc-review">
      <div className="fc-panel-head"><div><h2>Review and approve</h2><p className="fc-muted">{me.role === 'lead' ? `${me.sub} submissions` : 'All submissions'} awaiting your approval.</p></div></div>
      {pending.length === 0 && <p className="fc-empty">Nothing awaiting approval.</p>}
      {pending.map((o) => (
        <div key={o.id} className="fc-objcard">
          <div className="fc-objcard-head">
            <div><h3>{o.title}</h3><p className="fc-muted">{staffName(o.owner)} · {o.sub} · {o.priority}</p></div>
            <div className="fc-objcard-tags"><OutcomeChip objectives={[o]} /></div>
          </div>
          <ul className="fc-krlist">
            {o.krs.map((k) => (
              <li key={k.id}><TypeTag t={k.kr_type} /><span className="fc-kr-st">{k.statement}</span>{k.override_reason && <Pill kind="warn">override: {k.override_reason}</Pill>}</li>
            ))}
          </ul>
          <div className="fc-objcard-actions">
            <button className="fc-btn fc-btn-ghost fc-btn-sm" onClick={() => onReturn(o.id)}>Return to draft</button>
            <button className="fc-btn fc-btn-gold fc-btn-sm" onClick={() => onApprove(o.id)}>Approve</button>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ----------------------------- Scorecards ------------------------- */
function Scorecards({ data, me, onAdjust }) {
  const ownerName = (id) => (data.staff.find((s) => s.id === id) || {}).name || 'Unknown'
  const inScope = data.objectives
    .filter((o) => (o.status === 'approved' || o.status === 'submitted') && canViewScore(me, o))
    .sort((a, b) => (a.sub === b.sub ? ownerName(a.owner).localeCompare(ownerName(b.owner)) : a.sub.localeCompare(b.sub)))
  const mine = me.role === 'staff'
  return (
    <div className="fc-scorecards">
      <div className="fc-panel-head">
        <div>
          <h2>Scorecards</h2>
          <p className="fc-muted">{mine ? 'Your objectives, scored against the house rubric.' : 'Auto-scored against the rubric. Adjust any dimension and the change is logged.'}</p>
        </div>
        <span className="fc-rubric-key">SMART 30 · Alignment 30 · Ambition 20 · Ownership 20</span>
      </div>
      {inScope.length === 0 && <p className="fc-empty">No submitted or approved objectives to score yet.</p>}
      {inScope.map((o) => (
        <ScorecardCard key={o.id} obj={o} me={me} owner={ownerName(o.owner)} onAdjust={onAdjust} />
      ))}
    </div>
  )
}

function ScorecardCard({ obj, me, owner, onAdjust }) {
  const fs = finalScore(obj)
  const may = canAdjustScore(me, obj)
  const [editing, setEditing] = useState(false)
  const [vals, setVals] = useState(fs.dims)
  const [reason, setReason] = useState('')
  const dims = ['smart', 'align', 'ambition', 'ownership']

  function save() {
    const changes = {}
    dims.forEach((d) => {
      let v = parseFloat(vals[d])
      if (isNaN(v)) return
      v = r1(Math.max(0, Math.min(10, v)))
      if (v !== fs.dims[d]) changes[d] = v
    })
    if (Object.keys(changes).length) onAdjust(obj.id, changes, reason)
    setEditing(false); setReason('')
  }

  return (
    <div className="fc-scorecard">
      <div className="fc-sc-head">
        <div>
          <h3>{obj.title}</h3>
          <p className="fc-muted">{owner} · {obj.sub} · {obj.priority} · {obj.cycle}</p>
        </div>
        <div className="fc-sc-total">
          <b>{fs.total.toFixed(1)}</b><span className="fc-sc-outof">/10</span><Band b={fs.band} />
        </div>
      </div>

      <div className="fc-sc-table">
        <div className="fc-sc-row fc-sc-th"><span>Dimension</span><span>Weight</span><span>Auto</span><span>Final</span></div>
        {dims.map((d) => {
          const adjusted = fs.adj[d] != null && fs.adj[d] !== fs.auto[d]
          return (
            <div key={d} className="fc-sc-row">
              <span>{RUBRIC_LABEL[d]}</span>
              <span className="fc-muted">{Math.round(RUBRIC[d] * 100)}%</span>
              <span className="fc-muted">{fs.auto[d].toFixed(1)}</span>
              <span>
                {editing && may ? (
                  <input className="fc-input fc-sc-input" type="number" min="0" max="10" step="0.1"
                    value={vals[d]} onChange={(e) => setVals((v) => ({ ...v, [d]: e.target.value }))} />
                ) : (
                  <>{fs.dims[d].toFixed(1)}{adjusted && <span className="fc-adj-dot" title="Adjusted">•</span>}</>
                )}
              </span>
            </div>
          )
        })}
      </div>

      {may && !editing && (
        <div className="fc-sc-actions">
          <button className="fc-btn fc-btn-ghost fc-btn-sm" onClick={() => { setVals(fs.dims); setEditing(true) }}>Adjust scores</button>
        </div>
      )}
      {may && editing && (
        <div className="fc-sc-edit">
          <input className="fc-input" placeholder="Reason for the adjustment (logged)" value={reason} onChange={(e) => setReason(e.target.value)} />
          <div className="fc-cta-row">
            <button className="fc-btn fc-btn-ghost fc-btn-sm" onClick={() => setEditing(false)}>Cancel</button>
            <button className="fc-btn fc-btn-gold fc-btn-sm" onClick={save}>Save adjustment</button>
          </div>
        </div>
      )}

      {fs.log.length > 0 && (
        <div className="fc-sc-log">
          <p className="fc-sc-log-title">Adjustment history</p>
          {fs.log.slice().reverse().map((l, i) => (
            <p key={i} className="fc-sc-log-row">
              <b>{RUBRIC_LABEL[l.dim]}</b> {Number(l.from).toFixed(1)} → {Number(l.to).toFixed(1)} · {l.by} ({ROLES[l.role]}) · {l.at}{l.reason ? ` · “${l.reason}”` : ''}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

/* --------------------------- Organisations ------------------------ */
function Organisations({ tenant, data, me }) {
  // A subsidiary lead sees only their own organisation; oversight roles see the holding
  // company overview plus head office and every subsidiary.
  const orgs = me.role === 'lead' ? [me.sub] : ['Group', 'Corporate', ...tenant.subsidiaries]
  const [org, setOrg] = useState(orgs[0])
  const active = orgs.includes(org) ? org : orgs[0]

  return (
    <div className="fc-orgs">
      <div className="fc-panel-head"><div><h2>Organisations</h2><p className="fc-muted">Imade Forte Holdings and its subsidiaries. Each carries its own staff and OKRs. May 2026.</p></div></div>
      <nav className="fc-orgtabs">
        {orgs.map((o) => (
          <button key={o} className={`fc-orgtab ${active === o ? 'is-on' : ''}`} onClick={() => setOrg(o)}>
            {orgLabel(o)}{o !== 'Group' && <span className="fc-orgtab-count">{data.staff.filter((s) => s.sub === o && s.score > 0).length}</span>}
          </button>
        ))}
      </nav>
      {active === 'Group' ? <GroupOverview tenant={tenant} data={data} /> : <OrgPanel tenant={tenant} data={data} org={active} me={me} />}
    </div>
  )
}

function GroupOverview({ tenant, data }) {
  const rows = ['Corporate', ...tenant.subsidiaries].map((sub) => {
    const staff = data.staff.filter((s) => s.sub === sub && s.score > 0)
    const objs = data.objectives.filter((o) => o.sub === sub)
    const avg = staff.length ? (staff.reduce((a, s) => a + personScore(data, s.id).total, 0) / staff.length).toFixed(1) : '—'
    return { sub, count: staff.length, ratio: outcomeRatio(objs), avg }
  })
  const people = data.staff.filter((s) => s.score > 0).map((s) => ({ s, ...personScore(data, s.id) })).sort((a, b) => b.total - a.total)
  return (
    <div className="fc-boardview">
      <div className="fc-boardtable">
        <div className="fc-bt-head"><span>Organisation</span><span>Staff</span><span>Outcome ratio</span><span>Weighted average</span></div>
        {rows.map((r) => (
          <div key={r.sub} className="fc-bt-row"><span>{legalName(r.sub)}</span><span>{r.count}</span><span>{r.ratio}%</span><span>{r.avg}</span></div>
        ))}
      </div>
      <div className="fc-staffgrid">
        {people.map(({ s, total, band, computed }) => (
          <div key={s.id} className="fc-staffcard"><Avatar name={s.name} /><div className="fc-staffcard-body"><b>{s.name}</b><span className="fc-muted">{ROLES[s.role]} · {s.sub}</span></div><div className="fc-staffcard-score"><b>{total.toFixed(1)}</b><Band b={band} />{computed && <span className="fc-scored-dot" title="Scored from OKRs">rubric</span>}</div></div>
        ))}
      </div>
    </div>
  )
}

function OrgPanel({ tenant, data, org, me }) {
  const staff = data.staff.filter((s) => s.sub === org && s.score > 0)
  const objs = data.objectives.filter((o) => o.sub === org)
  const prio = tenant.priorities.find((p) => p.name === org)
  const avg = staff.length ? (staff.reduce((a, s) => a + personScore(data, s.id).total, 0) / staff.length).toFixed(1) : '—'
  const stalls = stalledIn(objs.filter((o) => o.status === 'approved' || o.status === 'submitted'))
  const ownerName = (id) => (data.staff.find((s) => s.id === id) || {}).name || 'Unknown'
  const mayNudge = me.role === 'md' || me.role === 'hr' || (me.role === 'lead' && me.sub === org)

  return (
    <div className="fc-orgpanel">
      <div className="fc-panel-head"><div><h3 className="fc-orgpanel-h">{legalName(org)}</h3><p className="fc-muted">{org === 'Corporate' ? 'Head office' : 'Subsidiary'} · {prio ? `${prio.rank} priority` : 'support function'}</p></div></div>
      <div className="fc-board-grid fc-dash-metrics">
        <Metric value={staff.length} label="Staff under this organisation" />
        <Metric value={`${outcomeRatio(objs)}%`} label="Outcome ratio" />
        <Metric value={avg} unit="/10" label="Weighted average" />
        <Metric value={prio ? prio.rank : '—'} label={`Strategic priority${prio ? '' : ' (support)'}`} />
      </div>

      <div className="fc-dash-cols">
        <section className="fc-panel">
          <div className="fc-panel-head"><h3>Staff</h3></div>
          {staff.length === 0 && <p className="fc-empty">No staff assigned to this organisation yet.</p>}
          {staff.map((s) => {
            const ps = personScore(data, s.id)
            return (
              <div key={s.id} className="fc-obj-row">
                <div className="fc-org-person"><Avatar name={s.name} /><span><b>{s.name}</b><span className="fc-muted"> · {ROLES[s.role]}</span></span></div>
                <div className="fc-obj-row-right"><b className="fc-org-score">{ps.total.toFixed(1)}</b><Band b={ps.band} /></div>
              </div>
            )
          })}
        </section>
        <section className="fc-panel">
          <div className="fc-panel-head"><h3>Objectives</h3></div>
          {objs.length === 0 && <p className="fc-empty">No objectives under this organisation yet.</p>}
          {objs.map((o) => (
            <div key={o.id} className="fc-obj-row">
              <div><b>{o.title}</b><span className="fc-muted"> · {ownerName(o.owner)}</span></div>
              <div className="fc-obj-row-right"><OutcomeChip objectives={[o]} /><StatusTag s={o.status} /></div>
            </div>
          ))}
        </section>
      </div>

      <section className="fc-panel fc-stallpanel">
        <div className="fc-panel-head"><h3>Needs attention</h3><span className="fc-muted">{stalls.length} flagged key results</span></div>
        {stalls.length === 0 && <p className="fc-empty">Nothing stalled. Every tracked key result is on course.</p>}
        {stalls.map(({ obj, k, reason }, i) => (
          <div key={i} className="fc-stall">
            <div className="fc-stall-body">
              <span className="fc-stall-reason">{reason}</span>
              <b>{k.statement}</b>
              <span className="fc-muted">{obj.title} · {ownerName(obj.owner)}</span>
            </div>
            {mayNudge && <a className="fc-btn fc-btn-ghost fc-btn-sm" href={waLink(nudgeText(ownerName(obj.owner), obj.title, k, reason))} target="_blank" rel="noreferrer">Draft nudge</a>}
          </div>
        ))}
      </section>
    </div>
  )
}

/* --------------------------- Chairman cockpit --------------------- */
function Cockpit({ tenant, data }) {
  const [sel, setSel] = useState(null)
  const [selOrg, setSelOrg] = useState(null)
  const ownerName = (id) => (data.staff.find((s) => s.id === id) || {}).name || 'Unknown'

  const people = data.staff.filter((s) => s.score > 0).map((s) => ({ s, ...personScore(data, s.id), move: movementOf(data, s) }))
  const green = people.filter((p) => p.band === 'green').length
  const amber = people.filter((p) => p.band === 'amber').length
  const red = people.filter((p) => p.band === 'red').length
  const avg = people.length ? r1(people.reduce((a, p) => a + p.total, 0) / people.length) : 0
  const ratio = outcomeRatio(data.objectives)

  const orgs = ['Corporate', ...tenant.subsidiaries].map((org) => {
    const st = people.filter((p) => p.s.sub === org)
    const objs = data.objectives.filter((o) => o.sub === org)
    const oavg = st.length ? r1(st.reduce((a, p) => a + p.total, 0) / st.length) : null
    const omove = st.length ? r1(st.reduce((a, p) => a + p.move, 0) / st.length) : 0
    const prio = tenant.priorities.find((p) => p.name === org)
    return {
      org, count: st.length, ratio: outcomeRatio(objs), avg: oavg, band: oavg == null ? null : bandOf(oavg), move: omove,
      rank: prio ? prio.rank : (org === 'Corporate' ? 'Head office' : '—'), g: st.filter((p) => p.band === 'green').length, a: st.filter((p) => p.band === 'amber').length, r: st.filter((p) => p.band === 'red').length,
    }
  })

  const risks = stalledIn(data.objectives.filter((o) => o.status === 'approved' || o.status === 'submitted'))
  const movers = [...people].sort((a, b) => b.move - a.move)
  const up = movers.filter((p) => p.move > 0).slice(0, 3)
  const down = movers.filter((p) => p.move < 0).slice(-3).reverse()

  if (sel) return <PersonDetail data={data} id={sel} onBack={() => setSel(null)} />
  if (selOrg) return (
    <div className="fc-cockpit">
      <button className="fc-back" onClick={() => setSelOrg(null)}>← Back to holding company</button>
      <OrgPanel tenant={tenant} data={data} org={selOrg} me={{ role: 'chairman' }} />
    </div>
  )

  return (
    <div className="fc-cockpit">
      <div className="fc-panel-head">
        <div><h2>Chairman's cockpit</h2><p className="fc-muted">Imade Forte Holdings, group oversight. Read only. May 2026.</p></div>
        <span className="fc-rubric-key">{tenant.name}</span>
      </div>

      <div className="fc-board-grid fc-dash-metrics">
        <Metric value={`${ratio}%`} label="Holding company outcome ratio" />
        <Metric value={avg.toFixed(1)} unit="/10" label="Weighted average" />
        <div className="fc-metric"><span className="fc-rag"><b className="fc-rag-g">{green}</b><b className="fc-rag-a">{amber}</b><b className="fc-rag-r">{red}</b></span><span className="fc-metric-label">Green · Amber · Red</span></div>
        <Metric value={people.length} label={`Staff · ${tenant.subsidiaries.length} subsidiaries`} />
      </div>

      {/* 1. Organisation health */}
      <section className="fc-cockpit-section">
        <h3 className="fc-cockpit-h">Organisation health <span className="fc-muted">· tap to zoom in</span></h3>
        <div className="fc-orghealth-grid">
          {orgs.map((o) => (
            <button key={o.org} className={`fc-orghealth-card fc-orghealth-btn ${o.band ? `hb-${o.band}` : 'hb-none'}`} onClick={() => setSelOrg(o.org)}>
              <div className="fc-oh-top"><b>{o.org}</b><span className="fc-oh-rank">{o.rank}</span></div>
              <div className="fc-oh-legal">{legalName(o.org)}</div>
              <div className="fc-oh-score">{o.avg == null ? '—' : o.avg.toFixed(1)}{o.avg != null && <span className="fc-oh-outof">/10</span>} {o.avg != null && <Move v={o.move} />}</div>
              <div className="fc-oh-meta">{o.count} staff · {o.ratio}% outcome</div>
              <div className="fc-oh-rag"><span className="fc-rag-g">{o.g}</span><span className="fc-rag-a">{o.a}</span><span className="fc-rag-r">{o.r}</span></div>
            </button>
          ))}
        </div>
      </section>

      {/* 2. Staff standing */}
      <section className="fc-cockpit-section">
        <h3 className="fc-cockpit-h">Staff standing</h3>
        <div className="fc-staff-table">
          <div className="fc-stt-row fc-stt-head"><span>Name</span><span>Organisation</span><span>Score</span><span>Band</span><span>Move</span><span></span></div>
          {people.sort((a, b) => b.total - a.total).map(({ s, total, band, move }) => (
            <div key={s.id} className="fc-stt-row">
              <span className="fc-stt-name"><Avatar name={s.name} /> {s.name}</span>
              <span className="fc-muted">{s.sub}</span>
              <span><b>{total.toFixed(1)}</b></span>
              <span><Band b={band} /></span>
              <span><Move v={move} /></span>
              <span><button className="fc-btn fc-btn-ghost fc-btn-sm" onClick={() => setSel(s.id)}>View</button></span>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Risks and stalled results */}
      <section className="fc-cockpit-section">
        <h3 className="fc-cockpit-h">Risks and stalled results <span className="fc-muted">· {risks.length} flagged</span></h3>
        {risks.length === 0 && <p className="fc-empty">Nothing stalled across the group.</p>}
        {risks.map(({ obj, k, reason }, i) => (
          <div key={i} className="fc-stall">
            <div className="fc-stall-body"><span className="fc-stall-reason">{reason}</span><b>{k.statement}</b><span className="fc-muted">{obj.title} · {ownerName(obj.owner)} · {obj.sub}</span></div>
          </div>
        ))}
      </section>

      {/* 4. Movement */}
      <section className="fc-cockpit-section">
        <h3 className="fc-cockpit-h">Movement vs last cycle</h3>
        <div className="fc-movers">
          <div className="fc-mover-col">
            <p className="fc-mover-h fc-mover-up">Climbing</p>
            {up.length === 0 && <p className="fc-empty">No gains yet.</p>}
            {up.map((p) => <div key={p.s.id} className="fc-mover-row"><span>{p.s.name}</span><Move v={p.move} /></div>)}
          </div>
          <div className="fc-mover-col">
            <p className="fc-mover-h fc-mover-down">Slipping</p>
            {down.length === 0 && <p className="fc-empty">No slips this cycle.</p>}
            {down.map((p) => <div key={p.s.id} className="fc-mover-row"><span>{p.s.name}</span><Move v={p.move} /></div>)}
          </div>
        </div>
      </section>
    </div>
  )
}

function PersonDetail({ data, id, onBack }) {
  const s = data.staff.find((x) => x.id === id) || {}
  const ps = personScore(data, id)
  const move = movementOf(data, s)
  const objs = data.objectives.filter((o) => o.owner === id)
  const scored = objs.filter((o) => o.status === 'approved' || o.status === 'submitted')
  const stalls = stalledIn(scored)
  const noop = () => {}
  return (
    <div className="fc-persondetail">
      <button className="fc-back" onClick={onBack}>← Back</button>
      <div className="fc-pd-head">
        <div className="fc-pd-id"><Avatar name={s.name} /><div><h2>{s.name}</h2><p className="fc-muted">{ROLES[s.role]} · {s.sub} · {s.tier === 'ops' ? 'Weekly check-ins' : 'Monthly check-ins'}</p></div></div>
        <div className="fc-pd-score"><b>{ps.total.toFixed(1)}</b><span className="fc-sc-outof">/10</span><Band b={ps.band} /><Move v={move} /></div>
      </div>

      <h3 className="fc-cockpit-h">Objectives</h3>
      {objs.length === 0 && <p className="fc-empty">No objectives on record.</p>}
      {objs.map((o) => (
        <div key={o.id} className="fc-obj-row">
          <div><b>{o.title}</b><span className="fc-muted"> · {o.sub} · {o.priority}</span></div>
          <div className="fc-obj-row-right"><OutcomeChip objectives={[o]} /><StatusTag s={o.status} /></div>
        </div>
      ))}

      {scored.length > 0 && <><h3 className="fc-cockpit-h" style={{ marginTop: '1.4rem' }}>Scorecards</h3>
        {scored.map((o) => <ScorecardCard key={o.id} obj={o} me={{ role: 'chairman' }} owner={s.name} onAdjust={noop} />)}</>}

      {stalls.length > 0 && <section className="fc-panel fc-stallpanel">
        <div className="fc-panel-head"><h3>Needs attention</h3><span className="fc-muted">{stalls.length} flagged</span></div>
        {stalls.map(({ obj, k, reason }, i) => (
          <div key={i} className="fc-stall"><div className="fc-stall-body"><span className="fc-stall-reason">{reason}</span><b>{k.statement}</b><span className="fc-muted">{obj.title}</span></div></div>
        ))}
      </section>}
    </div>
  )
}

/* --------------------------- Roster / admin ----------------------- */
function AdminConsole({ tenant, data, onAdd, onUpdate, onRemove }) {
  const [adding, setAdding] = useState(false)
  const [nf, setNf] = useState({ name: '', role: 'staff', sub: tenant.subsidiaries[0], tier: 'ops' })
  const roleOpts = ['staff', 'lead', 'md', 'hr', 'chairman', 'admin']
  const managers = data.staff.filter((s) => ['lead', 'md', 'hr', 'chairman'].includes(s.role))
  const pending = data.staff.filter((s) => /pending/i.test(s.name)).length

  function add() {
    if (!nf.name.trim()) return
    onAdd({ id: uid(), name: nf.name.trim(), role: nf.role, sub: nf.sub, tier: nf.tier, band: 'green', score: 0, prev: 0, managerId: null })
    setNf({ name: '', role: 'staff', sub: tenant.subsidiaries[0], tier: 'ops' }); setAdding(false)
  }

  return (
    <div className="fc-admin">
      <div className="fc-panel-head">
        <div><h2>Roster and admin</h2><p className="fc-muted">Manage people, roles, organisations and reporting lines for {tenant.name}.</p></div>
        <button className="fc-btn fc-btn-gold" onClick={() => setAdding((a) => !a)}>{adding ? 'Close' : '+ Add person'}</button>
      </div>

      {pending > 0 && <p className="fc-adm-flag">{pending} {pending === 1 ? 'profile needs' : 'profiles need'} a surname. Edit the highlighted rows to complete them.</p>}

      {adding && (
        <div className="fc-admin-add">
          <input className="fc-input" placeholder="Full name" value={nf.name} onChange={(e) => setNf({ ...nf, name: e.target.value })} />
          <select className="fc-input" value={nf.role} onChange={(e) => setNf({ ...nf, role: e.target.value })}>{roleOpts.map((r) => <option key={r} value={r}>{ROLES[r]}</option>)}</select>
          <select className="fc-input" value={nf.sub} onChange={(e) => setNf({ ...nf, sub: e.target.value })}>{tenant.subsidiaries.map((s) => <option key={s}>{s}</option>)}</select>
          <select className="fc-input" value={nf.tier} onChange={(e) => setNf({ ...nf, tier: e.target.value })}><option value="ops">Weekly check-ins</option><option value="leadership">Monthly check-ins</option></select>
          <button className="fc-btn fc-btn-gold fc-btn-sm" onClick={add}>Add</button>
        </div>
      )}

      <div className="fc-admin-table">
        <div className="fc-adm-row fc-adm-head"><span>Name</span><span>Role</span><span>Organisation</span><span>Cadence</span><span>Reports to</span><span></span></div>
        {data.staff.map((s) => (
          <StaffRow key={s.id} s={s} tenant={tenant} roleOpts={roleOpts} managers={managers.filter((m) => m.id !== s.id)} onUpdate={onUpdate} onRemove={onRemove} />
        ))}
      </div>
    </div>
  )
}

function StaffRow({ s, tenant, roleOpts, managers, onUpdate, onRemove }) {
  const [edit, setEdit] = useState(false)
  const [f, setF] = useState({ name: s.name, role: s.role, sub: s.sub, tier: s.tier, managerId: s.managerId || '' })
  const pending = /pending/i.test(s.name)
  const mgr = managers.find((m) => m.id === s.managerId)

  function save() {
    onUpdate(s.id, { name: f.name.trim() || s.name, role: f.role, sub: f.sub, tier: f.tier, managerId: f.managerId || null })
    setEdit(false)
  }

  if (edit) return (
    <div className="fc-adm-row fc-adm-edit">
      <input className="fc-input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
      <select className="fc-input" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>{roleOpts.map((r) => <option key={r} value={r}>{ROLES[r]}</option>)}</select>
      <select className="fc-input" value={f.sub} onChange={(e) => setF({ ...f, sub: e.target.value })}>{tenant.subsidiaries.map((x) => <option key={x}>{x}</option>)}</select>
      <select className="fc-input" value={f.tier} onChange={(e) => setF({ ...f, tier: e.target.value })}><option value="ops">Weekly</option><option value="leadership">Monthly</option></select>
      <select className="fc-input" value={f.managerId} onChange={(e) => setF({ ...f, managerId: e.target.value })}><option value="">None</option>{managers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
      <span className="fc-adm-actions"><button className="fc-btn fc-btn-gold fc-btn-sm" onClick={save}>Save</button><button className="fc-btn fc-btn-ghost fc-btn-sm" onClick={() => setEdit(false)}>Cancel</button></span>
    </div>
  )

  return (
    <div className={`fc-adm-row ${pending ? 'fc-adm-pending' : ''}`}>
      <span className="fc-adm-name">{s.name}{pending && <span className="fc-adm-pill">needs surname</span>}</span>
      <span className="fc-muted">{ROLES[s.role]}</span>
      <span>{s.sub}</span>
      <span className="fc-muted">{s.tier === 'ops' ? 'Weekly' : 'Monthly'}</span>
      <span className="fc-muted">{mgr ? mgr.name : '—'}</span>
      <span className="fc-adm-actions"><button className="fc-btn fc-btn-ghost fc-btn-sm" onClick={() => { setF({ name: s.name, role: s.role, sub: s.sub, tier: s.tier, managerId: s.managerId || '' }); setEdit(true) }}>Edit</button><button className="fc-icon-btn" title="Remove" onClick={() => { if (confirm(`Remove ${s.name}?`)) onRemove(s.id) }}>✕</button></span>
    </div>
  )
}

/* ----------------------------- Organogram ------------------------- */
function Organogram({ tenant, data, me }) {
  const [selPerson, setSelPerson] = useState(null)
  const [selOrg, setSelOrg] = useState(null)

  if (selPerson) return (
    <div className="fc-cockpit"><PersonDetail data={data} id={selPerson} onBack={() => setSelPerson(null)} /></div>
  )
  if (selOrg) return (
    <div className="fc-cockpit">
      <button className="fc-back" onClick={() => setSelOrg(null)}>← Back to organogram</button>
      <OrgPanel tenant={tenant} data={data} org={selOrg} me={me} />
    </div>
  )

  return (
    <div className="fc-organogram">
      <div className="fc-panel-head"><div><h2>Organogram</h2><p className="fc-muted">Imade Forte Holdings and its people, by reporting line. Tap an organisation or a name to open it.</p></div></div>
      <div className="fc-og-parent">
        {tenant.logo && <img className="fc-og-logo" src={tenant.logo} alt={tenant.name} />}
        <div><b>{tenant.name}</b><span className="fc-muted">Parent holding company</span></div>
      </div>
      <div className="fc-og-orgs">
        {['Corporate', ...tenant.subsidiaries].map((org) => (
          <OrgBranch key={org} org={org} data={data} onPerson={setSelPerson} onOrg={setSelOrg} />
        ))}
      </div>
    </div>
  )
}

function OrgBranch({ org, data, onPerson, onOrg }) {
  const members = data.staff.filter((s) => s.sub === org)
  const roots = members.filter((m) => !m.managerId || !members.some((x) => x.id === m.managerId))
  const extMgrId = roots.map((r) => r.managerId).find((id) => id && !members.some((x) => x.id === id))
  const extMgr = extMgrId ? data.staff.find((s) => s.id === extMgrId) : null
  const headcount = members.length

  return (
    <div className="fc-og-branch">
      <button className="fc-og-orgnode" onClick={() => onOrg(org)}>
        <b>{org}</b>
        <span className="fc-og-legal">{legalName(org)}</span>
        <span className="fc-muted">{headcount} {headcount === 1 ? 'person' : 'people'}{extMgr ? ` · reports to ${extMgr.name}` : ''}</span>
      </button>
      <div className="fc-og-tree">
        {members.length === 0 ? <p className="fc-og-empty">No staff yet</p> : roots.map((r) => <PersonNode key={r.id} person={r} members={members} onPerson={onPerson} />)}
      </div>
    </div>
  )
}

function PersonNode({ person, members, onPerson }) {
  const reports = members.filter((m) => m.managerId === person.id)
  return (
    <div className="fc-og-node">
      <button className="fc-og-person" onClick={() => onPerson(person.id)}>
        <Avatar name={person.name} />
        <span className="fc-og-pbody"><b>{person.name}</b><span className="fc-muted">{ROLES[person.role]}</span></span>
        {reports.length > 0 && <span className="fc-og-count">{reports.length}</span>}
      </button>
      {reports.length > 0 && <div className="fc-og-children">{reports.map((r) => <PersonNode key={r.id} person={r} members={members} onPerson={onPerson} />)}</div>}
    </div>
  )
}

/* ------------------------------- Root ----------------------------- */
export default function App() {
  const [tenantId, setTenantId] = useState('imade-forte')
  const [screen, setScreen] = useState('gateway') // gateway | auth | profile | app
  const [me, setMe] = useState(null)
  const [authUser, setAuthUser] = useState(null)
  const [data, setData] = useState({ staff: [], objectives: [] })
  const tenant = TENANTS[tenantId]

  // brand tokens per tenant
  useEffect(() => {
    document.documentElement.style.setProperty('--navy', tenant.brand.navy)
    document.documentElement.style.setProperty('--gold', tenant.brand.gold)
  }, [tenantId])

  // load data whenever tenant changes and we are in the app
  useEffect(() => { loadData(tenantId).then(setData) }, [tenantId])

  // persist on change
  useEffect(() => { if (data.staff.length) saveData(tenantId, data) }, [data])

  // restore demo session
  useEffect(() => {
    if (LIVE) return
    try { const raw = localStorage.getItem(SKEY(tenantId)); if (raw) { setMe(JSON.parse(raw)); setScreen('app') } } catch { /* ignore */ }
  }, [tenantId])

  // live session wiring
  useEffect(() => {
    if (!LIVE) return
    supabase.auth.getSession().then(({ data }) => setAuthUser((data && data.session && data.session.user) || null))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = (session && session.user) || null
      setAuthUser(u)
      if (!u) { setMe(null); setScreen('gateway') }
    })
    return () => { try { sub.subscription.unsubscribe() } catch { /* ignore */ } }
  }, [])

  // resolve profile for a live-authenticated user
  useEffect(() => {
    if (!LIVE || !authUser || me) return
    let live = true
    ;(async () => {
      try {
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle()
        if (live && prof && prof.role) {
          enterProfile({ id: authUser.id, name: prof.name || authUser.email, role: prof.role, sub: prof.subsidiary || tenant.subsidiaries[0], tier: prof.cadence_tier || 'ops' }, false)
          return
        }
      } catch { /* table may not exist yet */ }
      if (live) setScreen('profile')
    })()
    return () => { live = false }
  }, [authUser])

  function enterProfile(profile, persistDemo = true) {
    setMe(profile); setScreen('app')
    if (!LIVE && persistDemo) { try { localStorage.setItem(SKEY(tenantId), JSON.stringify(profile)) } catch { /* ignore */ } }
    setData((d) => (d.staff.some((s) => s.id === profile.id) ? d : { ...d, staff: [...d.staff, { band: 'green', score: 0, prev: 0, ...profile }] }))
  }
  function enter(profile) { enterProfile(profile) }

  async function createLiveProfile(p) {
    const profile = { id: authUser.id, name: p.name, role: p.role, sub: p.sub, tier: p.tier }
    try {
      await supabase.from('profiles').upsert({ id: authUser.id, tenant_id: tenantId, name: p.name, role: p.role, subsidiary: p.sub, cadence_tier: p.tier })
    } catch { /* best effort; RLS/table may not be set up */ }
    enterProfile(profile, false)
  }

  async function signOut() {
    if (LIVE) { try { await supabase.auth.signOut() } catch { /* ignore */ } }
    setMe(null); setAuthUser(null); setScreen('gateway')
    try { localStorage.removeItem(SKEY(tenantId)) } catch { /* ignore */ }
  }

  return (
    <div className="fc-root">
      <style>{CSS}</style>
      {screen === 'gateway' && <Gateway tenant={tenant} onSignIn={() => setScreen('auth')} />}
      {screen === 'auth' && <AuthScreen tenant={tenant} staff={data.staff.length ? data.staff : STAFF} onEnter={enter} onBack={() => setScreen('gateway')} />}
      {screen === 'profile' && (
        <div className="fc-auth"><div className="fc-auth-card">
          <h2 className="fc-auth-title">Set up your profile</h2>
          <p className="fc-auth-sub">{authUser ? authUser.email : ''}</p>
          <RolePicker tenant={tenant} onCreate={createLiveProfile} />
        </div></div>
      )}
      {screen === 'app' && me && <AppShell tenant={tenant} me={me} data={data} setData={setData} onSwitchTenant={setTenantId} onSignOut={signOut} />}
    </div>
  )
}

/* ------------------------------- Styles --------------------------- */
const CSS = `
:root{--navy:#0E2240;--navy-deep:#091A33;--navy-soft:#16304F;--gold:#B8924A;--gold-lit:#D8B266;--parchment:#EDE9E0;--muted:#93A0B4;--hairline:rgba(237,233,224,.14);--rag-g:#4FA07A;--rag-a:#C79A3E;--rag-r:#B65656;--ink:#22303F;}
*{box-sizing:border-box}
.fc-root{margin:0;min-height:100vh;background:radial-gradient(120% 80% at 78% -10%,var(--navy-soft) 0%,var(--navy) 42%,var(--navy-deep) 100%);color:var(--parchment);font-family:'Lora',Georgia,serif;-webkit-font-smoothing:antialiased;overflow-x:hidden}
.fc-btn{font-family:inherit;font-size:.95rem;border-radius:2px;padding:.62rem 1.25rem;cursor:pointer;border:1px solid transparent;transition:background .16s,color .16s,border-color .16s}
.fc-btn:focus-visible{outline:2px solid var(--gold-lit);outline-offset:3px}
.fc-btn-sm{padding:.42rem .9rem;font-size:.85rem}
.fc-btn-gold{background:var(--gold);color:var(--navy-deep);font-weight:600}
.fc-btn-gold:hover{background:var(--gold-lit)}
.fc-btn-gold:disabled{opacity:.4;cursor:not-allowed}
.fc-btn-ghost{background:transparent;color:var(--parchment);border-color:var(--hairline)}
.fc-btn-ghost:hover{border-color:var(--gold);color:var(--gold-lit)}
.fc-link{color:var(--parchment);text-decoration:none;border-bottom:1px solid var(--gold);padding-bottom:2px;font-size:.98rem;cursor:pointer}
.fc-link:hover{color:var(--gold-lit)}
.fc-muted{color:var(--muted)}
.fc-input{font-family:inherit;font-size:.95rem;padding:.6rem .8rem;border-radius:3px;border:1px solid var(--hairline);background:rgba(237,233,224,.04);color:var(--parchment);width:100%}
.fc-input:focus{outline:none;border-color:var(--gold)}
select.fc-input{cursor:pointer}
option{color:#111}

/* gateway (Stage 1) */
.fc-top{display:flex;align-items:center;justify-content:space-between;padding:1.6rem clamp(1.25rem,5vw,5rem);border-bottom:1px solid var(--hairline)}
.fc-brand{display:flex;align-items:center;gap:.95rem;text-decoration:none;color:var(--parchment)}
.fc-brand-logo{height:48px;width:auto;display:block;flex:none}
.fc-wordmark{font-size:1.12rem;letter-spacing:.14em;text-transform:uppercase;font-weight:500;padding-left:.95rem;border-left:1px solid var(--hairline)}
.fc-wordmark em{color:var(--gold);font-style:normal}
.fc-hero{display:grid;grid-template-columns:1.35fr .9fr;gap:clamp(2rem,6vw,5rem);align-items:center;padding:clamp(3rem,9vw,7rem) clamp(1.25rem,5vw,5rem) clamp(2rem,5vw,4rem);max-width:1240px;margin:0 auto}
.fc-eyebrow{color:var(--gold);font-size:.8rem;letter-spacing:.22em;text-transform:uppercase;margin:0 0 1.3rem;font-weight:600}
.fc-headline{font-size:clamp(2.7rem,7vw,5rem);line-height:1.02;font-weight:600;margin:0 0 1.4rem}
.fc-gold{color:var(--gold);font-style:italic}
.fc-sub{font-size:clamp(1.05rem,1.8vw,1.3rem);line-height:1.6;max-width:34ch;margin:0 0 2rem;opacity:.92}
.fc-cta-row{display:flex;align-items:center;gap:1.2rem;flex-wrap:wrap}
.fc-ladder{border-left:1px solid var(--hairline);padding-left:clamp(1.5rem,3vw,2.75rem)}
.fc-ladder-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:.55rem}
.fc-rung{display:flex;align-items:center;gap:1rem;padding:.85rem 1rem;border:1px solid var(--hairline);border-radius:3px;opacity:.5}
.fc-rung-index{font-size:.8rem;color:var(--muted);width:1ch}
.fc-rung-body{display:flex;flex-direction:column}
.fc-rung-label{font-size:1.15rem;font-weight:500}
.fc-rung-note{font-size:.82rem;color:var(--muted)}
.fc-rung-flag{margin-left:auto;font-size:.72rem;text-transform:uppercase;letter-spacing:.14em;color:var(--navy-deep);background:var(--gold);padding:.22rem .6rem;border-radius:2px;font-weight:600}
.fc-rung.is-lit{opacity:1;border-color:var(--gold);background:linear-gradient(90deg,rgba(184,146,74,.16),rgba(184,146,74,.03));box-shadow:0 0 34px -14px var(--gold)}
.fc-rung.is-lit .fc-rung-label{color:var(--gold-lit)}
.fc-ladder-caption{margin:1.1rem 0 0;font-size:.85rem;color:var(--muted);font-style:italic}
.fc-how{background:var(--parchment);color:var(--navy-deep);padding:clamp(3rem,7vw,5.5rem) clamp(1.25rem,5vw,5rem)}
.fc-eyebrow-dark{color:var(--gold)}
.fc-cap-grid{max-width:1240px;margin:1.6rem auto 0;display:grid;grid-template-columns:repeat(4,1fr);gap:clamp(1.5rem,3vw,3rem)}
.fc-cap{border-top:2px solid var(--navy);padding-top:1.1rem}
.fc-cap-index{font-size:.82rem;color:var(--gold);letter-spacing:.1em;font-weight:600}
.fc-cap-title{font-size:1.4rem;font-weight:600;margin:.4rem 0 .7rem}
.fc-cap-body{font-size:.98rem;line-height:1.62;color:#3a4658;margin:0}
.fc-foot{display:flex;align-items:center;justify-content:space-between;gap:1.5rem;flex-wrap:wrap;padding:1.8rem clamp(1.25rem,5vw,5rem);border-top:1px solid var(--hairline);color:var(--muted);font-size:.88rem}
.fc-foot-left{display:flex;align-items:center;gap:1rem}
.fc-foot-logo{height:40px;width:auto;opacity:.95}
.fc-foot-tenant{color:var(--muted);font-size:.8rem;letter-spacing:.14em;text-transform:uppercase;padding-left:1rem;border-left:1px solid var(--hairline)}

/* auth */
.fc-auth{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:2rem}
.fc-auth-card{width:100%;max-width:460px;background:rgba(9,26,51,.6);border:1px solid var(--hairline);border-radius:8px;padding:2.2rem}
.fc-back{background:none;border:none;color:var(--muted);cursor:pointer;font-family:inherit;margin-bottom:1rem}
.fc-auth-logo{height:44px;margin-bottom:1rem}
.fc-auth-title{margin:.2rem 0 .3rem;font-size:1.5rem}
.fc-auth-sub{color:var(--muted);margin:0 0 1.2rem;display:flex;align-items:center;gap:.6rem}
.fc-demo-tag{font-size:.7rem;text-transform:uppercase;letter-spacing:.12em;color:var(--gold);border:1px solid var(--gold);border-radius:2px;padding:.1rem .45rem}
.fc-auth-hint{color:var(--muted);font-size:.9rem;margin:0 0 1rem}
.fc-auth-form{display:flex;flex-direction:column;gap:.7rem}
.fc-auth-msg{color:var(--rag-a);font-size:.85rem}
.fc-identity-list{display:flex;flex-direction:column;gap:.5rem;max-height:340px;overflow:auto}
.fc-identity{display:flex;align-items:center;gap:.8rem;padding:.6rem .8rem;border:1px solid var(--hairline);border-radius:4px;background:transparent;color:var(--parchment);cursor:pointer;text-align:left;font-family:inherit}
.fc-identity:hover{border-color:var(--gold)}
.fc-identity-body{display:flex;flex-direction:column}
.fc-identity-name{font-weight:600}
.fc-identity-role{font-size:.8rem;color:var(--muted)}
.fc-add-new{display:inline-block;margin-top:1rem}
.fc-avatar{width:34px;height:34px;flex:none;border-radius:50%;background:var(--navy-soft);border:1px solid var(--gold);color:var(--gold-lit);display:inline-flex;align-items:center;justify-content:center;font-size:.78rem;font-weight:600}
.fc-rolepick{margin-top:1.2rem;display:flex;flex-direction:column;gap:.7rem;border-top:1px solid var(--hairline);padding-top:1.2rem}
.fc-rp-q{margin:0;font-size:1.05rem}
.fc-rp-grid{display:grid;grid-template-columns:1fr 1fr;gap:.5rem}
.fc-rp-card{padding:.7rem;border:1px solid var(--hairline);border-radius:4px;background:transparent;color:var(--parchment);cursor:pointer;font-family:inherit}
.fc-rp-card.is-on{border-color:var(--gold);background:rgba(184,146,74,.12);color:var(--gold-lit)}

/* app shell */
.fc-app{min-height:100vh;display:flex;flex-direction:column}
.fc-appbar{display:flex;align-items:center;gap:1.5rem;padding:.9rem clamp(1rem,3vw,2.2rem);border-bottom:1px solid var(--hairline);flex-wrap:wrap}
.fc-appbar-left{display:flex;align-items:center;gap:.7rem}
.fc-appbar-logo{height:34px}
.fc-appbar-word{font-size:.95rem;letter-spacing:.12em;text-transform:uppercase}
.fc-appbar-word em{color:var(--gold);font-style:normal}
.fc-nav{display:flex;gap:.3rem;flex:1}
.fc-nav-btn{background:none;border:none;color:var(--muted);cursor:pointer;font-family:inherit;font-size:.95rem;padding:.5rem .85rem;border-radius:3px}
.fc-nav-btn:hover{color:var(--parchment)}
.fc-nav-btn.is-on{color:var(--gold-lit);background:rgba(184,146,74,.1)}
.fc-appbar-right{display:flex;align-items:center;gap:.9rem}
.fc-tenant-switch{background:transparent;color:var(--parchment);border:1px solid var(--hairline);border-radius:3px;padding:.35rem .5rem;font-family:inherit}
.fc-me{display:flex;align-items:center;gap:.55rem}
.fc-me-body{display:flex;flex-direction:column;line-height:1.15}
.fc-me-body b{font-size:.9rem}
.fc-me-body i{font-size:.75rem;color:var(--muted);font-style:normal}
.fc-main{flex:1;padding:clamp(1.5rem,4vw,3rem) clamp(1rem,4vw,3rem);max-width:1180px;margin:0 auto;width:100%}

/* dashboard */
.fc-dash-head h2{margin:0 0 .2rem;font-size:1.7rem}
.fc-board-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:clamp(1rem,3vw,2.5rem)}
.fc-dash-metrics{margin:1.6rem 0 2rem;padding:1.4rem;border:1px solid var(--hairline);border-radius:6px;background:rgba(9,26,51,.5)}
.fc-metric{display:flex;flex-direction:column;gap:.4rem}
.fc-metric-value{font-size:clamp(1.7rem,3.4vw,2.5rem);font-weight:600;line-height:1}
.fc-metric-unit{font-size:1rem;color:var(--muted)}
.fc-metric-label{font-size:.8rem;color:var(--muted)}
.fc-rag{display:flex;gap:.7rem;font-size:clamp(1.7rem,3.4vw,2.5rem);font-weight:600;line-height:1}
.fc-rag-g{color:var(--rag-g)}.fc-rag-a{color:var(--rag-a)}.fc-rag-r{color:var(--rag-r)}
.fc-dash-cols{display:grid;grid-template-columns:1.4fr .8fr;gap:1.4rem}
.fc-panel{border:1px solid var(--hairline);border-radius:6px;padding:1.3rem;background:rgba(9,26,51,.4)}
.fc-panel-head{display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:1rem}
.fc-panel-head h3,.fc-panel-head h2{margin:0}
.fc-obj-row{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:.7rem 0;border-top:1px solid var(--hairline)}
.fc-obj-row-right{display:flex;align-items:center;gap:.6rem}
.fc-prio{display:flex;align-items:center;gap:.8rem;padding:.5rem 0;border-top:1px solid var(--hairline)}
.fc-prio-rank{color:var(--gold);font-weight:600;width:2ch}
.fc-empty{color:var(--muted);font-style:italic;padding:.6rem 0}

/* chips / tags */
.fc-type{font-size:.7rem;text-transform:uppercase;letter-spacing:.1em;padding:.16rem .5rem;border-radius:2px;font-weight:600;flex:none}
.fc-type-outcome{background:var(--gold);color:var(--navy-deep)}
.fc-type-output{background:rgba(147,160,180,.25);color:var(--parchment)}
.fc-type-activity{background:rgba(147,160,180,.16);color:var(--muted)}
.fc-type-input{background:rgba(147,160,180,.1);color:var(--muted)}
.fc-ochip{font-size:.75rem;padding:.2rem .55rem;border-radius:2px;border:1px solid var(--hairline)}
.fc-ochip.ok{color:var(--rag-g);border-color:var(--rag-g)}
.fc-ochip.mid{color:var(--rag-a);border-color:var(--rag-a)}
.fc-ochip.low{color:var(--rag-r);border-color:var(--rag-r)}
.fc-status{font-size:.72rem;text-transform:uppercase;letter-spacing:.08em;padding:.18rem .55rem;border-radius:2px}
.fc-status-draft{color:var(--muted);border:1px solid var(--hairline)}
.fc-status-submitted{color:var(--gold-lit);border:1px solid var(--gold)}
.fc-status-approved,.fc-status-active{color:var(--rag-g);border:1px solid var(--rag-g)}
.fc-band{font-size:.72rem;padding:.15rem .5rem;border-radius:2px;font-weight:600}
.fc-band-green{color:var(--rag-g);border:1px solid var(--rag-g)}
.fc-band-amber{color:var(--rag-a);border:1px solid var(--rag-a)}
.fc-band-red{color:var(--rag-r);border:1px solid var(--rag-r)}
.fc-pill{font-size:.72rem;padding:.15rem .5rem;border-radius:2px}
.fc-pill-warn{color:var(--rag-a);border:1px solid var(--rag-a)}
.fc-pill-ok{color:var(--rag-g);border:1px solid var(--rag-g)}
.fc-pill-mut{color:var(--muted);border:1px solid var(--hairline)}

/* objectives + author */
.fc-objlist-head,.fc-panel-head{flex-wrap:wrap}
.fc-objlist-head h2{margin:0}
.fc-objcard{border:1px solid var(--hairline);border-radius:6px;padding:1.2rem;margin-bottom:1rem;background:rgba(9,26,51,.4)}
.fc-objcard-head{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem}
.fc-objcard-head h3{margin:0 0 .2rem}
.fc-objcard-tags{display:flex;gap:.5rem;flex:none}
.fc-krlist{list-style:none;margin:.9rem 0 0;padding:0;display:flex;flex-direction:column;gap:.55rem}
.fc-krlist li{display:flex;align-items:center;gap:.6rem;font-size:.95rem}
.fc-kr-st{flex:1}
.fc-objcard-actions{display:flex;gap:.6rem;justify-content:flex-end;margin-top:1rem}
.fc-field-grid{display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin:1.4rem 0}
.fc-field{display:flex;flex-direction:column;gap:.35rem}
.fc-field span{font-size:.8rem;color:var(--muted)}
.fc-col2{grid-column:1/3}
.fc-kr-head{display:flex;align-items:center;justify-content:space-between;margin:1rem 0 .8rem}
.fc-kr-head h3{margin:0}
.fc-krrow{border:1px solid var(--hairline);border-left:3px solid var(--hairline);border-radius:5px;padding:1rem;margin-bottom:.8rem;background:rgba(9,26,51,.35)}
.fc-krrow.is-outcome{border-left-color:var(--gold)}
.fc-krrow.is-output{border-left-color:var(--muted)}
.fc-krrow.is-activity,.fc-krrow.is-input{border-left-color:var(--rag-a)}
.fc-krrow-top{display:flex;align-items:center;gap:.7rem}
.fc-krrow-n{color:var(--muted);font-size:.85rem}
.fc-kr-statement{flex:1}
.fc-icon-btn{background:none;border:none;color:var(--muted);cursor:pointer;font-size:.9rem}
.fc-kr-measures{display:grid;grid-template-columns:repeat(4,1fr);gap:.6rem;margin-top:.6rem}
.fc-kr-note{font-size:.82rem;color:var(--muted);margin:.5rem 0 0}
.fc-warn-note{color:var(--rag-a)}
.fc-coach{margin-top:.8rem;padding:.8rem;border:1px dashed var(--gold);border-radius:4px;background:rgba(184,146,74,.06)}
.fc-coach-title{margin:0 0 .5rem;font-size:.85rem;color:var(--gold-lit);text-transform:uppercase;letter-spacing:.08em}
.fc-coach-rewrites{display:flex;flex-direction:column;gap:.4rem;margin-bottom:.6rem}
.fc-coach-rw{text-align:left;padding:.5rem .7rem;border:1px solid var(--hairline);border-radius:3px;background:transparent;color:var(--parchment);cursor:pointer;font-family:inherit;font-size:.9rem}
.fc-coach-rw:hover{border-color:var(--gold);color:var(--gold-lit)}
.fc-author-foot{display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;margin-top:1.4rem;border-top:1px solid var(--hairline);padding-top:1.2rem}

/* board */
.fc-boardtable{border:1px solid var(--hairline);border-radius:6px;overflow:hidden;margin-bottom:1.6rem}
.fc-bt-head,.fc-bt-row{display:grid;grid-template-columns:1.4fr .6fr 1fr 1fr;padding:.7rem 1rem;gap:.5rem}
.fc-bt-head{background:rgba(184,146,74,.1);color:var(--gold-lit);font-size:.8rem;text-transform:uppercase;letter-spacing:.06em}
.fc-bt-row{border-top:1px solid var(--hairline)}
.fc-staffgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:.8rem}
.fc-staffcard{display:flex;align-items:center;gap:.7rem;border:1px solid var(--hairline);border-radius:5px;padding:.8rem;background:rgba(9,26,51,.4)}
.fc-staffcard-body{display:flex;flex-direction:column;flex:1}
.fc-staffcard-body b{font-size:.9rem}
.fc-staffcard-score{display:flex;flex-direction:column;align-items:flex-end;gap:.25rem}
.fc-staffcard-score b{font-size:1.1rem;color:var(--gold-lit)}

.fc-scored-dot{font-size:.6rem;text-transform:uppercase;letter-spacing:.1em;color:var(--gold);border:1px solid var(--gold);border-radius:2px;padding:.05rem .3rem;margin-top:.15rem}

/* scorecards */
.fc-rubric-key{font-size:.78rem;color:var(--muted);letter-spacing:.03em}
.fc-scorecard{border:1px solid var(--hairline);border-radius:6px;padding:1.2rem;margin-bottom:1rem;background:rgba(9,26,51,.4)}
.fc-sc-head{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem}
.fc-sc-head h3{margin:0 0 .2rem}
.fc-sc-total{display:flex;align-items:center;gap:.5rem;flex:none}
.fc-sc-total b{font-size:1.6rem;color:var(--gold-lit);line-height:1}
.fc-sc-outof{color:var(--muted);font-size:.85rem;margin-left:-.3rem}
.fc-sc-table{margin-top:1rem;border:1px solid var(--hairline);border-radius:5px;overflow:hidden}
.fc-sc-row{display:grid;grid-template-columns:1.6fr .7fr .7fr 1fr;gap:.5rem;padding:.55rem .9rem;align-items:center}
.fc-sc-row+.fc-sc-row{border-top:1px solid var(--hairline)}
.fc-sc-th{background:rgba(184,146,74,.08);color:var(--gold-lit);font-size:.72rem;text-transform:uppercase;letter-spacing:.06em}
.fc-sc-input{padding:.3rem .45rem;max-width:88px}
.fc-adj-dot{color:var(--gold);margin-left:.35rem;font-size:1.1rem;vertical-align:middle}
.fc-sc-actions{margin-top:.9rem;display:flex;justify-content:flex-end}
.fc-sc-edit{margin-top:.9rem;display:flex;flex-direction:column;gap:.6rem;border-top:1px solid var(--hairline);padding-top:.9rem}
.fc-sc-log{margin-top:1rem;border-top:1px solid var(--hairline);padding-top:.8rem}
.fc-sc-log-title{margin:0 0 .4rem;font-size:.72rem;text-transform:uppercase;letter-spacing:.08em;color:var(--muted)}
.fc-sc-log-row{margin:.2rem 0;font-size:.82rem;color:var(--muted)}
.fc-sc-log-row b{color:var(--parchment)}

/* organisations */
.fc-orgtabs{display:flex;gap:.4rem;flex-wrap:wrap;margin:0 0 1.4rem;border-bottom:1px solid var(--hairline);padding-bottom:.6rem}
.fc-orgtab{display:inline-flex;align-items:center;gap:.5rem;background:none;border:1px solid var(--hairline);border-radius:3px;color:var(--muted);cursor:pointer;font-family:inherit;font-size:.9rem;padding:.45rem .85rem}
.fc-orgtab:hover{color:var(--parchment)}
.fc-orgtab.is-on{color:var(--navy-deep);background:var(--gold);border-color:var(--gold);font-weight:600}
.fc-orgtab-count{font-size:.72rem;background:rgba(237,233,224,.14);color:inherit;border-radius:10px;padding:.02rem .45rem}
.fc-orgtab.is-on .fc-orgtab-count{background:rgba(9,26,51,.25)}
.fc-org-person{display:flex;align-items:center;gap:.6rem}
.fc-org-score{color:var(--gold-lit);font-size:1.05rem}

/* suggestions */
.fc-suggest{border:1px dashed var(--gold);border-radius:6px;padding:1.1rem;margin:0 0 1.3rem;background:rgba(184,146,74,.05)}
.fc-suggest-title{margin:0 0 .8rem;font-size:.8rem;text-transform:uppercase;letter-spacing:.08em;color:var(--gold-lit)}
.fc-suggest-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:.9rem}
.fc-suggest-card{border:1px solid var(--hairline);border-radius:5px;padding:.9rem;background:rgba(9,26,51,.4);display:flex;flex-direction:column;gap:.5rem}
.fc-suggest-card h4{margin:0;font-size:1rem}
.fc-suggest-krs{list-style:none;margin:.2rem 0;padding:0;font-size:.85rem;color:var(--parchment);display:flex;flex-direction:column;gap:.35rem}
.fc-suggest-card .fc-btn{margin-top:auto}

/* stalls */
.fc-stallpanel{margin-top:1.4rem}
.fc-stall{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:.7rem 0;border-top:1px solid var(--hairline)}
.fc-stall-body{display:flex;flex-direction:column;gap:.15rem}
.fc-stall-body b{font-size:.95rem}
.fc-stall-reason{font-size:.7rem;text-transform:uppercase;letter-spacing:.08em;color:var(--rag-a);border:1px solid var(--rag-a);border-radius:2px;padding:.08rem .4rem;width:fit-content}

/* cockpit */
.fc-move{font-size:.78rem;font-weight:600}
.fc-move.up{color:var(--rag-g)}
.fc-move.down{color:var(--rag-r)}
.fc-move-flat{color:var(--muted)}
.fc-cockpit-section{margin-top:1.8rem}
.fc-cockpit-h{margin:0 0 .9rem;font-size:1.15rem}
.fc-cockpit-h .fc-muted{font-size:.9rem;font-weight:400}
.fc-orghealth-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:.9rem}
.fc-orghealth-card{border:1px solid var(--hairline);border-left:3px solid var(--hairline);border-radius:6px;padding:1rem;background:rgba(9,26,51,.4)}
.fc-orghealth-card.hb-green{border-left-color:var(--rag-g)}
.fc-orghealth-card.hb-amber{border-left-color:var(--rag-a)}
.fc-orghealth-card.hb-red{border-left-color:var(--rag-r)}
.fc-orghealth-btn{cursor:pointer;text-align:left;color:var(--parchment);font-family:inherit;width:100%;transition:border-color .15s,transform .05s}
.fc-orghealth-btn:hover{border-color:var(--gold)}
.fc-orghealth-btn:active{transform:translateY(1px)}
.fc-oh-legal{font-size:.72rem;color:var(--muted);margin-top:.15rem;line-height:1.25}
.fc-orgpanel-h{margin:0}
.fc-oh-top{display:flex;align-items:center;justify-content:space-between}
.fc-oh-top b{font-size:1.02rem}
.fc-oh-rank{color:var(--gold);font-size:.78rem;font-weight:600}
.fc-oh-score{font-size:1.5rem;font-weight:600;margin:.4rem 0 .1rem;display:flex;align-items:baseline;gap:.5rem}
.fc-oh-outof{font-size:.8rem;color:var(--muted);margin-left:-.35rem}
.fc-oh-meta{font-size:.82rem;color:var(--muted)}
.fc-oh-rag{display:flex;gap:.7rem;margin-top:.5rem;font-weight:600;font-size:.9rem}
.fc-staff-table{border:1px solid var(--hairline);border-radius:6px;overflow:hidden}
.fc-stt-row{display:grid;grid-template-columns:2fr 1.1fr .6fr .8fr .7fr .7fr;gap:.5rem;align-items:center;padding:.6rem .9rem}
.fc-stt-row+.fc-stt-row{border-top:1px solid var(--hairline)}
.fc-stt-head{background:rgba(184,146,74,.08);color:var(--gold-lit);font-size:.72rem;text-transform:uppercase;letter-spacing:.06em}
.fc-stt-name{display:flex;align-items:center;gap:.55rem}
.fc-movers{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
.fc-mover-col{border:1px solid var(--hairline);border-radius:6px;padding:1rem;background:rgba(9,26,51,.4)}
.fc-mover-h{margin:0 0 .6rem;font-size:.78rem;text-transform:uppercase;letter-spacing:.08em}
.fc-mover-up{color:var(--rag-g)}
.fc-mover-down{color:var(--rag-r)}
.fc-mover-row{display:flex;align-items:center;justify-content:space-between;padding:.35rem 0;border-top:1px solid var(--hairline);font-size:.92rem}
.fc-persondetail .fc-pd-head{display:flex;align-items:center;justify-content:space-between;gap:1rem;margin:.6rem 0 1.4rem;flex-wrap:wrap}
.fc-pd-id{display:flex;align-items:center;gap:.8rem}
.fc-pd-id h2{margin:0}
.fc-pd-score{display:flex;align-items:center;gap:.6rem}
.fc-pd-score b{font-size:1.7rem;color:var(--gold-lit)}

/* check-ins, sparkline, progress */
.fc-spark{display:inline-block;vertical-align:middle}
.fc-spark-empty{font-size:.75rem;color:var(--muted)}
.fc-progress{position:relative;width:120px;height:14px;border:1px solid var(--hairline);border-radius:8px;background:rgba(237,233,224,.05);overflow:hidden}
.fc-progress-fill{position:absolute;left:0;top:0;bottom:0;border-radius:8px;background:var(--gold)}
.fc-progress-fill.ok{background:var(--rag-g)}
.fc-progress-fill.mid{background:var(--rag-a)}
.fc-progress-fill.low{background:var(--rag-r)}
.fc-progress-pct{position:absolute;right:.4rem;top:-.05rem;font-size:.68rem;color:var(--parchment)}
.fc-prog-na{font-size:.8rem}
.fc-ci-list{margin-top:.9rem;display:flex;flex-direction:column;gap:.7rem}
.fc-ci-row{border:1px solid var(--hairline);border-radius:5px;padding:.8rem;background:rgba(9,26,51,.35)}
.fc-ci-main{display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap}
.fc-ci-statement{display:flex;align-items:center;gap:.55rem;font-size:.95rem;flex:1;min-width:240px}
.fc-ci-metrics{display:flex;align-items:center;gap:1rem;flex-wrap:wrap}
.fc-ci-latest{font-size:.95rem;font-weight:600}
.fc-ci-conf{font-size:.8rem;color:var(--muted)}
.fc-ci-meta{margin-top:.5rem;font-size:.8rem}
.fc-ci-form{margin-top:.8rem;display:grid;grid-template-columns:1fr 1fr 1.4fr auto;gap:.7rem;align-items:end;border-top:1px solid var(--hairline);padding-top:.8rem}
.fc-ci-form input[type=range]{width:100%}
.fc-ci-form .fc-btn{height:fit-content}

/* roster / admin */
.fc-adm-flag{background:rgba(184,146,74,.1);border:1px solid var(--gold);color:var(--gold-lit);border-radius:4px;padding:.6rem .8rem;font-size:.88rem;margin:0 0 1rem}
.fc-admin-add{display:grid;grid-template-columns:1.6fr 1fr 1fr 1fr auto;gap:.6rem;margin:0 0 1.2rem;align-items:center}
.fc-admin-table{border:1px solid var(--hairline);border-radius:6px;overflow-x:auto}
.fc-adm-row{display:grid;grid-template-columns:1.7fr 1.1fr 1fr .8fr 1.1fr 1.3fr;gap:.6rem;align-items:center;padding:.6rem .9rem}
.fc-adm-row+.fc-adm-row{border-top:1px solid var(--hairline)}
.fc-adm-head{background:rgba(184,146,74,.08);color:var(--gold-lit);font-size:.72rem;text-transform:uppercase;letter-spacing:.06em}
.fc-adm-name{font-weight:600;display:flex;align-items:center;gap:.5rem;flex-wrap:wrap}
.fc-adm-pending{background:rgba(184,146,74,.06)}
.fc-adm-pill{font-size:.66rem;text-transform:uppercase;letter-spacing:.06em;color:var(--gold-lit);border:1px solid var(--gold);border-radius:2px;padding:.05rem .35rem}
.fc-adm-actions{display:flex;gap:.4rem;justify-content:flex-end;align-items:center}
.fc-adm-edit .fc-input{padding:.4rem .5rem;font-size:.85rem}

/* organogram */
.fc-og-parent{display:flex;align-items:center;gap:1rem;border:1px solid var(--gold);border-radius:8px;padding:1rem 1.2rem;background:linear-gradient(90deg,rgba(184,146,74,.12),rgba(184,146,74,.02));margin-bottom:1.4rem}
.fc-og-logo{height:40px;width:auto}
.fc-og-parent b{display:block;font-size:1.05rem}
.fc-og-parent .fc-muted{font-size:.82rem}
.fc-og-orgs{display:flex;flex-direction:column;gap:1.1rem}
.fc-og-branch{border:1px solid var(--hairline);border-radius:8px;padding:1rem 1.2rem;background:rgba(9,26,51,.4)}
.fc-og-orgnode{display:flex;flex-direction:column;gap:.15rem;text-align:left;width:100%;background:none;border:none;cursor:pointer;color:var(--parchment);font-family:inherit;padding:0 0 .6rem;border-bottom:1px solid var(--hairline);margin-bottom:.8rem}
.fc-og-orgnode b{font-size:1.05rem}
.fc-og-orgnode:hover b{color:var(--gold-lit)}
.fc-og-legal{font-size:.78rem;color:var(--gold)}
.fc-og-tree{display:flex;flex-direction:column;gap:.15rem}
.fc-og-empty{color:var(--muted);font-style:italic;margin:.2rem 0}
.fc-og-node{position:relative}
.fc-og-person{display:inline-flex;align-items:center;gap:.6rem;background:rgba(237,233,224,.03);border:1px solid var(--hairline);border-radius:6px;padding:.45rem .7rem;margin:.35rem 0;cursor:pointer;color:var(--parchment);font-family:inherit;text-align:left}
.fc-og-person:hover{border-color:var(--gold)}
.fc-og-pbody{display:flex;flex-direction:column;line-height:1.2}
.fc-og-pbody .fc-muted{font-size:.78rem}
.fc-og-count{margin-left:.4rem;font-size:.7rem;background:var(--navy-soft);border:1px solid var(--gold);color:var(--gold-lit);border-radius:10px;padding:.05rem .4rem}
.fc-og-children{margin-left:1.3rem;padding-left:1.3rem;border-left:1px solid var(--hairline);position:relative}
.fc-og-children > .fc-og-node::before{content:'';position:absolute;left:-1.3rem;top:1.35rem;width:1.1rem;height:1px;background:var(--hairline)}

@media(max-width:900px){.fc-hero{grid-template-columns:1fr}.fc-ladder{border-left:none;border-top:1px solid var(--hairline);padding-left:0;padding-top:2rem}.fc-cap-grid{grid-template-columns:repeat(2,1fr)}.fc-dash-cols{grid-template-columns:1fr}.fc-board-grid{grid-template-columns:repeat(2,1fr)}.fc-kr-measures{grid-template-columns:1fr 1fr}.fc-suggest-grid{grid-template-columns:1fr}.fc-ci-form{grid-template-columns:1fr 1fr}.fc-admin-add{grid-template-columns:1fr 1fr}.fc-adm-row{min-width:660px}.fc-nav{order:3;width:100%}}
@media(max-width:560px){.fc-field-grid{grid-template-columns:1fr}.fc-col2{grid-column:1}.fc-cap-grid{grid-template-columns:1fr}.fc-board-grid{grid-template-columns:1fr 1fr}}
@media(prefers-reduced-motion:reduce){*{transition:none!important}}
`
