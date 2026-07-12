import React, { useEffect, useMemo, useRef, useState } from 'react'
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
  accountant: 'Accountant',
  admin: 'Tenant Admin',
}
const uid = () => Math.random().toString(36).slice(2, 10)
const roleLabel = (x) => (x && x.title) || ROLES[x && x.role] || ''

/* ------------------------ Seeded cohort --------------------------- */
// Real May 2026 cohort. Bands seed the group board; a subset carries full OKRs.
const STAFF = [
  { id: 's_jen', name: 'Jennifer Kaja', role: 'md', title: 'Managing Director', sub: 'Corporate', also: ['Girard', 'Yostrat'], tier: 'leadership', band: 'green', score: 8.4 },
  { id: 's_ebi', name: 'Ebime Abari', role: 'lead', sub: 'Genesys', tier: 'leadership', band: 'green', score: 8.1 },
  { id: 's_sol', name: 'Solomon C. Nweke', role: 'lead', sub: 'Realms', tier: 'leadership', band: 'green', score: 7.6 },
  { id: 's_tha', name: 'Thaddeus U. Oparaocha', role: 'staff', sub: 'Realms', tier: 'ops', band: 'green', score: 7.2 },
  { id: 's_ojo', name: 'Ojuma Joy Ndidi', role: 'staff', sub: 'Realms', tier: 'ops', band: 'green', score: 7.3 },
  { id: 's_gud', name: 'Goodness Udoka', role: 'staff', sub: 'Girard', tier: 'leadership', band: 'green', score: 7.6 },
  { id: 's_chi', name: 'Chinomso Isdone Ordor', role: 'staff', sub: 'Genesys', also: ['Girard'], tier: 'ops', band: 'green', score: 8.0 },
  { id: 's_ade', name: 'Adebayo Okediji', role: 'accountant', title: 'Accountant', sub: 'Corporate', tier: 'leadership', band: 'green', score: 7.6 },
  { id: 's_sun', name: 'Sunday Orimoyegun', role: 'staff', sub: 'Genesys', tier: 'ops', band: 'amber', score: 6.2 },
  { id: 's_kit', name: 'Kitunde Abayomi', role: 'staff', sub: 'Genesys', tier: 'ops', band: 'amber', score: 5.8 },
  { id: 's_goo', name: 'Goodnews Anele', role: 'staff', sub: 'Realms', tier: 'ops', band: 'amber', score: 6.5 },
  { id: 's_god', name: 'Godwin Idiong', role: 'lead', title: 'Head of Products', sub: 'Corporate', also: ['Genesys'], tier: 'leadership', band: 'amber', score: 6.5 },
  { id: 's_emma', name: 'Emmanuella', role: 'staff', title: 'Customer Service', sub: 'Corporate', tier: 'ops', band: 'green', score: 0 },
]
// A Chairman and an HR seat, for role coverage.
STAFF.push({ id: 's_chair', name: 'Office of the Chairman', role: 'chairman', sub: 'Corporate', tier: 'leadership', band: 'green', score: 0 })
STAFF.push({ id: 's_hr', name: 'Ijeoma Balogun', role: 'hr', sub: 'Corporate', tier: 'leadership', band: 'green', score: 0 })
STAFF.push({ id: 's_buchi', name: 'Buchi', role: 'lead', sub: 'Corporate', also: ['Girard'], tier: 'leadership', band: 'green', score: 7.0 })
// Prior-cycle standing (April 2026), used to show movement.
const PREV = { s_jen: 8.1, s_ebi: 7.5, s_sol: 7.4, s_tha: 7.0, s_ojo: 7.3, s_gud: 7.8, s_chi: 7.7, s_ade: 7.6, s_sun: 6.6, s_kit: 5.5, s_goo: 6.2, s_god: 6.3, s_buchi: 6.8, s_emma: 0 }
// Reporting lines. Chairman at the top; each subsidiary head reports to the MD.
const MGR = {
  s_jen: 's_chair', s_gud: 's_buchi', s_hr: 's_jen', s_ade: 's_jen', s_buchi: 's_jen',
  s_ebi: 's_god', s_god: 's_jen', s_sun: 's_ebi', s_kit: 's_ebi', s_chi: 's_ebi', s_emma: 's_jen',
  s_sol: 's_jen', s_tha: 's_sol', s_ojo: 's_sol', s_goo: 's_sol',
}
STAFF.forEach((s) => { s.prev = PREV[s.id] ?? s.score; s.managerId = MGR[s.id] ?? null })
// Monthly gross salary (NGN) and optional annual rent (for rent relief).
const SALARY = { s_jen: 2500000, s_ebi: 1500000, s_god: 1400000, s_ade: 1300000, s_buchi: 1300000, s_sol: 1200000, s_hr: 1100000, s_gud: 700000, s_chi: 550000, s_sun: 500000, s_ojo: 450000, s_tha: 450000, s_goo: 450000, s_kit: 300000, s_emma: 380000 }
const RENT = { s_jen: 6000000, s_ebi: 3000000, s_emma: 900000 }
STAFF.forEach((s) => { s.salary = SALARY[s.id] ?? 0; s.rent = RENT[s.id] ?? 0 })

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
      id: uid(), owner: 's_emma', sub: 'Corporate', priority: 'P2', cycle: 'May 2026',
      status: 'approved',
      title: 'Schedule appointments for Genesys clients',
      description: 'Turn client contact into booked, attended appointments.',
      krs: [
        KR('Contact assigned Genesys clients weekly', 'activity', 'Clients contacted', 'Ad hoc', 'Weekly, all assigned', 'cadence'),
        KR('Book appointments with contacted clients', 'output', 'Appointments booked', 'Untracked', '40 to 60% of contacted', '%'),
        KR('Record all bookings and client responses within 24 hours', 'output', 'Records logged', 'Same week', 'Within 24 hours', 'hours'),
      ],
    },
    {
      id: uid(), owner: 's_gud', sub: 'Girard', priority: 'P1', cycle: 'May 2026',
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
// Corporate rolls up every subsidiary: its outcome ratio spans the whole group.
const outcomeRatioForOrg = (data, org) => {
  if (org === 'Corporate') return outcomeRatio(data.objectives)
  return outcomeRatio(data.objectives.filter((o) => o.sub === org))
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
// An organisation's score comes from the OKRs set within it, so a person with
// roles in more than one organisation has their score divided across them.
function orgScore(data, org) {
  const objs = data.objectives.filter((o) => o.sub === org && o.status === 'approved')
  if (!objs.length) return null
  return r1(objs.reduce((a, o) => a + finalScore(o).total, 0) / objs.length)
}
// Movement against the prior cycle.
function movementOf(data, s) {
  const cur = personScore(data, s.id).total
  const prev = s.prev ?? cur
  return r1(cur - prev)
}
// Organisation membership, including any dual roles held via `also`.
const inOrg = (s, org) => s.sub === org || (Array.isArray(s.also) && s.also.includes(org))

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

/* -------------- Reviews, feedback and intervention ---------------- */
const RATING = {
  exceeds: { label: 'Exceeds expectations', tone: 'good', neg: 0 },
  meets: { label: 'Meets expectations', tone: 'ok', neg: 0 },
  below: { label: 'Below expectations', tone: 'warn', neg: 1 },
  unsatisfactory: { label: 'Unsatisfactory', tone: 'bad', neg: 2 },
}
const RATING_ORDER = ['exceeds', 'meets', 'below', 'unsatisfactory']

function seedReviews() {
  const r = (subjectId, reviewerId, cycle, rating, summary, strengths, improvements, at, ack = false, response = '') =>
    ({ id: uid(), subjectId, reviewerId, cycle, rating, summary, strengths, improvements, createdAt: at, ack, response })
  return [
    r('s_ebi', 's_god', 'April 2026', 'exceeds', 'Led Version 2 to production and held stability high.', 'Ownership, technical depth, calm under load.', 'Delegate more so the bus factor improves.', '2026-04-30'),
    r('s_tha', 's_sol', 'April 2026', 'meets', 'Consistent monitoring coverage and clean reporting.', 'Reliability, field discipline.', 'Push checklist completion above 95 percent.', '2026-04-30'),
    r('s_sun', 's_ebi', 'April 2026', 'below', 'Steady on legacy support; slow on the migration queue.', 'Patient with legacy clients.', 'Clear the high-priority migration tickets within SLA.', '2026-04-30'),
    r('s_kit', 's_ebi', 'March 2026', 'below', 'Learning fast but output below the module targets.', 'Eager, coachable.', 'Ship the assigned modules on schedule.', '2026-03-31'),
    r('s_kit', 's_ebi', 'April 2026', 'below', 'Repeat gap on module delivery; needs closer support.', 'Good attitude.', 'Meet the next two module deadlines without slippage.', '2026-04-30'),
  ]
}
function seedFeedback() {
  const f = (toId, fromId, text, at) => ({ id: uid(), toId, fromId, text, createdAt: at })
  return [
    f('s_ebi', 's_jen', 'The migration validation report was excellent, thank you.', '2026-05-18'),
    f('s_goo', 's_chair', 'Calendar ran flawlessly through the board week.', '2026-05-16'),
  ]
}

const reviewsFor = (data, id) => (data.reviews || []).filter((r) => r.subjectId === id).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
const lastReview = (data, id) => reviewsFor(data, id)[0] || null
const feedbackFor = (data, id) => (data.feedback || []).filter((f) => f.toId === id).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
const reportsOf = (data, id) => data.staff.filter((s) => s.managerId === id)

// Recommendation from frequency and severity of low performance.
function interventionFor(data, s) {
  const revs = reviewsFor(data, s.id)
  const below = revs.filter((r) => r.rating === 'below').length
  const unsat = revs.filter((r) => r.rating === 'unsatisfactory').length
  const negatives = below + unsat
  const move = movementOf(data, s)
  const reasons = []
  if (s.band === 'red') reasons.push('Red band this cycle')
  if (s.band === 'amber') reasons.push('Amber band this cycle')
  if (unsat) reasons.push(`${unsat} unsatisfactory review${unsat > 1 ? 's' : ''}`)
  if (below) reasons.push(`${below} below-expectations review${below > 1 ? 's' : ''}`)
  if (move < 0) reasons.push(`Down ${Math.abs(move).toFixed(1)} vs last cycle`)
  let level = 'ok'
  if (s.band === 'red' || unsat >= 1 || negatives >= 2) level = 'terminate'
  else if (s.band === 'amber' && negatives >= 1) level = 'pip'
  else if (s.band === 'amber' || negatives >= 1) level = 'monitor'
  return { level, frequency: negatives, severity: unsat > 0 ? 'high' : below > 0 ? 'moderate' : (s.band === 'amber' ? 'low' : 'none'), reasons, move }
}
const INTERVENTION = {
  ok: { label: 'On track', tone: 'good' },
  monitor: { label: 'Monitor', tone: 'ok' },
  pip: { label: 'Improvement plan', tone: 'warn' },
  terminate: { label: 'Recommend for termination', tone: 'bad' },
}


/* ---------------------------- Leave ------------------------------- */
const LEAVE_TYPES = [
  { key: 'annual', label: 'Annual' },
  { key: 'sick', label: 'Sick' },
  { key: 'maternity', label: 'Maternity & Paternity' },
  { key: 'compassionate', label: 'Compassionate' },
]
const LEAVE_ENTITLEMENT = { annual: 20, sick: 12, maternity: 60, compassionate: 5 }
const leaveLabel = (k) => (LEAVE_TYPES.find((t) => t.key === k) || {}).label || k
const daysBetween = (a, b) => {
  const d1 = new Date(a), d2 = new Date(b)
  if (isNaN(d1) || isNaN(d2) || d2 < d1) return 0
  return Math.round((d2 - d1) / 86400000) + 1
}
function seedLeave() {
  const L = (staffId, type, start, end, reason, status, decidedBy = null, decidedAt = null) =>
    ({ id: uid(), staffId, type, start, end, days: daysBetween(start, end), reason, status, decidedBy, decidedAt, note: '' })
  return [
    L('s_tha', 'annual', '2026-07-14', '2026-07-18', 'Personal time', 'pending'),
    L('s_sun', 'sick', '2026-05-22', '2026-05-23', 'Malaria', 'approved', 's_jen', '2026-05-21'),
    L('s_goo', 'compassionate', '2026-05-05', '2026-05-07', 'Family bereavement', 'approved', 's_jen', '2026-05-04'),
  ]
}
function leaveBalance(data, id) {
  const mine = (data.leave || []).filter((l) => l.staffId === id && l.status === 'approved')
  const out = {}
  LEAVE_TYPES.forEach((t) => {
    const used = mine.filter((l) => l.type === t.key).reduce((a, l) => a + (l.days || 0), 0)
    out[t.key] = { entitlement: LEAVE_ENTITLEMENT[t.key], used, left: Math.max(0, LEAVE_ENTITLEMENT[t.key] - used) }
  })
  return out
}

/* --------------------------- Payroll (Nigeria) -------------------- */
// Nigeria Tax Act 2025, effective 1 Jan 2026. Bands on annual chargeable income.
const PAYE_BANDS = [
  { upTo: 800000, rate: 0 },
  { upTo: 3000000, rate: 0.15 },
  { upTo: 12000000, rate: 0.18 },
  { upTo: 25000000, rate: 0.21 },
  { upTo: 50000000, rate: 0.23 },
  { upTo: Infinity, rate: 0.25 },
]
const PAY_STRUCTURE = { basic: 0.5, housing: 0.25, transport: 0.15, other: 0.1 }
const EMP_PENSION = 0.08
const ER_PENSION = 0.1
const naira = (n) => '₦' + Math.round(n || 0).toLocaleString('en-NG')
function payeAnnual(chargeable) {
  let tax = 0, lower = 0
  for (const b of PAYE_BANDS) {
    if (chargeable > lower) { tax += (Math.min(chargeable, b.upTo) - lower) * b.rate; lower = b.upTo } else break
  }
  return Math.max(0, Math.round(tax))
}
const NHF_RATE = 0.025        // 2.5% of basic, tax-deductible
const NHIS_EMP = 0.05         // employee 5% of basic, not tax-deductible
const NHIS_ER = 0.10          // employer 10% of basic
const DEV_LEVY = 4000         // flat NGN per year (NTA 2025)
function payrollFor(s, opts = {}) {
  const { nhf = true, nhis = true } = opts
  const grossM = s.salary || 0
  if (!grossM) return null
  const grossA = grossM * 12
  const basic = grossA * PAY_STRUCTURE.basic
  const housing = grossA * PAY_STRUCTURE.housing
  const transport = grossA * PAY_STRUCTURE.transport
  const other = grossA * PAY_STRUCTURE.other
  const pensionable = basic + housing + transport
  const empPensionA = pensionable * EMP_PENSION
  const erPensionA = pensionable * ER_PENSION
  const nhfA = nhf ? basic * NHF_RATE : 0
  const nhisEmpA = nhis ? basic * NHIS_EMP : 0
  const nhisErA = nhis ? basic * NHIS_ER : 0
  const rentRelief = Math.min((s.rent || 0) * 0.2, 500000)
  const chargeable = Math.max(0, grossA - empPensionA - nhfA - rentRelief)
  const payeA = payeAnnual(chargeable)
  const netA = grossA - empPensionA - nhfA - payeA - nhisEmpA - DEV_LEVY
  return {
    grossM, grossA, basic, housing, transport, other, pensionable,
    empPensionA, erPensionA, nhfA, nhisEmpA, nhisErA, devLevyA: DEV_LEVY, rentRelief, chargeable, payeA, netA,
    empPensionM: empPensionA / 12, erPensionM: erPensionA / 12, nhfM: nhfA / 12, nhisEmpM: nhisEmpA / 12, devLevyM: DEV_LEVY / 12, payeM: payeA / 12, netM: netA / 12,
  }
}

/* ---------------------------- Onboarding -------------------------- */
const ONBOARDING_TASKS = [
  'Signed offer letter', 'Employment contract signed', 'ID and right-to-work documents',
  'Bank and pension (PFA) details', 'Email and system accounts', 'Workspace and equipment',
  'Orientation and policies acknowledged', 'First-week check-in with manager',
]
const newChecklist = (allDone = false) => ONBOARDING_TASKS.map((label, i) => ({ id: 'ob' + i, label, done: allDone }))
function seedOnboarding(id) {
  const recent = { s_buchi: 5, s_kit: 3, s_emma: 2 } // recent hires: number of tasks completed
  if (id in recent) return ONBOARDING_TASKS.map((label, i) => ({ id: 'ob' + i, label, done: i < recent[id] }))
  return newChecklist(true)
}
function onboardingProgress(s) {
  const t = s.onboarding || []
  const done = t.filter((x) => x.done).length
  return { done, total: t.length, pct: t.length ? Math.round((done / t.length) * 100) : 100, complete: t.length === 0 || done === t.length }
}

/* ---------------------------- Documents --------------------------- */
const DOC_CATEGORIES = ['Contract', 'ID', 'Certificate', 'Tax (TIN)', 'Pension', 'Other']
// Uploaded file blobs are kept in memory for the session (not persisted to storage).
const DOC_BLOBS = {}
function seedDocuments(id) {
  const D = (name, category, at) => ({ id: uid(), name, category, size: 0, uploadedAt: at, uploadedBy: 'Ijeoma Balogun' })
  const map = {
    s_jen: [D('Employment contract.pdf', 'Contract', '2025-11-01'), D('National ID card.pdf', 'ID', '2025-11-01')],
    s_ebi: [D('Employment contract.pdf', 'Contract', '2025-12-01'), D('Degree certificate.pdf', 'Certificate', '2025-12-01')],
    s_kit: [D('Internship letter.pdf', 'Contract', '2026-02-01')],
  }
  return map[id] || []
}
const fileSize = (n) => (!n ? 'on file' : n < 1024 ? n + ' B' : n < 1048576 ? (n / 1024).toFixed(0) + ' KB' : (n / 1048576).toFixed(1) + ' MB')

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
  const forte = tenantId === 'imade-forte'
  const seeded = {
    staff: STAFF.map((s) => ({ ...s, onboarding: seedOnboarding(s.id), documents: seedDocuments(s.id) })),
    objectives: forte ? seedObjectives() : [],
    reviews: forte ? seedReviews() : [],
    feedback: forte ? seedFeedback() : [],
    leave: forte ? seedLeave() : [],
    cycles: forte
      ? [{ id: 'c_mar', name: 'March 2026', status: 'closed' }, { id: 'c_apr', name: 'April 2026', status: 'closed' }, { id: 'c_may', name: 'May 2026', status: 'active' }]
      : [{ id: 'c1', name: 'Current cycle', status: 'active' }],
    activeCycle: forte ? 'May 2026' : 'Current cycle',
    hrActions: [],
    payrollRun: { cycle: forte ? 'May 2026' : 'Current cycle', status: 'draft', preparedBy: null, approvedBy: null, paidBy: null },
  }
  return seeded
}

async function saveData(tenantId, data) {
  if (LIVE) {
    try { await supabase.from('kv').upsert({ tenant_id: tenantId, key: 'dataset', value: data, updated_at: new Date().toISOString() }) } catch { /* ignore */ }
  }
  try { localStorage.setItem(LKEY(tenantId), JSON.stringify(data)) } catch { /* ignore */ }
}

/* ---- Enforced tables: objectives (first migrated entity, opt-in) ---- */
// Off unless the deploy sets VITE_USE_TABLES=on. Your live site is untouched
// until you turn it on (do that on a Vercel preview first).
const USE_TABLES = LIVE && import.meta.env.VITE_USE_TABLES === 'on'
const krRowToApp = (k) => ({ id: k.id, statement: k.statement, kr_type: k.kr_type, measure: k.measure, baseline: k.baseline, target: k.target, unit: k.unit, current: k.current, confidence: k.confidence, due: k.due, checkins: k.checkins || [] })
const objRowToApp = (o, krs) => ({ id: o.id, owner: o.owner_key, sub: o.subsidiary, priority: o.priority, cycle: o.cycle, status: o.status, title: o.title, description: o.description, score: o.score || undefined, krs: krs.filter((k) => k.objective_id === o.id).map(krRowToApp) })
async function fetchObjectives(tenantId) {
  const { data: objs, error: e1 } = await supabase.from('objectives').select('*').eq('tenant_id', tenantId)
  if (e1) throw e1
  const ids = (objs || []).map((o) => o.id)
  let krs = []
  if (ids.length) { const { data: krRows, error: e2 } = await supabase.from('key_results').select('*').in('objective_id', ids); if (e2) throw e2; krs = krRows || [] }
  return (objs || []).map((o) => objRowToApp(o, krs))
}
async function upsertObjective(tenantId, ownerKey, o) {
  const row = { id: o.id, tenant_id: tenantId, owner_key: ownerKey, subsidiary: o.sub, priority: o.priority, cycle: o.cycle, status: o.status, title: o.title, description: o.description, score: o.score ?? null }
  const { error: e1 } = await supabase.from('objectives').upsert(row); if (e1) throw e1
  await supabase.from('key_results').delete().eq('objective_id', o.id)
  const krRows = (o.krs || []).map((k) => ({ id: k.id, objective_id: o.id, statement: k.statement, kr_type: k.kr_type, measure: k.measure, baseline: k.baseline, target: k.target, unit: k.unit, current: k.current, confidence: k.confidence, due: k.due || null, checkins: k.checkins || [] }))
  if (krRows.length) { const { error: e2 } = await supabase.from('key_results').upsert(krRows); if (e2) throw e2 }
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
/* ======================= Imade Forte site ========================= */
function ShieldLogo({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 64 76" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M32 3 58 12v26c0 18-13 29-26 35C19 67 6 56 6 38V12L32 3Z" stroke="#B8924A" strokeWidth="2.5" fill="none" />
      <rect x="17" y="24" width="30" height="4" rx="1" fill="#B8924A" />
      <rect x="17" y="47" width="30" height="4" rx="1" fill="#B8924A" />
      <rect x="21" y="28" width="4" height="19" fill="#B8924A" />
      <rect x="30" y="28" width="4" height="19" fill="#B8924A" />
      <rect x="39" y="28" width="4" height="19" fill="#B8924A" />
    </svg>
  )
}
function IFBrand({ onHome, light }) {
  return (
    <button className="if-brand" onClick={onHome} aria-label="Imade Forte Holdings home">
      <img className="if-logo" src="/imade-forte-logo-hires.png" alt="Imade Forte Holdings Limited" />
    </button>
  )
}

const IF_SERVICES = [
  ['01', 'Strategic & Institutional Consulting', 'We help public and private organizations define strategy, sharpen operations, and build the institutional capacity to last.', ['Corporate and organizational strategy', 'Business process optimization', 'Institutional restructuring and reform', 'Performance management systems', 'Change management and capacity building'], 'Strategy', 'Corporate strategy, restructuring, and performance systems for public and private institutions.'],
  ['02', 'Healthcare Systems & Policy Advisory', 'Specialized advisory for healthcare institutions, investors, and government agencies working to strengthen health systems and improve outcomes.', ['Health policy and systems strengthening', 'Healthcare management consulting', 'Health project design and implementation', 'Health financing and sustainability advisory', 'Public-private partnerships in healthcare'], 'Healthcare', 'Health-systems strengthening and healthcare PPP structuring across public and private providers.'],
  ['03', 'Financial & Investment Advisory', 'Practical insight and structuring that enable sound investment decisions and efficient use of capital.', ['Feasibility studies and market analysis', 'Financial modeling and valuation', 'Project finance and investment structuring', 'Due diligence and transaction support', 'PPP and infrastructure investment advisory'], 'Finance', 'Feasibility, valuation, and investment structuring, including infrastructure and PPP finance.'],
  ['04', 'Governance, Risk & Compliance', 'We strengthen governance and help organizations meet local and international standards for accountability and performance.', ['Corporate governance frameworks', 'Risk assessment and management', 'Regulatory and compliance audits', 'Internal control systems', 'ESG and sustainability advisory'], 'Governance', 'Governance frameworks, risk management, and regulatory and ESG compliance.'],
  ['05', 'Real Estate & Infrastructure Consulting', 'Strategic insight and transaction support for investors and developers building sustainable value in real estate and infrastructure.', ['Feasibility and viability assessments', 'Project structuring and finance advisory', 'Asset management and portfolio optimization', 'Transaction and negotiation support', 'Market and investment analysis'], 'Real estate', 'Feasibility and transaction advisory, including the LASMIIZO (Lagos State Medical, Industrial & Innovation Zone) feasibility study with Lekki Worldwide Investment.'],
]
const IF_SECTORS = ['Healthcare', 'Finance', 'Real estate', 'Governance', 'Investment']
const IF_INSIGHTS = [
  ['Healthcare', 'Health systems that outlast the project', 'Sustainable financing and reliable data are what keep health interventions running long after launch. We design for the operating model, not just the pilot.'],
  ['Infrastructure', 'Making PPPs investment-ready', 'Bankability starts with rigorous feasibility. Clear demand, credible structuring, and aligned governance move projects from ambition to financial close.'],
  ['Governance', 'Governance as a growth asset', 'Strong controls and transparent reporting lower risk and unlock capital. Compliance, done well, compounds into institutional value.'],
]
const IF_RECOGNITION = 'Recognised among The Guardian\u2019s 25 Exceptional & Most Value-Adding Female Professionals in Nigeria.'
const IF_VALUES = [
  ['Integrity', 'We uphold the highest ethical standards in every engagement.'],
  ['Excellence', 'We deliver world-class quality and measurable results.'],
  ['Innovation', 'We bring creative, evidence-based, forward-thinking solutions.'],
  ['Collaboration', 'We build partnerships and create shared value.'],
  ['Impact', 'We measure success by the long-term value we create.'],
]
const IF_DIFF = [
  ['Sectoral expertise', 'Deep knowledge across healthcare, finance, real estate, and governance.'],
  ['Data-driven decisions', 'Strategies informed by rigorous analysis and actionable insight.'],
  ['Integrated solutions', 'Multidisciplinary teams brought together for comprehensive results.'],
  ['Global standards, local relevance', 'Global best practice aligned to local realities for maximum impact.'],
  ['Sustainable value', 'Engagements focused on long-term institutional growth.'],
]
const IF_LEADERS = [
  ['Dr. Olamide Okulaja', 'Chairman / CEO', 'A healthcare executive and entrepreneur with over two decades across clinical practice, public health, and healthcare management. As Chief Executive of Genesys Health Information Systems, a pioneering health-technology company, he is improving healthcare delivery across Africa. His work in health-systems reform, policy, and strategic leadership anchors the direction of Imade Forte Holdings.'],
  ['Jennifer Kaja', 'Managing Director', 'A distinguished Nigerian lawyer with first-class honours from the University of Wales and a decade of practice across corporate, commercial, and real-estate law, spanning transactions, joint ventures, public-private partnerships, restructuring, and regulatory compliance. As Chief Legal Officer of Periwinkle Empire, she led legal affairs, governance, and compliance, and was recognised among The Guardian\u2019s 25 Exceptional and Most Value-Adding Female Professionals in Nigeria.'],
]
const IF_LEADER_IMG = ['/site/olamide.webp', '/site/jennifer.webp']
const IF_PRAC_IMG = ['p_strategy', 'p_health', 'p_finance', 'p_governance', 'p_realestate']
const IF_INSIGHT_IMG = ['p_health', 'i_infra', 'globe']
function CountUp({ to, suffix = '', dur = 1300 }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    let raf; const t0 = performance.now()
    const tick = (t) => { const p = Math.min(1, (t - t0) / dur); setN(Math.round(to * (1 - Math.pow(1 - p, 3)))); if (p < 1) raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf)
  }, [to])
  return <>{n}{suffix}</>
}
function initialsOf(name) { return name.replace(/^Dr\.?\s+/i, '').split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase() }
function Colonnade({ className = '' }) {
  const cols = [0, 1, 2, 3, 4]
  return (
    <svg className={className} viewBox="0 0 520 360" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" preserveAspectRatio="xMidYMax meet">
      <g stroke="#B8924A" strokeWidth="1.6" className="if-colo-draw">
        <path d="M40 66 H480" />
        <path d="M28 78 H492" />
        {cols.map((i) => {
          const x = 60 + i * 96
          return (
            <g key={i}>
              <path d={`M${x} 84 v210`} />
              <path d={`M${x + 34} 84 v210`} />
              <path d={`M${x + 8} 90 v198`} opacity="0.5" />
              <path d={`M${x + 17} 90 v198`} opacity="0.5" />
              <path d={`M${x + 26} 90 v198`} opacity="0.5" />
              <path d={`M${x - 6} 84 h46`} />
              <path d={`M${x - 6} 294 h46`} />
            </g>
          )
        })}
        <path d="M22 306 H498" />
        <path d="M10 320 H510" strokeWidth="2.2" />
      </g>
    </svg>
  )
}
function ColMark({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 20 24" fill="none" aria-hidden="true">
      <path d="M3 4 H17 M4 20 H16 M6 6 V18 M10 6 V18 M14 6 V18" stroke="#B8924A" strokeWidth="1.5" />
    </svg>
  )
}

