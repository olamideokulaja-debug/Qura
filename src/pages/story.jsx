// "Our story" page, redesigned 10 October 2026 (Olamide's brief: new layout, founder profiles
// with photographs). Kept in its own file so the story can change without moving App.jsx,
// which is too large to update through the usual tooling. App.jsx renders <OurStory /> inside
// the "sec story" section the site's router shows and hides.
//
// Every claim here comes from the previous story text or from facts the founders have given.
// The photographs are of the founders themselves.

import React from "react";
import { ArrowRight, Award, ShieldCheck, Sparkles, Globe, Star, TrendingUp, MapPin } from "lucide-react";
import { imgOlamide } from "./photoOlamide.js";
import { imgOla } from "./photoOla.js";

const FOUNDERS = [
  {
    name: "Ola Folawiyo", role: "Co-Founder and Chief Executive Officer", place: "United Kingdom", img: imgOla,
    alt: "Ola Folawiyo, Co-Founder and Chief Executive Officer of Qura",
    bio: [
      "Ola spent more than a decade in senior healthcare business development across the UK, helping healthcare organisations and staffing agencies win high-value partnerships.",
      "He stepped away from a senior leadership role with one question: what if that knowledge could lift the whole sector, beyond a single organisation? Qura is his answer. He leads the company, its partnerships and its work with suppliers and providers.",
    ],
  },
  {
    name: "Dr Olamide Okulaja", role: "Co-Founder and Chief Growth Officer", place: "Lagos, Nigeria", img: imgOlamide,
    alt: "Dr Olamide Okulaja, Co-Founder and Chief Growth Officer of Qura",
    bio: [
      "Olamide is a medical doctor whose career spans healthcare financing, policy and large-scale health system transformation, working alongside governments and health systems across Africa.",
      "He has led programmes that widen access to care and health coverage, and helped deliver one of the continent's most ambitious cancer programmes. At Qura he leads growth, the platform and its intelligence.",
    ],
  },
];

const CHAPTERS = [
  { n: "01", t: "Two careers inside healthcare", b: "Between us we have spent more than 32 years across healthcare business development, workforce strategy, healthcare economics and health system transformation, in the UK and across Africa." },
  { n: "02", t: "The same problem, everywhere", b: "Hospitals struggled to find the right partners. Workforce suppliers could not reach the right decision-makers. Clinicians faced fragmented career paths. Good opportunities were missed because the people who needed each other could not find each other." },
  { n: "03", t: "One late-night conversation", b: "Comparing notes, we kept arriving at the same conclusion: healthcare needs an ecosystem that connects everyone in it, with the information each side needs in one place." },
  { n: "04", t: "Qura today", b: "One platform that connects healthcare organisations, suppliers, workforce partners and clinicians, removes friction, improves transparency and helps the right people find each other faster." },
];

const VALUES = [
  { i: Award, t: "Built by experience", d: "Every feature starts from a real healthcare problem we have lived." },
  { i: ShieldCheck, t: "Trust before transactions", d: "Lasting partnerships rest on transparency, credibility and reputation." },
  { i: Sparkles, t: "Technology with purpose", d: "AI should take away administration and leave more time for relationships." },
  { i: Globe, t: "Global thinking", d: "Healthcare challenges cross borders, and so should the solutions." },
  { i: Star, t: "Quality over quantity", d: "Better connections lead to better outcomes for organisations, clinicians and patients." },
  { i: TrendingUp, t: "Always improving", d: "Healthcare keeps moving, and we keep building with it." },
];

