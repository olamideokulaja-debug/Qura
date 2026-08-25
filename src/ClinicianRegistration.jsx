// The clinician registration form.
//
// Lifted out of App.jsx so the screen we change most often is a file of its own
// rather than a fragment of a 550 KB module.
//
// Two rules worth keeping in view when editing this:
//   - the POST must carry submit: true, or the server saves a draft and the
//     clinician is told they registered when they did not
//   - the CV is optional. It is asked for, it improves a profile, it does not
//     gate registration.

import React, { useState, useEffect } from "react";
import { Check, FileText, ShieldCheck } from "lucide-react";
import { PageHead, SectionHead } from "./components/ui.jsx";
import { supabase } from "./supabase.js";

export default function ClinicianRegistration({ onToast }) {
  const [f, setF] = useState({ cat: "", prof: "", regNo: "", country: "", years: "", sector: "", cv: "", declare: false });
  const [done, setDone] = useState(false);
  const [cvBusy, setCvBusy] = useState(false);
  // hyd gates the draft autosave. Without it the first render would save an
  // empty form over a real draft before the fetch below has come back.
  const [hyd, setHyd] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const upd = (k, v) => setF((s) => ({ ...s, [k]: v }));

  const authHeaders = async (json) => {
    let t = "";
    try { const { data } = await supabase.auth.getSession(); t = (data && data.session && data.session.access_token) || ""; } catch (e) {}
    const h = t ? { Authorization: "Bearer " + t } : {};
    if (json) h["content-type"] = "application/json";
    return h;
  };

  // Load whatever this clinician already has: a finished registration puts
  // them straight on the confirmation screen, a draft refills the form.
  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const r = await fetch("/api/clinician-register", { headers: await authHeaders(false) });
        if (r.ok) {
          const j = await r.json();
          const reg = j && j.registration;
          if (!dead && reg) {
            if (reg.status === "registered") {
              setF((s) => ({ ...s, ...reg, declare: true }));
              setDone(true);
            } else if (reg.form) {
              setF((s) => ({ ...s, ...reg.form }));
            }
          }
        }
      } catch (e) {}
      if (!dead) setHyd(true);
    })();
    return () => { dead = true; };
  }, []);

  // Autosave the draft. Debounced, because this fires on every keystroke.
  useEffect(() => {
    if (!hyd || done) return;
    const t = setTimeout(async () => {
      try {
        await fetch("/api/clinician-register", {
          method: "POST", headers: await authHeaders(true),
          body: JSON.stringify({ action: "draft", ...f }),
        });
      } catch (e) {}
    }, 900);
    return () => clearTimeout(t);
  }, [f, hyd, done]);
  const onCv = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    upd("cv", file.name);
    if (supabase && supabase.storage) {
      setCvBusy(true);
      try {
        const path = "uploads/" + Date.now() + "_" + file.name.replace(/[^A-Za-z0-9._-]/g, "_");
        const { error } = await supabase.storage.from("cvs").upload(path, file, { upsert: false });
        if (!error) setF((st) => ({ ...st, cvPath: path }));
      } catch (err) {}
      setCvBusy(false);
    }
  };
  const profs = f.cat === "Nurse / Midwife" ? NURSE_TYPES : f.cat === "Allied Health Professional" ? AHP_TYPES : f.cat === "Doctor" ? DOCTOR_SPECIALTIES : f.cat === "Pharmacy & Healthcare Science" ? SCIENCE_TYPES : [];
  const body = REG_BODY[f.cat] || "professional";
  const isUK = f.country === "United Kingdom";
  const isIntl = f.country && f.country !== "United Kingdom";
  const minYears = isIntl ? 2 : 1;
  const yearsOk = f.years !== "" && Number(f.years) >= minYears;
  const protectedC = PROTECTED_LIST.includes(f.country);
  const checks = [
    { k: "Category", ok: !!f.cat },
    { k: "Profession / specialty", ok: !!f.prof },
    { k: body + " registration number", ok: !!f.regNo.trim() },
    { k: "Country of residence", ok: !!f.country },
    { k: "Minimum " + minYears + " years' experience", ok: yearsOk },
    { k: "NHS or private experience", ok: !isUK || !!f.sector },
    { k: "Declaration", ok: f.declare },
  ];
  // The CV is asked for but does NOT gate registration. It was required, and
  // the result was that clinicians reached this screen and left: finding and
  // uploading a CV on a phone, minutes after arriving from a LinkedIn post, is
  // where people stop. It is shown as an optional extra below the checklist and
  // requested again once they are in.
  const complete = checks.every((c) => c.ok);
  // The old version of this function set a local flag and told the clinician
  // they were registered. Nothing was written anywhere. The success screen is
  // now shown only after the server confirms it has the record.
  const submit = async () => {
    if (!complete || busy) return;
    setBusy(true); setErr("");
    try {
      const r = await fetch("/api/clinician-register", {
        method: "POST", headers: await authHeaders(true),
        // submit: true is what turns a draft into a registration. Without it the
        // endpoint saves the answers and returns ok, and the clinician is shown
        // "Registration complete" while registeredAt is never set — so they
        // never appear as registered in the founder panel. Tiago hit exactly
        // this.
        body: JSON.stringify({ ...f, years: Number(f.years), submit: true }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) {
        setErr(j.error || "We could not save your registration. Nothing has been lost, please try again.");
        setBusy(false);
        return;
      }
      // Only claim registration when the server confirms it. Anything else is
      // a saved draft, and saying otherwise is how someone ends up believing
      // they have registered when they have not.
      const reg = j.registration || {};
      if (reg.status === "registered" || reg.registeredAt) {
        setDone(true);
        if (onToast) onToast("Registration complete. You are now registered on Qura.");
      } else {
        setErr("Your answers are saved, but the registration did not complete. "
          + (Array.isArray(reg.missing) && reg.missing.length
             ? "Still needed: " + reg.missing.join(", ") + "."
             : "Please try again, or email support@qurahealth.org."));
        setBusy(false);
        return;
      }
    } catch (e) {
      setErr("We could not reach Qura to save your registration. Nothing has been lost, please try again.");
    }
    setBusy(false);
  };
  const lab = { fontSize: 12.5, fontWeight: 600, display: "block", margin: "14px 0 5px" };
  const inp = { width: "100%", padding: "11px 12px", border: "1px solid var(--line)", borderRadius: 10, fontSize: 14, boxSizing: "border-box", background: "#fff" };
  if (done) return (
    <div>
      <PageHead title="Register with Qura" sub="Registration and profile checks" />
      <div className="card" style={{ padding: 40, textAlign: "center", maxWidth: 640, margin: "0 auto" }}>
        <div style={{ width: 64, height: 64, borderRadius: 999, background: "var(--cyan-soft)", display: "grid", placeItems: "center", margin: "0 auto 16px" }}><ShieldCheck size={30} color="#06776F" /></div>
        <h2 className="disp" style={{ fontSize: 24, fontWeight: 700, margin: "0 0 8px" }}>You are registered on Qura</h2>
        <p className="muted" style={{ fontSize: 14.5, lineHeight: 1.6, maxWidth: 460, margin: "0 auto" }}>Your profile is complete and added to the Qura network. Hospital decision-makers and workforce suppliers around the world can now find you. Before any introduction is made we check your registration number directly against the official register, and your profile is then marked verified. We will be in touch as matching roles appear.</p>
        {protectedC ? <div className="chip chip-med" style={{ marginTop: 16 }}>Direct application status applies to your country</div> : null}
      </div>
    </div>
  );
  return (
    <div>
      <PageHead title="Register with Qura" sub="Complete your registration to join the network. Every field is required, so hospitals know each Qura clinician is qualified and employable straight away." right={<span className="chip chip-cyan"><ShieldCheck size={12} /> Complete profiles only</span>} />
      <div className="grid g2" style={{ gap: 16, alignItems: "start" }}>
        <div className="card" style={{ padding: 22 }}>
          <SectionHead title="1. Profession" />
          <label style={lab}>Category</label>
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>{["Nurse / Midwife", "Allied Health Professional", "Doctor", "Pharmacy & Healthcare Science"].map((c) => (<button key={c} onClick={() => { upd("cat", c); upd("prof", ""); }} className="chip" style={{ cursor: "pointer", padding: "9px 14px", background: f.cat === c ? "var(--navy)" : "#EEF1F7", color: f.cat === c ? "#fff" : "#5A6783" }}>{c}</button>))}</div>
          {f.cat ? <><label style={lab}>{f.cat === "Doctor" ? "Specialty (general or niche)" : "Profession"}</label>
          <select value={f.prof} onChange={(e) => upd("prof", e.target.value)} style={inp}><option value="">Select...</option>{profs.map((p) => <option key={p} value={p}>{p}</option>)}</select>
          <label style={lab}>{body} registration number</label>
          <input value={f.regNo} onChange={(e) => upd("regNo", e.target.value)} placeholder={"Your " + body + " PIN / reference"} style={inp} /></> : <p className="faint" style={{ fontSize: 13, marginTop: 10 }}>Choose a category to see the relevant professions and registration body.</p>}

          <div style={{ height: 1, background: "var(--line)", margin: "22px 0" }} />
          <SectionHead title="2. Experience & location" />
          <label style={lab}>Country of residence</label>
          <select value={f.country} onChange={(e) => upd("country", e.target.value)} style={inp}><option value="">Select...</option>{RESIDENCE_LIST.map((c) => <option key={c} value={c}>{c}</option>)}</select>
          {protectedC ? <div className="row" style={{ gap: 8, marginTop: 10, fontSize: 12.5, color: "#9A5E00", background: "var(--amber-bg)", padding: "9px 11px", borderRadius: 9, lineHeight: 1.5 }}><ShieldCheck size={14} style={{ flexShrink: 0, marginTop: 1 }} /><span>Your country is on the WHO and UK protected-countries list. You are welcome to register and apply directly, of your own accord. Qura will not actively target recruitment from your country.</span></div> : null}
          <label style={lab}>Years of experience{isIntl ? " (2 years minimum for international candidates)" : " (1 year minimum)"}</label>
          <input type="number" min="0" value={f.years} onChange={(e) => upd("years", e.target.value)} placeholder="e.g. 5" style={{ ...inp, borderColor: f.years !== "" && !yearsOk ? "var(--red)" : "var(--line)" }} />
          {f.years !== "" && !yearsOk ? <div className="faint" style={{ fontSize: 12, color: "var(--red)", marginTop: 5 }}>A minimum of {minYears} year{minYears > 1 ? "s" : ""} is required to join.</div> : null}
          {isUK ? <><label style={lab}>UK experience</label><div className="row" style={{ gap: 8, flexWrap: "wrap" }}>{["NHS", "Private", "Both"].map((sct) => (<button key={sct} onClick={() => upd("sector", sct)} className="chip" style={{ cursor: "pointer", padding: "8px 14px", background: f.sector === sct ? "var(--blue)" : "#EEF1F7", color: f.sector === sct ? "#fff" : "#5A6783" }}>{sct}</button>))}</div></> : null}

          <div style={{ height: 1, background: "var(--line)", margin: "22px 0" }} />
          <SectionHead title="3. Proof of experience" />
          <label style={lab}>Upload your CV (PDF or Word) — optional</label>
          <div className="muted" style={{ fontSize: 12.5, marginBottom: 8, lineHeight: 1.5 }}>
            Not needed to register. You can add it now or later from your profile,
            and hospitals see far more of you once it is there.
          </div>
          <label className="btn btn-light" style={{ cursor: "pointer", justifyContent: "center", width: "100%" }}><FileText size={15} /> {cvBusy ? "Uploading..." : (f.cv ? "Replace CV" : "Choose file")}<input type="file" accept=".pdf,.doc,.docx" onChange={onCv} style={{ display: "none" }} /></label>
          {f.cv ? <div className="row" style={{ gap: 8, marginTop: 8, fontSize: 13 }}><Check size={15} color="#0E8C7E" /> {f.cv}{f.cvPath ? <span className="faint" style={{ fontSize: 11.5 }}>(stored securely)</span> : null}</div> : null}
          <label className="row" style={{ gap: 9, fontSize: 13, cursor: "pointer", marginTop: 18, alignItems: "flex-start", lineHeight: 1.45 }}><input type="checkbox" checked={f.declare} onChange={(e) => upd("declare", e.target.checked)} style={{ marginTop: 2 }} /> I confirm the information provided is accurate, my registration is current, and I consent to Qura holding this data in line with the privacy notice.</label>
        </div>
        <div className="card" style={{ padding: 22, position: "sticky", top: 16 }}>
          <SectionHead title="Registration status" />
          <p className="muted" style={{ fontSize: 12.5, marginTop: 0, marginBottom: 14 }}>You can only join once every item is complete. This is how we keep the network complete and employable.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{checks.map((c) => (<div key={c.k} className="row" style={{ gap: 9, fontSize: 13.5, color: c.ok ? "var(--text)" : "var(--muted)" }}>{c.ok ? <Check size={16} color="#0E8C7E" style={{ flexShrink: 0 }} /> : <span style={{ width: 16, height: 16, borderRadius: 999, border: "1.6px solid var(--line)", flexShrink: 0 }} />}{c.k}</div>))}</div>
          <button onClick={submit} disabled={!complete || busy} className={"btn " + (complete ? "btn-primary" : "btn-light")} style={{ width: "100%", justifyContent: "center", marginTop: 20 }}>{busy ? "Saving..." : (complete ? "Complete registration" : "Complete all items to join")}</button>
          {err ? <div style={{ fontSize: 12.5, color: "var(--red)", marginTop: 10, lineHeight: 1.5 }}>{err}</div> : null}
          <div className="faint" style={{ fontSize: 11.5, marginTop: 10, lineHeight: 1.5 }}>An incomplete profile cannot join the network. Your answers are saved as you go, so you can come back and finish later.</div>
        </div>
      </div>
    </div>
  );
}
