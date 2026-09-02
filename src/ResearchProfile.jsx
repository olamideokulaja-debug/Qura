// The clinical research half of a clinician profile.
//
// Shown only where someone's target roles sit in a research track. It is a long
// form, and asking a locum radiographer to fill it in is how a form gets
// abandoned by everybody.
//
// Nothing here is required. Someone moving into clinical research for the first
// time has none of it, and that is precisely the person the whole career
// direction feature exists to help. The completeness figure is a prompt to
// them, never a score used to rank them.

import React, { useState, useEffect, useCallback } from "react";
import { Check, FlaskConical, Info } from "lucide-react";
import { SectionHead } from "./components/ui.jsx";
import {
  TRIAL_PHASES, THERAPEUTIC_AREAS, MONITORING_ACTIVITIES, RESEARCH_SETTINGS,
  CERTIFICATIONS, EDC_SYSTEMS, TRAVEL_WILLINGNESS, researchProfileStrength,
} from "./data/research.js";
import { supabase } from "./supabase.js";

const authHeaders = async (json) => {
  let t = "";
  try { const { data } = await supabase.auth.getSession(); t = (data && data.session && data.session.access_token) || ""; } catch (e) {}
  const h = t ? { Authorization: "Bearer " + t } : {};
  if (json) h["content-type"] = "application/json";
  return h;
};

const inp = {
  width: "100%", padding: "10px 12px", border: "1px solid var(--line)",
  borderRadius: 10, fontSize: 14, boxSizing: "border-box",
};
const lab = { fontSize: 12.5, fontWeight: 600, display: "block", margin: "14px 0 5px" };

function Chips({ options, value, onChange, idKey = "id", labelKey = "label" }) {
  const list = Array.isArray(value) ? value : [];
  return (
    <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
      {options.map((o) => {
        const id = typeof o === "string" ? o : o[idKey];
        const label = typeof o === "string" ? o : o[labelKey];
        const hint = typeof o === "string" ? "" : o.hint || o.note || "";
        const on = list.includes(id);
        return (
          <button key={id} type="button" className="chip" title={hint}
            onClick={() => onChange(on ? list.filter((x) => x !== id) : [...list, id])}
            style={{
              cursor: "pointer", border: "none", fontSize: 11.5, fontWeight: 600,
              background: on ? "var(--cyan-soft)" : "#EEF1F7",
              color: on ? "var(--teal)" : "#5A6783",
            }}>
            {on ? "\u2713 " : ""}{label}
          </button>
        );
      })}
    </div>
  );
}

