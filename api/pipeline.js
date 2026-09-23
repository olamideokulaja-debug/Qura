import { getUser } from "./_auth.js";

// The pipeline, as rows shared across a team.
//
// Replaces a single JSON blob held per account, which meant the two founders
// could not see each other's pipeline, nothing could be queried server-side,
// and two open tabs silently overwrote one another.
//
//   GET    /api/pipeline                      -> the team's deals
//   POST   /api/pipeline  {org, role, ...}    -> add a deal
//   PATCH  /api/pipeline  {id, stage|lost}    -> move or mark lost
//   DELETE /api/pipeline?id=...               -> remove a deal
//
// Every response is scoped to the caller's team, worked out from team_members.
// A caller can never name a team; it is always derived from who they are.

const base = () => (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const svc = () => process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const headers = (extra = {}) => ({
  apikey: svc(), Authorization: "Bearer " + svc(),
  "Content-Type": "application/json", ...extra,
});

async function rest(path, init = {}) {
  const r = await fetch(base() + "/rest/v1/" + path, { ...init, headers: headers(init.headers) });
  const text = await r.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch (e) { body = null; }
  return { ok: r.ok, status: r.status, body };
}

// A user's team. Everyone has one: their own by default, shared where they
// have been put in a shared team. Created on first use so an account that
// predates teams still works rather than erroring.
async function teamOf(user) {
  const got = await rest("team_members?user_id=eq." + encodeURIComponent(user.id) + "&select=team_id&limit=1");
  if (got.ok && Array.isArray(got.body) && got.body.length) return got.body[0].team_id;
  const name = (user.email || "Account").split("@")[0];
  await rest("teams", { method: "POST", body: JSON.stringify({ id: user.id, name }),
    headers: { Prefer: "resolution=ignore-duplicates" } });
  await rest("team_members", { method: "POST", body: JSON.stringify({ team_id: user.id, user_id: user.id }),
    headers: { Prefer: "resolution=ignore-duplicates" } });
  return user.id;
}

const clean = (v, max = 300) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Sign in required" });
  if (!base() || !svc()) return res.status(200).json({ deals: [], teamId: null, unavailable: true });

  let teamId;
  try { teamId = await teamOf(user); }
  catch (e) { return res.status(500).json({ error: "Could not resolve your team" }); }

  if (req.method === "GET") {
    const r = await rest("pipeline_deals?team_id=eq." + encodeURIComponent(teamId) +
      "&select=id,org,role,value_text,stage,lost,source,notice_url,note,created_by,created_at&order=created_at.desc");
    if (!r.ok) return res.status(500).json({ error: "Could not load the pipeline" });
    return res.status(200).json({ deals: r.body || [], teamId });
  }

  if (req.method === "POST") {
    const b = req.body || {};
    const org = clean(b.org, 200);
    if (!org) return res.status(400).json({ error: "An organisation is required" });
    const row = {
      team_id: teamId, created_by: user.id, org,
      role: clean(b.role, 300), value_text: clean(b.value_text || b.val, 60) || null,
      source: clean(b.source, 60) || null, notice_url: clean(b.notice_url || b.url, 600) || null,
      note: clean(b.note, 600) || null, stage: 0, lost: false,
    };
    const r = await rest("pipeline_deals", { method: "POST", body: JSON.stringify(row),
      headers: { Prefer: "return=representation,resolution=merge-duplicates" } });
    // The unique index means adding the same deal twice is not an error, it is
    // simply already there, which is what a person would expect.
    if (!r.ok && r.status !== 409) return res.status(500).json({ error: "Could not add that to the pipeline" });
    return res.status(200).json({ deal: Array.isArray(r.body) ? r.body[0] : null, alreadyThere: r.status === 409 });
  }

  if (req.method === "PATCH") {
    const b = req.body || {};
    if (!b.id) return res.status(400).json({ error: "id required" });
    const patch = { updated_at: new Date().toISOString() };
    if (b.stage != null) patch.stage = Math.max(0, Math.min(10, Number(b.stage) || 0));
    if (b.lost != null) patch.lost = Boolean(b.lost);
    if (b.note != null) patch.note = clean(b.note, 600);
    const r = await rest("pipeline_deals?id=eq." + encodeURIComponent(b.id) +
      "&team_id=eq." + encodeURIComponent(teamId),
      { method: "PATCH", body: JSON.stringify(patch), headers: { Prefer: "return=representation" } });
    if (!r.ok) return res.status(500).json({ error: "Could not update that deal" });
    if (!Array.isArray(r.body) || !r.body.length) return res.status(404).json({ error: "Deal not found" });
    return res.status(200).json({ deal: r.body[0] });
  }

  if (req.method === "DELETE") {
    const id = (req.query && req.query.id) || (req.body && req.body.id);
    if (!id) return res.status(400).json({ error: "id required" });
    const r = await rest("pipeline_deals?id=eq." + encodeURIComponent(id) +
      "&team_id=eq." + encodeURIComponent(teamId), { method: "DELETE" });
    if (!r.ok) return res.status(500).json({ error: "Could not remove that deal" });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
