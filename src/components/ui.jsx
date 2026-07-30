import { APP_NAME } from "../constants.js";
import React, { useEffect, useRef, useState } from "react";
import { Star, TrendingUp } from "lucide-react";

// Shared building blocks, extracted from App.jsx on 27 July 2026.
// Presentation only: no data and no business logic.

export const QuraLogo = ({ size = 34, light }) => (
  <svg width={size} height={size} viewBox="0 0 44 44" fill="none" aria-label={`${APP_NAME} logo`}>
    <circle cx="20" cy="20" r="12.5" stroke={light ? "#fff" : "var(--navy)"} strokeWidth="3.4" fill="none" />
    <path d="M26.5 26.5 L33 33" stroke={light ? "#fff" : "var(--navy)"} strokeWidth="3.6" strokeLinecap="round" />
    <rect x="13.4" y="22" width="3.1" height="6" rx="1.2" fill="#2BB6A8" />
    <rect x="18.1" y="18" width="3.1" height="10" rx="1.2" fill="#1FA0A6" />
    <rect x="22.8" y="14" width="3.1" height="14" rx="1.2" fill="#178FB0" />
  </svg>
);

export const Wordmark = ({ light, sub = "HEALTHCARE GROWTH CRM" }) => (
  <div className="row" style={{ gap: 11 }}>
    <QuraLogo light={light} />
    <div style={{ lineHeight: 1 }}>
      <div className="disp" style={{ fontWeight: 700, fontSize: 20, color: light ? "#fff" : "var(--navy)" }}>{APP_NAME}</div>
      <div style={{ fontSize: 8.5, letterSpacing: ".16em", fontWeight: 600, color: light ? "#9FB0D0" : "var(--faint)" }}>{sub}</div>
    </div>
  </div>
);

export const Avatar = ({ src, initials, size = 36 }) => src
  ? <img src={src} alt="" style={{ width: size, height: size, borderRadius: 999, objectFit: "cover" }} />
  : <div className="disp" style={{ width: size, height: size, borderRadius: 999, background: "var(--navy)", color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, fontSize: size * 0.36 }}>{initials}</div>;

export function useCountUp(target, dur = 1100) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf, start;
    const tick = (t) => { if (!start) start = t; const p = Math.min((t - start) / dur, 1); setV(target * (1 - Math.pow(1 - p, 3))); if (p < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf);
  }, [target, dur]); return v;
}

export const Stat = ({ label, value, delta, icon: Icon, accent }) => (
  <div className="card lift" style={{ padding: 20 }}>
    <div className="row" style={{ justifyContent: "space-between" }}>
      <div style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase" }} className="muted">{label}</div>
      <div style={{ width: 36, height: 36, borderRadius: 10, display: "grid", placeItems: "center", background: accent === "cyan" ? "var(--cyan-soft)" : accent === "violet" ? "var(--violet-soft)" : "#EAF0FF" }}><Icon size={17} color={accent === "cyan" ? "#076B61" : accent === "violet" ? "#5B3FD6" : "#1E54E6"} /></div>
    </div>
    <div className="num" style={{ fontSize: 28, fontWeight: 600, marginTop: 14 }}>{value}</div>
    {delta && <div style={{ fontSize: 12.5, marginTop: 6 }} className="row up"><TrendingUp size={13} style={{ marginRight: 4 }} />{delta}</div>}
  </div>
);