function ContactForm() {
  const [f, setF] = useState({ name: '', email: '', company: '', message: '', botcheck: '' })
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  async function submit() {
    if (f.botcheck) { setSent(true); return } // honeypot: silently drop bots
    if (!f.name.trim() || !f.email.trim() || !f.message.trim()) return
    setBusy(true)
    const key = import.meta.env.VITE_WEB3FORMS_KEY
    if (key) {
      try {
        const r = await fetch('https://api.web3forms.com/submit', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_key: key, subject: 'New enquiry from imadeforteholdings.com', from_name: f.name, email: f.email, message: `Company: ${f.company}\n\n${f.message}`, replyto: f.email }),
        })
        if (r.ok) { setSent(true); setBusy(false); return }
      } catch { /* fall through to mailto */ }
    }
    const body = encodeURIComponent(`Name: ${f.name}\nEmail: ${f.email}\nCompany: ${f.company}\n\n${f.message}`)
    window.location.href = `mailto:info@imadeforteholdings.com?subject=${encodeURIComponent('Enquiry from the website')}&body=${body}`
    setBusy(false); setSent(true)
  }
  if (sent) return <div className="if-form-sent"><b>Thank you.</b><p>Your message is on its way to our team. We will be in touch shortly.</p></div>
  return (
    <div className="if-form">
      <input className="if-hp" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" value={f.botcheck} onChange={set('botcheck')} />
      <div className="if-form-row"><input className="if-input" aria-label="Full name" placeholder="Full name" value={f.name} onChange={set('name')} /><input className="if-input" aria-label="Email address" placeholder="Email address" value={f.email} onChange={set('email')} /></div>
      <input className="if-input" aria-label="Organization" placeholder="Organization (optional)" value={f.company} onChange={set('company')} />
      <textarea className="if-input if-textarea" aria-label="Message" placeholder="How can we help?" value={f.message} onChange={set('message')} rows={4} />
      <button className="if-btn if-btn-gold" disabled={busy || !f.name.trim() || !f.email.trim() || !f.message.trim()} onClick={submit}>{busy ? 'Sending\u2026' : 'Send message'}</button>
    </div>
  )
}

