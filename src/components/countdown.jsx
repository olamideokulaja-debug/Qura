import React, { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { LAUNCH_AT } from "../launch.js";

// Extracted from App.jsx on 27 July 2026.
//
// The date now comes from src/launch.js rather than a second copy here, so the
// countdown, the client-side seed switch and the API switch cannot drift apart.
// They did: this file said 22 September 09:00 while the rest of the platform
// moved to Monday 21 September 00:00.
//
// THE EMAIL CAPTURE HAS BEEN REMOVED, for two reasons.
//
// It never worked. It wrote to window.storage, which does not exist in an
// ordinary browser, so every address typed into it was answered with "You are
// on the early-access list" and saved nowhere at all. Any early-access list
// collected through this box does not exist.
//
// And it is no longer the right ask. Clinicians can create a free account
// today, so sending them to the real sign-up is both honest and more useful
// than collecting an address for a list.
export const LAUNCH_DATE = new Date(LAUNCH_AT).toISOString();

export function CountdownBanner({ onEnter }) {
  const target = LAUNCH_AT;
  const [now, setNow] = useState(Date.now());
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

  // Hides itself the moment the launch instant passes. Nothing to remember and
  // nothing to deploy on the day.
  if (diff <= 0) return null;

  const box = (v, l) => (
    <div style={{ textAlign: "center", minWidth: 62 }}>
      <div className="disp" style={{ fontSize: 36, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{String(v).padStart(2, "0")}</div>
      <div style={{ fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(255,255,255,.6)", marginTop: 5 }}>{l}</div>
    </div>
  );

  return (
    <div style={{ background: "linear-gradient(120deg, #0A1730 0%, #123A63 55%, #0E8C7E 100%)", borderRadius: 22, padding: "30px 24px", margin: "0 auto 30px", maxWidth: 900, color: "#fff", boxShadow: "0 18px 46px rgba(10,23,48,.30)" }}>
      <div className="row" style={{ justifyContent: "center", marginBottom: 8 }}>
        <span className="chip" style={{ background: "rgba(0,194,184,.22)", color: "#9FF6EF", border: "1px solid rgba(0,194,184,.4)" }}>{spot.tag}</span>
      </div>
      <div className="disp" style={{ textAlign: "center", fontWeight: 800, fontSize: 25, marginBottom: 5 }}>{spot.title}</div>
      <div style={{ textAlign: "center", fontSize: 13.5, opacity: .82, maxWidth: 560, margin: "0 auto 20px", lineHeight: 1.5 }}>{spot.line}</div>
      <div className="row" style={{ justifyContent: "center", gap: 18, marginBottom: 20 }}>{box(d, "Days")}{box(h, "Hrs")}{box(m, "Min")}{box(sec, "Sec")}</div>
      <div className="row" style={{ justifyContent: "center" }}>
        <button onClick={() => onEnter && onEnter()} className="btn lift" style={{ background: "#00C2B8", color: "#04231F", fontWeight: 800, padding: "12px 24px" }}>
          Register here <ArrowRight size={15} />
        </button>
      </div>
      <div style={{ textAlign: "center", fontSize: 11.5, opacity: .6, marginTop: 14 }}>
        Free for clinicians, always. Organisations open {new Date(LAUNCH_AT).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.
      </div>
    </div>
  );
}
