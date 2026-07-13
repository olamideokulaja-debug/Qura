import { supabase, MODE } from './supabaseClient.js'

/* ---------- helpers ---------- */
export function haversine(a, b) {
  if (!a || !b) return Infinity
  const R = 6371, toRad = d => d * Math.PI / 180
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng)
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

// Nearest-neighbour ordering of facilities that have coordinates.
export function orderRoute(list) {
  const pts = list.filter(f => typeof f.lat === 'number' && typeof f.lng === 'number')
  if (pts.length <= 2) return pts
  const remaining = pts.slice()
  const route = [remaining.shift()]
  while (remaining.length) {
    const last = route[route.length - 1]
    let bi = 0, bd = Infinity
    remaining.forEach((f, i) => { const d = haversine(last, f); if (d < bd) { bd = d; bi = i } })
    route.push(remaining.splice(bi, 1)[0])
  }
  return route
}

export function googleMapsDirUrl(ordered) {
  const pts = ordered.filter(f => typeof f.lat === 'number' && typeof f.lng === 'number')
  if (!pts.length) return ''
  const path = pts.map(f => f.lat + ',' + f.lng).join('/')
  return 'https://www.google.com/maps/dir/' + path
}

/* ---------- CSV ---------- */
export function parseCSV(text) {
  const rows = []; let field = '', row = [], inQ = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQ) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++ } else inQ = false }
      else field += c
    } else {
      if (c === '"') inQ = true
      else if (c === ',') { row.push(field); field = '' }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = '' }
      else if (c === '\r') { /* skip */ }
      else field += c
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row) }
  return rows.filter(r => r.some(x => x && x.trim() !== ''))
}

function pick(obj, keys) { for (const k of keys) { if (obj[k] !== undefined && obj[k] !== '') return obj[k] } return '' }

export function facilitiesFromCSV(text) {
  const rows = parseCSV(text)
  if (rows.length < 2) return []
  const headers = rows[0].map(h => h.trim().toLowerCase())
  return rows.slice(1).map(r => {
    const o = {}; headers.forEach((h, i) => { o[h] = (r[i] || '').trim() })
    const lat = parseFloat(pick(o, ['lat', 'latitude']))
    const lng = parseFloat(pick(o, ['lng', 'lon', 'long', 'longitude']))
    return {
      name: pick(o, ['name', 'facility', 'facility name']) || 'Unnamed facility',
      category: pick(o, ['category', 'licensed category', 'type']),
      area: pick(o, ['area', 'lga', 'location']) || 'Unassigned',
      address: pick(o, ['address']),
      last_visit: pick(o, ['last_visit', 'previous', 'previous monitoring date', 'last visit']),
      lat: isNaN(lat) ? null : lat,
      lng: isNaN(lng) ? null : lng
    }
  })
}

/* ---------- optional geocode (OpenStreetMap Nominatim, best-effort, no key) ---------- */
export async function geocode(address) {
  const q = encodeURIComponent(address + ', Lagos, Nigeria')
  const res = await fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + q, { headers: { 'Accept': 'application/json' } })
  const j = await res.json()
  if (j && j[0]) return { lat: parseFloat(j[0].lat), lng: parseFloat(j[0].lon) }
  return null
}

/* ---------- facilities store (Supabase or demo/localStorage) ---------- */
const LS_FAC = 'realms_facilities'
const LS_ASG = 'realms_assignments'
function lsGet(k) { try { return JSON.parse(localStorage.getItem(k) || '[]') } catch (e) { return [] } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)) } catch (e) { /* ignore */ } }
function uid() { return 'loc_' + Math.random().toString(36).slice(2, 10) }

function nullEmpty(v) { return (v === '' || v === undefined) ? null : v }
function cleanRow(obj) { const o = { ...obj }; Object.keys(o).forEach(k => { if (o[k] === '') o[k] = null }); return o }