export const Kpi = ({ label, value, prefix = "", suffix = "", delta, icon: Icon, accent, decimals = 0 }) => {
  const n = useCountUp(value);
  const shown = prefix + (decimals ? n.toFixed(decimals) : Math.round(n).toLocaleString()) + suffix;
  return (
    <div className="card lift" style={{ padding: 20 }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <span className="muted" style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase" }}>{label}</span>
        <div style={{ width: 36, height: 36, borderRadius: 10, display: "grid", placeItems: "center", background: accent === "cyan" ? "var(--cyan-soft)" : accent === "violet" ? "var(--violet-soft)" : "#EAF0FF" }}><Icon size={17} color={accent === "cyan" ? "#076B61" : accent === "violet" ? "#5B3FD6" : "#1E54E6"} /></div>
      </div>
      <div className="num" style={{ fontSize: 28, fontWeight: 600, marginTop: 14 }}>{shown}</div>
      {delta && <div className="row up" style={{ fontSize: 12.5, marginTop: 6 }}><TrendingUp size={13} style={{ marginRight: 4 }} />{delta}</div>}
    </div>
  );
};

export const SectionHead = ({ title, action }) => (<div className="row" style={{ justifyContent: "space-between", marginBottom: 16 }}><h3 style={{ fontSize: 17, fontWeight: 600, margin: 0, letterSpacing: "-.01em" }}><span className="sh-accent" />{title}</h3>{action}</div>);

export const PageHead = ({ title, sub, right }) => (
  <div className="row" style={{ justifyContent: "space-between", marginBottom: 26, flexWrap: "wrap", gap: 14 }}>
    <div><div className="ph-accent" /><h1 className="ph-title" style={{ fontSize: 30, fontWeight: 700, margin: 0, letterSpacing: "-.025em", lineHeight: 1.05 }}>{title}</h1>{sub && <div className="muted" style={{ marginTop: 9, fontSize: 15, maxWidth: 660, lineHeight: 1.5 }}>{sub}</div>}</div>{right}
  </div>
);

export const Toggle = ({ on, onClick }) => (<button onClick={onClick} style={{ width: 42, height: 24, borderRadius: 999, background: on ? "var(--teal)" : "#D5DCE8", position: "relative", transition: ".18s", flexShrink: 0 }}><span style={{ position: "absolute", top: 3, left: on ? 21 : 3, width: 18, height: 18, borderRadius: 999, background: "#fff", transition: ".18s", boxShadow: "0 1px 3px rgba(10,23,51,.25)" }} /></button>);

export const Stars = ({ n }) => (<span className="row" style={{ gap: 1 }}>{[1, 2, 3, 4, 5].map((i) => (<Star key={i} size={13} color="#F2A33C" fill={i <= Math.round(n) ? "#F2A33C" : "none"} />))}</span>);

export const Reveal = ({ children, delay = 0, style }) => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { el.classList.add("in"); io.unobserve(el); } }), { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });
    io.observe(el); return () => io.disconnect();
  }, []);
  return <div ref={ref} className="rv" style={{ transitionDelay: delay + "ms", ...(style || {}) }}>{children}</div>;
};

export const PulseLine = ({ w = 320, color = "var(--cyan)" }) => (
  <svg viewBox="0 0 600 40" width={w} height="40" style={{ maxWidth: "82%" }} aria-hidden="true">
    <path className="draw" d="M0 20 H232 l16 -15 14 28 18 -34 12 21 H600" stroke={color} strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// A small label for any figure that is illustrative rather than measured.
export const DemoTag = () => (
  <span style={{ background: "#FFF4E0", border: "1px solid #F0D9A8", color: "#9A5E00", fontSize: 10.5,
    fontWeight: 700, letterSpacing: ".06em", padding: "3px 8px", borderRadius: 6, whiteSpace: "nowrap" }}>
    ILLUSTRATIVE
  </span>
);

// A banner for a whole screen of illustrative figures.
export const IllustrativeBanner = ({ note }) => (
  <div style={{ background: "#FFF8EC", border: "1px solid #F0D9A8", borderRadius: 12, padding: "12px 16px",
    marginBottom: 16, display: "flex", gap: 10, alignItems: "flex-start" }}>
    <span style={{ fontSize: 15, lineHeight: "20px" }}>{"\u26A0"}</span>
    <div style={{ fontSize: 13, lineHeight: 1.55, color: "#7A4B00" }}>
      <strong>Illustrative figures.</strong> {note || "The numbers on this screen are example data used to demonstrate the reporting. They are not Qura's trading position and must not be quoted or screenshotted as such."}
    </div>
  </div>
);
