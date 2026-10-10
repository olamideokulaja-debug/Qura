// Admin, Outcomes: what happened after clinicians opened roles on NHS Jobs and
// other sites (10 October 2026). "Opened" is recorded by Qura; every later step
// is what clinicians told us. Nothing here is employer-confirmed, and the screen
// says so, so these numbers are never quoted as placements.

import React, { useEffect, useState } from "react";
import { supabase } from "./supabase.js";

async function get(path) {
  let token = "";
  try { const { data } = await supabase.auth.getSession(); token = (data && data.session && data.session.access_token) || ""; } catch (e) {}
  const r = await fetch(path, { headers: { authorization: "Bearer " + token } });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || "Could not load.");
  return j;
}

const pct = (a, b) => (b ? Math.round((a / b) * 100) + "%" : "");

export default function AdminOutcomes() {
  const [days, setDays] = useState(90);
  const [profession, setProfession] = useState("");
  const [region, setRegion] = useState("");
  const [d, setD] = useState(null);
  const [err, setErr] = useState("");

  const load = async () => {
    setErr("");
    try { setD(await get("/api/tracking?view=funnel&days=" + days + (profession ? "&profession=" + encodeURIComponent(profession) : "") + (region ? "&region=" + encodeURIComponent(region) : ""))); }
    catch (e) { setErr(e.message); }
  };
  useEffect(() => { load(); }, [days]); // eslint-disable-line react-hooks/exhaustive-deps

  const opened = d && d.steps && d.steps[0] ? d.steps[0].roles : 0;
  const List = ({ title, rows }) => (
    <div className="card" style={{ padding: 14 }}>
      <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 8 }}>{title}</div>
      {(rows || []).length ? rows.map((r) => (
        <div key={r.name} className="row" style={{ justifyContent: "space-between", fontSize: 13, padding: "3px 0" }}><span>{r.name}</span><b>{r.n}</b></div>
      )) : <div className="faint" style={{ fontSize: 12.5 }}>None yet</div>}
    </div>
  );

  return (
    <div>
      <div className="card" style={{ padding: 14, marginBottom: 14, background: "var(--bg)", fontSize: 13.5, lineHeight: 1.6 }}>
        <b>How to read this.</b> "Opened" is recorded by Qura when a signed-in clinician taps through to an advert. Every later step is what the clinician told us when asked, and is not confirmed by any employer. Quote these as clinician-reported, never as placements.
      </div>
      <div className="row" style={{ gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        {[30, 90, 365].map((n) => <button key={n} className={"btn " + (days === n ? "btn-primary" : "btn-light")} onClick={() => setDays(n)}>Last {n} days</button>)}
        <input className="input" placeholder="Profession (exact)" value={profession} onChange={(e) => setProfession(e.target.value)} style={{ maxWidth: 200 }} />
        <input className="input" placeholder="Region or town" value={region} onChange={(e) => setRegion(e.target.value)} style={{ maxWidth: 180 }} />
        <button className="btn btn-light" onClick={load}>Apply filters</button>
      </div>
      {err ? <div style={{ color: "#B4433A", marginBottom: 10 }}>{err}</div> : null}
      {!d ? <div className="muted">Loading...</div> : (
        <>
          <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 14 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead><tr style={{ background: "var(--bg)", textAlign: "left" }}>
                <th style={{ padding: "10px 14px" }}>Step</th><th style={{ padding: "10px 14px" }}>Roles</th><th style={{ padding: "10px 14px" }}>Clinicians</th><th style={{ padding: "10px 14px" }}>Of opened</th><th style={{ padding: "10px 14px" }}>Source</th>
              </tr></thead>
              <tbody>
                {d.steps.map((s, i) => (
                  <tr key={s.key} style={{ borderTop: "1px solid var(--line)" }}>
                    <td style={{ padding: "10px 14px", fontWeight: 600 }}>{s.label}</td>
                    <td style={{ padding: "10px 14px" }}>{s.roles}</td>
                    <td style={{ padding: "10px 14px" }}>{s.clinicians}</td>
                    <td style={{ padding: "10px 14px" }}>{i ? pct(s.roles, opened) : ""}</td>
                    <td style={{ padding: "10px 14px", fontSize: 12.5 }} className="muted">{i ? "Clinician-reported" : "Recorded by Qura"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", marginBottom: 14 }}>
            {[["Asked at least once", d.asked], ["Answered", d.answered], ["Asked, no answer yet", d.noAnswer], ["Not asked yet (under 2 days)", d.waitingFirstQuestion], ["Not applying", d.notApplying], ["Not successful", d.notSuccessful], ["Employer-confirmed", d.employerVerified]].map(([l, n]) => (
              <div key={l} className="card" style={{ padding: 12 }}><div className="faint" style={{ fontSize: 12 }}>{l}</div><div style={{ fontWeight: 700, fontSize: 20 }}>{n}</div></div>
            ))}
          </div>
          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))" }}>
            <List title="By profession" rows={d.byProfession} />
            <List title="By employer" rows={d.byEmployer} />
            <List title="By source" rows={d.bySource} />
            <List title="By platform" rows={d.byPlatform} />
          </div>
        </>
      )}
    </div>
  );
}