export default function ResearchProfile({ onToast }) {
  const [r, setR] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/profile", { headers: await authHeaders(false) });
      if (res.ok) { const j = await res.json(); setR((j.profile && j.profile.research) || {}); }
      else setR({});
    } catch (e) { setR({}); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setBusy(true); setMsg("");
    try {
      const res = await fetch("/api/profile", {
        method: "POST", headers: await authHeaders(true),
        body: JSON.stringify({ research: r }),
      });
      if (!res.ok) { const j = await res.json(); setMsg(j.error || "Could not save that."); }
      else if (onToast) onToast("Saved. Your research experience is now part of your matching.");
    } catch (e) { setMsg("Could not reach Qura. Please try again."); }
    setBusy(false);
  };

  if (r === null) return <div className="muted">Loading...</div>;

  const set = (k, v) => setR({ ...r, [k]: v });
  const strength = researchProfileStrength(r);

  return (
    <div className="card" style={{ padding: 20 }}>
      <div className="row" style={{ justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div className="row" style={{ gap: 9 }}>
          <FlaskConical size={18} color="var(--teal)" />
          <span style={{ fontWeight: 700, fontSize: 16 }}>Clinical research experience</span>
        </div>
        <span className="chip" style={{ fontSize: 11.5, background: "var(--cyan-soft)", color: "var(--teal)", fontWeight: 700 }}>
          {strength.pct}% complete
        </span>
      </div>

      {/* Said plainly, because the honest version is also the encouraging one. */}
      <div className="row" style={{ gap: 9, alignItems: "flex-start", marginTop: 12, padding: "11px 13px", borderRadius: 10, background: "var(--bg)" }}>
        <Info size={15} color="var(--teal)" style={{ marginTop: 2, flexShrink: 0 }} />
        <div style={{ fontSize: 13, lineHeight: 1.6 }}>
          None of this is required, and an empty section does not count against you.
          CROs and sponsors read these fields rather than your professional registration,
          so anything you can add here makes your matches sharper. If you are moving into
          clinical research for the first time, leave what you have not done yet.
        </div>
      </div>

      <SectionHead title="Experience" />
      <div className="row" style={{ gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 190 }}>
          <label style={lab}>Years in clinical research</label>
          <input style={inp} type="number" min="0" max="50" value={r.researchYears || ""}
            onChange={(e) => set("researchYears", e.target.value)} />
        </div>
        <div style={{ flex: 1, minWidth: 190 }}>
          <label style={lab}>Years monitoring independently</label>
          <input style={inp} type="number" min="0" max="50" value={r.independentYears || ""}
            onChange={(e) => set("independentYears", e.target.value)} />
        </div>
      </div>

      <label style={lab}>Trial phases you have worked on</label>
      <Chips options={TRIAL_PHASES} value={r.phases} onChange={(v) => set("phases", v)} />

      <label style={lab}>Therapeutic areas</label>
      <Chips options={THERAPEUTIC_AREAS} value={r.therapeuticAreas} onChange={(v) => set("therapeuticAreas", v)} />

      <SectionHead title="What you have actually done" />
      <div className="muted" style={{ fontSize: 12.5, marginBottom: 8, lineHeight: 1.5 }}>
        This is the part a CRO reads first. Taking a site from qualification through to
        close-out is a different proposition from monitoring visits alone.
      </div>
      <Chips options={MONITORING_ACTIVITIES} value={r.activities} onChange={(v) => set("activities", v)} />

      <label style={lab}>Where you have worked from</label>
      <Chips options={RESEARCH_SETTINGS} value={r.settings} onChange={(v) => set("settings", v)} />

      <div className="row" style={{ gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 190 }}>
          <label style={lab}>Sites managed at once, at most</label>
          <input style={inp} type="number" min="0" max="200" value={r.sitesManaged || ""}
            onChange={(e) => set("sitesManaged", e.target.value)} />
        </div>
        <div style={{ flex: 1, minWidth: 190 }}>
          <label style={lab}>Travel you are willing to do</label>
          <select style={inp} value={r.travel || ""} onChange={(e) => set("travel", e.target.value)}>
            <option value="">Choose...</option>
            {TRAVEL_WILLINGNESS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>
      </div>

      <SectionHead title="Training and systems" />
      <label style={lab}>Certifications</label>
      <Chips options={CERTIFICATIONS} value={r.certifications} onChange={(v) => set("certifications", v)} />
      <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
        Upload the certificates themselves under My documents, and we will verify them.
      </div>

      <label style={lab}>Systems you have used</label>
      <Chips options={EDC_SYSTEMS} value={r.systems} onChange={(v) => set("systems", v)} />

      <label style={lab}>Languages you work in</label>
      <input style={inp} value={r.languages || ""} placeholder="e.g. English, French"
        onChange={(e) => set("languages", e.target.value)} />

      <div className="row" style={{ gap: 10, marginTop: 18, flexWrap: "wrap" }}>
        <button className="btn btn-primary" style={{ fontSize: 13.5 }} disabled={busy} onClick={save}>
          {busy ? "Saving..." : "Save research experience"}
        </button>
        {strength.missing.length && strength.pct > 0 ? (
          <span className="muted" style={{ fontSize: 12.5 }}>
            Still to add: {strength.missing.slice(0, 3).join(", ")}
          </span>
        ) : null}
      </div>
      {msg ? <div style={{ color: "var(--red)", fontSize: 13, marginTop: 10 }}>{msg}</div> : null}
    </div>
  );
}
