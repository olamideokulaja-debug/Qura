import React, { useEffect, useState } from "react";
import { ArrowRight, Check } from "lucide-react";

// Extracted from App.jsx on 27 July 2026. Behaviour unchanged.

export const LAUNCH_DATE = "2026-09-22T09:00:00";

export function CountdownBanner() {
  const target = new Date(LAUNCH_DATE).getTime();
  const [now, setNow] = useState(Date.now());
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState(false);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const diff = Math.max(0, target - now);
  const d = Math.floor(diff / 86400000), h = Math.floor(diff / 3600000) % 24, m = Math.floor(diff / 60000) % 60, sec = Math.floor(diff / 1000) % 60;
  const DAILY = [
    { tag: "For clinicians", title: "Get verified once, be seen everywhere", line: "One vetted profile, in front of hospitals and workforce suppliers worldwide, every day." },
    { tag: "For workforce suppliers", title: "Win work in the time others spend searching", line: "Stop mapping the market by hand. Live demand and decision-makers on one platform." },
    { tag: "For hospitals", title: "Ready-to-start talent in seconds, not weeks", line: "Search ready-to-start clinicians and request introductions the moment a need appears." },
    { tag: "For medical device companies", title: "Reach the buyers who actually buy", line: "The decision-makers behind every trust and ICB, on one live platform." },
    { tag: "For GP & care", title: "Fill sessions and shifts faster", line: "Find available GPs, nurses and carers, with compliance built in." },
  ];
  const spot = DAILY[new Date().getDate() % DAILY.length];
  const join = async () => {
    if (!email || !email.includes("@")) return;
    try { let list = []; const r = await window.storage?.get("qura_waitlist"); if (r?.value) list = JSON.parse(r.value); if (!Array.isArray(list)) list = []; if (!list.includes(email)) { list.push(email); await window.storage?.set("qura_waitlist", JSON.stringify(list)); } } catch (e) {}
    setJoined(true);
  };
  if (diff <= 0) return null;
  const box = (v, l) => (<div style={{ textAlign: "center", minWidth: 62 }}><div className="disp" style={{ fontSize: 36, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{String(v).padStart(2, "0")}</div><div style={{ fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(255,255,255,.6)", marginTop: 5 }}>{l}</div></div>);
  return (
    <div style={{ background: "linear-gradient(120deg, #0A1730 0%, #123A63 55%, #0E8C7E 100%)", borderRadius: 22, padding: "30px 24px", margin: "0 auto 30px", maxWidth: 900, color: "#fff", boxShadow: "0 18px 46px rgba(10,23,48,.30)" }}>
      <div className="row" style={{ justifyContent: "center", marginBottom: 8 }}><span className="chip" style={{ background: "rgba(0,194,184,.22)", color: "#9FF6EF", border: "1px solid rgba(0,194,184,.4)" }}>{spot.tag}</span></div>
      <div className="disp" style={{ textAlign: "center", fontWeight: 800, fontSize: 25, marginBottom: 5 }}>{spot.title}</div>
      <div style={{ textAlign: "center", fontSize: 13.5, opacity: .82, maxWidth: 560, margin: "0 auto 20px", lineHeight: 1.5 }}>{spot.line}</div>
      <div className="row" style={{ justifyContent: "center", gap: 18, marginBottom: 20 }}>{box(d, "Days")}{box(h, "Hrs")}{box(m, "Min")}{box(sec, "Sec")}</div>
      {joined ? (
        <div style={{ textAlign: "center", fontWeight: 700, fontSize: 14.5 }}><Check size={16} style={{ verticalAlign: "middle" }} /> You are on the early-access list. See you at launch.</div>
      ) : (
        <div className="row" style={{ gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@organisation.com" style={{ padding: "12px 16px", borderRadius: 999, border: "none", minWidth: 260, fontSize: 14, outline: "none" }} />
          <button onClick={join} className="btn lift" style={{ background: "#00C2B8", color: "#04231F", fontWeight: 800, padding: "12px 22px" }}>Get early access <ArrowRight size={15} /></button>
        </div>
      )}
      <div style={{ textAlign: "center", fontSize: 11.5, opacity: .6, marginTop: 14 }}>Launching {new Date(LAUNCH_DATE).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}. A different side of Qura revealed each day.</div>
    </div>
  );
}
