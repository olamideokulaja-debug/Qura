import { useEffect, useState } from "react";
import { supabase, supabaseEnabled } from "./supabase.js";

// Availability & compensation on the website (Permanent First, 1 October 2026).
//
// The same fields as the phone app's home card, saved through /api/profile:
// employment preferences (Permanent first), availability, an annual salary
// expectation as the main figure, and an optional day rate. Mounted in
// main.jsx so it needs no change to App.jsx:
//   - signed-in clinicians with no salary expectation see a slim prompt bar
//   - the form opens from that bar, or from any link to /?edit=compensation
// Closing the bar hides it on this device for 7 days.

const HIDE_KEY = "qura_comp_bar_hidden";
const HIDE_MS = 7 * 86400000;
const PREFS = [["permanent", "Permanent"], ["fixed_term", "Fixed-term"], ["locum_bank", "Locum / Bank"], ["contract_insourcing", "Contract / Insourcing"]];
const FALLBACK_BANDS = [["under_25", "Under £25k"], ["25_30", "£25k to £30k"], ["30_35", "£30k to £35k"], ["35_40", "£35k to £40k"], ["40_45", "£40k to £45k"], ["45_50", "£45k to £50k"], ["50_60", "£50k to £60k"], ["60_70", "£60k to £70k"], ["70_80", "£70k to £80k"], ["80_100", "£80k to £100k"], ["100_125", "£100k to £125k"], ["125_plus", "£125k+"], ["negotiable", "Negotiable"]];

const C = { navy: "#0A1A30", teal: "#0E8C7E", soft: "#E6F4F2", text: "#1A2233", muted: "#5A6783", line: "#E4EAF3", bg2: "#EEF1F7" };
const font = "Inter,-apple-system,'Segoe UI',Roboto,Arial,sans-serif";

const hiddenNow = () => { try { const t = Number(window.localStorage.getItem(HIDE_KEY) || 0); return t && Date.now() - t < HIDE_MS; } catch (e) { return false; } };

async function token() {
  try {
    if (!supabaseEnabled || !supabase) return "";
    const { data } = await supabase.auth.getSession();
    return (data && data.session && data.session.access_token) || "";
  } catch (e) { return ""; }
}

function Pill({ on, label, onClick, tick }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on}
      style={{ padding: "8px 14px", borderRadius: 999, border: "1px solid " + (on ? C.navy : "#E1E8F2"), background: on ? C.navy : C.bg2,
        color: on ? "#fff" : C.muted, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: font }}>
      {tick && on ? "✓ " : ""}{label}
    </button>
  );
}

