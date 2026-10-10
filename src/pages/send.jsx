// The SEND tab (/send): SEND Intelligence for specialist SEND staffing and therapy suppliers.
// Moved out of App.jsx on 10 October 2026 so it can change without that file, and the top
// half redrawn in 2 columns (text left, film right) so it no longer sits in a narrow band
// on wide screens. Registering interest opens the SEND screen in the app.

import React from "react";
import { Building2, Search, FileText, Network, Bell, Sparkles, ShieldCheck } from "lucide-react";
import { SendFilm } from "./agency.jsx";

const SEND_FEATURES = [
  [Building2, "Schools", "About 5,900 schools", "Every special school, alternative provision and school with an SEN unit across the UK, from each nation's official list, with daily checks of their own jobs pages where they publish one."],
  [Search, "Vacancies", "Live SEND vacancies", "Posted on schools' own websites, picked up by the daily checks and linked to the original advert."],
  [FileText, "Tenders", "Tenders and renewals", "SEND tenders, pre-tender notices, frameworks and contracts coming up for renewal, so you are ready before they land."],
  [Network, "Councils", "Councils under pressure", "EHC plan growth, assessment delays, high-needs funding, Safety Valve and Delivering Better Value, area SEND inspections and Ofsted concerns."],
  [Bell, "Territories", "A morning alert, a Monday briefing", "Choose your councils, settings and professions. Matching vacancies arrive each morning, with a briefing every Monday."],
  [Sparkles, "Outreach", "Drafted in seconds", "An AI first draft for each vacancy, plus exports and your Qura pipeline. You check every line and send it yourself."],
];

const css = ".send-hero{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.15fr);gap:48px;align-items:center;max-width:1240px;margin:0 auto}"
  + ".send-hero h1,.send-hero p{text-align:left}"
  + ".send-feats{display:grid;gap:16px;grid-template-columns:repeat(3,minmax(0,1fr));margin-bottom:28px}"
  + "@media(max-width:960px){.send-hero{grid-template-columns:1fr;gap:28px}.send-hero .send-copy{text-align:center}.send-hero h1,.send-hero p{text-align:center}.send-hero .send-btns{justify-content:center}.send-feats{grid-template-columns:repeat(2,minmax(0,1fr))}}"
  + "@media(max-width:620px){.send-feats{grid-template-columns:1fr}}";

export default function SendSection() {
  return (
    <div className="sec send">
      <style>{css}</style>
      <div style={{ background: "linear-gradient(160deg,#0A1A30,#13243F)", color: "#fff", padding: "56px 28px 40px" }}>
        <div className="send-hero">
          <div className="send-copy">
            <span className="chip chip-cyan" style={{ background: "rgba(0,194,184,.15)", color: "var(--cyan)" }}>SEND Intelligence</span>
            <h1 className="disp" style={{ fontSize: "clamp(30px,4.2vw,50px)", fontWeight: 700, margin: "16px 0 14px", lineHeight: 1.08 }}>
              <span style={{ display: "inline-block" }}>Every special school.</span> <span style={{ display: "inline-block" }}>Every vacancy.</span> <span style={{ color: "var(--cyan)", display: "inline-block" }}>Every morning.</span>
            </h1>
            <p style={{ color: "#AEBED6", fontSize: 17, lineHeight: 1.6, margin: "0 0 24px" }}>
              For specialist SEND staffing and therapy suppliers. Qura checks the jobs pages of special schools, alternative provision and SEN units every day, and puts the vacancies, tenders and council signals for all 4 UK nations in one place.
            </p>
            <div className="row send-btns" style={{ gap: 10, flexWrap: "wrap" }}>
              <a href="/?open=send" className="btn lift" style={{ background: "var(--cyan)", color: "var(--navy)", fontWeight: 800, padding: "12px 24px", textDecoration: "none" }}>Register your interest</a>
              <a href="/send-data" className="btn" style={{ background: "transparent", color: "#fff", border: "1px solid #3B5A88", fontWeight: 700, padding: "12px 24px", textDecoration: "none" }}>How we use public data</a>
            </div>
          </div>
          <div><SendFilm cta={false} /></div>
        </div>
      </div>
      <div className="wrap" style={{ padding: "52px 28px 56px", maxWidth: 1240 }}>
        <div style={{ textAlign: "center", maxWidth: 660, margin: "0 auto 28px" }}>
          <div className="eyebrow" style={{ color: "#06776F" }}>What you see each morning</div>
          <h2 className="disp" style={{ fontSize: "clamp(24px,3.4vw,34px)", fontWeight: 700, margin: "10px 0 0" }}>One place for SEND demand</h2>
        </div>
        <div className="send-feats">
          {SEND_FEATURES.map(([Ic, k, h, b]) => (
            <div key={k} className="card lift" style={{ padding: 24 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: "var(--cyan-soft)", display: "grid", placeItems: "center", marginBottom: 12 }}><Ic size={20} color="#06776F" /></div>
              <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "#06776F" }}>{k}</div>
              <div style={{ fontWeight: 700, fontSize: 16.5, margin: "4px 0 6px" }}>{h}</div>
              <div className="muted" style={{ fontSize: 14, lineHeight: 1.55 }}>{b}</div>
            </div>
          ))}
        </div>
        <div style={{ background: "linear-gradient(160deg,#0A1A30,#13243F)", color: "#fff", borderRadius: 18, padding: "28px 30px", display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div style={{ maxWidth: 600 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--cyan)" }}>Founding SEND Partner</div>
            <div className="disp" style={{ fontSize: "clamp(22px,3vw,30px)", fontWeight: 700, margin: "8px 0" }}>5 places. 50% off for 12 months.</div>
            <div style={{ color: "#C4D0E2", fontSize: 14.5, lineHeight: 1.55 }}>The first five SEND customers get half price for their first year, with no setup fee. Places open soon: register your interest and a founder will be in touch.</div>
          </div>
          <a href="/?open=send" className="btn lift" style={{ background: "var(--cyan)", color: "var(--navy)", fontWeight: 800, padding: "12px 24px", textDecoration: "none" }}>Register your interest</a>
        </div>
        <div className="card" style={{ padding: "22px 26px" }}>
          <div className="row" style={{ gap: 8, marginBottom: 10 }}><ShieldCheck size={18} color="#06776F" /><b>Built on public data</b></div>
          <ul className="muted" style={{ margin: 0, paddingLeft: 20, lineHeight: 1.7, fontSize: 14.5 }}>
            <li>Schools come from each nation's official school list (England, Scotland, Wales and Northern Ireland), under the Open Government Licence.</li>
            <li>Vacancies come only from school, trust and council pages Qura is allowed to check. Coverage is partial and shown openly.</li>
            <li>Qura holds no data about pupils, families or EHC plans. <a href="/send-data">How Qura uses data</a>.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