export const facilities = {
  async list() {
    if (MODE === 'supabase') {
      const { data, error } = await supabase.from('facilities').select('*').order('area', { ascending: true })
      if (error) throw error
      return data || []
    }
    return lsGet(LS_FAC)
  },
  async addMany(items, userId) {
    if (MODE === 'supabase') {
      const rows = items.map(f => ({ ...cleanRow(f), created_by: userId || null }))
      const { data, error } = await supabase.from('facilities').insert(rows).select()
      if (error) throw error
      return data || []
    }
    const cur = lsGet(LS_FAC); const added = items.map(f => ({ ...f, id: uid() }))
    lsSet(LS_FAC, cur.concat(added)); return added
  },
  async remove(id) {
    if (MODE === 'supabase') { const { error } = await supabase.from('facilities').delete().eq('id', id); if (error) throw error; return }
    lsSet(LS_FAC, lsGet(LS_FAC).filter(f => f.id !== id))
  },
  async update(id, patch) {
    if (MODE === 'supabase') { const { error } = await supabase.from('facilities').update(cleanRow(patch)).eq('id', id); if (error) throw error; return }
    lsSet(LS_FAC, lsGet(LS_FAC).map(f => f.id === id ? { ...f, ...patch } : f))
  }
}

export const assignments = {
  async list() {
    if (MODE === 'supabase') {
      const { data, error } = await supabase.from('assignments').select('*').order('visit_date', { ascending: true })
      if (error) throw error
      return data || []
    }
    return lsGet(LS_ASG)
  },
  async add(a, userId) {
    if (MODE === 'supabase') {
      const { data, error } = await supabase.from('assignments').insert([{ ...cleanRow(a), created_by: userId || null }]).select()
      if (error) throw error
      return (data && data[0]) || a
    }
    const cur = lsGet(LS_ASG); const rec = { ...a, id: uid(), created_at: new Date().toISOString() }
    lsSet(LS_ASG, cur.concat([rec])); return rec
  }
}

/* ---------- visits (Engage, Stage 4) ---------- */
const LS_VIS = 'realms_visits'
export const visits = {
  async list() {
    if (MODE === 'supabase') {
      const { data, error } = await supabase.from('visits').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    }
    return lsGet(LS_VIS)
  },
  async add(v, userId) {
    if (MODE === 'supabase') {
      const { data, error } = await supabase.from('visits').insert([{ ...cleanRow(v), created_by: userId || null }]).select()
      if (error) throw error
      return (data && data[0]) || v
    }
    const cur = lsGet(LS_VIS); const rec = { ...v, id: uid(), created_at: new Date().toISOString() }
    lsSet(LS_VIS, [rec].concat(cur)); return rec
  },
  async update(id, patch) {
    if (MODE === 'supabase') { const { error } = await supabase.from('visits').update(cleanRow(patch)).eq('id', id); if (error) throw error; return }
    lsSet(LS_VIS, lsGet(LS_VIS).map(v => v.id === id ? { ...v, ...patch } : v))
  }
}

/* ---------- notifications + call logs (customer service follow-ups) ---------- */
const LS_NOTIF = 'realms_notifications'
export const notifications = {
  async list() {
    if (MODE === 'supabase') { const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }); if (error) throw error; return data || [] }
    return lsGet(LS_NOTIF)
  },
  async add(n, userId) {
    if (MODE === 'supabase') { const { data, error } = await supabase.from('notifications').insert([{ ...cleanRow(n), created_by: userId || null }]).select(); if (error) throw error; return (data && data[0]) || n }
    const cur = lsGet(LS_NOTIF); const rec = { ...n, id: uid(), created_at: new Date().toISOString() }; lsSet(LS_NOTIF, [rec].concat(cur)); return rec
  }
}
const LS_CALL = 'realms_calls'
export const calls = {
  async list() {
    if (MODE === 'supabase') { const { data, error } = await supabase.from('calls').select('*').order('created_at', { ascending: false }); if (error) throw error; return data || [] }
    return lsGet(LS_CALL)
  },
  async add(c, userId) {
    if (MODE === 'supabase') { const { data, error } = await supabase.from('calls').insert([{ ...cleanRow(c), created_by: userId || null }]).select(); if (error) throw error; return (data && data[0]) || c }
    const cur = lsGet(LS_CALL); const rec = { ...c, id: uid(), created_at: new Date().toISOString() }; lsSet(LS_CALL, [rec].concat(cur)); return rec
  }
}