const css = `
.qs p,.qs h1,.qs h2,.qs h3{text-align:left}
.qs-hero{background:radial-gradient(120% 90% at 85% -10%,#173A5E 0%,#0A1A30 55%);color:#fff;position:relative;overflow:hidden}
.qs-hero:after{content:"";position:absolute;right:-120px;top:-120px;width:420px;height:420px;border-radius:50%;background:radial-gradient(circle,rgba(0,194,184,.28),rgba(0,194,184,0) 70%)}
.qs-wrap{max-width:1180px;margin:0 auto;padding:0 24px;position:relative;z-index:1}
.qs-eyebrow{font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#7EEDE4}
.qs-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:34px;max-width:640px}
.qs-stat{border:1px solid rgba(255,255,255,.14);border-radius:14px;padding:14px 16px;background:rgba(255,255,255,.04)}
.qs-founders{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:28px}
.qs-card{background:#fff;border:1px solid var(--line);border-radius:22px;overflow:hidden;box-shadow:0 18px 40px rgba(10,26,48,.08);display:flex;flex-direction:column}
.qs-photo{position:relative;aspect-ratio:4/5;max-height:520px;overflow:hidden;background:#0A1A30}
.qs-photo img{width:100%;height:100%;object-fit:cover;object-position:center 22%;display:block;transition:transform .6s ease}
.qs-card:hover .qs-photo img{transform:scale(1.03)}
.qs-photo:after{content:"";position:absolute;inset:auto 0 0 0;height:46%;background:linear-gradient(180deg,rgba(10,26,48,0),rgba(10,26,48,.86))}
.qs-name{position:absolute;left:24px;right:24px;bottom:20px;z-index:1;color:#fff}
.qs-chapters{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px;counter-reset:ch}
.qs-ch{position:relative;padding:22px 20px 22px;border-radius:18px;background:#fff;border:1px solid var(--line)}
.qs-ch:before{content:"";position:absolute;left:20px;right:20px;top:0;height:3px;border-radius:0 0 3px 3px;background:linear-gradient(90deg,#00C2B8,#2D6BFF)}
.qs-values{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
.qs-val{display:flex;gap:14px;align-items:flex-start;padding:18px;border-radius:16px;background:#fff;border:1px solid var(--line)}
.qs-cta{background:linear-gradient(135deg,#0A1A30,#13243F);border-radius:24px;color:#fff;padding:40px;display:flex;gap:24px;align-items:center;justify-content:space-between;flex-wrap:wrap}
@media (max-width:980px){.qs-chapters{grid-template-columns:repeat(2,minmax(0,1fr))}.qs-values{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:760px){.qs-founders,.qs-chapters,.qs-values{grid-template-columns:1fr}.qs-stats{grid-template-columns:1fr 1fr 1fr;gap:8px}.qs-stat{padding:10px}.qs-cta{padding:28px 22px}.qs-h1{font-size:34px!important}}
`;

