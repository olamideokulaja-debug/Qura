// Post a role (web). The same form and rules as the phone app's Post a role
// screen: an organisation a founder has confirmed posts a role, matching
// clinicians are told straight away by push or email, and the organisation
// can see and close what it has posted. The server does every check; this
// only shows what it says.

import React, { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { supabase } from "./supabase.js";
import ClaimAdverts from "./ClaimAdverts.jsx";

const PROFESSIONS = [
  "Adult Nurse (RGN)", "Mental Health Nurse (RMN)", "Learning Disability Nurse", "Children's Nurse", "Midwife",
  "ICU / Critical Care", "Theatre Nurse", "District / Community", "Nurse",
  "Sonographer", "Diagnostic Radiographer", "Therapeutic Radiographer", "Radiographer", "Echocardiographer",
  "Physiotherapist", "Occupational Therapist", "Speech & Language Therapist", "Podiatrist", "Dietitian", "Paramedic",
  "Operating Department Practitioner", "Orthoptist", "Prosthetist / Orthotist", "Practitioner Psychologist",
  "General Practitioner", "Radiologist", "Oncologist", "Anaesthetist", "Emergency Medicine", "Psychiatrist", "Specialist Consultant",
  "Pharmacist", "Pharmacy Technician", "Clinical Scientist", "Biomedical Scientist", "Genomic Scientist", "Clinical Audiologist",
  "Clinical Research Associate",
];
const COUNTRIES = ["United Kingdom", "Ireland", "Australia", "New Zealand", "Canada", "United States",
  "UAE", "Saudi Arabia", "Qatar", "Nigeria", "Ghana", "Kenya", "South Africa", "Brazil", "European Union", "Other"];
const MARKETS = ["NHS", "Private", "International", "Public"];
// Type of work and salary range (Permanent First, 1 October 2026), the same
// as the phone app. Permanent and fixed-term roles can give a yearly range.
const TYPES = [["permanent", "Permanent"], ["fixed_term", "Fixed-term"], ["locum_bank", "Locum / Bank"], ["contract_insourcing", "Contract / Insourcing"]];
const TYPE_LABEL = Object.fromEntries(TYPES);
const digits = (v) => String(v || "").replace(/[^0-9]/g, "");
const EMPTY = { title: "", profession: "", buyer: "", country: "United Kingdom", region: "", market: "NHS",
  rate: "", need: "", start: "", closesInDays: 30, note: "", employmentType: "permanent", salaryMin: "", salaryMax: "" };

async function call(path, body) {
  let token = "";
  try { const { data } = await supabase.auth.getSession(); token = (data && data.session && data.session.access_token) || ""; } catch (e) {}
  const r = await fetch(path, body
    ? { method: "POST", headers: { authorization: "Bearer " + token, "content-type": "application/json" }, body: JSON.stringify(body) }
    : { headers: { authorization: "Bearer " + token } });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || j.message || "Something went wrong. Please try again.");
  return j;
}

