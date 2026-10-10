// The suppliers page (/for-suppliers). Moved out of App.jsx on 10 October 2026 so it can change
// without that file, and the top half redrawn in 2 columns (text left, film right) as on /send.

import React from "react";
import { ArrowRight } from "lucide-react";
import { track } from "../lib/analytics.js";
import { StoreBadges } from "../components/store.jsx";
import { AgencyFilm } from "./agency.jsx";
import { HERO2_CSS } from "./clinician.jsx";

const SUPPLIER_TAGLINES = [
  { h: "Your whole pipeline in your pocket", b: "Track candidates and BD opportunities worldwide, in real time, from your phone. No desk required." },
  { h: "Never out of touch", b: "Being out of office doesn't mean being out of reach. Stay connected to clients and clinicians 24/7." },
  { h: "Connect the moment it counts", b: "Reach clinicians instantly, during clinic hours or after. BD isn't limited to 9 to 5." },
  { h: "Nothing slips through", b: "Emails vanish in clinician inboxes daily. Your AI assistant on Qura replies at any hour, so no opportunity is lost." },
];

export default function SupplierAppSection() {
  return (
    <div id="suppliers-app" className="sec suppliers-app" style={{ background: "linear-gradient(160deg,#0A1A30,#13243F)", color: "#fff", padding: "56px 24px 60px" }}>
      <style>{HERO2_CSS}</style>
      <div className="wrap">
        <div className="hero2">
          <div className="hero2-copy">
            <span className="chip chip-cyan" style={{ background: "rgba(0,194,184,.15)", color: "var(--cyan)" }}>For workforce suppliers</span>
            <h1 className="disp" style={{ fontSize: "clamp(30px,4.2vw,50px)", fontWeight: 700, margin: "16px 0 12px", lineHeight: 1.08 }}>Your pipeline, in your pocket.</h1>
            <p style={{ color: "#AEBED6", fontSize: 17, lineHeight: 1.6, margin: "0 0 22px" }}>Being out of office doesn't mean being out of touch. Run your business development from your phone, wherever you are.</p>
            <a href="/founding-partner.html" onClick={() => track("supplier_film_cta")} className="btn lift"
              style={{ background: "var(--cyan)", color: "var(--navy)", fontWeight: 800, padding: "12px 24px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
              Join as a Founding Partner <ArrowRight size={16} />
            </a>
            <div style={{ color: "#AEBED6", fontSize: 12.5, marginTop: 9 }}>12 months of Qura Growth, free. Join by 31 December 2026.</div>
          </div>
          <div><AgencyFilm cta={false} /></div>
        </div>
        <div style={{ display: "grid", gap: 12, maxWidth: 1240, margin: "0 auto 28px", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,240px),1fr))" }}>
          {SUPPLIER_TAGLINES.map((t, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 14, padding: "18px 20px", textAlign: "left" }}>
              <div style={{ fontWeight: 700, fontSize: 15.5, marginBottom: 6 }}>{t.h}</div>
              <div style={{ fontSize: 14, lineHeight: 1.5, color: "#C4D0E2" }}>{t.b}</div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center" }}>
          <StoreBadges />
          <div style={{ fontSize: 12, color: "#8697B0", marginTop: 14 }}>Free on Android. Run your pipeline from your phone.</div>
        </div>
      </div>
    </div>
  );
}