const IF_PAGES = ['home', 'about', 'approach', 'practices', 'sectors', 'engagements', 'advantages', 'insights', 'leadership', 'careers', 'faq', 'contact']
const IF_TAB_LABELS = { home: 'Home', about: 'About', approach: 'Approach', practices: 'Practices', sectors: 'Sectors', engagements: 'Engagements', advantages: 'Advantages', insights: 'Insights', leadership: 'Leadership', careers: 'Careers', faq: 'FAQ', contact: 'Contact' }
function AfricaMark({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 1000 1000" fill="none" aria-hidden="true" preserveAspectRatio="xMidYMid meet">
      <defs>
        <filter id="ifrough" x="-6%" y="-6%" width="112%" height="112%">
          <feTurbulence type="fractalNoise" baseFrequency="0.016" numOctaves="2" seed="7" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="6" />
        </filter>
      </defs>
      <path d="M157 457 L88 409 L62 367 L38 349 L36 329 L24 313 L36 301 L42 280 L42 239 L31 227 L46 189 L86 135 L106 127 L135 103 L132 86 L139 66 L172 45 L186 22 L238 30 L288 10 L355 3 L400 0 L409 2 L409 9 L421 4 L411 49 L479 70 L486 83 L532 98 L546 88 L547 71 L566 62 L668 90 L697 80 L711 89 L743 85 L752 109 L741 132 L727 124 L717 104 L721 120 L762 186 L760 197 L779 213 L787 260 L800 268 L812 297 L868 346 L858 371 L868 385 L930 407 L946 387 L946 359 L976 355 L968 390 L941 444 L913 478 L826 553 L811 582 L805 607 L814 612 L811 635 L829 667 L833 721 L815 749 L786 761 L750 792 L761 824 L759 852 L719 874 L724 881 L714 916 L659 972 L625 988 L581 987 L546 1000 L522 991 L516 969 L520 956 L479 893 L465 824 L431 768 L431 736 L457 684 L457 666 L433 587 L390 533 L404 475 L398 466 L386 451 L350 458 L328 431 L294 432 L241 452 L203 446 L157 457ZM963 739 L959 731 L920 863 L897 872 L878 864 L867 823 L883 796 L877 759 L884 742 L910 736 L929 720 L950 684 L961 705 L963 739Z" fill="none" stroke="#B8924A" strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" filter="url(#ifrough)" />
    </svg>
  )
}

function LandingPage({ onCompass }) {
  const initial = (typeof location !== 'undefined' && IF_PAGES.includes((location.hash || '').replace('#', ''))) ? location.hash.replace('#', '') : 'home'
  const [page, setPage] = useState(initial)
  useEffect(() => {
    const onHash = () => { const h = (location.hash || '').replace('#', ''); if (IF_PAGES.includes(h)) setPage(h) }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  const go = (id) => { setPage(id); try { history.replaceState(null, '', '#' + id) } catch { location.hash = id } }
  const View = { home: HomeView, about: AboutView, approach: ApproachView, practices: PracticesView, sectors: SectorsView, engagements: EngagementsView, advantages: AdvantagesView, insights: InsightsView, leadership: LeadershipView, careers: CareersView, faq: FaqView, contact: ContactView }[page] || HomeView
  return (
    <div className="if">
      <header className="if-top"><div className="if-top-inner">
        <IFBrand onHome={() => go('home')} />
        <nav className="if-nav" role="tablist" aria-label="Sections">
          {IF_PAGES.map((id) => (
            <button key={id} role="tab" aria-selected={page === id} className={`if-tab ${page === id ? 'on' : ''}`} onClick={() => go(id)}>{IF_TAB_LABELS[id]}</button>
          ))}
        </nav>
        <button className="if-compass" onClick={onCompass}>Forte Compass</button>
      </div></header>
      <main className="if-main" role="tabpanel">
        <div key={page} className="if-view"><View go={go} onCompass={onCompass} /></div>
      </main>
      <footer className="if-foot"><div className="if-foot-inner">
        <span>© {new Date().getFullYear()} Imade Forte Holdings Limited</span>
        <span className="if-foot-dot">·</span>
        <span className="if-foot-addr">21 Fatai Arobieke Street, Lekki Phase 1, Lagos</span>
        <button className="if-foot-link" onClick={onCompass}>Staff portal · Forte Compass</button>
      </div></footer>
    </div>
  )
}

function HomeView({ go }) {
  return (
    <div className="if-home">
      <AfricaMark className="if-africa-wm" />
      <div className="if-hero">
        <div className="if-hero-copy">
          <p className="if-eyebrow"><ColMark />Consulting · Advisory · Impact</p>
          <h1>Strategy that strengthens <em>institutions.</em></h1>
          <p className="if-lede">A consulting and advisory firm partnering with organisations, government, and investors to deliver strategic guidance, operational excellence, and measurable impact across the sectors that shape Africa's future.</p>
          <div className="if-cta">
            <button className="if-btn if-btn-gold" onClick={() => go('contact')}>Get in touch</button>
            <button className="if-btn if-btn-ghost" onClick={() => go('practices')}>Our practices</button>
          </div>
        </div>
        <div className="if-frame if-hero-media"><img src="/site/hero_bg.webp" alt="Modern institutional architecture" /></div>
      </div>
      <div className="if-stats">
        <div className="if-stat"><b>2023</b><span>Incorporated in Nigeria</span></div>
        <div className="if-stat"><b><CountUp to={5} /></b><span>Practice areas</span></div>
        <div className="if-stat"><b><CountUp to={20} suffix="+" /></b><span>Years of leadership</span></div>
        <div className="if-stat"><b>Africa</b><span>Reach and ambition</span></div>
      </div>
      <p className="if-partners"><b>Partnering with</b> government institutions · organisations · investors</p>
      <div className="if-marquee"><div className="if-marquee-track">
        {['Strategy', 'Healthcare', 'Finance', 'Governance', 'Real estate', 'Investment', 'Feasibility', 'Public-private partnerships', 'ESG', 'Institutional strengthening', 'Strategy', 'Healthcare', 'Finance', 'Governance', 'Real estate', 'Investment', 'Feasibility', 'Public-private partnerships', 'ESG', 'Institutional strengthening'].map((k, i) => (<span key={i}>{k}</span>))}
      </div></div>
    </div>
  )
}

function AboutView() {
  const glance = [['Company', 'Imade Forte Holdings Limited'], ['Incorporated', '2023 · Nigeria'], ['Sector', 'Consulting & advisory'], ['Practices', 'Strategy · Healthcare · Finance · Governance · Real estate'], ['Clients', 'Organisations, government, investors'], ['Head office', 'Lekki Phase 1, Lagos']]
  return (
    <div className="if-grid2">
      <div className="if-col">
        <p className="if-eyebrow"><ColMark />Who we are</p>
        <h2>A trusted partner to the institutions we serve.</h2>
        <p className="if-mut">Imade Forte Holdings Limited is a specialised consulting and advisory firm, incorporated in 2023 under the laws of the Federal Republic of Nigeria.</p>
        <p className="if-mut">We provide evidence-based advisory across healthcare, finance, real estate, governance, and investment, combining global standards with local insight to create long-term institutional value. Our work is anchored on integrity, innovation, and data-driven insight.</p>
        <div className="if-vm"><span className="if-vm-tag">Vision</span><p>Africa's most trusted and value-driven consulting partner, empowering institutions to operate with excellence and sustainability.</p></div>
        <div className="if-vm"><span className="if-vm-tag">Mission</span><p>Evidence-based consulting and advisory that strengthens institutions, improves systems, and lifts organisational performance.</p></div>
        <a className="if-btn if-btn-ghost" href="/Imade-Forte-Holdings-Company-Profile.pdf" download>Download company profile (PDF)</a>
      </div>
      <div className="if-col">
        <div className="if-frame if-wide"><img src="/site/about.webp" alt="Imade Forte offices" loading="lazy" /></div>
        <dl className="if-card if-glance">
          {glance.map((r) => (<div key={r[0]} className="if-grow"><dt>{r[0]}</dt><dd>{r[1]}</dd></div>))}
        </dl>
        <div className="if-chips">{IF_VALUES.map((v) => <span key={v[0]} className="if-chip" title={v[1]}>{v[0]}</span>)}</div>
      </div>
    </div>
  )
}

function PracticesView({ go }) {
  const [sector, setSector] = useState('All')
  const [pick, setPick] = useState(0)
  const filters = ['All', 'Healthcare', 'Finance', 'Real estate', 'Governance', 'Strategy']
  const visible = IF_SERVICES.map((s, i) => ({ s, i })).filter(({ s }) => sector === 'All' || s[4] === sector)
  const active = visible.some(({ i }) => i === pick) ? pick : (visible[0] ? visible[0].i : 0)
  const s = IF_SERVICES[active]
  return (
    <div className="if-stack">
      <p className="if-eyebrow"><ColMark />What we do</p>
      <h2>Five practices, one standard.</h2>
      <div className="if-chips if-filter">
        {filters.map((f) => (
          <button key={f} className={`if-fchip ${sector === f ? 'on' : ''}`} onClick={() => { setSector(f); const first = IF_SERVICES.findIndex((sv) => f === 'All' || sv[4] === f); if (first >= 0) setPick(first) }}>{f}</button>
        ))}
      </div>
      <div className="if-explorer">
        <ul className="if-plist">
          {visible.map(({ s: sv, i }) => (
            <li key={sv[1]}><button className={i === active ? 'on' : ''} onClick={() => setPick(i)}><span className="if-pdot" /><span>{sv[1]}</span></button></li>
          ))}
        </ul>
        <div className="if-pdetail" key={active}>
          <div className="if-frame"><img src={`/site/${IF_PRAC_IMG[active]}.webp`} alt={s[1]} loading="lazy" /></div>
          <span className="if-tag">{s[4]}</span>
          <h3>{s[1]}</h3>
          <p className="if-mut">{s[2]}</p>
          <ul className="if-points">{s[3].map((pt) => <li key={pt}>{pt}</li>)}</ul>
          <p className="if-focus"><b>In focus.</b> {s[5]}</p>
          <button className="if-btn if-btn-gold" onClick={() => go('contact')}>Discuss this practice</button>
        </div>
      </div>
    </div>
  )
}

function AdvantagesView() {
  return (
    <div className="if-grid2">
      <div className="if-col">
        <p className="if-eyebrow"><ColMark />Why Imade Forte</p>
        <h2>What sets the work apart.</h2>
        <div className="if-diff">
          {IF_DIFF.map((d) => (<div key={d[0]} className="if-diff-item"><b>{d[0]}</b><span>{d[1]}</span></div>))}
        </div>
      </div>
      <aside className="if-commit">
        <div className="if-commit-bg"><img src="/site/globe.webp" alt="" aria-hidden="true" loading="lazy" /></div>
        <p className="if-commit-tag">Our commitment</p>
        <p>More than consultants, we are catalysts for transformation, supporting government initiatives, strengthening institutions, and empowering businesses through insight, innovation, and integrity.</p>
      </aside>
    </div>
  )
}

function InsightsView({ go }) {
  return (
    <div className="if-stack">
      <p className="if-eyebrow"><ColMark />Perspectives</p>
      <h2>Insights from the work.</h2>
      <div className="if-cards3">
        {IF_INSIGHTS.map((it, i) => (
          <article key={it[1]} className="if-icard">
            <div className="if-icard-media"><img src={`/site/${IF_INSIGHT_IMG[i]}.webp`} alt={it[1]} loading="lazy" /></div>
            <div className="if-icard-body"><span className="if-tag">{it[0]}</span><h3>{it[1]}</h3><p>{it[2]}</p></div>
          </article>
        ))}
      </div>
      <div className="if-cta-row"><p>Want our view on a challenge you are facing?</p><button className="if-btn if-btn-gold" onClick={() => go('contact')}>Talk to us</button></div>
    </div>
  )
}

function LeadershipView() {
  return (
    <div className="if-stack">
      <p className="if-eyebrow"><ColMark />Our people</p>
      <h2>Leadership.</h2>
      <div className="if-leaders">
        {IF_LEADERS.map((l, i) => (
          <article key={l[0]} className="if-leader">
            <div className="if-frame"><img src={IF_LEADER_IMG[i]} alt={`Portrait of ${l[0]}`} loading="lazy" /></div>
            <div className="if-lbody">
              <h3>{l[0]}</h3>
              <p className="if-lrole">{l[1]}</p>
              <p className="if-lbio">{l[2]}</p>
              {i === 1 && <p className="if-recog">★ {IF_RECOGNITION}</p>}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

function CareersView({ go, onCompass }) {
  return (
    <div className="if-grid2">
      <div className="if-col">
        <p className="if-eyebrow"><ColMark />Join us</p>
        <h2>Build institutions that last.</h2>
        <p className="if-mut">We are assembling a multidisciplinary team across strategy, healthcare, finance, governance, and real estate, people who pair global standards with local insight and care about measurable impact.</p>
        <p className="if-note">New team members onboard through Forte Compass, our internal performance platform, from day one.</p>
        <div className="if-cta">
          <button className="if-btn if-btn-gold" onClick={() => go('contact')}>Introduce yourself</button>
          <button className="if-btn if-btn-ghost" onClick={onCompass}>Staff portal</button>
        </div>
      </div>
      <div className="if-col">
        <div className="if-frame if-wide"><img src="/site/careers.webp" alt="" aria-hidden="true" loading="lazy" /></div>
        <div className="if-roles">
          {['Strategy & institutions', 'Healthcare systems', 'Finance & investment', 'Governance & compliance', 'Real estate & infrastructure'].map((r) => (
            <div key={r} className="if-role"><ColMark /><span>{r}</span></div>
          ))}
        </div>
      </div>
    </div>
  )
}

const IF_APPROACH = [
  ['Discover', 'We begin by understanding the institution, its context, and the outcome that truly matters before proposing anything.', ['Stakeholder and needs assessment', 'Data and baseline review', 'Problem and opportunity framing']],
  ['Design', 'We shape an evidence-based strategy and a delivery plan built around measurable results.', ['Options and business case', 'Target operating model', 'Roadmap and milestones']],
  ['Deliver', 'We move from plan to execution, managing risk and momentum throughout.', ['Implementation support', 'Governance and controls', 'Progress tracking and reporting']],
  ['Sustain', 'We hand over capability that lasts, not dependence on us.', ['Capacity building and training', 'Monitoring and evaluation', 'Continuous improvement']],
]
const IF_SECTOR_CARDS = [
  ['Healthcare', 'Systems strengthening, management, and financing for providers, investors, and regulators.', 'p_health'],
  ['Government & public sector', 'Policy, institutional reform, and delivery support for public institutions.', 'p_governance'],
  ['Financial services', 'Investment structuring, feasibility, and transaction advisory.', 'p_finance'],
  ['Real estate & infrastructure', 'Feasibility, structuring, and value creation for developers and investors.', 'p_realestate'],
  ['Investment & development finance', 'Bankable projects and partnerships aligned with long-term value.', 'i_infra'],
]

function ApproachView() {
  const [i, setI] = useState(0)
  const s = IF_APPROACH[i]
  return (
    <div className="if-stack">
      <p className="if-eyebrow"><ColMark />How we work</p>
      <h2>A disciplined path from insight to impact.</h2>
      <div className="if-steps">
        <div className="if-steprail">
          {IF_APPROACH.map((st, idx) => (
            <button key={st[0]} className={`if-step ${idx === i ? 'on' : ''}`} onClick={() => setI(idx)}>
              <span className="if-stepnum">{String(idx + 1).padStart(2, '0')}</span>
              <span className="if-steplabel">{st[0]}</span>
            </button>
          ))}
        </div>
        <div className="if-stepdetail" key={i}>
          <span className="if-tag">Step {i + 1} of {IF_APPROACH.length}</span>
          <h3>{s[0]}</h3>
          <p className="if-mut">{s[1]}</p>
          <ul className="if-points">{s[2].map((pt) => <li key={pt}>{pt}</li>)}</ul>
        </div>
      </div>
    </div>
  )
}

function SectorsView({ go }) {
  return (
    <div className="if-stack">
      <p className="if-eyebrow"><ColMark />Where we work</p>
      <h2>Sectors we serve.</h2>
      <div className="if-sectors">
        {IF_SECTOR_CARDS.map((c) => (
          <article key={c[0]} className="if-sector">
            <div className="if-sector-media"><img src={`/site/${c[2]}.webp`} alt={c[0]} loading="lazy" /></div>
            <div className="if-sector-body"><h3>{c[0]}</h3><p>{c[1]}</p></div>
          </article>
        ))}
        <button className="if-sector if-sector-cta" onClick={() => go('contact')}>
          <div className="if-sector-body"><h3>Have a brief for us?</h3><p>Tell us about the institution and the outcome you are working toward.</p><span className="if-sector-arrow">Start a conversation →</span></div>
        </button>
      </div>
    </div>
  )
}

const IF_FAQ = [
  ['What does Imade Forte Holdings do?', 'We are a consulting and advisory firm delivering strategy, healthcare, finance, governance, and real estate advisory, with a strong emphasis on strengthening institutions and health systems.'],
  ['Which sectors do you work in?', 'Healthcare, government and the public sector, financial services, real estate and infrastructure, and investment and development finance.'],
  ['Who do you typically work with?', 'Organisations, government institutions, and investors, from early strategy through to delivery and long-term sustainability.'],
  ['How does an engagement start?', 'It starts with a conversation. We take time to understand the institution and the outcome that matters before proposing an approach.'],
  ['Do you work with government institutions?', 'Yes. A significant part of our work supports government initiatives and public institutions, including feasibility and structuring for major public developments.'],
  ['Where are you based?', 'Our head office is at 21 Fatai Arobieke Street, Off Admiralty Way, Lekki Phase 1, Lagos, Nigeria.'],
  ['How do we get in touch?', 'Email info@imadeforteholdings.com, call +234 805 873 3019, or use the contact form, and we will get back to you.'],
]

function EngagementsView({ go }) {
  const caps = [['Feasibility & investment structuring', 'Bankable studies and structures for major projects.'], ['Health-systems strengthening', 'Strategy, financing, and delivery for health institutions.'], ['Governance & compliance', 'Frameworks, controls, and regulatory readiness.'], ['PPP & infrastructure', 'Public-private structures that reach delivery.']]
  return (
    <div className="if-stack">
      <p className="if-eyebrow"><ColMark />Selected work</p>
      <h2>Engagements, and the work behind them.</h2>
      <div className="if-eng">
        <article className="if-eng-featured">
          <span className="if-tag">Featured · Real estate & infrastructure</span>
          <h3>LASMIIZO feasibility study</h3>
          <p className="if-mut">Imade Forte was engaged in connection with the feasibility study for the Lagos State Medical, Industrial and Innovation Zone (LASMIIZO), working with Lekki Worldwide Investment to help assess viability, commercial structure, and delivery for a landmark public development.</p>
          <ul className="if-points">
            <li>Feasibility and viability assessment</li>
            <li>Commercial and delivery structuring</li>
            <li>Stakeholder and investment alignment</li>
            <li>Public-sector engagement</li>
          </ul>
          <button className="if-btn if-btn-gold" onClick={() => go('contact')}>Discuss a project</button>
        </article>
        <aside className="if-eng-side">
          <p className="if-eyebrow-sm">The kind of work we do</p>
          {caps.map((c) => (<div key={c[0]} className="if-eng-cap"><b>{c[0]}</b><span>{c[1]}</span></div>))}
          <p className="if-note">Some engagements are confidential and are not listed here.</p>
        </aside>
      </div>
    </div>
  )
}

function FaqView({ go }) {
  const [open, setOpen] = useState(0)
  return (
    <div className="if-stack">
      <p className="if-eyebrow"><ColMark />Questions</p>
      <h2>Frequently asked.</h2>
      <div className="if-faq">
        {IF_FAQ.map((f, i) => (
          <div key={i} className={`if-faq-item ${open === i ? 'on' : ''}`}>
            <button className="if-faq-q" aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)}>
              <span>{f[0]}</span><span className="if-faq-mark">{open === i ? '–' : '+'}</span>
            </button>
            <div className="if-faq-a"><p>{f[1]}</p></div>
          </div>
        ))}
      </div>
      <div className="if-cta-row"><p>Still have a question?</p><button className="if-btn if-btn-gold" onClick={() => go('contact')}>Ask us</button></div>
    </div>
  )
}

function ContactView() {
  return (
    <div className="if-grid2">
      <div className="if-col">
        <p className="if-eyebrow"><ColMark />Get in touch</p>
        <h2>Let's shape what's next.</h2>
        <dl className="if-cdetails">
          <div><dt>Registered office</dt><dd>21 Fatai Arobieke Street, Off Admiralty Way, Lekki Phase 1, Lagos</dd></div>
          <div><dt>Email</dt><dd>info@imadeforteholdings.com</dd></div>
          <div><dt>Phone</dt><dd>+234 805 873 3019</dd></div>
          <div><dt>Hours</dt><dd>Monday to Friday, 9AM to 6PM</dd></div>
        </dl>
        <a className="if-btn if-btn-wa" href="https://wa.me/2348058733019" target="_blank" rel="noreferrer">Chat on WhatsApp</a>
      </div>
      <ContactForm />
    </div>
  )
}


/* --------------------------- Compass overview --------------------- */
function Gateway({ tenant, onSignIn, onBackToSite }) {
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
        <div className="fc-top-actions">
          {onBackToSite && <button className="fc-link fc-back-site" onClick={onBackToSite}>← Imade Forte</button>}
          <button className="fc-btn fc-btn-ghost" onClick={onSignIn}>Sign in</button>
        </div>
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
                    <span className="fc-identity-role">{roleLabel(s)} · {s.sub}</span>
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
  const cards = [['staff', 'Staff'], ['lead', 'Subsidiary Lead'], ['md', 'Managing Director'], ['accountant', 'Accountant'], ['hr', 'HR Manager'], ['chairman', 'Chairman'], ['admin', 'Tenant Admin']]
  const corporate = role === 'chairman' || role === 'md' || role === 'admin' || role === 'accountant' || role === 'hr'
  const orgSub = corporate ? 'Corporate' : sub
  return (
    <div className="fc-rolepick">
      <p className="fc-rp-q">Which best describes you?</p>
      <div className="fc-rp-grid">
        {cards.map((c) => (
          <button key={c[0]} className={`fc-rp-card ${role === c[0] ? 'is-on' : ''}`} onClick={() => setRole(c[0])}>{c[1]}</button>
        ))}
      </div>
      <input className="fc-input" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
      {corporate ? (
        <p className="fc-rp-note">Corporate role at the level of the holding company. No company to choose.</p>
      ) : (
        <select className="fc-input" value={sub} onChange={(e) => setSub(e.target.value)}>
          {tenant.subsidiaries.map((s) => <option key={s}>{s}</option>)}
        </select>
      )}
      <button className="fc-btn fc-btn-gold" disabled={!name.trim()}
        onClick={() => onCreate({ id: uid(), name: name.trim(), role, sub: orgSub, tier: role === 'staff' ? 'ops' : 'leadership', band: 'green', score: 0 })}>
        Enter Forte Compass
      </button>
    </div>
  )
}

/* ----------------------------- App shell -------------------------- */
function AppShell({ tenant, me, data, setData, onSwitchTenant, onSignOut, onSwitchWorkspace, viewingAs, onReturnHome }) {
  const [tab, setTab] = useState(me.role === 'chairman' ? 'cockpit' : 'dashboard')
  const [editing, setEditing] = useState(null) // objective being authored
  const [navOpen, setNavOpen] = useState(false)

  const myObjectives = data.objectives.filter((o) => o.owner === me.id)
  const canReview = me.role === 'lead' || me.role === 'md' || me.role === 'hr'
  const canSeeAll = me.role !== 'staff'
  const canAdmin = me.role === 'admin' || me.role === 'md' || me.role === 'hr'
  const canOrg = me.role === 'chairman' || me.role === 'md' || me.role === 'hr' || me.role === 'admin'
  const canPerf = me.role === 'chairman' || me.role === 'md' || me.role === 'hr'
  const canPay = me.role === 'md' || me.role === 'hr' || me.role === 'admin' || me.role === 'accountant'
  const canOnboard = me.role === 'md' || me.role === 'hr' || me.role === 'admin'
  const canCycle = me.role === 'md' || me.role === 'hr' || me.role === 'admin'
  const canDocs = me.role === 'md' || me.role === 'hr' || me.role === 'admin'
  const canExport = me.role === 'chairman' || me.role === 'md' || me.role === 'hr' || me.role === 'admin'

  function addStaff(s) { setData((d) => ({ ...d, staff: [...d.staff, { ...s, onboarding: newChecklist(false) }] })) }
  function updateStaff(id, patch) { setData((d) => ({ ...d, staff: d.staff.map((x) => (x.id === id ? { ...x, ...patch } : x)) })) }
  function removeStaff(id) { setData((d) => ({ ...d, staff: d.staff.filter((x) => x.id !== id), objectives: d.objectives.filter((o) => o.owner !== id) })) }
  function toggleOnboarding(staffId, taskId) { setData((d) => ({ ...d, staff: d.staff.map((s) => (s.id !== staffId ? s : { ...s, onboarding: (s.onboarding || []).map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)) })) })) }
  function rollCycle(newName) {
    setData((d) => {
      const cycles = (d.cycles || []).map((c) => (c.status === 'active' ? { ...c, status: 'closed' } : c))
      cycles.push({ id: uid(), name: newName, status: 'active' })
      const carried = d.objectives.filter((o) => o.status === 'approved').map((o) => ({
        ...o, id: uid(), cycle: newName, status: 'draft', score: undefined,
        krs: (o.krs || []).map((k) => ({ ...k, id: uid(), current: '', confidence: 60, checkins: [] })),
      }))
      return { ...d, cycles, activeCycle: newName, objectives: [...d.objectives, ...carried] }
    })
  }
  function activateCycle(name) {
    setData((d) => ({ ...d, cycles: (d.cycles || []).map((c) => ({ ...c, status: c.name === name ? 'active' : 'closed' })), activeCycle: name }))
  }
  function addDocument(staffId, doc) { setData((d) => ({ ...d, staff: d.staff.map((s) => (s.id === staffId ? { ...s, documents: [doc, ...(s.documents || [])] } : s)) })) }
  function removeDocument(staffId, docId) { setData((d) => ({ ...d, staff: d.staff.map((s) => (s.id === staffId ? { ...s, documents: (s.documents || []).filter((x) => x.id !== docId) } : s)) })) }
  function referToHr(staffId, level) { setData((d) => ({ ...d, hrActions: [...(d.hrActions || []), { id: uid(), staffId, level, raisedBy: me.name, at: new Date().toISOString().slice(0, 10), status: 'open' }] })) }
  function resolveHrAction(id) { setData((d) => ({ ...d, hrActions: (d.hrActions || []).map((a) => (a.id === id ? { ...a, status: 'done' } : a)) })) }
  const activeCycle = data.activeCycle || 'May 2026'

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
      id: uid(), owner: me.id, sub: me.sub, priority: tenant.priorities[0].rank, cycle: activeCycle, status: 'draft',
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
  function saveReview(rev) { setData((d) => ({ ...d, reviews: [...(d.reviews || []), rev] })) }
  function ackReview(id, response) { setData((d) => ({ ...d, reviews: (d.reviews || []).map((r) => (r.id === id ? { ...r, ack: true, response } : r)) })) }
  function giveFeedback(fb) { setData((d) => ({ ...d, feedback: [...(d.feedback || []), fb] })) }
  function requestLeave(req) { setData((d) => ({ ...d, leave: [...(d.leave || []), req] })) }
  function decideLeave(id, status) { setData((d) => ({ ...d, leave: (d.leave || []).map((l) => (l.id === id ? { ...l, status, decidedBy: me.id, decidedAt: new Date().toISOString().slice(0, 10) } : l)) })) }
  function setSalary(id, salary) { setData((d) => ({ ...d, staff: d.staff.map((s) => (s.id === id ? { ...s, salary } : s)) })) }
  const today = () => new Date().toISOString().slice(0, 10)
  function submitPayroll() { setData((d) => ({ ...d, payrollRun: { cycle: d.activeCycle, status: 'submitted', preparedBy: me.name, approvedBy: null, paidBy: null, submittedAt: today() } })) }
  function approvePayroll() { setData((d) => ({ ...d, payrollRun: { ...(d.payrollRun || {}), cycle: d.activeCycle, status: 'approved', approvedBy: me.name, approvedAt: today() } })) }
  function payPayroll() { setData((d) => ({ ...d, payrollRun: { ...(d.payrollRun || {}), cycle: d.activeCycle, status: 'paid', paidBy: me.name, paidAt: today() } })) }

  const tabs = me.role === 'chairman'
    ? [['cockpit', 'Cockpit'], ['organisations', 'Organisations'], ['organogram', 'Organogram'], ['performance', 'Performance'], ['leave', 'Leave'], ['scorecards', 'Scorecards'], ['export', 'Export']]
    : [
        ['dashboard', 'Dashboard'],
        ['objectives', 'My OKRs'],
        ['checkins', 'Check-ins'],
        ['reviews', 'Reviews'],
        ['leave', 'Leave'],
        ['scorecards', 'Scorecards'],
        canReview && ['review', 'Review & approve'],
        canPerf && ['performance', 'Performance'],
        canPay && ['payroll', 'Payroll'],
        canOnboard && ['onboarding', 'Onboarding'],
        canDocs && ['documents', 'Documents'],
        canCycle && ['cycles', 'Cycles'],
        canExport && ['export', 'Export'],
        canSeeAll && ['organisations', 'Organisations'],
        canOrg && ['organogram', 'Organogram'],
        canAdmin && ['admin', 'Roster'],
      ].filter(Boolean)

  const currentLabel = (tabs.find((t) => t[0] === tab) || [null, ''])[1]

  return (
    <div className="fc-app">
      {navOpen && <div className="fc-nav-scrim" onClick={() => setNavOpen(false)} />}
      <aside className={`fc-sidebar ${navOpen ? 'is-open' : ''}`}>
        <div className="fc-sb-brand">
          {tenant.logo && <img className="fc-appbar-logo" src={tenant.logo} alt={tenant.name} />}
          <span className="fc-appbar-word">Forte <em>Compass</em></span>
        </div>
        <nav className="fc-sb-nav">
          {tabs.map((t) => (
            <button key={t[0]} className={`fc-sb-btn ${tab === t[0] ? 'is-on' : ''}`} onClick={() => { setTab(t[0]); setEditing(null); setNavOpen(false) }}>{t[1]}</button>
          ))}
        </nav>
        <div className="fc-sb-foot">
          {me.role === 'admin' && (
            <select className="fc-tenant-switch" value={tenant.id} onChange={(e) => onSwitchTenant(e.target.value)}>
              {Object.values(TENANTS).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          )}
          <span className="fc-sb-tenant">{tenant.name}</span>
          <span className={`fc-mode ${LIVE ? 'is-live' : ''}`}>{LIVE ? '● Live · connected' : '● Demo mode'}</span>
        </div>
      </aside>

      <div className="fc-app-body">
        <header className="fc-topbar">
          <div className="fc-topbar-left">
            <button className="fc-hamburger" onClick={() => setNavOpen((o) => !o)} aria-label="Menu">☰</button>
            <span className="fc-topbar-title">{currentLabel}</span>
          </div>
          <div className="fc-topbar-right">
            <span className="fc-me"><Avatar name={me.name} /><span className="fc-me-body"><b>{me.name}</b><i>{roleLabel(me)}</i></span></span>
            <button className="fc-btn fc-btn-ghost fc-btn-sm" onClick={onSignOut}>Sign out</button>
          </div>
        </header>

        {viewingAs && (
          <div className="fc-viewas">
            <span>Viewing as <b>{me.name}</b> · {roleLabel(me)}</span>
            <button className="fc-btn fc-btn-gold fc-btn-sm" onClick={onReturnHome}>Return to Chairman</button>
          </div>
        )}

        <main className="fc-main">
          {tab === 'dashboard' && <Dashboard tenant={tenant} me={me} data={data} onAuthor={() => { setTab('objectives') }} />}
          {tab === 'cockpit' && <Cockpit tenant={tenant} data={data} me={me} onSwitchWorkspace={onSwitchWorkspace} />}
          {tab === 'objectives' && !editing && (
            <Objectives me={me} objectives={myObjectives} tenant={tenant}
              onNew={() => setEditing({ id: uid(), owner: me.id, sub: me.sub, priority: tenant.priorities[0].rank, cycle: activeCycle, status: 'draft', title: '', description: '', krs: [] })}
              onEdit={(o) => setEditing(o)} onSubmit={(id) => setStatus(id, 'submitted')} onUseSuggestion={useSuggestion} />
          )}
          {tab === 'objectives' && editing && (
            <Author tenant={tenant} me={me} objective={editing} onCancel={() => setEditing(null)}
              onSave={(o) => { upsertObjective(o); setEditing(null) }} />
          )}
          {tab === 'review' && <Review data={data} me={me} onApprove={(id) => setStatus(id, 'approved')} onReturn={(id) => setStatus(id, 'draft')} />}
          {tab === 'scorecards' && <Scorecards data={data} me={me} onAdjust={adjustScore} />}
          {tab === 'checkins' && <CheckIns me={me} objectives={myObjectives} onLog={logCheckin} />}
          {tab === 'organisations' && <Organisations tenant={tenant} data={data} me={me} />}
          {tab === 'organogram' && <Organogram tenant={tenant} data={data} me={me} />}
          {tab === 'reviews' && <Reviews data={data} me={me} cycle={activeCycle} onSaveReview={saveReview} onAckReview={ackReview} onGiveFeedback={giveFeedback} />}
          {tab === 'performance' && <Performance data={data} me={me} onRefer={referToHr} onResolve={resolveHrAction} />}
          {tab === 'leave' && <Leave data={data} me={me} onRequest={requestLeave} onDecide={decideLeave} />}
          {tab === 'payroll' && <Payroll data={data} me={me} onSetSalary={setSalary} onSubmitRun={submitPayroll} onApproveRun={approvePayroll} onPayRun={payPayroll} />}
          {tab === 'onboarding' && <Onboarding data={data} tenant={tenant} onToggle={toggleOnboarding} onAdd={addStaff} />}
          {tab === 'cycles' && <Cycles data={data} onActivate={activateCycle} onRoll={rollCycle} />}
          {tab === 'documents' && <Documents data={data} me={me} onAdd={addDocument} onRemove={removeDocument} />}
          {tab === 'export' && <Exports data={data} tenant={tenant} />}
          {tab === 'admin' && <AdminConsole tenant={tenant} data={data} onAdd={addStaff} onUpdate={updateStaff} onRemove={removeStaff} />}
        </main>
      </div>
    </div>
  )
}

/* ----------------------------- Dashboard -------------------------- */
function Dashboard({ tenant, me, data, onAuthor }) {
  const scored = data.staff.filter((s) => s.role !== 'chairman' && personScore(data, s.id).total > 0).map((s) => ({ s, ...personScore(data, s.id) }))
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
        <p className="fc-muted">{roleLabel(me)} · {me.sub} · {me.tier === 'ops' ? 'Weekly check-ins' : 'Monthly check-ins'}</p>
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
      <MyOnboarding meRec={data.staff.find((s) => s.id === me.id)} />
      <MyDocuments meRec={data.staff.find((s) => s.id === me.id)} />
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
function Author({ tenant, me, objective, onSave, onCancel }) {
  const [obj, setObj] = useState(objective)
  const set = (patch) => setObj((o) => ({ ...o, ...patch }))
  const myOrgs = Array.from(new Set([me.sub, ...(me.also || [])]))

  function addKR() {
    setObj((o) => ({ ...o, krs: [...o.krs, { id: uid(), statement: '', kr_type: null, measure: '', baseline: '', target: '', unit: '', current: '', confidence: 60, due: '2026-05-31', override_reason: null }] }))
  }
  function patchKR(id, patch) {
    setObj((o) => ({ ...o, krs: o.krs.map((k) => (k.id === id ? { ...k, ...patch } : k)) }))
  }
  function removeKR(id) { setObj((o) => ({ ...o, krs: o.krs.filter((k) => k.id !== id) })) }
  function applySugg(s) {
    setObj((o) => ({ ...o, title: s.title, description: s.description, krs: s.krs.map((k) => ({ id: uid(), statement: k.statement, kr_type: 'outcome', measure: k.measure, baseline: k.baseline, target: k.target, unit: k.unit, current: '', confidence: 60, due: '2026-05-31', override_reason: null, _accepted: true })) }))
  }
  const sugg = heuristicSuggest({ sub: obj.sub, existingTitles: [obj.title] }).slice(0, 3)

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
        <label className="fc-field"><span>Organisation</span>
          <select className="fc-input" value={obj.sub} onChange={(e) => { const o = e.target.value; const pr = tenant.priorities.find((p) => p.name === o); set({ sub: o, priority: pr ? pr.rank : obj.priority }) }}>{myOrgs.map((s) => <option key={s}>{s}</option>)}</select></label>
        <label className="fc-field"><span>Strategic priority</span>
          <select className="fc-input" value={obj.priority} onChange={(e) => set({ priority: e.target.value })}>{tenant.priorities.map((p) => <option key={p.rank} value={p.rank}>{p.rank} · {p.name}</option>)}</select></label>
        <label className="fc-field fc-col2"><span>Description</span><input className="fc-input" value={obj.description} placeholder="One line of context" onChange={(e) => set({ description: e.target.value })} /></label>
      </div>

      {!obj.title.trim() && sugg.length > 0 && (
        <div className="fc-author-sugg">
          <span className="fc-muted">Suggested for {obj.sub}:</span>
          {sugg.map((s, i) => <button key={i} className="fc-btn fc-btn-ghost fc-btn-sm" onClick={() => applySugg(s)}>{s.title}</button>)}
        </div>
      )}

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
  const cycles = (data.cycles || []).map((c) => c.name)
  const [cycle, setCycle] = useState(data.activeCycle || (cycles[cycles.length - 1] || 'May 2026'))
  const inScope = data.objectives
    .filter((o) => (o.status === 'approved' || o.status === 'submitted') && canViewScore(me, o) && o.cycle === cycle)
    .sort((a, b) => (a.sub === b.sub ? ownerName(a.owner).localeCompare(ownerName(b.owner)) : a.sub.localeCompare(b.sub)))
  const mine = me.role === 'staff'
  return (
    <div className="fc-scorecards">
      <div className="fc-panel-head">
        <div>
          <h2>Scorecards</h2>
          <p className="fc-muted">{mine ? 'Your objectives, scored against the house rubric.' : 'Auto-scored against the rubric. Adjust any dimension and the change is logged.'}</p>
        </div>
        <div className="fc-sc-controls">
          {cycles.length > 1 && <select className="fc-input fc-cycle-select" value={cycle} onChange={(e) => setCycle(e.target.value)}>{cycles.slice().reverse().map((n) => <option key={n} value={n}>{n}</option>)}</select>}
          <span className="fc-rubric-key">SMART 30 · Alignment 30 · Ambition 20 · Ownership 20</span>
        </div>
      </div>
      {inScope.length === 0 && <p className="fc-empty">No submitted or approved objectives in {cycle}.</p>}
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
            {orgLabel(o)}{o !== 'Group' && <span className="fc-orgtab-count">{data.staff.filter((s) => inOrg(s, o) && s.role !== 'chairman').length}</span>}
          </button>
        ))}
      </nav>
      {active === 'Group' ? <GroupOverview tenant={tenant} data={data} /> : <OrgPanel tenant={tenant} data={data} org={active} me={me} />}
    </div>
  )
}

function GroupOverview({ tenant, data }) {
  const rows = ['Corporate', ...tenant.subsidiaries].map((sub) => {
    const staff = data.staff.filter((s) => inOrg(s, sub) && s.role !== 'chairman')
    const objs = data.objectives.filter((o) => o.sub === sub)
    const avg = orgScore(data, sub) ?? '—'
    return { sub, count: staff.length, ratio: outcomeRatioForOrg(data, sub), avg }
  })
  const people = data.staff.filter((s) => s.role !== 'chairman' && personScore(data, s.id).total > 0).map((s) => ({ s, ...personScore(data, s.id) })).sort((a, b) => b.total - a.total)
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
          <div key={s.id} className="fc-staffcard"><Avatar name={s.name} /><div className="fc-staffcard-body"><b>{s.name}</b><span className="fc-muted">{roleLabel(s)} · {s.sub}</span></div><div className="fc-staffcard-score"><b>{total.toFixed(1)}</b><Band b={band} />{computed && <span className="fc-scored-dot" title="Scored from OKRs">rubric</span>}</div></div>
        ))}
      </div>
    </div>
  )
}