function PostRoleCard() {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [mine, setMine] = useState([]);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));

  const load = async () => { try { const j = await call("/api/demand?mine=1"); setMine(j.items || []); } catch (e) {} };
  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (busy) return;
    if (!f.title.trim() || !f.profession.trim()) { setErr("Please give the role a title and choose a profession."); return; }
    const salaried = f.employmentType === "permanent" || f.employmentType === "fixed_term";
    const lo = Number(digits(f.salaryMin)), hi = Number(digits(f.salaryMax));
    if (salaried && ((f.salaryMin && lo < 1000) || (f.salaryMax && hi < 1000))) { setErr("Please give the salary as a yearly figure in pounds, for example 42000."); return; }
    setBusy(true); setErr(""); setMsg("");
    try {
      const j = await call("/api/demand", { ...f, title: f.title.trim(), salaryMin: salaried && lo ? lo : "", salaryMax: salaried && hi ? hi : "" });
      const a = j.alerted || {};
      setMsg(a.matched
        ? "Role posted. " + a.matched + (a.matched === 1 ? " matching clinician has" : " matching clinicians have") + " been told about it."
        : "Role posted and live. No registered clinician matches it yet; they will see it when they look for roles.");
      setF(EMPTY); setOpen(false);
      load();
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };

  const close = async (m) => {
    if (!window.confirm("Close " + m.title + "? It will stop showing to clinicians.")) return;
    try { await call("/api/demand", { action: "close", id: m.id }); load(); } catch (e) { setErr(e.message); }
  };

  const label = { display: "block", fontSize: 12.5, fontWeight: 700, color: "var(--muted)", margin: "12px 0 5px" };
  const input = { width: "100%", boxSizing: "border-box" };

  return (
    <div className="card" style={{ padding: 18, marginBottom: 16 }}>
      <div className="row" style={{ justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15.5 }}>Post a role for clinicians</div>
          <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>Clinicians whose profile matches are told straight away. Only confirmed organisations can post.</div>
        </div>
        <button className={"btn " + (open ? "btn-light" : "btn-primary")} style={{ fontSize: 13 }} onClick={() => { setOpen((v) => !v); setErr(""); }}>
          {open ? <><X size={15} /> Cancel</> : <><Plus size={15} /> Post a role</>}
        </button>
      </div>
      {msg ? <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 10, background: "#E6F6F3", color: "#06776F", fontSize: 13.5 }}>{msg}</div> : null}
      {err ? <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 10, background: "#FDECEA", color: "#B4433A", fontSize: 13.5 }}>{err}</div> : null}

      {open ? (
        <div style={{ marginTop: 6 }}>
          <div className="grid g2" style={{ gap: 12 }}>
            <div><label style={label}>Role title</label>
              <input className="in" style={input} maxLength={120} value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. MRI Radiographer, 2 posts" /></div>
            <div><label style={label}>Profession</label>
              <input className="in" style={input} list="qura-professions" maxLength={80} value={f.profession} onChange={(e) => set("profession", e.target.value)} placeholder="Start typing, e.g. sonographer" />
              <datalist id="qura-professions">{PROFESSIONS.map((p) => <option key={p} value={p} />)}</datalist></div>
            <div><label style={label}>Organisation name shown to clinicians</label>
              <input className="in" style={input} maxLength={120} value={f.buyer} onChange={(e) => set("buyer", e.target.value)} placeholder="Your organisation" /></div>
            <div><label style={label}>Country</label>
              <select className="in" style={input} value={f.country} onChange={(e) => set("country", e.target.value)}>{COUNTRIES.map((c) => <option key={c}>{c}</option>)}</select></div>
            <div><label style={label}>Town or region</label>
              <input className="in" style={input} maxLength={80} value={f.region} onChange={(e) => set("region", e.target.value)} placeholder="e.g. Manchester" /></div>
            <div><label style={label}>Setting</label>
              <select className="in" style={input} value={f.market} onChange={(e) => set("market", e.target.value)}>{MARKETS.map((c) => <option key={c}>{c}</option>)}</select></div>
            <div><label style={label}>Type of work</label>
              <select className="in" style={input} value={f.employmentType} onChange={(e) => set("employmentType", e.target.value)}>{TYPES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
            {f.employmentType === "permanent" || f.employmentType === "fixed_term" ? (
              <div><label style={label}>Salary range, per year (optional)</label>
                <div className="row" style={{ gap: 8 }}>
                  <input className="in" style={input} inputMode="numeric" maxLength={7} value={f.salaryMin} onChange={(e) => set("salaryMin", digits(e.target.value))} placeholder="From, e.g. 40000" />
                  <input className="in" style={input} inputMode="numeric" maxLength={7} value={f.salaryMax} onChange={(e) => set("salaryMax", digits(e.target.value))} placeholder="To, e.g. 46000" />
                </div></div>
            ) : null}
            <div><label style={label}>{f.employmentType === "permanent" || f.employmentType === "fixed_term" ? "Other pay details" : "Pay"}</label>
              <input className="in" style={input} maxLength={60} value={f.rate} onChange={(e) => set("rate", e.target.value)} placeholder={f.employmentType === "permanent" || f.employmentType === "fixed_term" ? "e.g. Band 7, plus relocation" : "e.g. £320 a day"} /></div>
            <div className="row" style={{ gap: 10 }}>
              <div style={{ flex: 1 }}><label style={label}>How many</label>
                <input className="in" style={input} maxLength={80} value={f.need} onChange={(e) => set("need", e.target.value)} placeholder="e.g. 2 posts" /></div>
              <div style={{ flex: 1 }}><label style={label}>Start</label>
                <input className="in" style={input} maxLength={40} value={f.start} onChange={(e) => set("start", e.target.value)} placeholder="e.g. ASAP" /></div>
            </div>
            <div><label style={label}>Open for</label>
              <select className="in" style={input} value={f.closesInDays} onChange={(e) => set("closesInDays", Number(e.target.value))}>{[7, 14, 30, 60, 90].map((d) => <option key={d} value={d}>{d} days</option>)}</select></div>
          </div>
          <label style={label}>About the role</label>
          <textarea className="in" style={{ ...input, minHeight: 90, resize: "vertical" }} maxLength={1000} value={f.note} onChange={(e) => set("note", e.target.value)} placeholder="Duties, shift pattern, requirements" />
          <div style={{ marginTop: 14 }}>
            <button className="btn btn-primary" disabled={busy} onClick={submit}>{busy ? "Posting..." : "Post role"}</button>
          </div>
        </div>
      ) : null}

      {mine.length ? (
        <div style={{ marginTop: 16, borderTop: "1px solid var(--line)", paddingTop: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 6 }}>Your roles</div>
          {mine.map((m) => (
            <div key={m.id} className="row" style={{ justifyContent: "space-between", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--line)", flexWrap: "wrap" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{m.title}</div>
                <div className="faint" style={{ fontSize: 12.5 }}>
                  {[m.profession, TYPE_LABEL[m.employmentType], m.region, m.country].filter(Boolean).join(" · ")} · {m.open ? "closes in " + m.closes : "closed"}
                  {m.notified && m.notified.matched ? " · " + m.notified.matched + " matching clinicians told" : ""}
                </div>
              </div>
              {m.open ? <button className="btn btn-light" style={{ fontSize: 12.5 }} onClick={() => close(m)}>Close role</button> : <span className="chip" style={{ fontSize: 11 }}>Closed</span>}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

// The post form, then "Already advertising on NHS Jobs?" (claim your adverts).
export default function PostRole(props) {
  return <>
    <PostRoleCard {...props} />
    <ClaimAdverts />
  </>;
}