export default function CompensationPanel() {
  const [me, setMe] = useState(null);      // { profile, bands }
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(hiddenNow());
  const [f, setF] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const load = async () => {
    const t = await token();
    if (!t) { setMe(null); return; }
    const h = { Authorization: "Bearer " + t };
    try {
      const a = await (await fetch("/api/account", { headers: h })).json();
      const isClin = a && (a.lens === "clinician" || a.role === "clinician");
      if (!isClin) { setMe(null); return; }
      const j = await (await fetch("/api/profile", { headers: h })).json();
      const bands = (j.options && Array.isArray(j.options.salaryBands) && j.options.salaryBands.length)
        ? j.options.salaryBands.map((b) => [b.key, b.label]) : FALLBACK_BANDS;
      setMe({ profile: j.profile || {}, bands });
      try { if (new URLSearchParams(window.location.search).get("edit") === "compensation") setOpen(true); } catch (e) {}
    } catch (e) { setMe(null); }
  };

  useEffect(() => {
    load();
    let unsub;
    try { if (supabaseEnabled && supabase) unsub = supabase.auth.onAuthStateChange(() => load()).data.subscription; } catch (e) {}
    return () => { try { unsub && unsub.unsubscribe(); } catch (e) {} };
  }, []);

  useEffect(() => {
    if (!open || !me) return;
    const p = me.profile;
    const av = p.availableFrom;
    setF({
      prefs: Array.isArray(p.employmentPreferences) ? p.employmentPreferences : [],
      mode: av === "now" ? "now" : av ? "date" : "none",
      date: av && av !== "now" ? av : "",
      band: p.salaryBand || "",
      rate: p.dayRate ? String(p.dayRate) : "",
    });
    setMsg("");
  }, [open, me]);

  if (!me) return null;

  const save = async () => {
    if (f.mode === "date" && !/^\d{4}-\d{2}-\d{2}$/.test(f.date)) { setMsg("Please choose the date you are available from."); return; }
    const n = Number(String(f.rate).replace(/[^0-9]/g, ""));
    if (f.rate && !n) { setMsg("Please enter your day rate as a number of pounds, or leave it blank."); return; }
    setSaving(true); setMsg("");
    try {
      const t = await token();
      const r = await fetch("/api/profile", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + t },
        body: JSON.stringify({
          availableFrom: f.mode === "now" ? "now" : f.mode === "date" ? f.date : "",
          employmentPreferences: f.prefs, salaryBand: f.band || "", dayRate: f.rate ? n : "",
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Could not save");
      setMe({ ...me, profile: j.profile || me.profile });
      setOpen(false);
    } catch (e) { setMsg((e && e.message) || "Could not save. Please try again."); }
    setSaving(false);
  };

  const togglePref = (k) => setF((x) => {
    const next = x.prefs.includes(k) ? x.prefs.filter((y) => y !== k) : [...x.prefs, k];
    return { ...x, prefs: PREFS.map(([key]) => key).filter((key) => next.includes(key)) };
  });
  const wantsDay = f && (f.prefs.includes("locum_bank") || f.prefs.includes("contract_insourcing"));
  const permOnly = f && f.prefs.length > 0 && !wantsDay;
  const lab = { fontSize: 12, fontWeight: 700, letterSpacing: ".04em", color: C.muted, textTransform: "uppercase", margin: "18px 0 8px" };

  const bar = !me.profile.salaryBand && !hidden && !open ? (
    <div role="region" aria-label="Add your salary expectation"
      style={{ background: C.soft, color: C.text, fontFamily: font, fontSize: 13.5, padding: "9px 44px 9px 14px", textAlign: "center", position: "relative", borderBottom: "1px solid #CDE8E3" }}>
      <span>New: add your salary expectation so permanent roles can find you.</span>{" "}
      <button type="button" onClick={() => setOpen(true)} style={{ background: "none", border: "none", color: C.teal, fontWeight: 700, textDecoration: "underline", cursor: "pointer", fontSize: 13.5, fontFamily: font }}>Add it now</button>
      <button type="button" aria-label="Close" onClick={() => { try { window.localStorage.setItem(HIDE_KEY, String(Date.now())); } catch (e) {} setHidden(true); }}
        style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", fontSize: 18, color: C.muted, cursor: "pointer", padding: 6 }}>×</button>
    </div>
  ) : null;

  const modal = open && f ? (
    <div role="dialog" aria-modal="true" aria-label="Availability & compensation" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
      style={{ position: "fixed", inset: 0, background: "rgba(10,26,48,.55)", zIndex: 9999, display: "flex", alignItems: "flex-start", justifyContent: "center", overflowY: "auto", padding: "40px 16px", fontFamily: font }}>
      <div style={{ background: "#fff", borderRadius: 16, maxWidth: 520, width: "100%", padding: 22, boxShadow: "0 20px 60px rgba(10,26,48,.25)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 700, fontSize: 17, color: C.text }}>Availability & compensation</div>
          <button type="button" aria-label="Close" onClick={() => setOpen(false)} style={{ background: "none", border: "none", fontSize: 22, color: C.muted, cursor: "pointer" }}>×</button>
        </div>
        <div style={{ fontSize: 13.5, color: C.muted, marginTop: 4, lineHeight: 1.5 }}>Shown only to hospitals and suppliers that Qura has checked. Keep it current and the right roles find you.</div>

        <div style={lab}>Employment preferences</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{PREFS.map(([k, l]) => <Pill key={k} tick on={f.prefs.includes(k)} label={l} onClick={() => togglePref(k)} />)}</div>
        <div style={{ fontSize: 12, color: "#8A97AE", marginTop: 6 }}>Choose all that apply.</div>

        <div style={lab}>Availability</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {[["now", "Available now"], ["date", "From a date"], ["none", "Not looking"]].map(([k, l]) => <Pill key={k} on={f.mode === k} label={l} onClick={() => setF({ ...f, mode: k })} />)}
        </div>
        {f.mode === "date" ? <input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })}
          style={{ marginTop: 10, border: "1px solid #E1E8F2", borderRadius: 8, padding: "9px 12px", fontSize: 14, fontFamily: font }} /> : null}

        <div style={{ marginTop: 20, background: C.soft, border: "1.5px solid " + C.teal, borderRadius: 12, padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <label htmlFor="qura-salary" style={{ fontWeight: 700, fontSize: 14.5, color: C.text }}>Salary expectation</label>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: "#06776F" }}>PER YEAR</span>
          </div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>For permanent and fixed-term roles.</div>
          <select id="qura-salary" value={f.band} onChange={(e) => setF({ ...f, band: e.target.value })}
            style={{ marginTop: 10, width: "100%", border: "1px solid " + C.teal, borderRadius: 8, padding: "10px 12px", fontSize: 15, fontWeight: f.band ? 700 : 400, background: "#fff", color: f.band ? C.text : "#9AA7BC", fontFamily: font }}>
            <option value="">Choose a salary range</option>
            {me.bands.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <label htmlFor="qura-dayrate" style={{ fontWeight: 600, fontSize: 14, color: C.text }}>Expected day rate</label>
            <span style={{ fontSize: 12, color: "#8A97AE" }}>Optional</span>
          </div>
          <div style={{ fontSize: 12, color: C.muted, margin: "2px 0 8px" }}>
            {permOnly ? "Not needed for permanent or fixed-term work. Add one if you would also consider locum, bank, contract or insourcing roles." : "For locum, bank, contract or insourcing roles."}
          </div>
          <div style={{ display: "flex", alignItems: "center", border: "1px solid #E1E8F2", borderRadius: 8, padding: "0 12px" }}>
            <span style={{ color: C.muted }}>£</span>
            <input id="qura-dayrate" inputMode="numeric" value={f.rate} placeholder="450" onChange={(e) => setF({ ...f, rate: e.target.value.replace(/[^0-9]/g, "") })}
              style={{ flex: 1, border: "none", outline: "none", padding: "10px 6px", fontSize: 14.5, fontFamily: font }} />
            <span style={{ fontSize: 12.5, color: C.muted }}>per day</span>
          </div>
        </div>

        {msg ? <div style={{ marginTop: 12, color: "#8A1030", fontSize: 13.5 }}>{msg}</div> : null}
        <button type="button" onClick={save} disabled={saving}
          style={{ marginTop: 18, width: "100%", background: C.teal, color: "#fff", border: "none", borderRadius: 999, padding: "13px 0", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: font, opacity: saving ? 0.7 : 1 }}>
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  ) : null;

  return <>{bar}{modal}</>;
}
