import React, { useState } from "react";
import { Check } from "lucide-react";
import { StoreBadges } from "../components/store.jsx";

// Extracted from App.jsx on 27 July 2026. Behaviour unchanged.

export const CLIN_TAGLINES = [
  "Take your career into your own hands and track your application process in real time.",
  "No more sending your CV and hoping, without any visibility.",
  "Step by step updates on your application to the most reputable hospitals globally, via Qura.",
];

export const CLIN_UNIVERSAL = ["At least 2 years of post-qualification experience", "A CV with evidence of your qualification", "You have held a previous clinical role (qualified staff only, not students or aspiring)"];

export const CLIN_TABS = ["United Kingdom", "Australia", "United States", "Dubai (UAE)", "Nigeria", "Ireland", "Canada"];

export const CLIN_COUNTRIES = {
  "United Kingdom": { flag: "\uD83C\uDDEC\uD83C\uDDE7", reg: "GMC / NMC / HCPC", items: ["Registration or eligibility with the relevant UK regulator", "English language evidence (IELTS/OET) where required", "Right to work or a Health and Care Worker visa"] },
  "Australia": { flag: "\uD83C\uDDE6\uD83C\uDDFA", reg: "AHPRA", items: ["Registration or eligibility with AHPRA", "English language evidence where required", "Skills assessment and an eligible work visa"] },
  "United States": { flag: "\uD83C\uDDFA\uD83C\uDDF8", reg: "State board / ECFMG", items: ["ECFMG certification and USMLE for doctors, where applicable", "State licensure or eligibility", "An eligible US work visa"] },
  "Dubai (UAE)": { flag: "\uD83C\uDDE6\uD83C\uDDEA", reg: "DHA / DOH / MOHAP", items: ["Eligibility for licensing with a UAE authority", "Primary source verification (DataFlow)", "Employer visa sponsorship"] },
  "Nigeria": { flag: "\uD83C\uDDF3\uD83C\uDDEC", reg: "MDCN / NMCN / PCN", items: ["Current registration with the relevant Nigerian regulator", "Evidence of qualification and a current practising licence", "Internship / NYSC where applicable"] },
  "Ireland": { flag: "\uD83C\uDDEE\uD83C\uDDEA", reg: "IMC / NMBI / CORU", items: ["Registration or eligibility with the relevant Irish regulator", "English language evidence where required", "Eligibility to work in Ireland / EU"] },
  "Canada": { flag: "\uD83C\uDDE8\uD83C\uDDE6", reg: "Provincial colleges", items: ["Eligibility with the relevant provincial college", "Credential assessment (NNAS / MCC)", "An eligible Canadian work permit or PR pathway"] },
};

export function ClinicianSection({ onEnter }) {
  const [country, setCountry] = useState(CLIN_TABS[0]);
  const c = CLIN_COUNTRIES[country];
  return (
    <div id="clinicians" className="sec clinicians" style={{ background: "var(--navy)", color: "#fff", padding: "84px 24px" }}>
      <div className="wrap">
        <div style={{ textAlign: "center", maxWidth: 760, margin: "0 auto 10px" }}>
          <span className="chip chip-cyan" style={{ background: "rgba(0,194,184,.15)", color: "var(--cyan)" }}>For clinicians</span>
          <h2 className="disp" style={{ fontSize: "clamp(26px,4vw,40px)", fontWeight: 700, margin: "16px 0 8px", lineHeight: 1.1 }}>Your move abroad, in your hands.</h2>
        </div>
        <div style={{ display: "grid", gap: 12, maxWidth: 820, margin: "0 auto 20px", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))" }}>
          {CLIN_TAGLINES.map((t, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 14, padding: "16px 18px", fontSize: 15, lineHeight: 1.5 }}>{t}</div>
          ))}
        </div>
        <div style={{ maxWidth: 820, margin: "0 auto 26px", textAlign: "center", color: "#AEBED6", fontSize: 14.5, lineHeight: 1.65 }}>
          Clinical managers rarely give feedback in the time frames shown in adverts. It is not that they do not want to, they are overwhelmed with work and cannot keep up. Qura has stepped in to filter the talent. If your CV matches the requirements, Qura has increased the likelihood of you being found. Sign up today and start getting notified.
        </div>

        <div style={{ maxWidth: 900, margin: "0 auto", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 18, padding: 22 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14, textAlign: "center" }}>Where do you want to work? Check what it takes.</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 20 }}>
            {CLIN_TABS.map((t) => (
              <button key={t} onClick={() => setCountry(t)} style={{ cursor: "pointer", padding: "8px 14px", borderRadius: 999, fontSize: 13, fontWeight: 600,
                background: country === t ? "var(--cyan)" : "rgba(255,255,255,.06)", color: country === t ? "var(--navy)" : "#fff",
                border: "1px solid " + (country === t ? "var(--cyan)" : "rgba(255,255,255,.15)") }}>{CLIN_COUNTRIES[t].flag} {t}</button>
            ))}
          </div>
          <div style={{ display: "grid", gap: 18, gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>
            <div>
              <div style={{ fontSize: 12.5, color: "var(--cyan)", fontWeight: 600, marginBottom: 8, letterSpacing: ".04em" }}>REGULATOR: {c.reg}</div>
              {c.items.map((it, i) => (
                <div key={i} style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 8, paddingLeft: 18, position: "relative" }}>
                  <span style={{ position: "absolute", left: 0, color: "var(--cyan)" }}>{"\u2713"}</span>{it}
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 12.5, color: "#AEBED6", fontWeight: 600, marginBottom: 8, letterSpacing: ".04em" }}>EVERYONE ALSO NEEDS</div>
              {CLIN_UNIVERSAL.map((it, i) => (
                <div key={i} style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 8, paddingLeft: 18, position: "relative" }}>
                  <span style={{ position: "absolute", left: 0, color: "#AEBED6" }}>{"\u2022"}</span>{it}
                </div>
              ))}
            </div>
          </div>
          <div style={{ textAlign: "center", marginTop: 22 }}>
            <button className="btn btn-primary" onClick={onEnter} style={{ padding: "12px 28px", fontSize: 15 }}>Check my eligibility & sign up</button>
            <div style={{ fontSize: 12, color: "#8697B0", marginTop: 10, marginBottom: 22 }}>Guidance only, not immigration advice. Requirements are confirmed during verification.</div>
            <div style={{ fontSize: 13.5, color: "#AEBED6", marginBottom: 14, fontWeight: 600 }}>Track your applications in real time. Get the app.</div>
            <StoreBadges />
            <div style={{ fontSize: 12, color: "#8697B0", marginTop: 12 }}>Available on iOS and Android.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