/* ---------- evidence storage (Supabase Storage; falls back to inline data URL) ---------- */
function dataUrlToBlob(dataUrl) {
  const parts = dataUrl.split(','); const meta = parts[0] || ''; const b64 = parts[1] || ''
  const mime = (meta.match(/:(.*?);/) || [])[1] || 'application/octet-stream'
  const bin = atob(b64); const arr = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
  return new Blob([arr], { type: mime })
}
export async function uploadEvidence(visitId, type, dataUrl) {
  if (MODE !== 'supabase' || !supabase) return dataUrl
  try {
    const blob = dataUrlToBlob(dataUrl)
    const ext = type === 'voice' ? 'webm' : 'jpg'
    const path = (visitId || 'v') + '/' + Date.now() + '_' + Math.random().toString(36).slice(2, 8) + '.' + ext
    const { error } = await supabase.storage.from('evidence').upload(path, blob, { contentType: blob.type, upsert: false })
    if (error) throw error
    const { data } = supabase.storage.from('evidence').getPublicUrl(path)
    return (data && data.publicUrl) || dataUrl
  } catch (e) { return dataUrl }
}

/* ---------- notifications (posts to the /api/notify serverless function) ---------- */
export async function sendNotify(payload) {
  try {
    const res = await fetch('/api/notify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const j = await res.json().catch(() => ({ ok: false, reason: 'bad_response' }))
    if (!res.ok) return { ok: false, reason: j.reason || ('http_' + res.status) }
    return j
  } catch (e) { return { ok: false, reason: 'network' } }
}

/* ---------- sample/demo data (for previewing the app) ---------- */
const SAMPLE_FACILITIES = [
  { name: 'Iyana-Ipaja Primary Health Centre', category: 'Primary health centre', area: 'Iyana-Ipaja', address: 'Iyana-Ipaja', lat: 6.6139, lng: 3.2560, last_visit: '' },
  { name: 'Command Road Medical Centre', category: 'Medical centre', area: 'Iyana-Ipaja', address: 'Command Road', lat: 6.6300, lng: 3.2700, last_visit: '' },
  { name: 'Ifako-Ijaiye General Hospital', category: 'General hospital', area: 'Ifako-Ijaiye', address: 'Ifako-Ijaiye', lat: 6.6700, lng: 3.3200, last_visit: '' },
  { name: 'Ojokoro Health Centre', category: 'Primary health centre', area: 'Ifako-Ijaiye', address: 'Ojokoro', lat: 6.6600, lng: 3.3100, last_visit: '' },
  { name: 'Ikeja General Hospital', category: 'General hospital', area: 'Ikeja', address: 'Oba Akinjobi Way', lat: 6.6018, lng: 3.3515, last_visit: '' },
  { name: 'St. Raphael Clinic', category: 'Private clinic', area: 'Ikeja', address: 'Allen Avenue', lat: 6.5921, lng: 3.3373, last_visit: '' },
  { name: 'Ayobo Primary Health Centre', category: 'Primary health centre', area: 'Ayobo', address: 'Ayobo Road', lat: 6.6274, lng: 3.2560, last_visit: '' },
  { name: 'Surulere Family Clinic', category: 'Private clinic', area: 'Surulere', address: 'Adeniran Ogunsanya Street', lat: 6.4969, lng: 3.3481, last_visit: '' },
  { name: 'Yaba Health Centre', category: 'Primary health centre', area: 'Yaba', address: 'Herbert Macaulay Way', lat: 6.5095, lng: 3.3711, last_visit: '' },
  { name: 'Lekki Primary Care', category: 'Private clinic', area: 'Lekki', address: 'Admiralty Way', lat: 6.4433, lng: 3.4711, last_visit: '' }
]
const SAMPLE_MONITORS = ['Ojuma Joy', 'Anele Goodnews']
const SAMPLE_CATS = { infrastructure: 6, infection: 4, personnel: 5, equipment: 4, records: 5, compliance: 6, laboratory: 3, services: 3 }
function sampleItems(profile) {
  const cycle = profile === 'green' ? ['green', 'green', 'green', 'amber'] : profile === 'amber' ? ['green', 'amber', 'amber', 'red'] : ['red', 'amber', 'red', 'green']
  let idx = 0; const items = {}
  Object.keys(SAMPLE_CATS).forEach(cat => { for (let i = 0; i < SAMPLE_CATS[cat]; i++) { items[cat + '_' + i] = { rating: cycle[idx % cycle.length], note: '', evidence: [] }; idx++ } })
  return items
}
function scoreFromItems(items) {
  let sum = 0, max = 0
  Object.values(items).forEach(it => { if (it.rating) { max += 2; sum += it.rating === 'green' ? 2 : it.rating === 'amber' ? 1 : 0 } })
  const pct = max ? Math.round(sum / max * 100) : null
  return { pct, rag: pct == null ? null : pct >= 80 ? 'green' : pct >= 50 ? 'amber' : 'red' }
}
function sampleVisitFor(f, profile, ageDays) {
  const arrival = new Date(Date.now() - ageDays * 86400000).toISOString()
  const base = {
    facility_id: f.id, facility_name: f.name, area: f.area, lat: f.lat, lng: f.lng, arrival_time: arrival,
    team: [{ name: 'Rev. Dr Solomon Nweke', role: 'Team Lead' }, { name: SAMPLE_MONITORS[ageDays % SAMPLE_MONITORS.length], role: 'Monitoring Officer' }],
    person_in_charge: { name: 'Matron ' + (f.name.split(' ')[0]), role: 'Matron', phone: '0803' + Math.floor(1000000 + Math.random() * 8999999) },
    greeting_confirmed: true
  }
  if (profile === 'engaged') return { ...base, status: 'engaged' }
  const items = sampleItems(profile); const sc = scoreFromItems(items)
  return { ...base, status: 'monitored', monitoring: { items, score: sc.pct, overallRating: sc.rag, updatedAt: arrival }, score: sc.pct, overall_rating: sc.rag }
}
export async function seedSampleData(userId) {
  let facs = [], error = null
  try { facs = await facilities.addMany(SAMPLE_FACILITIES, userId) } catch (e) { error = (e && e.message) || String(e) }
  const plan = [['green', 3], ['amber', 6], ['red', 9], ['green', 12], ['amber', 15], ['red', 18], ['engaged', 1]]
  for (let i = 0; i < Math.min(facs.length, plan.length); i++) {
    try { await visits.add(sampleVisitFor(facs[i], plan[i][0], plan[i][1]), userId) } catch (e) { if (!error) error = (e && e.message) || String(e) }
  }
  return { count: facs.length, error }
}

/* ---------- clear everything (before going live) ---------- */
export async function clearAllData() {
  if (MODE === 'supabase' && supabase) {
    try { await supabase.from('visits').delete().not('id', 'is', null) } catch (e) {}
    try { await supabase.from('assignments').delete().not('id', 'is', null) } catch (e) {}
    try { await supabase.from('facilities').delete().not('id', 'is', null) } catch (e) {}
  } else {
    try { localStorage.removeItem(LS_FAC); localStorage.removeItem(LS_ASG); localStorage.removeItem(LS_VIS) } catch (e) {}
  }
}