function OrgPanel({ tenant, data, org, me }) {
  const staff = data.staff.filter((s) => inOrg(s, org) && s.role !== 'chairman')
  const objs = data.objectives.filter((o) => o.sub === org)
  const prio = tenant.priorities.find((p) => p.name === org)
  const avg = orgScore(data, org) ?? '—'
  const stalls = stalledIn(objs.filter((o) => o.status === 'approved' || o.status === 'submitted'))
  const ownerName = (id) => (data.staff.find((s) => s.id === id) || {}).name || 'Unknown'
  const mayNudge = me.role === 'md' || me.role === 'hr' || (me.role === 'lead' && me.sub === org)

  return (
    <div className="fc-orgpanel">
      <div className="fc-panel-head"><div><h3 className="fc-orgpanel-h">{legalName(org)}</h3><p className="fc-muted">{org === 'Corporate' ? 'Head office' : 'Subsidiary'} · {prio ? `${prio.rank} priority` : 'support function'}</p></div></div>
      <div className="fc-board-grid fc-dash-metrics">
        <Metric value={staff.length} label="Staff under this organisation" />
        <Metric value={`${outcomeRatioForOrg(data, org)}%`} label="Outcome ratio" />
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
                <div className="fc-org-person"><Avatar name={s.name} /><span><b>{s.name}</b><span className="fc-muted"> · {roleLabel(s)}</span></span></div>
                <div className="fc-obj-row-right">{ps.total > 0 ? <><b className="fc-org-score">{ps.total.toFixed(1)}</b><Band b={ps.band} /></> : <span className="fc-lv fc-lv-pending">New</span>}</div>
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
function Cockpit({ tenant, data, me, onSwitchWorkspace }) {
  const [sel, setSel] = useState(null)
  const [selOrg, setSelOrg] = useState(null)
  const ownerName = (id) => (data.staff.find((s) => s.id === id) || {}).name || 'Unknown'
  const WORKSPACES = [
    { id: 's_jen', label: 'Managing Director' },
    { id: 's_god', label: 'Subsidiary Lead' },
    { id: 's_hr', label: 'HR Manager' },
    { id: 's_sun', label: 'Staff member' },
  ]

  const people = data.staff.filter((s) => s.role !== 'chairman' && personScore(data, s.id).total > 0).map((s) => ({ s, ...personScore(data, s.id), move: movementOf(data, s) }))
  const green = people.filter((p) => p.band === 'green').length
  const amber = people.filter((p) => p.band === 'amber').length
  const red = people.filter((p) => p.band === 'red').length
  const avg = people.length ? r1(people.reduce((a, p) => a + p.total, 0) / people.length) : 0
  const ratio = outcomeRatio(data.objectives)

  const orgs = ['Corporate', ...tenant.subsidiaries].map((org) => {
    const st = people.filter((p) => inOrg(p.s, org))
    const objs = data.objectives.filter((o) => o.sub === org)
    const oavg = orgScore(data, org)
    const omove = st.length ? r1(st.reduce((a, p) => a + p.move, 0) / st.length) : 0
    const prio = tenant.priorities.find((p) => p.name === org)
    return {
      org, count: st.length, ratio: outcomeRatioForOrg(data, org), avg: oavg, band: oavg == null ? null : bandOf(oavg), move: omove,
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
        <div><h2>Chairman's cockpit</h2><p className="fc-muted">Imade Forte Holdings, group oversight. Read only. {data.activeCycle || 'May 2026'}.</p></div>
        <span className="fc-rubric-key">{tenant.name}</span>
      </div>

      {onSwitchWorkspace && (
        <section className="fc-ws">
          <span className="fc-ws-label">Workspaces · step into a role</span>
          <div className="fc-ws-row">
            {WORKSPACES.map((w) => {
              const s = data.staff.find((x) => x.id === w.id)
              if (!s) return null
              return (
                <button key={w.id} className="fc-ws-card" onClick={() => onSwitchWorkspace({ id: s.id, name: s.name, role: s.role, sub: s.sub, tier: s.tier, also: s.also })}>
                  <Avatar name={s.name} />
                  <span className="fc-ws-body"><b>{w.label}</b><span className="fc-muted">{s.name}</span></span>
                </button>
              )
            })}
          </div>
        </section>
      )}

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
        <div className="fc-pd-id"><Avatar name={s.name} /><div><h2>{s.name}</h2><p className="fc-muted">{roleLabel(s)} · {s.sub} · {s.tier === 'ops' ? 'Weekly check-ins' : 'Monthly check-ins'}</p></div></div>
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
  const roleOpts = ['staff', 'lead', 'md', 'hr', 'accountant', 'chairman', 'admin']
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
      <span className="fc-muted">{roleLabel(s)}</span>
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
  const members = data.staff.filter((s) => inOrg(s, org))
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
        <span className="fc-og-pbody"><b>{person.name}</b><span className="fc-muted">{roleLabel(person)}</span></span>
        {reports.length > 0 && <span className="fc-og-count">{reports.length}</span>}
      </button>
      {reports.length > 0 && <div className="fc-og-children">{reports.map((r) => <PersonNode key={r.id} person={r} members={members} onPerson={onPerson} />)}</div>}
    </div>
  )
}

/* --------------------------- Reviews & feedback ------------------- */
function RatingTag({ rating }) {
  const r = RATING[rating] || { label: rating, tone: 'ok' }
  return <span className={`fc-rating fc-rating-${r.tone}`}>{r.label}</span>
}

function Reviews({ data, me, cycle, onSaveReview, onAckReview, onGiveFeedback }) {
  const name = (id) => (data.staff.find((s) => s.id === id) || {}).name || 'Someone'
  const myReviews = reviewsFor(data, me.id)
  const myFeedback = feedbackFor(data, me.id)
  const reports = reportsOf(data, me.id)
  const managerScope = me.role === 'hr' || me.role === 'md' ? data.staff.filter((s) => s.id !== me.id && s.role !== 'chairman') : reports
  const [composeFor, setComposeFor] = useState(null)
  const [fbTo, setFbTo] = useState('')
  const [fbText, setFbText] = useState('')

  return (
    <div className="fc-reviews">
      <div className="fc-panel-head"><div><h2>Reviews and feedback</h2><p className="fc-muted">Your last review, feedback from the team, and the reviews you run.</p></div></div>

      <section className="fc-panel">
        <div className="fc-panel-head"><h3>My reviews</h3>{myReviews[0] && <span className="fc-muted">last: {myReviews[0].cycle}</span>}</div>
        {myReviews.length === 0 && <p className="fc-empty">No reviews on record yet.</p>}
        {myReviews.map((r) => <ReviewCard key={r.id} r={r} reviewer={name(r.reviewerId)} mine onAck={onAckReview} />)}
      </section>

      <section className="fc-panel">
        <div className="fc-panel-head"><h3>Feedback from the team</h3></div>
        {myFeedback.length === 0 && <p className="fc-empty">No feedback yet.</p>}
        {myFeedback.map((f) => <div key={f.id} className="fc-fb"><b>{name(f.fromId)}</b><span className="fc-fb-text">{f.text}</span><span className="fc-muted">{f.createdAt}</span></div>)}
      </section>

      <section className="fc-panel">
        <div className="fc-panel-head"><h3>Give quick feedback</h3></div>
        <div className="fc-fb-form">
          <select className="fc-input" value={fbTo} onChange={(e) => setFbTo(e.target.value)}>
            <option value="">Choose a colleague</option>
            {data.staff.filter((s) => s.id !== me.id && s.role !== 'chairman').map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input className="fc-input" placeholder="A quick note" value={fbText} onChange={(e) => setFbText(e.target.value)} />
          <button className="fc-btn fc-btn-gold fc-btn-sm" disabled={!fbTo || !fbText.trim()}
            onClick={() => { onGiveFeedback({ id: uid(), toId: fbTo, fromId: me.id, text: fbText.trim(), createdAt: new Date().toISOString().slice(0, 10) }); setFbTo(''); setFbText('') }}>Send feedback</button>
        </div>
      </section>

      {managerScope.length > 0 && (
        <section className="fc-panel">
          <div className="fc-panel-head"><h3>My team's reviews</h3><span className="fc-muted">{managerScope.length} people</span></div>
          {managerScope.map((s) => {
            const lr = lastReview(data, s.id)
            return (
              <div key={s.id} className="fc-tr-row">
                <div className="fc-tr-who"><Avatar name={s.name} /><span><b>{s.name}</b><span className="fc-muted"> · {roleLabel(s)} · {s.sub}</span></span></div>
                <div className="fc-tr-right">{lr ? <RatingTag rating={lr.rating} /> : <span className="fc-muted">no review</span>}<button className="fc-btn fc-btn-ghost fc-btn-sm" onClick={() => setComposeFor(s.id)}>New review</button></div>
              </div>
            )
          })}
        </section>
      )}

      {composeFor && <ReviewComposer subject={data.staff.find((s) => s.id === composeFor)} me={me} cycle={cycle} onCancel={() => setComposeFor(null)} onSave={(rev) => { onSaveReview(rev); setComposeFor(null) }} />}
    </div>
  )
}

function ReviewCard({ r, reviewer, mine, onAck }) {
  const [resp, setResp] = useState(r.response || '')
  return (
    <div className="fc-reviewcard">
      <div className="fc-rc-head"><div><b>{r.cycle}</b><span className="fc-muted"> · by {reviewer} · {r.createdAt}</span></div><RatingTag rating={r.rating} /></div>
      <p className="fc-rc-summary">{r.summary}</p>
      <div className="fc-rc-cols">
        <div><span className="fc-rc-k">Strengths</span><p>{r.strengths || '—'}</p></div>
        <div><span className="fc-rc-k">To improve</span><p>{r.improvements || '—'}</p></div>
      </div>
      {mine && (r.ack
        ? <p className="fc-rc-ack">Acknowledged{r.response ? ` · “${r.response}”` : ''}</p>
        : <div className="fc-rc-ackrow"><input className="fc-input" placeholder="Your response (optional)" value={resp} onChange={(e) => setResp(e.target.value)} /><button className="fc-btn fc-btn-gold fc-btn-sm" onClick={() => onAck(r.id, resp)}>Acknowledge</button></div>
      )}
    </div>
  )
}

function ReviewComposer({ subject, me, cycle, onSave, onCancel }) {
  const [rating, setRating] = useState('meets')
  const [summary, setSummary] = useState('')
  const [strengths, setStrengths] = useState('')
  const [improvements, setImprovements] = useState('')
  return (
    <div className="fc-composer">
      <div className="fc-panel-head"><h3>Review session · {subject.name}</h3><button className="fc-icon-btn" onClick={onCancel}>✕</button></div>
      <label className="fc-field"><span>Overall rating</span>
        <select className="fc-input" value={rating} onChange={(e) => setRating(e.target.value)}>{RATING_ORDER.map((k) => <option key={k} value={k}>{RATING[k].label}</option>)}</select></label>
      <label className="fc-field"><span>Summary</span><input className="fc-input" value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Overall assessment this cycle" /></label>
      <label className="fc-field"><span>Strengths</span><input className="fc-input" value={strengths} onChange={(e) => setStrengths(e.target.value)} /></label>
      <label className="fc-field"><span>Areas to improve</span><input className="fc-input" value={improvements} onChange={(e) => setImprovements(e.target.value)} /></label>
      <div className="fc-cta-row fc-composer-foot">
        <button className="fc-btn fc-btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="fc-btn fc-btn-gold" disabled={!summary.trim()}
          onClick={() => onSave({ id: uid(), subjectId: subject.id, reviewerId: me.id, cycle: cycle || 'May 2026', rating, summary: summary.trim(), strengths: strengths.trim(), improvements: improvements.trim(), createdAt: new Date().toISOString().slice(0, 10), ack: false, response: '' })}>Save review</button>
      </div>
    </div>
  )
}

/* ----------------------- Performance intervention ----------------- */
function Performance({ data, me, onRefer, onResolve }) {
  const rank = { terminate: 3, pip: 2, monitor: 1, ok: 0 }
  const rows = data.staff.filter((s) => s.role !== 'chairman' && personScore(data, s.id).total > 0).map((s) => ({ s, ...interventionFor(data, s), ...personScore(data, s.id) }))
    .sort((a, b) => rank[b.level] - rank[a.level] || a.total - b.total)
  const flagged = rows.filter((r) => r.level !== 'ok')
  const count = (lv) => rows.filter((r) => r.level === lv).length
  const actions = data.hrActions || []
  const name = (id) => (data.staff.find((s) => s.id === id) || {}).name || 'Someone'
  const openFor = (id, level) => actions.find((a) => a.staffId === id && a.level === level && a.status === 'open')
  const canRefer = me.role === 'chairman' || me.role === 'md'
  const isHR = me.role === 'hr' || me.role === 'admin'
  return (
    <div className="fc-performance">
      <div className="fc-panel-head"><div><h2>Performance and intervention</h2><p className="fc-muted">Recommendations based on the frequency and severity of low performance. Refer a case and HR picks it up.</p></div></div>
      <div className="fc-board-grid fc-dash-metrics">
        <Metric value={count('terminate')} label="Termination recommended" />
        <Metric value={count('pip')} label="Improvement plan" />
        <Metric value={count('monitor')} label="Monitor" />
        <Metric value={count('ok')} label="On track" />
      </div>
      {flagged.length === 0 && <p className="fc-empty">No one is flagged. Everyone is on track.</p>}
      {flagged.map(({ s, level, frequency, severity, reasons, total, band }) => {
        const referable = level === 'pip' || level === 'terminate'
        const existing = openFor(s.id, level)
        return (
          <div key={s.id} className="fc-perf-row">
            <div className="fc-perf-who"><Avatar name={s.name} /><span><b>{s.name}</b><span className="fc-muted"> · {roleLabel(s)} · {s.sub}</span></span></div>
            <div className="fc-perf-mid"><span className="fc-muted">score {total.toFixed(1)}</span><Band b={band} /><span className="fc-muted">freq {frequency} · sev {severity}</span></div>
            <div className="fc-perf-reasons">{reasons.map((x, i) => <span key={i} className="fc-perf-reason">{x}</span>)}</div>
            <span className="fc-perf-act">
              <span className={`fc-interv fc-interv-${INTERVENTION[level].tone}`}>{INTERVENTION[level].label}</span>
              {referable && (existing
                ? <span className="fc-referred">Sent to HR</span>
                : canRefer && <button className="fc-btn fc-btn-ghost fc-btn-sm" onClick={() => onRefer(s.id, level)}>Refer to HR</button>)}
            </span>
          </div>
        )
      })}
      {(isHR || canRefer) && actions.length > 0 && (
        <section className="fc-panel fc-hractions">
          <div className="fc-panel-head"><h3>HR action queue</h3><span className="fc-muted">{actions.filter((a) => a.status === 'open').length} open</span></div>
          {actions.slice().reverse().map((a) => (
            <div key={a.id} className="fc-hraction-row">
              <span><b>{name(a.staffId)}</b> · {INTERVENTION[a.level].label} · raised by {a.raisedBy} · {a.at}</span>
              <span className="fc-hraction-right">{a.status === 'open'
                ? (isHR ? <button className="fc-btn fc-btn-gold fc-btn-sm" onClick={() => onResolve(a.id)}>Mark actioned</button> : <span className="fc-lv fc-lv-pending">Open</span>)
                : <span className="fc-lv fc-lv-approved">Actioned</span>}</span>
            </div>
          ))}
        </section>
      )}
    </div>
  )
}

/* ------------------------------- Leave ---------------------------- */
function LeaveStatus({ s }) {
  const m = { pending: ['Pending', 'submitted'], approved: ['Approved', 'approved'], declined: ['Declined', 'draft'] }
  const [label, cls] = m[s] || [s, 'draft']
  return <span className={`fc-status fc-status-${cls}`}>{label}</span>
}
function Leave({ data, me, onRequest, onDecide }) {
  const name = (id) => (data.staff.find((s) => s.id === id) || {}).name || 'Someone'
  const bal = leaveBalance(data, me.id)
  const myLeave = (data.leave || []).filter((l) => l.staffId === me.id).sort((a, b) => (a.start < b.start ? 1 : -1))
  const isMD = me.role === 'md'
  const canViewAll = me.role === 'hr' || me.role === 'admin'
  const pending = (data.leave || []).filter((l) => l.status === 'pending')
  const roleOf = (id) => (data.staff.find((s) => s.id === id) || {}).role
  const canApprove = (l) => {
    if (l.staffId === me.id) return false
    return roleOf(l.staffId) === 'md' ? me.role === 'chairman' : ['md', 'hr', 'admin'].includes(me.role)
  }
  const myQueue = pending.filter(canApprove)
  const canApproveAny = ['chairman', 'md', 'hr', 'admin'].includes(me.role)
  const allLeave = (data.leave || []).slice().sort((a, b) => (a.start < b.start ? 1 : -1))
  const [type, setType] = useState('annual')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [reason, setReason] = useState('')
  const reqDays = daysBetween(start, end)
  const requests = me.role !== 'chairman'

  return (
    <div className="fc-leave">
      <div className="fc-panel-head"><div><h2>Leave</h2><p className="fc-muted">{requests ? 'Request time off. The MD approves the team; the Chairman approves the MD.' : 'Approve the Managing Director\u2019s leave here.'}</p></div></div>

      {requests && (
        <div className="fc-board-grid fc-dash-metrics">
          {LEAVE_TYPES.map((t) => (
            <div key={t.key} className="fc-metric"><span className="fc-metric-value">{bal[t.key].left}<span className="fc-metric-unit"> / {bal[t.key].entitlement}</span></span><span className="fc-metric-label">{t.label} days left</span></div>
          ))}
        </div>
      )}

      {requests && (
        <section className="fc-panel">
          <div className="fc-panel-head"><h3>Request leave</h3></div>
          <div className="fc-leave-form">
            <select className="fc-input" value={type} onChange={(e) => setType(e.target.value)}>{LEAVE_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}</select>
            <label className="fc-field"><span>From</span><input className="fc-input" type="date" value={start} onChange={(e) => setStart(e.target.value)} /></label>
            <label className="fc-field"><span>To</span><input className="fc-input" type="date" value={end} onChange={(e) => setEnd(e.target.value)} /></label>
            <input className="fc-input" placeholder="Reason" value={reason} onChange={(e) => setReason(e.target.value)} />
            <button className="fc-btn fc-btn-gold fc-btn-sm" disabled={reqDays < 1}
              onClick={() => { onRequest({ id: uid(), staffId: me.id, type, start, end, days: reqDays, reason: reason.trim(), status: 'pending', decidedBy: null, decidedAt: null, note: '' }); setStart(''); setEnd(''); setReason('') }}>
              Request{reqDays > 0 ? ` · ${reqDays} day${reqDays > 1 ? 's' : ''}` : ''}
            </button>
          </div>
        </section>
      )}

      {canApproveAny && (
        <section className="fc-panel">
          <div className="fc-panel-head"><h3>Awaiting your approval</h3><span className="fc-muted">{myQueue.length}</span></div>
          {myQueue.length === 0 && <p className="fc-empty">Nothing to approve.</p>}
          {myQueue.map((l) => (
            <div key={l.id} className="fc-leave-row">
              <div><b>{name(l.staffId)}</b><span className="fc-muted"> · {leaveLabel(l.type)} · {l.start} to {l.end} · {l.days}d{roleOf(l.staffId) === 'md' ? ' · MD request' : ''}</span><div className="fc-muted">{l.reason}</div></div>
              <div className="fc-leave-actions"><button className="fc-btn fc-btn-ghost fc-btn-sm" onClick={() => onDecide(l.id, 'declined')}>Decline</button><button className="fc-btn fc-btn-gold fc-btn-sm" onClick={() => onDecide(l.id, 'approved')}>Approve</button></div>
            </div>
          ))}
        </section>
      )}

      {requests && (
        <section className="fc-panel">
          <div className="fc-panel-head"><h3>My requests</h3></div>
          {myLeave.length === 0 && <p className="fc-empty">No requests yet.</p>}
          {myLeave.map((l) => (
            <div key={l.id} className="fc-leave-row">
              <div><b>{leaveLabel(l.type)}</b><span className="fc-muted"> · {l.start} to {l.end} · {l.days}d</span><div className="fc-muted">{l.reason}</div></div>
              <LeaveStatus s={l.status} />
            </div>
          ))}
        </section>
      )}

      {canViewAll && (
        <section className="fc-panel">
          <div className="fc-panel-head"><h3>All leave</h3></div>
          {allLeave.map((l) => (
            <div key={l.id} className="fc-leave-row"><div><b>{name(l.staffId)}</b><span className="fc-muted"> · {leaveLabel(l.type)} · {l.start} to {l.end} · {l.days}d</span></div><LeaveStatus s={l.status} /></div>
          ))}
        </section>
      )}
    </div>
  )
}

function buildPayrollXlsx(XLSX, data, opts) {
  const wb = XLSX.utils.book_new()
  const rows = [['Name', 'Organisation', 'Gross', 'Pension', 'NHF', 'PAYE', 'NHIS', 'Levy', 'Net']]
  data.staff.filter((s) => s.role !== 'chairman' && (s.salary || 0) > 0).map((s) => ({ s, pr: payrollFor(s, opts) })).filter((x) => x.pr).sort((a, b) => b.pr.grossM - a.pr.grossM)
    .forEach(({ s, pr }) => rows.push([s.name, s.sub, Math.round(pr.grossM), Math.round(pr.empPensionM), Math.round(pr.nhfM), Math.round(pr.payeM), Math.round(pr.nhisEmpM), Math.round(pr.devLevyM), Math.round(pr.netM)]))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Payroll')
  return wb
}
function Payroll({ data, me, onSetSalary, onSubmitRun, onApproveRun, onPayRun }) {
  const canEdit = me.role === 'md' || me.role === 'hr' || me.role === 'admin'
  const cycle = data.activeCycle || 'May 2026'
  const run = data.payrollRun && data.payrollRun.cycle === cycle ? data.payrollRun : { status: 'draft' }
  const [nhf, setNhf] = useState(true)
  const [nhis, setNhis] = useState(true)
  const opts = { nhf, nhis }
  const rows = data.staff.filter((s) => s.role !== 'chairman' && (s.salary || 0) > 0).map((s) => ({ s, pr: payrollFor(s, opts) })).filter((x) => x.pr).sort((a, b) => b.pr.grossM - a.pr.grossM)
  const tot = rows.reduce((a, { pr }) => ({ gross: a.gross + pr.grossM, paye: a.paye + pr.payeM, ded: a.ded + pr.empPensionM + pr.nhfM + pr.payeM + pr.nhisEmpM + pr.devLevyM, net: a.net + pr.netM }), { gross: 0, paye: 0, ded: 0, net: 0 })
  const [sel, setSel] = useState(null)
  const [edit, setEdit] = useState(null)
  const [val, setVal] = useState('')
  const [dl, setDl] = useState(false)
  const isHR = me.role === 'hr' || me.role === 'admin'
  const isMDr = me.role === 'md'
  const isAcct = me.role === 'accountant'
  const STEPS = { draft: 'Draft — HR to prepare', submitted: 'Submitted to MD for approval', approved: 'Approved — ready for the accountant', paid: 'Paid on the banking platform' }
  async function downloadForBank() {
    setDl(true)
    const XLSX = await import('xlsx')
    const out = XLSX.write(buildPayrollXlsx(XLSX, data, opts), { bookType: 'xlsx', type: 'array' })
    downloadBlob(new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `Forte_Payroll_${cycle.replace(/\s+/g, '_')}.xlsx`)
    setDl(false)
  }

  if (sel) { const s = data.staff.find((x) => x.id === sel); return <Payslip s={s} opts={opts} onBack={() => setSel(null)} /> }

  return (
    <div className="fc-payroll">
      <div className="fc-panel-head"><div><h2>Payroll</h2><p className="fc-muted">Monthly run. Nigerian PAYE, pension, NHF and NHIS under the Tax Act 2025.</p></div>
        <div className="fc-pay-toggles">
          <label className="fc-toggle"><input type="checkbox" checked={nhf} onChange={(e) => setNhf(e.target.checked)} /> NHF</label>
          <label className="fc-toggle"><input type="checkbox" checked={nhis} onChange={(e) => setNhis(e.target.checked)} /> NHIS</label>
        </div>
      </div>

      <div className={`fc-payrun fc-payrun-${run.status}`}>
        <div className="fc-payrun-status"><span className="fc-payrun-dot" /><b>{cycle} payroll</b><span className="fc-muted"> · {STEPS[run.status]}</span>{run.preparedBy ? <span className="fc-muted"> · prepared by {run.preparedBy}</span> : ''}{run.approvedBy ? <span className="fc-muted"> · approved by {run.approvedBy}</span> : ''}{run.paidBy ? <span className="fc-muted"> · paid by {run.paidBy}</span> : ''}</div>
        <div className="fc-payrun-actions">
          {isHR && run.status === 'draft' && <button className="fc-btn fc-btn-gold fc-btn-sm" onClick={onSubmitRun}>Submit to MD</button>}
          {isHR && run.status !== 'draft' && <span className="fc-muted">Sent to MD</span>}
          {isMDr && run.status === 'submitted' && <button className="fc-btn fc-btn-gold fc-btn-sm" onClick={onApproveRun}>Approve payroll</button>}
          {isMDr && run.status === 'approved' && <span className="fc-referred">Approved</span>}
          {isAcct && run.status === 'approved' && <><button className="fc-btn fc-btn-ghost fc-btn-sm" disabled={dl} onClick={downloadForBank}>{dl ? 'Preparing…' : 'Download for bank'}</button><button className="fc-btn fc-btn-gold fc-btn-sm" onClick={onPayRun}>Mark as paid</button></>}
          {isAcct && run.status === 'submitted' && <span className="fc-muted">Awaiting MD approval</span>}
          {isAcct && run.status === 'draft' && <span className="fc-muted">Awaiting HR</span>}
          {run.status === 'paid' && <span className="fc-referred">Paid{run.paidAt ? ` · ${run.paidAt}` : ''}</span>}
        </div>
      </div>

      <div className="fc-board-grid fc-dash-metrics">
        <Metric value={naira(tot.gross)} label="Gross monthly" />
        <Metric value={naira(tot.paye)} label="PAYE monthly" />
        <Metric value={naira(tot.ded)} label="Total deductions" />
        <Metric value={naira(tot.net)} label="Net monthly" />
      </div>
      <div className="fc-paytable">
        <div className="fc-pt-row fc-pt-head"><span>Name</span><span>Gross</span><span>PAYE</span><span>Deductions</span><span>Net</span><span></span></div>
        {rows.map(({ s, pr }) => (
          <div key={s.id} className="fc-pt-row">
            <span className="fc-pt-name">{s.name}<span className="fc-muted"> · {s.sub}</span></span>
            {edit === s.id ? <span><input className="fc-input fc-pt-input" value={val} onChange={(e) => setVal(e.target.value)} /></span> : <span>{naira(pr.grossM)}</span>}
            <span>{naira(pr.payeM)}</span>
            <span>{naira(pr.empPensionM + pr.nhfM + pr.payeM + pr.nhisEmpM + pr.devLevyM)}</span>
            <span><b>{naira(pr.netM)}</b></span>
            <span className="fc-pt-actions">
              {edit === s.id
                ? <button className="fc-btn fc-btn-gold fc-btn-sm" onClick={() => { onSetSalary(s.id, Number(val) || 0); setEdit(null) }}>Save</button>
                : <>{canEdit && <button className="fc-btn fc-btn-ghost fc-btn-sm" onClick={() => { setVal(String(pr.grossM)); setEdit(s.id) }}>Edit</button>}<button className="fc-btn fc-btn-ghost fc-btn-sm" onClick={() => setSel(s.id)}>Payslip</button></>}
            </span>
          </div>
        ))}
      </div>
      <p className="fc-muted fc-pay-note">Structure: basic 50%, housing 25%, transport 15%, other 10%. Pension and NHF reduce taxable income; NHIS (employee 5%) and the ₦4,000 annual development levy are deducted after tax. Estimates: confirm with your accountant and the Nigeria Revenue Service.</p>
    </div>
  )
}
function Payslip({ s, opts = {}, onBack }) {
  const pr = payrollFor(s, opts)
  const Row = ({ k, v, strong }) => <div className={`fc-ps-row ${strong ? 'is-strong' : ''}`}><span>{k}</span><span>{v}</span></div>
  return (
    <div className="fc-payslip">
      <div className="fc-ps-top"><button className="fc-back" onClick={onBack}>← Back to payroll</button><button className="fc-btn fc-btn-ghost fc-btn-sm fc-ps-print-btn" onClick={() => window.print()}>Print / save PDF</button></div>
      <div className="fc-ps-head"><Avatar name={s.name} /><div><h2>{s.name}</h2><p className="fc-muted">{roleLabel(s)} · {s.sub} · monthly payslip · May 2026</p></div></div>
      <div className="fc-ps-grid">
        <section className="fc-panel"><h3>Earnings (monthly)</h3>
          <Row k="Basic" v={naira(pr.basic / 12)} /><Row k="Housing" v={naira(pr.housing / 12)} /><Row k="Transport" v={naira(pr.transport / 12)} /><Row k="Other allowances" v={naira(pr.other / 12)} /><Row k="Gross" v={naira(pr.grossM)} strong />
        </section>
        <section className="fc-panel"><h3>Deductions (monthly)</h3>
          <Row k="Pension (8%)" v={naira(pr.empPensionM)} />{pr.nhfM > 0 && <Row k="NHF (2.5%)" v={naira(pr.nhfM)} />}<Row k="PAYE tax" v={naira(pr.payeM)} />{pr.nhisEmpM > 0 && <Row k="NHIS (5%)" v={naira(pr.nhisEmpM)} />}<Row k="Development levy" v={naira(pr.devLevyM)} /><Row k="Net pay" v={naira(pr.netM)} strong />
        </section>
      </div>
      <section className="fc-panel"><h3>Annual summary</h3>
        <Row k="Gross" v={naira(pr.grossA)} /><Row k="Rent relief" v={naira(pr.rentRelief)} /><Row k="Pension (employee 8%)" v={naira(pr.empPensionA)} /><Row k="Pension (employer 10%)" v={naira(pr.erPensionA)} />{pr.nhfA > 0 && <Row k="NHF (employee 2.5%)" v={naira(pr.nhfA)} />}<Row k="Chargeable income" v={naira(pr.chargeable)} /><Row k="PAYE (annual)" v={naira(pr.payeA)} />{pr.nhisEmpA > 0 && <Row k="NHIS (employee 5%)" v={naira(pr.nhisEmpA)} />}<Row k="Development levy" v={naira(pr.devLevyA)} /><Row k="Net (annual)" v={naira(pr.netA)} strong />
      </section>
      <p className="fc-muted fc-pay-note">Estimate under the Nigeria Tax Act 2025 and the Pension Reform Act. Confirm with your accountant and the Nigeria Revenue Service before remittance.</p>
    </div>
  )
}

/* ---------------------------- Onboarding -------------------------- */
function Onboarding({ data, tenant, onToggle, onAdd }) {
  const people = data.staff.map((s) => ({ s, ...onboardingProgress(s) }))
  const inProg = people.filter((p) => !p.complete)
  const doneCount = people.filter((p) => p.complete).length
  const [open, setOpen] = useState(null)
  const [adding, setAdding] = useState(false)
  const [f, setF] = useState({ name: '', role: 'staff', sub: 'Corporate', title: '' })
  const orgs = ['Corporate', ...tenant.subsidiaries]
  function add() {
    if (!f.name.trim()) return
    onAdd({ id: uid(), name: f.name.trim(), role: f.role, sub: f.sub, title: f.title.trim() || undefined, tier: 'ops', band: 'green', score: 0 })
    setF({ name: '', role: 'staff', sub: 'Corporate', title: '' }); setAdding(false)
  }
  return (
    <div className="fc-onboard">
      <div className="fc-panel-head"><div><h2>Onboarding</h2><p className="fc-muted">New-hire checklists. Tick items as they are completed.</p></div>
        {onAdd && <button className="fc-btn fc-btn-gold fc-btn-sm" onClick={() => setAdding((a) => !a)}>{adding ? 'Close' : '+ Add new hire'}</button>}
      </div>
      {adding && (
        <section className="fc-panel fc-ob-add">
          <div className="fc-ob-addform">
            <input className="fc-input" placeholder="Full name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            <input className="fc-input" placeholder="Title (e.g. Customer Service)" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
            <select className="fc-input" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>{['staff', 'lead', 'hr', 'accountant', 'admin'].map((r) => <option key={r} value={r}>{ROLES[r]}</option>)}</select>
            <select className="fc-input" value={f.sub} onChange={(e) => setF({ ...f, sub: e.target.value })}>{orgs.map((o) => <option key={o} value={o}>{o}</option>)}</select>
            <button className="fc-btn fc-btn-gold" disabled={!f.name.trim()} onClick={add}>Add and start onboarding</button>
          </div>
        </section>
      )}
      <div className="fc-board-grid fc-dash-metrics">
        <Metric value={inProg.length} label="In onboarding" />
        <Metric value={doneCount} label="Fully onboarded" />
      </div>
      {inProg.length === 0 && <p className="fc-empty">Everyone is fully onboarded.</p>}
      {inProg.map(({ s, done, total, pct }) => (
        <section key={s.id} className="fc-panel fc-ob-card">
          <div className="fc-ob-head" onClick={() => setOpen(open === s.id ? null : s.id)}>
            <div className="fc-ob-who"><Avatar name={s.name} /><span><b>{s.name}</b><span className="fc-muted"> · {roleLabel(s)} · {s.sub}</span></span></div>
            <div className="fc-ob-prog"><div className="fc-progress"><div className="fc-progress-fill mid" style={{ width: pct + '%' }} /><span className="fc-progress-pct">{done}/{total}</span></div></div>
          </div>
          {open === s.id && (
            <div className="fc-ob-tasks">
              {(s.onboarding || []).map((t) => (
                <label key={t.id} className="fc-ob-task"><input type="checkbox" checked={t.done} onChange={() => onToggle(s.id, t.id)} /><span className={t.done ? 'is-done' : ''}>{t.label}</span></label>
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  )
}
function MyOnboarding({ meRec }) {
  if (!meRec) return null
  const pr = onboardingProgress(meRec)
  if (pr.complete) return null
  return (
    <section className="fc-panel fc-stallpanel">
      <div className="fc-panel-head"><h3>Your onboarding</h3><span className="fc-muted">{pr.done}/{pr.total} done</span></div>
      <div className="fc-ob-tasks">
        {(meRec.onboarding || []).map((t) => (
          <div key={t.id} className="fc-ob-task"><span className={t.done ? 'is-done' : ''}>{t.done ? '✓' : '○'} {t.label}</span></div>
        ))}
      </div>
    </section>
  )
}

/* --------------------------- Review cycles ------------------------ */
function Cycles({ data, onActivate, onRoll }) {
  const [name, setName] = useState('')
  const cycles = data.cycles || []
  const active = cycles.find((c) => c.status === 'active')
  const objsIn = (n) => data.objectives.filter((o) => o.cycle === n).length
  return (
    <div className="fc-cycles">
      <div className="fc-panel-head"><div><h2>Review cycles</h2><p className="fc-muted">The active cycle drives new objectives and reviews. Closing a cycle keeps its history.</p></div></div>
      <div className="fc-board-grid fc-dash-metrics">
        <Metric value={active ? active.name : '—'} label="Active cycle" />
        <Metric value={cycles.filter((c) => c.status === 'closed').length} label="Closed cycles" />
        <Metric value={active ? objsIn(active.name) : 0} label="Objectives this cycle" />
      </div>
      <section className="fc-panel">
        <div className="fc-panel-head"><h3>Start the next cycle</h3></div>
        <div className="fc-cycle-form">
          <input className="fc-input" placeholder="e.g. June 2026" value={name} onChange={(e) => setName(e.target.value)} />
          <button className="fc-btn fc-btn-gold" disabled={!name.trim()} onClick={() => { onRoll(name.trim()); setName('') }}>Roll to next cycle</button>
        </div>
        <p className="fc-muted fc-cycle-note">Rolling forward closes the current cycle and carries every approved objective into the new one as a draft to refine and resubmit. Scores, reviews and check-ins from the closed cycle stay intact as history.</p>
      </section>
      <section className="fc-panel">
        <div className="fc-panel-head"><h3>All cycles</h3></div>
        {cycles.slice().reverse().map((c) => (
          <div key={c.id} className="fc-cycle-row">
            <span><b>{c.name}</b><span className="fc-muted"> · {objsIn(c.name)} objectives</span></span>
            <span className="fc-cycle-right">
              {c.status === 'active'
                ? <span className="fc-lv fc-lv-approved">Active</span>
                : <><span className="fc-lv fc-lv-declined">Closed</span><button className="fc-btn fc-btn-ghost fc-btn-sm" onClick={() => onActivate(c.name)}>Make active</button></>}
            </span>
          </div>
        ))}
      </section>
    </div>
  )
}

/* ---------------------------- Documents --------------------------- */
function DocLink({ d }) {
  const url = DOC_BLOBS[d.id]
  if (url) return <a className="fc-doc-open" href={url} target="_blank" rel="noreferrer" download={d.name}>Open</a>
  return <span className="fc-muted fc-doc-onfile">on file</span>
}
function Documents({ data, me, onAdd, onRemove }) {
  const people = data.staff.filter((s) => s.role !== 'chairman')
  const [sel, setSel] = useState(people[0] ? people[0].id : null)
  const [cat, setCat] = useState('Contract')
  const person = data.staff.find((s) => s.id === sel)
  const docs = (person && person.documents) || []

  function onFile(e) {
    const f = e.target.files && e.target.files[0]
    if (!f || !sel) return
    const id = uid()
    try { DOC_BLOBS[id] = URL.createObjectURL(f) } catch { /* ignore */ }
    onAdd(sel, { id, name: f.name, category: cat, size: f.size, uploadedAt: new Date().toISOString().slice(0, 10), uploadedBy: me.name })
    e.target.value = ''
  }

  return (
    <div className="fc-docs">
      <div className="fc-panel-head"><div><h2>Documents</h2><p className="fc-muted">Contracts, IDs, certificates and other records, held per person.</p></div></div>
      <div className="fc-docs-layout">
        <aside className="fc-docs-people">
          {people.map((s) => (
            <button key={s.id} className={`fc-docs-person ${sel === s.id ? 'is-on' : ''}`} onClick={() => setSel(s.id)}>
              <Avatar name={s.name} /><span><b>{s.name}</b><span className="fc-muted">{(s.documents || []).length} docs</span></span>
            </button>
          ))}
        </aside>
        <section className="fc-docs-main">
          {person && (
            <>
              <div className="fc-panel-head"><h3>{person.name}</h3><span className="fc-muted">{roleLabel(person)} · {person.sub}</span></div>
              <div className="fc-docs-upload">
                <select className="fc-input" value={cat} onChange={(e) => setCat(e.target.value)}>{DOC_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
                <label className="fc-btn fc-btn-gold fc-btn-sm fc-docs-uploadbtn">Upload document<input type="file" onChange={onFile} hidden /></label>
              </div>
              {docs.length === 0 && <p className="fc-empty">No documents yet.</p>}
              {docs.map((d) => (
                <div key={d.id} className="fc-doc-row">
                  <span className="fc-doc-cat">{d.category}</span>
                  <span className="fc-doc-name">{d.name}</span>
                  <span className="fc-muted fc-doc-meta">{fileSize(d.size)} · {d.uploadedAt} · {d.uploadedBy}</span>
                  <span className="fc-doc-actions"><DocLink d={d} /><button className="fc-icon-btn" title="Remove" onClick={() => { if (confirm('Remove this document?')) onRemove(sel, d.id) }}>✕</button></span>
                </div>
              ))}
            </>
          )}
        </section>
      </div>
    </div>
  )
}
function MyDocuments({ meRec }) {
  const docs = (meRec && meRec.documents) || []
  if (docs.length === 0) return null
  return (
    <section className="fc-panel">
      <div className="fc-panel-head"><h3>My documents</h3><span className="fc-muted">{docs.length}</span></div>
      {docs.map((d) => (
        <div key={d.id} className="fc-doc-row"><span className="fc-doc-cat">{d.category}</span><span className="fc-doc-name">{d.name}</span><span className="fc-muted fc-doc-meta">{d.uploadedAt}</span><span className="fc-doc-actions"><DocLink d={d} /></span></div>
      ))}
    </section>
  )
}

/* ------------------------------ Export ---------------------------- */
function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = name; document.body.appendChild(a); a.click()
  setTimeout(() => { URL.revokeObjectURL(url); a.remove() }, 1500)
}
async function tryLogoDataUrl(src) {
  try {
    const r = await fetch(src); const b = await r.blob()
    return await new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = () => res(null); fr.readAsDataURL(b) })
  } catch { return null }
}
function reviewPackHTML(data, tenant, logo) {
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))
  const cycle = data.activeCycle || 'May 2026'
  const ownerName = (id) => (data.staff.find((s) => s.id === id) || {}).name || 'Unknown'
  const people = data.staff.filter((s) => s.role !== 'chairman' && personScore(data, s.id).total > 0).map((s) => ({ s, ...personScore(data, s.id), move: movementOf(data, s) })).sort((a, b) => b.total - a.total)
  const g = people.filter((p) => p.band === 'green').length, a = people.filter((p) => p.band === 'amber').length, r = people.filter((p) => p.band === 'red').length
  const avg = people.length ? (people.reduce((x, p) => x + p.total, 0) / people.length).toFixed(1) : '—'
  const risks = stalledIn(data.objectives.filter((o) => o.status === 'approved' || o.status === 'submitted'))
  const scRows = people.map((p) => `<tr><td>${esc(p.s.name)}</td><td>${esc(roleLabel(p.s))}</td><td>${esc(p.s.sub)}</td><td class="num">${p.total.toFixed(1)}</td><td><span class="band ${p.band}">${p.band}</span></td></tr>`).join('')
  const sections = people.map((p) => {
    const objs = data.objectives.filter((o) => o.owner === p.s.id && (o.status === 'approved' || o.status === 'submitted'))
    const lr = lastReview(data, p.s.id)
    const objHtml = objs.map((o) => `<div class="obj"><b>${esc(o.title)}</b> <span class="chip">${outcomeRatio([o])}% outcome</span><div class="krs">${(o.krs || []).map((k) => `<div class="kr">${esc(k.statement)}</div>`).join('')}</div></div>`).join('') || '<p class="muted">No approved objectives.</p>'
    const rev = lr ? `<div class="review"><b>${esc((RATING[lr.rating] || {}).label || lr.rating)}</b> <span class="muted">(${esc(lr.cycle)}, by ${esc(ownerName(lr.reviewerId))})</span><p>${esc(lr.summary)}</p><p class="muted">Strengths: ${esc(lr.strengths)}</p><p class="muted">To improve: ${esc(lr.improvements)}</p></div>` : '<p class="muted">No review on record.</p>'
    return `<section class="person"><h3>${esc(p.s.name)} <span class="score">${p.total.toFixed(1)}/10</span></h3><p class="muted">${esc(roleLabel(p.s))} · ${esc(p.s.sub)}</p>${objHtml}<h4>Latest review</h4>${rev}</section>`
  }).join('')
  const riskRows = risks.map(({ obj, k, reason }) => `<tr><td>${esc(reason)}</td><td>${esc(k.statement)}</td><td>${esc(obj.title)}</td><td>${esc(ownerName(obj.owner))}</td></tr>`).join('') || '<tr><td colspan="4" class="muted">No stalled key results.</td></tr>'
  return `<!doctype html><html><head><meta charset="utf-8"><title>Forte Review Pack — ${esc(cycle)}</title><style>
:root{--navy:#0E2240;--gold:#B8924A}*{box-sizing:border-box}body{font-family:Georgia,'Times New Roman',serif;color:#10233f;margin:0}
.cover{background:var(--navy);color:#EDE9E0;padding:80px 60px}.cover img{height:64px;margin-bottom:28px}.cover h1{font-size:40px;margin:6px 0}.sub{color:var(--gold);letter-spacing:2px;text-transform:uppercase;font-size:13px}
.wrap{padding:40px 60px;max-width:900px;margin:0 auto}h2{color:var(--navy);border-bottom:2px solid var(--gold);padding-bottom:6px;margin-top:34px}
table{width:100%;border-collapse:collapse;margin:14px 0}th,td{text-align:left;padding:8px 10px;border-bottom:1px solid #ddd}th{color:var(--navy);border-bottom:2px solid var(--gold)}td.num{text-align:right;font-weight:bold}
.band{padding:2px 8px;border-radius:3px;text-transform:uppercase;font-size:11px;font-weight:bold;color:#fff}.band.green{background:#2f7d5b}.band.amber{background:#b8924a}.band.red{background:#a33}
.metrics{display:flex;gap:20px;margin:14px 0}.metric{background:#f3f0e9;border-radius:6px;padding:12px 16px}.metric b{font-size:24px;color:var(--navy);display:block}
.person{page-break-inside:avoid;margin:20px 0;border-top:1px solid #eee;padding-top:14px}.person .score{color:var(--gold);font-size:17px}
.chip{background:#eef;border:1px solid #ccd;border-radius:10px;padding:1px 8px;font-size:11px}.obj{margin:8px 0}.krs{margin:4px 0 0 14px}.kr{font-size:14px;color:#333}.muted{color:#666}.review p{margin:6px 0}
</style></head><body><div class="cover">${logo ? `<img src="${logo}" alt="">` : ''}<div class="sub">${esc(tenant.name)} · Office of the Chairman</div><h1>OKR Review Pack</h1><div class="sub">${esc(cycle)}</div></div>
<div class="wrap"><h2>Cohort scorecard</h2><div class="metrics"><div class="metric"><b>${avg}</b>Weighted average</div><div class="metric"><b>${g} / ${a} / ${r}</b>Green / Amber / Red</div><div class="metric"><b>${people.length}</b>Staff</div></div>
<table><thead><tr><th>Name</th><th>Role</th><th>Organisation</th><th>Score</th><th>Band</th></tr></thead><tbody>${scRows}</tbody></table>
<h2>Individual coaching</h2>${sections}<h2>Risk register</h2><table><thead><tr><th>Flag</th><th>Key result</th><th>Objective</th><th>Owner</th></tr></thead><tbody>${riskRows}</tbody></table></div></body></html>`
}
function buildTracker(XLSX, data) {
  const wb = XLSX.utils.book_new()
  const people = data.staff.filter((s) => s.role !== 'chairman' && personScore(data, s.id).total > 0).map((s) => ({ s, ...personScore(data, s.id), move: movementOf(data, s) })).sort((a, b) => b.total - a.total)
  const sc = [['Name', 'Role', 'Organisation', 'Score', 'Band', 'Movement vs last cycle']]
  people.forEach((p) => sc.push([p.s.name, roleLabel(p.s), p.s.sub, p.total, p.band, p.move]))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sc), 'Scorecard')
  const kr = [['Owner', 'Objective', 'Key result', 'Type', 'Baseline', 'Target', 'Current', 'Confidence']]
  data.objectives.forEach((o) => (o.krs || []).forEach((k) => {
    const owner = (data.staff.find((s) => s.id === o.owner) || {}).name || ''
    kr.push([owner, o.title, k.statement, k.kr_type || '', k.baseline || '', k.target || '', krLatestVal(k) ?? '', krConf(k)])
  }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(kr), 'Key Results')
  return wb
}
function Exports({ data, tenant }) {
  const [busy, setBusy] = useState('')
  const cyc = (data.activeCycle || 'cycle').replace(/\s+/g, '_')
  async function pack() {
    setBusy('pack')
    const logo = await tryLogoDataUrl(tenant.logo)
    downloadBlob(new Blob([reviewPackHTML(data, tenant, logo)], { type: 'text/html' }), `Forte_Review_Pack_${cyc}.html`)
    setBusy('')
  }
  async function tracker() {
    setBusy('xlsx')
    const XLSX = await import('xlsx')
    const out = XLSX.write(buildTracker(XLSX, data), { bookType: 'xlsx', type: 'array' })
    downloadBlob(new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `Forte_Tracker_${cyc}.xlsx`)
    setBusy('')
  }
  const count = data.staff.filter((s) => s.role !== 'chairman' && personScore(data, s.id).total > 0).length
  return (
    <div className="fc-exports">
      <div className="fc-panel-head"><div><h2>Export</h2><p className="fc-muted">Generate the branded pack and tracker from live {data.activeCycle || ''} data.</p></div></div>
      <div className="fc-export-grid">
        <div className="fc-export-card">
          <h3>Review pack</h3>
          <p className="fc-muted">Branded cover, cohort scorecard, individual coaching and a risk register across all {count} staff. Opens as a document you can print or save as PDF.</p>
          <button className="fc-btn fc-btn-gold" disabled={!!busy} onClick={pack}>{busy === 'pack' ? 'Preparing…' : 'Download review pack'}</button>
        </div>
        <div className="fc-export-card">
          <h3>Tracker (Excel)</h3>
          <p className="fc-muted">A workbook with the cohort scorecard and every key result: baseline, target, current and confidence.</p>
          <button className="fc-btn fc-btn-gold" disabled={!!busy} onClick={tracker}>{busy === 'xlsx' ? 'Preparing…' : 'Download tracker'}</button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------- Root ----------------------------- */
export default function App() {
  const [tenantId, setTenantId] = useState('imade-forte')
  const [screen, setScreen] = useState('gateway') // gateway | auth | profile | app
  const [me, setMe] = useState(null)
  const [authUser, setAuthUser] = useState(null)
  const [chairmanReturn, setChairmanReturn] = useState(null)
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

  // Table mode (opt-in): load objectives from the enforced tables when the user enters,
  // and mirror the user's own objective changes back to the tables. Off unless VITE_USE_TABLES=on.
  const mirrored = useRef({})
  useEffect(() => {
    if (!USE_TABLES || !me || screen !== 'app') return
    let live = true
    fetchObjectives(tenantId).then((objs) => {
      if (!live) return
      objs.forEach((o) => { mirrored.current[o.id] = JSON.stringify(o) })
      setData((d) => ({ ...d, objectives: objs }))
    }).catch(() => { /* keep current objectives on failure */ })
    return () => { live = false }
  }, [me, screen])
  useEffect(() => {
    if (!USE_TABLES || !me) return
    data.objectives.filter((o) => o.owner === me.id).forEach((o) => {
      const sig = JSON.stringify(o)
      if (mirrored.current[o.id] === sig) return
      mirrored.current[o.id] = sig
      upsertObjective(tenantId, me.id, o).catch(() => {})
    })
  }, [data.objectives, me])

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
      try { const c = localStorage.getItem('fc:liveprofile:' + authUser.id); if (live && c) { enterProfile(JSON.parse(c), false); return } } catch { /* ignore */ }
      try {
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle()
        if (live && prof && prof.role) {
          const profile = { id: authUser.id, name: prof.name || authUser.email, role: prof.role, sub: prof.subsidiary || tenant.subsidiaries[0], tier: prof.cadence_tier || 'ops' }
          try { localStorage.setItem('fc:liveprofile:' + authUser.id, JSON.stringify(profile)) } catch { /* ignore */ }
          enterProfile(profile, false)
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
    try { localStorage.setItem('fc:liveprofile:' + authUser.id, JSON.stringify(profile)) } catch { /* ignore */ }
    enterProfile(profile, false)
  }

  async function signOut() {
    if (LIVE) { try { await supabase.auth.signOut() } catch { /* ignore */ } }
    setMe(null); setAuthUser(null); setChairmanReturn(null); setScreen('gateway')
    try { localStorage.removeItem(SKEY(tenantId)) } catch { /* ignore */ }
  }

  function switchWorkspace(profile) {
    setChairmanReturn((prev) => prev || me)
    setMe(profile)
    if (!LIVE) { try { localStorage.setItem(SKEY(tenantId), JSON.stringify(profile)) } catch { /* ignore */ } }
  }
  function returnHome() {
    if (!chairmanReturn) return
    setMe(chairmanReturn)
    if (!LIVE) { try { localStorage.setItem(SKEY(tenantId), JSON.stringify(chairmanReturn)) } catch { /* ignore */ } }
    setChairmanReturn(null)
  }

  return (
    <div className="fc-root">
      <style>{CSS}</style>
      {screen === 'gateway' && <LandingPage onCompass={() => setScreen('compass')} />}
      {screen === 'compass' && <Gateway tenant={tenant} onSignIn={() => setScreen('auth')} onBackToSite={() => setScreen('gateway')} />}
      {screen === 'auth' && <AuthScreen tenant={tenant} staff={data.staff.length ? data.staff : STAFF} onEnter={enter} onBack={() => setScreen('compass')} />}
      {screen === 'profile' && (
        <div className="fc-auth"><div className="fc-auth-card">
          <h2 className="fc-auth-title">Set up your profile</h2>
          <p className="fc-auth-sub">{authUser ? authUser.email : ''}</p>
          <RolePicker tenant={tenant} onCreate={createLiveProfile} />
        </div></div>
      )}
      {screen === 'app' && me && <AppShell tenant={tenant} me={me} data={data} setData={setData} onSwitchTenant={setTenantId} onSignOut={signOut} onSwitchWorkspace={switchWorkspace} viewingAs={!!chairmanReturn} onReturnHome={returnHome} />}
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
.fc-app{min-height:100vh;display:flex}
.fc-sidebar{width:232px;flex:none;position:sticky;top:0;height:100vh;display:flex;flex-direction:column;border-right:1px solid var(--hairline);background:rgba(9,26,51,.5);z-index:40}
.fc-sb-brand{display:flex;align-items:center;gap:.6rem;padding:1.2rem 1.1rem;border-bottom:1px solid var(--hairline)}
.fc-appbar-logo{height:32px;width:auto}
.fc-appbar-word{font-size:.9rem;letter-spacing:.12em;text-transform:uppercase}
.fc-appbar-word em{color:var(--gold);font-style:normal}
.fc-sb-nav{display:flex;flex-direction:column;gap:.15rem;padding:.8rem .6rem;flex:1;overflow-y:auto}
.fc-sb-btn{text-align:left;background:none;border:none;color:var(--muted);cursor:pointer;font-family:inherit;font-size:.95rem;padding:.6rem .8rem;border-radius:5px}
.fc-sb-btn:hover{color:var(--parchment);background:rgba(237,233,224,.04)}
.fc-sb-btn.is-on{color:var(--gold-lit);background:rgba(184,146,74,.12)}
.fc-sb-foot{padding:.9rem .8rem;border-top:1px solid var(--hairline);display:flex;flex-direction:column;gap:.7rem}
.fc-tenant-switch{background:transparent;color:var(--parchment);border:1px solid var(--hairline);border-radius:3px;padding:.35rem .5rem;font-family:inherit;width:100%}
.fc-me{display:flex;align-items:center;gap:.55rem}
.fc-me-body{display:flex;flex-direction:column;line-height:1.15}
.fc-me-body b{font-size:.9rem}
.fc-me-body i{font-size:.75rem;color:var(--muted);font-style:normal}
.fc-app-body{flex:1;min-width:0;display:flex;flex-direction:column}
.fc-topbar{display:flex;align-items:center;justify-content:space-between;gap:.9rem;padding:.7rem clamp(1rem,4vw,2rem);border-bottom:1px solid var(--hairline)}
.fc-topbar-left{display:flex;align-items:center;gap:.8rem}
.fc-topbar-right{display:flex;align-items:center;gap:.9rem}
.fc-hamburger{display:none;background:none;border:1px solid var(--hairline);color:var(--parchment);border-radius:4px;font-size:1.1rem;line-height:1;padding:.3rem .6rem;cursor:pointer}
.fc-topbar-title{font-size:1rem;letter-spacing:.02em}
.fc-sb-tenant{color:var(--muted);font-size:.78rem}
.fc-mode{font-size:.72rem;color:var(--muted)}
.fc-mode.is-live{color:var(--rag-g)}
.fc-nav-scrim{display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:35}
.fc-viewas{display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;padding:.6rem clamp(1rem,4vw,3rem);background:rgba(184,146,74,.12);border-bottom:1px solid var(--gold)}
.fc-viewas span{font-size:.9rem}
.fc-main{flex:1;padding:clamp(1.5rem,4vw,3rem) clamp(1rem,4vw,3rem);max-width:1180px;margin:0 auto;width:100%}
.fc-ws{margin:0 0 1.4rem}
.fc-ws-label{font-size:.78rem;text-transform:uppercase;letter-spacing:.08em;color:var(--gold-lit)}
.fc-ws-row{display:flex;gap:.7rem;flex-wrap:wrap;margin-top:.6rem}
.fc-ws-card{display:flex;align-items:center;gap:.6rem;border:1px solid var(--hairline);border-radius:6px;padding:.55rem .8rem;background:rgba(9,26,51,.4);color:var(--parchment);cursor:pointer;font-family:inherit;text-align:left}
.fc-ws-card:hover{border-color:var(--gold)}
.fc-ws-body{display:flex;flex-direction:column;line-height:1.2}
.fc-ws-body .fc-muted{font-size:.78rem}
.fc-rp-note{font-size:.85rem;color:var(--muted);border:1px dashed var(--hairline);border-radius:4px;padding:.6rem .7rem;margin:0}

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
.fc-author-sugg{display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;margin:.2rem 0 1rem}

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

/* reviews & feedback */
.fc-reviews .fc-panel{margin-bottom:1.1rem}
.fc-rating{font-size:.72rem;text-transform:uppercase;letter-spacing:.06em;padding:.16rem .5rem;border-radius:2px;font-weight:600;flex:none}
.fc-rating-good{background:var(--rag-g);color:var(--navy-deep)}
.fc-rating-ok{background:rgba(147,160,180,.25);color:var(--parchment)}
.fc-rating-warn{color:var(--rag-a);border:1px solid var(--rag-a)}
.fc-rating-bad{color:var(--rag-r);border:1px solid var(--rag-r)}
.fc-reviewcard{border:1px solid var(--hairline);border-radius:6px;padding:1rem;margin-top:.7rem;background:rgba(9,26,51,.35)}
.fc-rc-head{display:flex;align-items:center;justify-content:space-between;gap:1rem}
.fc-rc-summary{margin:.6rem 0}
.fc-rc-cols{display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-top:.4rem}
.fc-rc-k{font-size:.72rem;text-transform:uppercase;letter-spacing:.06em;color:var(--gold-lit)}
.fc-rc-cols p{margin:.2rem 0 0}
.fc-rc-ack{margin:.8rem 0 0;color:var(--rag-g);font-size:.88rem}
.fc-rc-ackrow{display:flex;gap:.6rem;margin-top:.8rem}
.fc-fb{display:flex;align-items:baseline;gap:.7rem;padding:.55rem 0;border-top:1px solid var(--hairline);flex-wrap:wrap}
.fc-fb b{flex:none}
.fc-fb-text{flex:1;min-width:180px}
.fc-fb-form{display:grid;grid-template-columns:1.2fr 2fr auto;gap:.6rem;align-items:center}
.fc-tr-row{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:.6rem 0;border-top:1px solid var(--hairline)}
.fc-tr-who{display:flex;align-items:center;gap:.6rem}
.fc-tr-right{display:flex;align-items:center;gap:.7rem}
.fc-composer{border:1px solid var(--gold);border-radius:8px;padding:1.2rem;margin-top:1rem;background:rgba(184,146,74,.05);display:flex;flex-direction:column;gap:.7rem}
.fc-composer-foot{justify-content:flex-end}

/* performance / intervention */
.fc-perf-row{display:grid;grid-template-columns:1.6fr 1.3fr 2fr auto;gap:.8rem;align-items:center;padding:.8rem 0;border-top:1px solid var(--hairline)}
.fc-perf-who{display:flex;align-items:center;gap:.6rem}
.fc-perf-mid{display:flex;align-items:center;gap:.6rem;flex-wrap:wrap}
.fc-perf-reasons{display:flex;flex-wrap:wrap;gap:.3rem}
.fc-perf-reason{font-size:.72rem;color:var(--muted);border:1px solid var(--hairline);border-radius:2px;padding:.08rem .4rem}
.fc-interv{font-size:.74rem;font-weight:600;padding:.2rem .55rem;border-radius:2px;text-align:center;flex:none}
.fc-interv-good{color:var(--rag-g);border:1px solid var(--rag-g)}
.fc-interv-ok{color:var(--muted);border:1px solid var(--hairline)}
.fc-interv-warn{color:var(--rag-a);border:1px solid var(--rag-a)}
.fc-interv-bad{background:var(--rag-r);color:var(--parchment)}
.fc-perf-act{display:flex;flex-direction:column;align-items:flex-end;gap:.4rem}
.fc-referred{font-size:.74rem;color:var(--rag-g)}
.fc-hractions{margin-top:1.2rem}
.fc-hraction-row{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:.55rem 0;border-top:1px solid var(--hairline);flex-wrap:wrap}
.fc-hraction-right{display:flex;align-items:center;gap:.5rem}

/* leave */
.fc-leave-form{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:.7rem;align-items:end}
.fc-leave-form .fc-col2{grid-column:1/5}
.fc-leave-form .fc-btn{grid-column:1/5;justify-self:start}
.fc-leave-row{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:.6rem 0;border-top:1px solid var(--hairline);flex-wrap:wrap}
.fc-leave-actions{display:flex;gap:.5rem}
.fc-lv{font-size:.72rem;text-transform:uppercase;letter-spacing:.06em;padding:.16rem .5rem;border-radius:2px;font-weight:600}
.fc-lv-pending{color:var(--gold-lit);border:1px solid var(--gold)}
.fc-lv-approved{color:var(--rag-g);border:1px solid var(--rag-g)}
.fc-lv-declined{color:var(--rag-r);border:1px solid var(--rag-r)}

/* payroll */
.fc-paytable{border:1px solid var(--hairline);border-radius:6px;overflow-x:auto}
.fc-pt-row{display:grid;grid-template-columns:2fr 1.1fr 1fr 1fr 1.1fr 150px;gap:.6rem;align-items:center;padding:.6rem .9rem}
.fc-pt-row+.fc-pt-row{border-top:1px solid var(--hairline)}
.fc-pt-head{background:rgba(184,146,74,.08);color:var(--gold-lit);font-size:.72rem;text-transform:uppercase;letter-spacing:.06em}
.fc-pt-name{font-weight:600}
.fc-pt-name .fc-muted{font-weight:400}
.fc-pt-input{padding:.35rem .5rem;max-width:130px}
.fc-pt-actions{display:flex;gap:.4rem;justify-content:flex-end}
.fc-pay-note{font-size:.8rem;color:var(--muted);margin-top:.9rem}
.fc-payrun{display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;border:1px solid var(--hairline);border-left:3px solid var(--gold);border-radius:6px;padding:.7rem 1rem;margin-bottom:1rem;background:rgba(9,26,51,.35)}
.fc-payrun-status{display:flex;align-items:center;gap:.4rem;flex-wrap:wrap}
.fc-payrun-dot{width:8px;height:8px;border-radius:50%;background:var(--gold);flex:none}
.fc-payrun-approved{border-left-color:var(--rag-g)}.fc-payrun-approved .fc-payrun-dot{background:var(--rag-g)}
.fc-payrun-paid{border-left-color:var(--rag-g)}.fc-payrun-paid .fc-payrun-dot{background:var(--rag-g)}
.fc-payrun-submitted .fc-payrun-dot{background:var(--rag-a)}
.fc-payrun-actions{display:flex;align-items:center;gap:.5rem;flex-wrap:wrap}
.fc-payslip .fc-ps-head{display:flex;align-items:center;gap:.8rem;margin:.6rem 0 1.3rem}
.fc-payslip .fc-ps-head h2{margin:0}
.fc-ps-grid{display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem}
.fc-ps-row{display:flex;align-items:center;justify-content:space-between;padding:.4rem 0;border-top:1px solid var(--hairline);font-size:.92rem}
.fc-ps-row.is-strong{font-weight:700;color:var(--gold-lit);border-top:1px solid var(--gold)}
.fc-pay-toggles{display:flex;gap:1rem}
.fc-toggle{display:flex;align-items:center;gap:.4rem;font-size:.85rem;color:var(--muted)}
.fc-toggle input{width:15px;height:15px;accent-color:var(--gold)}
.fc-ps-top{display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:.4rem}

@media print {
  .fc-sidebar, .fc-topbar, .fc-viewas, .fc-nav-scrim, .fc-back, .fc-ps-print-btn { display: none !important; }
  .fc-app, .fc-app-body, .fc-main { display: block !important; height: auto !important; }
  .fc-main { max-width: none !important; padding: 0 !important; }
  body, .fc-root { background: #fff !important; }
  .fc-payslip, .fc-payslip * { color: #10233f !important; }
  .fc-payslip .fc-panel { border: 1px solid #d8d2c4 !important; background: #fff !important; }
  .fc-payslip .fc-muted { color: #5a6472 !important; }
  .fc-ps-row.is-strong { color: #0e2240 !important; border-top: 1px solid #b8924a !important; }
  .fc-avatar { background: #0e2240 !important; color: #fff !important; }
}

/* onboarding */
.fc-ob-card{padding:0}
.fc-ob-head{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:1rem 1.2rem;cursor:pointer;flex-wrap:wrap}
.fc-ob-who{display:flex;align-items:center;gap:.6rem}
.fc-ob-prog{min-width:130px}
.fc-ob-tasks{display:flex;flex-direction:column;gap:.5rem;padding:0 1.2rem 1.1rem}
.fc-ob-task{display:flex;align-items:center;gap:.6rem;font-size:.92rem}
.fc-ob-task input{width:16px;height:16px;accent-color:var(--gold)}
.fc-ob-task .is-done{color:var(--muted);text-decoration:line-through}
.fc-ob-addform{display:flex;gap:.6rem;flex-wrap:wrap;align-items:center}
.fc-ob-addform .fc-input{flex:1;min-width:150px}

/* cycles */
.fc-cycle-form{display:flex;gap:.6rem;align-items:center;flex-wrap:wrap}
.fc-cycle-form .fc-input{max-width:220px}
.fc-cycle-note{margin-top:.8rem}
.fc-cycle-row{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:.6rem 0;border-top:1px solid var(--hairline)}
.fc-cycle-right{display:flex;align-items:center;gap:.6rem}
.fc-sc-controls{display:flex;align-items:center;gap:.8rem;flex-wrap:wrap}
.fc-cycle-select{max-width:150px;padding:.35rem .5rem}

/* documents */
.fc-docs-layout{display:grid;grid-template-columns:240px 1fr;gap:1.2rem}
.fc-docs-people{display:flex;flex-direction:column;gap:.3rem;border:1px solid var(--hairline);border-radius:6px;padding:.5rem;max-height:520px;overflow-y:auto}
.fc-docs-person{display:flex;align-items:center;gap:.55rem;background:none;border:none;color:var(--parchment);cursor:pointer;font-family:inherit;text-align:left;padding:.45rem .5rem;border-radius:5px}
.fc-docs-person span{display:flex;flex-direction:column;line-height:1.2}
.fc-docs-person .fc-muted{font-size:.75rem}
.fc-docs-person:hover{background:rgba(237,233,224,.04)}
.fc-docs-person.is-on{background:rgba(184,146,74,.12)}
.fc-docs-main{border:1px solid var(--hairline);border-radius:6px;padding:1rem 1.2rem}
.fc-docs-upload{display:flex;gap:.6rem;align-items:center;margin:.4rem 0 1rem}
.fc-docs-upload .fc-input{max-width:170px}
.fc-docs-uploadbtn{cursor:pointer}
.fc-doc-row{display:grid;grid-template-columns:auto 1.6fr 1.4fr auto;gap:.7rem;align-items:center;padding:.55rem 0;border-top:1px solid var(--hairline)}
.fc-doc-cat{font-size:.7rem;text-transform:uppercase;letter-spacing:.05em;color:var(--gold-lit);border:1px solid var(--gold);border-radius:2px;padding:.08rem .4rem;justify-self:start}
.fc-doc-name{font-weight:600}
.fc-doc-meta{font-size:.8rem}
.fc-doc-actions{display:flex;align-items:center;gap:.5rem;justify-content:flex-end}
.fc-doc-open{color:var(--gold-lit);text-decoration:underline;font-size:.85rem}
.fc-doc-onfile{font-size:.85rem}

/* export */
.fc-export-grid{display:grid;grid-template-columns:1fr 1fr;gap:1.1rem;margin-top:.5rem}
.fc-export-card{border:1px solid var(--hairline);border-radius:8px;padding:1.4rem;background:rgba(9,26,51,.4);display:flex;flex-direction:column;gap:.7rem}
.fc-export-card h3{margin:0}
.fc-export-card .fc-btn{margin-top:auto;align-self:flex-start}

/* ===== Imade Forte corporate site ===== */
/* ===================== Imade Forte site ===================== */
.if{--nv:#0E2240;--nv2:#0A1830;--gold:#B8924A;--gold2:#E2C888;--parch:#F4F0E7;--line:rgba(184,146,74,.22);--wrap:min(1800px,94vw);--sans:ui-sans-serif,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;min-height:100vh;display:flex;flex-direction:column;position:relative;overflow-x:hidden;background:radial-gradient(130% 90% at 82% -12%,#173763 0%,#0E2240 46%,#091628 100%);color:#E8ECF3;font-family:'Lora',Georgia,serif;line-height:1.62;-webkit-font-smoothing:antialiased}
.if *{box-sizing:border-box}
.if h1,.if h2,.if h3{font-family:'Lora',Georgia,serif;font-weight:600;letter-spacing:-.015em;color:#fff;margin:0}
.if p{margin:0}
.if-mut{color:#B4BFCE}
.if-top{position:sticky;top:0;z-index:40;background:rgba(9,20,38,.72);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid var(--line)}
.if-top-inner{width:100%;padding:0 clamp(1.25rem,2vw,2.25rem);height:64px;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:1rem}
.if-brand{justify-self:start;background:none;border:none;cursor:pointer;padding:0;display:flex;align-items:center}
.if-logo{height:38px;width:auto;display:block}
.if-nav{justify-self:center;display:flex;align-items:center;gap:.1rem;max-width:100%;overflow-x:auto;scrollbar-width:none}
.if-nav::-webkit-scrollbar{display:none}
.if-tab{position:relative;flex:none;background:none;border:none;color:#B7C2D1;cursor:pointer;font-family:var(--sans);font-size:.85rem;letter-spacing:.01em;padding:.5rem .8rem;border-radius:6px;transition:color .18s}
.if-tab:hover{color:#fff}
.if-tab.on{color:#fff}
.if-tab.on::after{content:'';position:absolute;left:.8rem;right:.8rem;bottom:.34rem;height:2px;background:var(--gold);border-radius:2px;animation:if-uline .3s ease}
@keyframes if-uline{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.if-compass{justify-self:end;flex:none;background:none;border:1px solid var(--gold);color:var(--gold2);cursor:pointer;font-family:var(--sans);font-size:.82rem;padding:.5rem 1.05rem;border-radius:6px;white-space:nowrap;transition:.18s}
.if-compass:hover{background:var(--gold);color:var(--nv)}
.if-main{flex:1;display:flex;flex-direction:column}
.if-view{min-height:calc(100vh - 116px);width:var(--wrap);margin:0 auto;padding:clamp(2rem,5vh,4rem) 0;display:flex;flex-direction:column;justify-content:center;animation:if-in .5s ease}
@keyframes if-in{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.if-stack{display:flex;flex-direction:column}
.if-eyebrow{font-family:var(--sans);font-size:.72rem;letter-spacing:.26em;text-transform:uppercase;color:var(--gold2);margin-bottom:1rem;display:flex;align-items:center;gap:.5rem}
.if-eyebrow svg{width:15px;height:19px}
.if-view h2{font-size:clamp(1.8rem,3.4vw,2.6rem);line-height:1.12;margin-bottom:1.2rem}
.if-cta{display:flex;gap:.8rem;flex-wrap:wrap}
.if-btn{font-family:var(--sans);cursor:pointer;font-size:.86rem;letter-spacing:.01em;padding:.82rem 1.5rem;border-radius:6px;border:1px solid transparent;transition:transform .16s,background .16s,border-color .16s,color .16s;text-decoration:none;display:inline-block}
.if-btn:hover{transform:translateY(-2px)}
.if-btn-gold{background:var(--gold);color:var(--nv);border-color:var(--gold);font-weight:600}
.if-btn-gold:hover{background:var(--gold2);border-color:var(--gold2)}
.if-btn-ghost{background:none;color:#E8ECF3;border-color:rgba(232,236,243,.34)}
.if-btn-ghost:hover{border-color:var(--gold2);color:var(--gold2)}
.if-btn-wa{background:none;border-color:#25D366;color:#5fe39a}
.if-btn-wa:hover{background:#25D366;color:#04231a}
.if-frame{position:relative;border-radius:10px;overflow:hidden;border:1px solid var(--line);box-shadow:0 24px 50px rgba(0,0,0,.34);background:#0b1a30}
.if-frame img{width:100%;height:100%;object-fit:cover;display:block}
.if-wide{aspect-ratio:16/9}
.if-tag{align-self:flex-start;font-family:var(--sans);font-size:.62rem;letter-spacing:.16em;text-transform:uppercase;color:var(--gold2);border:1px solid rgba(184,146,74,.4);border-radius:4px;padding:.2rem .55rem}
.if-grid2{display:grid;grid-template-columns:1.1fr .9fr;gap:clamp(2rem,5vw,4rem);align-items:start}
.if-grid2.if-stretch{align-items:stretch}
.if-col{display:flex;flex-direction:column;gap:1.1rem}
.if-chips{display:flex;flex-wrap:wrap;gap:.5rem}
.if-chip{font-family:var(--sans);font-size:.78rem;color:var(--gold2);border:1px solid rgba(184,146,74,.4);border-radius:20px;padding:.34rem .85rem}
.if-home{position:relative;display:flex;flex-direction:column;gap:clamp(1.6rem,3.5vh,2.6rem)}
.if-hero,.if-stats,.if-partners{position:relative;z-index:1}
.if-africa-wm{position:absolute;left:50%;top:50%;transform:translate(-50%,-52%);height:132%;width:auto;opacity:.09;z-index:0;pointer-events:none}
.if-hero{display:grid;grid-template-columns:1.05fr .95fr;gap:clamp(2rem,5vw,4rem);align-items:center}
.if-hero h1{font-size:clamp(2.6rem,5.4vw,4.3rem);line-height:1.04;margin-bottom:1.3rem}
.if-hero h1 em{font-style:italic;color:var(--gold2)}
.if-lede{max-width:34rem;font-size:1.08rem;color:#C4CDDC;margin-bottom:1.9rem}
.if-hero-media{aspect-ratio:4/3}
.if-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;border-top:1px solid var(--line);padding-top:1.5rem}
.if-stat{text-align:center}
.if-stat b{display:block;font-size:clamp(1.9rem,3vw,2.7rem);color:var(--gold2);line-height:1}
.if-stat span{font-family:var(--sans);font-size:.7rem;letter-spacing:.1em;text-transform:uppercase;color:#93A0B3;margin-top:.5rem;display:block}
.if-partners{font-family:var(--sans);font-size:.82rem;color:#9AA7B9;text-align:center}
.if-partners b{color:var(--gold);font-weight:600;letter-spacing:.16em;text-transform:uppercase;font-size:.68rem;margin-right:.55rem}
.if-vm{border-left:2px solid var(--gold);padding:.1rem 0 .1rem 1.1rem}
.if-vm-tag{display:block;font-family:var(--sans);font-size:.66rem;letter-spacing:.2em;text-transform:uppercase;color:var(--gold);margin-bottom:.3rem}
.if-vm p{color:#D2DAE6;font-size:.98rem}
.if-glance{padding:.2rem 1.2rem;margin:0}
.if-grow{display:grid;grid-template-columns:.8fr 1.2fr;gap:.8rem;padding:.7rem 0;border-bottom:1px solid rgba(232,236,243,.09)}
.if-grow:last-child{border-bottom:none}
.if-grow dt{font-family:var(--sans);font-size:.66rem;letter-spacing:.13em;text-transform:uppercase;color:var(--gold);font-weight:600;margin:0}
.if-grow dd{margin:0;color:#D2DAE6;font-size:.9rem}
.if-filter{margin-bottom:1.4rem}
.if-fchip{font-family:var(--sans);font-size:.76rem;color:#B7C2D1;background:none;border:1px solid rgba(184,146,74,.34);border-radius:20px;padding:.32rem .85rem;cursor:pointer;transition:.16s}
.if-fchip:hover{color:#fff;border-color:var(--gold)}
.if-fchip.on{background:var(--gold);color:var(--nv);border-color:var(--gold);font-weight:600}
.if-explorer{display:grid;grid-template-columns:.82fr 1.18fr;gap:clamp(1.5rem,4vw,3rem);align-items:start}
.if-plist{list-style:none;margin:0;padding:0;border-top:1px solid var(--line)}
.if-plist button{width:100%;display:flex;align-items:center;gap:.7rem;background:none;border:none;border-bottom:1px solid rgba(232,236,243,.08);color:#B7C2D1;cursor:pointer;font-family:'Lora',serif;font-size:1.06rem;text-align:left;padding:.95rem .3rem;transition:.16s}
.if-plist button:hover{color:#fff;padding-left:.7rem}
.if-plist button.on{color:var(--gold2)}
.if-pdot{width:7px;height:7px;border-radius:50%;background:rgba(184,146,74,.4);flex:none;transition:.16s}
.if-plist button.on .if-pdot{background:var(--gold);box-shadow:0 0 0 4px rgba(184,146,74,.16)}
.if-pdetail{display:flex;flex-direction:column;gap:.8rem;animation:if-in .35s ease}
.if-pdetail .if-frame{height:clamp(140px,20vh,220px)}
.if-pdetail h3{color:#fff;font-size:1.4rem}
.if-points{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:.25rem 1rem}
.if-points li{font-family:var(--sans);font-size:.82rem;color:#C7D0DC;padding:.28rem 0 .28rem .95rem;position:relative}
.if-points li::before{content:'';position:absolute;left:0;top:.62rem;width:5px;height:5px;background:var(--gold);border-radius:1px}
.if-focus{color:#C4CDDC;font-size:.9rem;border-left:2px solid var(--gold);padding-left:.9rem}
.if-focus b{color:var(--gold2)}
.if-pdetail .if-btn{align-self:flex-start;margin-top:.2rem}
.if-diff{display:grid;grid-template-columns:1fr 1fr;gap:.1rem 2rem}
.if-diff-item{padding:.95rem 0;border-top:1px solid rgba(232,236,243,.12)}
.if-diff-item b{display:block;color:#fff;margin-bottom:.2rem}
.if-diff-item span{color:#B4BFCE;font-size:.9rem}
.if-commit{position:relative;overflow:hidden;border-radius:10px;border:1px solid var(--line);padding:1.8rem;display:flex;flex-direction:column;justify-content:center}
.if-commit-bg{position:absolute;inset:0;z-index:0}
.if-commit-bg img{width:100%;height:100%;object-fit:cover;opacity:.14}
.if-commit-tag{position:relative;z-index:1;font-family:var(--sans);font-size:.66rem;letter-spacing:.2em;text-transform:uppercase;color:var(--gold2);margin-bottom:.9rem}
.if-commit p:not(.if-commit-tag){position:relative;z-index:1;color:#D8DFEA;font-size:1.05rem}
.if-cards3{display:grid;grid-template-columns:repeat(3,1fr);gap:1.3rem;align-items:start}
.if-icard{display:flex;flex-direction:column;background:rgba(255,255,255,.035);border:1px solid var(--line);border-radius:10px;overflow:hidden;transition:transform .2s,border-color .2s}
.if-icard:hover{transform:translateY(-4px);border-color:var(--gold)}
.if-icard-media{aspect-ratio:16/9;overflow:hidden}
.if-icard-media img{width:100%;height:100%;object-fit:cover;display:block}
.if-icard-body{padding:1.2rem;display:flex;flex-direction:column;gap:.55rem}
.if-icard h3{color:#fff;font-size:1.12rem}
.if-icard p{color:#B4BFCE;font-size:.88rem}
.if-cta-row{display:flex;align-items:center;justify-content:space-between;gap:1.5rem;flex-wrap:wrap;margin-top:1.6rem;padding-top:1.4rem;border-top:1px solid var(--line)}
.if-cta-row p{color:#C4CDDC}
.if-leaders{display:grid;grid-template-columns:1fr 1fr;gap:1.6rem}
.if-leader{display:grid;grid-template-columns:170px 1fr;gap:1.4rem;background:rgba(255,255,255,.035);border:1px solid var(--line);border-radius:10px;padding:1.5rem;align-items:start}
.if-leader .if-frame{width:170px;aspect-ratio:4/5}
.if-leader h3{color:#fff;font-size:1.2rem;margin-bottom:.15rem}
.if-lrole{font-family:var(--sans);font-size:.68rem;letter-spacing:.14em;text-transform:uppercase;color:var(--gold);margin-bottom:.7rem}
.if-lbio{color:#B4BFCE;font-size:.86rem}
.if-recog{margin-top:.8rem;color:var(--gold2);font-size:.82rem;font-style:italic;border-top:1px solid var(--line);padding-top:.65rem}
.if-roles{display:flex;flex-direction:column;margin-top:.3rem}
.if-role{display:flex;align-items:center;gap:.7rem;padding:.7rem 0;border-bottom:1px solid rgba(232,236,243,.1);color:#D2DAE6;font-size:.95rem}
.if-role svg{width:15px;height:19px;flex:none}
.if-note{color:#B4BFCE;font-size:.92rem}
.if-cdetails{display:flex;flex-direction:column;margin:1.2rem 0}
.if-cdetails>div{padding:.75rem 0;border-top:1px solid var(--line)}
.if-cdetails dt{font-family:var(--sans);font-size:.66rem;letter-spacing:.14em;text-transform:uppercase;color:var(--gold);margin-bottom:.2rem}
.if-cdetails dd{margin:0;color:#D8DFEA}
.if-form{align-self:start;width:100%;max-width:560px;background:var(--parch);border-radius:10px;padding:1.7rem;display:flex;flex-direction:column;gap:.85rem}
.if-form-row{display:flex;gap:.8rem}
.if-input{width:100%;font-family:var(--sans);font-size:.92rem;padding:.8rem .9rem;border:1px solid #cdc6b6;border-radius:6px;background:#fff;color:#1D2733}
.if-input:focus{outline:none;border-color:var(--gold);box-shadow:0 0 0 3px rgba(184,146,74,.16)}
.if-textarea{resize:vertical;min-height:120px}
.if-form .if-btn-gold{align-self:flex-start}
.if-hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}
.if-form-sent{background:var(--parch);border-radius:10px;padding:2rem;color:#1D2733}
.if-form-sent b{color:var(--nv);font-size:1.2rem}
.if-form-sent p{color:#556;margin-top:.4rem}
.if-foot{border-top:1px solid var(--line);font-family:var(--sans);font-size:.74rem;color:#8A97AA;background:rgba(9,20,38,.5)}
.if-foot-inner{width:var(--wrap);margin:0 auto;height:52px;display:flex;align-items:center;gap:.7rem}
.if-foot-dot{opacity:.5}
.if-foot-link{margin-left:auto;background:none;border:1px solid rgba(184,146,74,.5);color:var(--gold2);padding:.4rem .9rem;border-radius:6px;cursor:pointer;font-family:var(--sans);font-size:.74rem;white-space:nowrap}
.if-foot-link:hover{background:var(--gold);color:var(--nv)}
/* ---- motion + interactive parts ---- */
.if::before{content:'';position:fixed;top:-18%;right:-8%;width:58vw;height:58vw;background:radial-gradient(circle,rgba(184,146,74,.10),transparent 62%);pointer-events:none;z-index:0;animation:if-drift 20s ease-in-out infinite alternate}
@keyframes if-drift{to{transform:translate(-7%,9%) scale(1.14)}}
.if-main{position:relative;z-index:1}
.if-hero-media{animation:if-float 7s ease-in-out infinite}
@keyframes if-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
.if-leader,.if-sector{transition:transform .2s,border-color .2s,box-shadow .2s}
.if-leader:hover,.if-sector:hover{transform:translateY(-4px);border-color:var(--gold);box-shadow:0 18px 40px rgba(0,0,0,.3)}
.if-marquee{margin-top:.3rem;overflow:hidden;border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:.8rem 0;-webkit-mask:linear-gradient(90deg,transparent,#000 7%,#000 93%,transparent);mask:linear-gradient(90deg,transparent,#000 7%,#000 93%,transparent)}
.if-marquee-track{display:flex;gap:2.7rem;width:max-content;animation:if-marq 36s linear infinite}
.if-marquee:hover .if-marquee-track{animation-play-state:paused}
.if-marquee-track span{font-family:var(--sans);font-size:.76rem;letter-spacing:.2em;text-transform:uppercase;color:#93A0B3;white-space:nowrap;position:relative}
.if-marquee-track span::after{content:'';position:absolute;right:-1.4rem;top:50%;width:4px;height:4px;border-radius:50%;background:var(--gold);transform:translateY(-50%);opacity:.55}
@keyframes if-marq{to{transform:translateX(-50%)}}
.if-steps{display:grid;grid-template-columns:.85fr 1.65fr;gap:clamp(1.5rem,4vw,3.5rem);align-items:start;margin-top:.4rem}
.if-steprail{display:flex;flex-direction:column;gap:.55rem}
.if-step{display:flex;align-items:center;gap:1rem;text-align:left;background:rgba(255,255,255,.02);border:1px solid var(--line);border-radius:10px;padding:.95rem 1.2rem;cursor:pointer;color:#B7C2D1;transition:.18s;font-family:var(--sans)}
.if-step:hover{color:#fff;border-color:rgba(184,146,74,.5)}
.if-step.on{background:rgba(184,146,74,.1);border-color:var(--gold);color:#fff}
.if-stepnum{font-family:'Lora',serif;font-size:1.5rem;color:var(--gold2);line-height:1}
.if-steplabel{font-size:.98rem;letter-spacing:.02em}
.if-stepdetail{background:rgba(255,255,255,.035);border:1px solid var(--line);border-radius:12px;padding:1.9rem;display:flex;flex-direction:column;gap:.7rem;animation:if-in .35s ease}
.if-stepdetail h3{color:#fff;font-size:1.6rem}
.if-sectors{display:grid;grid-template-columns:repeat(3,1fr);gap:1.3rem}
.if-sector{display:flex;flex-direction:column;text-align:left;background:rgba(255,255,255,.035);border:1px solid var(--line);border-radius:12px;overflow:hidden;padding:0}
.if-sector-media{aspect-ratio:16/10;overflow:hidden}
.if-sector-media img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .45s ease}
.if-sector:hover .if-sector-media img{transform:scale(1.06)}
.if-sector-body{padding:1.2rem;display:flex;flex-direction:column;gap:.45rem}
.if-sector-body h3{color:#fff;font-size:1.12rem}
.if-sector-body p{color:#B4BFCE;font-size:.88rem}
.if-sector-cta{background:linear-gradient(135deg,rgba(184,146,74,.18),rgba(184,146,74,.04));cursor:pointer;justify-content:center}
.if-sector-cta .if-sector-body{padding:1.7rem}
.if-sector-arrow{margin-top:.4rem;font-family:var(--sans);font-size:.84rem;color:var(--gold2);font-weight:600}
.if-eyebrow-sm{font-family:var(--sans);font-size:.66rem;letter-spacing:.2em;text-transform:uppercase;color:var(--gold);margin-bottom:.8rem}
.if-eng{display:grid;grid-template-columns:1.45fr .55fr;gap:clamp(1.5rem,4vw,3rem);align-items:start}
.if-eng-featured{background:rgba(255,255,255,.035);border:1px solid var(--line);border-radius:12px;padding:1.9rem;display:flex;flex-direction:column;gap:.85rem}
.if-eng-featured h3{color:#fff;font-size:1.7rem}
.if-eng-featured .if-btn{align-self:flex-start;margin-top:.3rem}
.if-eng-side{display:flex;flex-direction:column;gap:1rem}
.if-eng-cap{border-left:2px solid var(--gold);padding-left:1rem}
.if-eng-cap b{display:block;color:#fff;margin-bottom:.15rem;font-size:.98rem}
.if-eng-cap span{color:#B4BFCE;font-size:.86rem}
.if-eng-side .if-note{color:#8A97AA;font-size:.82rem;font-style:italic}
.if-faq{display:flex;flex-direction:column;gap:.7rem;max-width:940px;margin:0 auto;width:100%}
.if-faq-item{border:1px solid var(--line);border-radius:10px;background:rgba(255,255,255,.025);overflow:hidden;transition:border-color .2s}
.if-faq-item.on{border-color:var(--gold)}
.if-faq-q{width:100%;display:flex;align-items:center;justify-content:space-between;gap:1rem;background:none;border:none;cursor:pointer;color:#fff;font-family:'Lora',serif;font-size:1.08rem;text-align:left;padding:1.1rem 1.3rem}
.if-faq-mark{font-family:var(--sans);color:var(--gold2);font-size:1.35rem;line-height:1;flex:none}
.if-faq-a{max-height:0;overflow:hidden;transition:max-height .3s ease}
.if-faq-item.on .if-faq-a{max-height:400px}
.if-faq-a p{color:#B4BFCE;font-size:.92rem;padding:0 1.3rem 1.2rem}
.if a:focus-visible,.if button:focus-visible,.if input:focus-visible,.if textarea:focus-visible{outline:2px solid var(--gold2);outline-offset:2px;border-radius:4px}
@media (prefers-reduced-motion:reduce){.if-view,.if-pdetail,.if-tab.on::after,.if::before,.if-hero-media,.if-marquee-track,.if-stepdetail{animation:none!important}.if *{transition:none!important}}
@media(max-width:900px){
  .if-top-inner{grid-template-columns:auto 1fr auto;gap:.5rem;width:92vw}
  .if-view,.if-foot-inner{width:92vw}
  .if-africa-wm{opacity:.05;right:-25%}
  .if-hero,.if-grid2,.if-explorer,.if-leaders,.if-diff,.if-cards3,.if-points,.if-steps,.if-sectors,.if-eng{grid-template-columns:1fr}
  .if-stats{grid-template-columns:1fr 1fr;gap:1.2rem 0}
  .if-form-row{flex-direction:column}
  .if-view{min-height:auto;justify-content:flex-start}
  .if-logo{height:32px}
  .if-foot-addr{display:none}
}
@media(max-width:560px){.if-leader{grid-template-columns:1fr}.if-leader .if-frame{width:150px}.if-cards3{gap:1rem}}
`