export default function OurStory({ appName = "Qura", onEnter }) {
  return (
    <div className="qs" style={{ textAlign: "left" }}>
      <style>{css}</style>

      <div className="qs-hero" style={{ padding: "96px 0 76px" }}>
        <div className="qs-wrap">
          <div className="qs-eyebrow">Our story</div>
          <h1 className="disp qs-h1" style={{ fontSize: 48, lineHeight: 1.12, fontWeight: 700, margin: "14px 0 16px", maxWidth: 760, color: "#fff" }}>Healthcare moves faster when the right people connect.</h1>
          <p style={{ fontSize: 17.5, lineHeight: 1.65, color: "#C2D0E4", maxWidth: 640, margin: 0 }}>{appName} was built by two founders who spent their careers inside healthcare, one in the UK and one across Africa, and kept meeting the same problem from opposite sides.</p>
          <div className="qs-stats">
            {[["32+", "years in healthcare between us"], ["2", "continents, one shared problem"], ["4", "groups connected in one place"]].map(([v, l]) => (
              <div key={l} className="qs-stat"><div className="disp" style={{ fontSize: 26, fontWeight: 700, color: "#7EEDE4" }}>{v}</div><div style={{ fontSize: 12.5, lineHeight: 1.4, color: "#B8C7DD", marginTop: 2 }}>{l}</div></div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: "var(--bg2, #F6F8FC)", padding: "72px 0" }}>
        <div className="qs-wrap">
          <div style={{ maxWidth: 640, marginBottom: 32 }}>
            <div className="eyebrow">The founders</div>
            <h2 className="disp" style={{ fontSize: 32, fontWeight: 700, margin: "8px 0 0" }}>Meet the people building {appName}</h2>
          </div>
          <div className="qs-founders">
            {FOUNDERS.map((f) => (
              <article key={f.name} className="qs-card">
                <div className="qs-photo">
                  <img src={f.img} alt={f.alt} decoding="async" />
                  <div className="qs-name">
                    <div className="disp" style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.2 }}>{f.name}</div>
                    <div style={{ fontSize: 14.5, color: "#9FEFE8", fontWeight: 600, marginTop: 4 }}>{f.role}</div>
                  </div>
                </div>
                <div style={{ padding: "22px 24px 26px", flex: 1 }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, color: "#076B61", background: "var(--cyan-soft)", borderRadius: 999, padding: "4px 10px", marginBottom: 12 }}><MapPin size={13} />{f.place}</div>
                  {f.bio.map((p, i) => <p key={i} className="muted" style={{ fontSize: 15, lineHeight: 1.7, margin: i ? "10px 0 0" : 0 }}>{p}</p>)}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: "var(--bg)", padding: "72px 0", borderTop: "1px solid var(--line)" }}>
        <div className="qs-wrap">
          <div style={{ maxWidth: 640, marginBottom: 28 }}>
            <div className="eyebrow">How {appName} began</div>
            <h2 className="disp" style={{ fontSize: 32, fontWeight: 700, margin: "8px 0 0" }}>From one conversation to one platform</h2>
          </div>
          <div className="qs-chapters">
            {CHAPTERS.map((c) => (
              <div key={c.n} className="qs-ch">
                <div className="num" style={{ fontSize: 13, color: "var(--teal)" }}>{c.n}</div>
                <h3 style={{ fontSize: 18.5, fontWeight: 700, margin: "6px 0 8px" }}>{c.t}</h3>
                <p className="muted" style={{ fontSize: 14.5, lineHeight: 1.65, margin: 0 }}>{c.b}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: "var(--bg2, #F6F8FC)", padding: "72px 0", borderTop: "1px solid var(--line)" }}>
        <div className="qs-wrap">
          <div style={{ maxWidth: 640, marginBottom: 28 }}>
            <div className="eyebrow">What we stand for</div>
            <h2 className="disp" style={{ fontSize: 32, fontWeight: 700, margin: "8px 0 0" }}>Our values</h2>
          </div>
          <div className="qs-values">
            {VALUES.map((v) => (
              <div key={v.t} className="qs-val">
                <div style={{ width: 42, height: 42, borderRadius: 12, background: "#EEF3FF", display: "grid", placeItems: "center", flexShrink: 0 }}><v.i size={19} color="#1E54E6" /></div>
                <div><div style={{ fontWeight: 700, fontSize: 15.5 }}>{v.t}</div><div className="muted" style={{ fontSize: 13.5, marginTop: 3, lineHeight: 1.55 }}>{v.d}</div></div>
              </div>
            ))}
          </div>
          <div className="qs-cta" style={{ marginTop: 44 }}>
            <div style={{ maxWidth: 620 }}>
              <div className="disp" style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.25 }}>Be part of what we are building.</div>
              <div style={{ color: "#B8C7DD", fontSize: 15, marginTop: 8, lineHeight: 1.6 }}>Clinicians join free. Organisations and suppliers can start today and help shape {appName} as it grows.</div>
            </div>
            {onEnter && <button onClick={onEnter} className="btn" style={{ background: "#00C2B8", color: "#04231F", fontWeight: 700, border: "none", padding: "12px 20px", display: "inline-flex", alignItems: "center", gap: 8 }}>Get started <ArrowRight size={16} /></button>}
          </div>
        </div>
      </div>
    </div>
  );
}
