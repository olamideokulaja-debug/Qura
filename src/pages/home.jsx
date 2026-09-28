// The homepage, clinician first (Ola's brief, 28 September 2026).
//
// One primary action on the first screen: a healthcare professional creates a
// free profile. Providers and workforce suppliers keep clear routes in, as
// secondary links and in the ecosystem cards lower down. The moving globe in
// App.jsx stays as the hero visual; these components are the content layer
// over and below it.
//
// Every claim here has to be one Qura can stand behind today. No invented
// numbers, no "trusted by" before anyone is, no photographs presented as
// members. The trust strip only appears once RAD_ARTICLE_URL is filled in.
//
// Kept in its own file so homepage copy and layout can change without moving
// App.jsx, which is too large to update through the usual tooling.

import React from "react";
import { ArrowRight, Search, ShieldCheck, Building2, TrendingUp, Users, Briefcase, Check, Lock, Bell, UserCheck } from "lucide-react";
import { track } from "../lib/analytics.js";
import { StoreBadges, PLAYSTORE_URL } from "../components/store.jsx";

// Paste the article address here to show the "As seen in" strip.
export const RAD_ARTICLE_URL = "";

const MARKETS = [["\u{1F1EC}\u{1F1E7}", "United Kingdom"], ["\u{1F1E6}\u{1F1FA}", "Australia"],
  ["\u{1F1FA}\u{1F1F8}", "United States"], ["\u{1F1EA}\u{1F1FA}", "European Union"]];

const gradient = { background: "linear-gradient(96deg,var(--teal),var(--cyan))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" };

// The one clinician call to action, used in every placement so the route and
// the tracking are always the same. A signed-in visitor is taken to their
// account instead of being sent through sign-up again.
export function ClinicianCta({ placement, onJoin, onOpen, signedIn, dark }) {
  const click = () => {
    track("home_clinician_cta", { placement, signedIn: !!signedIn });
    if (signedIn) onOpen(); else onJoin();
  };
  return (
    <button onClick={click} className="btn lift"
      style={{ background: dark ? "#00C2B8" : "var(--teal)", color: dark ? "#04231F" : "#fff", fontWeight: 700, fontSize: 16, padding: "14px 28px", borderRadius: 999, border: "none", cursor: "pointer" }}>
      {signedIn ? "Open your account" : "Create your free profile"} <ArrowRight size={17} />
    </button>
  );
}

// ---- 01 Hero --------------------------------------------------------------
export function HomeHero({ onJoin, onOpen, signedIn, goTo }) {
  const secondary = (label, view, event) => (
    <button onClick={() => { track(event); goTo(view); }}
      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--navy)", fontWeight: 600, fontSize: 14.5, textDecoration: "underline", textUnderlineOffset: 4, display: "inline-flex", alignItems: "center", gap: 6 }}>
      {label} <ArrowRight size={15} />
    </button>
  );
  return (
    <div>
      <div className="reveal"><span className="chip chip-cyan" style={{ padding: "7px 15px" }}><ShieldCheck size={14} /> Free for healthcare professionals, always</span></div>
      <h1 className="disp heroh reveal" style={{ fontWeight: 700, margin: "22px auto 0", maxWidth: 900 }}>
        <span style={{ display: "block" }}>Healthcare professionals.</span>
        <span style={{ display: "block" }}>One profile.</span>
        <span style={{ ...gradient, display: "block" }}>A connected healthcare ecosystem.</span>
      </h1>
      <p className="reveal" style={{ fontSize: 18, lineHeight: 1.55, margin: "16px auto 0", maxWidth: 660, color: "var(--muted)" }}>
        Create a free, verified profile, hear about matching roles the moment they are posted, and be discovered by healthcare organisations across the UK and internationally.
      </p>
      <div className="reveal" style={{ marginTop: 24 }}>
        <ClinicianCta placement="hero" onJoin={onJoin} onOpen={onOpen} signedIn={signedIn} />
        {!signedIn ? <div className="faint" style={{ fontSize: 12.5, marginTop: 9 }}>It only takes a few minutes.</div> : null}
      </div>
      <div className="reveal row" style={{ gap: 7, justifyContent: "center", flexWrap: "wrap", marginTop: 24 }}>
        {MARKETS.map(([fl, label]) => (
          <span key={label} className="chip" style={{ padding: "6px 12px", fontSize: 12.5, background: "var(--card)", border: "1px solid var(--line)", color: "var(--muted)" }}>
            <span style={{ marginRight: 6, fontSize: 14 }} aria-hidden="true">{fl}</span>{label}
          </span>
        ))}
      </div>
      <div className="reveal faint" style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: ".09em", marginTop: 18, textTransform: "uppercase" }}>Built for healthcare, across every setting</div>
      <p className="reveal" style={{ fontSize: 16, lineHeight: 1.55, margin: "6px auto 0", maxWidth: 640, color: "var(--muted)" }}>One live platform spanning the NHS, private and international healthcare markets.</p>
      <div className="reveal row" style={{ gap: 22, justifyContent: "center", flexWrap: "wrap", marginTop: 16 }}>
        {secondary("For healthcare providers", "solutions", "home_link_providers")}
        {secondary("For workforce suppliers", "suppliers-app", "home_link_suppliers")}
      </div>
    </div>
  );
}

// ---- 02 Clinician value ---------------------------------------------------
const VALUE = [
  { i: Search, t: "Discover opportunities", d: "Roles posted by healthcare organisations, with an alert the moment one matches your profile." },
  { i: ShieldCheck, t: "Get verified", d: "Your registration is checked by the Qura team, so organisations know who they are dealing with." },
  { i: Building2, t: "Be seen by organisations", d: "Once verified, NHS, private and international providers and suppliers can find you." },
  { i: TrendingUp, t: "Build your career", d: "Set where you want to work next, including moves abroad and into clinical research." },
];

export function HomeValue() {
  return (
    <div className="sec home" style={{ borderBottom: "1px solid var(--line)", background: "#fff" }}>
      <div className="wrap" style={{ padding: "34px 24px" }}>
        <div className="grid g4" style={{ gap: 18 }}>
          {VALUE.map((v) => (
            <div key={v.t} style={{ textAlign: "center", padding: "6px 10px" }}>
              <v.i size={30} color="var(--teal)" strokeWidth={1.8} />
              <div style={{ fontWeight: 700, fontSize: 16, marginTop: 10 }}>{v.t}</div>
              <div className="muted" style={{ fontSize: 13.5, lineHeight: 1.55, marginTop: 5 }}>{v.d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---- 03 Verification and discoverability ----------------------------------
export function HomeVerify({ onJoin, onOpen, signedIn }) {
  const steps = [
    [UserCheck, "You register", "Your profession, registration and experience, once."],
    [ShieldCheck, "We check it", "The Qura team checks your registration before you are shown to anyone."],
    [Lock, "You stay in control", "Organisations see your documents only after an introduction the Qura team has verified, and every view is logged."],
    [Bell, "You hear first", "Matching roles reach you by notification or email as soon as they are posted."],
  ];
  return (
    <div className="sec home" style={{ background: "var(--bg)", borderBottom: "1px solid var(--line)" }}>
      <div className="wrap" style={{ padding: "60px 24px" }}>
        <div className="grid g2" style={{ gap: 36, alignItems: "center" }}>
          <div>
            <h2 className="disp" style={{ fontSize: 38, fontWeight: 700, lineHeight: 1.1, margin: 0 }}>
              Get verified once.<br /><span style={gradient}>Be seen everywhere.</span>
            </h2>
            <p className="muted" style={{ fontSize: 16, lineHeight: 1.6, margin: "16px 0 22px", maxWidth: 480, textAlign: "left" }}>
              A verified Qura profile shows healthcare organisations that your registration has been checked, and puts you in front of roles across the NHS, private and international markets.
            </p>
            <ClinicianCta placement="verify" onJoin={onJoin} onOpen={onOpen} signedIn={signedIn} />
            <div className="row faint" style={{ gap: 18, flexWrap: "wrap", marginTop: 16, fontSize: 12.5 }}>
              <span className="row" style={{ gap: 6 }}><Check size={14} /> Free to join</span>
              <span className="row" style={{ gap: 6 }}><Lock size={14} /> Secure and confidential</span>
              <span className="row" style={{ gap: 6 }}><ShieldCheck size={14} /> Checked by the Qura team</span>
            </div>
          </div>
          <div className="card" style={{ padding: 22 }}>
            {steps.map(([I, t, d], n) => (
              <div key={t} className="row" style={{ gap: 14, alignItems: "flex-start", padding: "12px 0", borderTop: n ? "1px solid var(--line)" : "none" }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: "var(--cyan-soft)", display: "grid", placeItems: "center", flexShrink: 0 }}><I size={19} color="#06776F" /></div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{t}</div>
                  <div className="muted" style={{ fontSize: 13.5, lineHeight: 1.55, marginTop: 2 }}>{d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- 04 The Qura ecosystem --------------------------------------------------
export function HomeEcosystem({ onJoin, onOpen, signedIn, goTo }) {
  const cards = [
    { i: Users, t: "Healthcare professionals", d: "Create your free profile, get verified and hear about matching roles.", cta: signedIn ? "Open your account" : "Create your free profile",
      go: () => { track("home_clinician_cta", { placement: "ecosystem", signedIn: !!signedIn }); if (signedIn) onOpen(); else onJoin(); }, lead: true },
    { i: Building2, t: "Healthcare providers", d: "Post roles and find verified clinicians across every setting.", cta: "For healthcare providers",
      go: () => { track("home_link_providers", { placement: "ecosystem" }); goTo("solutions"); } },
    { i: Briefcase, t: "Workforce suppliers", d: "Live demand, named decision-makers and a verified supplier profile.", cta: "For workforce suppliers",
      go: () => { track("home_link_suppliers", { placement: "ecosystem" }); goTo("suppliers-app"); } },
  ];
  return (
    <div className="sec home" style={{ background: "#fff" }}>
      <div className="wrap" style={{ padding: "60px 24px 30px" }}>
        <h2 className="disp" style={{ fontSize: 32, fontWeight: 700, margin: 0 }}>The Qura ecosystem</h2>
        <p className="muted" style={{ fontSize: 16, margin: "8px 0 24px" }}>Three connected communities. A stronger healthcare sector.</p>
        <div className="grid g3" style={{ gap: 16 }}>
          {cards.map((c) => (
            <div key={c.t} className="card lift" style={{ padding: 22, display: "flex", flexDirection: "column", background: c.lead ? "var(--cyan-soft)" : "var(--card)", borderColor: c.lead ? "var(--cyan)" : "var(--line)" }}>
              <c.i size={26} color={c.lead ? "#06776F" : "var(--navy)"} strokeWidth={1.8} />
              <div style={{ fontWeight: 700, fontSize: 17, marginTop: 12 }}>{c.t}</div>
              <div className="muted" style={{ fontSize: 13.5, lineHeight: 1.55, marginTop: 6, flex: 1 }}>{c.d}</div>
              <button onClick={c.go} style={{ marginTop: 14, alignSelf: "flex-start", background: "none", border: "none", padding: 0, cursor: "pointer", color: c.lead ? "#06776F" : "var(--navy)", fontWeight: 700, fontSize: 14, display: "inline-flex", alignItems: "center", gap: 6 }}>
                {c.cta} <ArrowRight size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---- 05 The app ------------------------------------------------------------
export function HomeApp() {
  const points = ["Search roles", "Get real-time alerts", "Manage your profile and documents", "Message organisations after an introduction"];
  return (
    <div className="sec home" style={{ background: "var(--navy)" }}>
      <div className="wrap" style={{ padding: "44px 24px" }}>
        <div className="grid g2" style={{ gap: 30, alignItems: "center" }}>
          <div>
            <h2 className="disp" style={{ fontSize: 28, fontWeight: 700, color: "#fff", margin: 0 }}>Qura Healthcare Careers</h2>
            <p style={{ color: "#9FB0D0", fontSize: 15, lineHeight: 1.6, margin: "10px 0 18px", maxWidth: 440 }}>Take Qura with you. See roles, update your profile and stay connected on the go.</p>
            <div style={{ color: "#9FB0D0" }} onClick={() => track("home_app_store", { store: PLAYSTORE_URL ? "google_play" : "none" })}>
              <StoreBadges compact />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {points.map((p) => (
              <div key={p} className="row" style={{ gap: 10, color: "#fff", fontSize: 15 }}>
                <span style={{ width: 22, height: 22, borderRadius: 999, background: "#00C2B8", display: "grid", placeItems: "center", flexShrink: 0 }}><Check size={14} color="#04231F" /></span>{p}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- 06 Trust: shown only once the article address is filled in -------------
export function HomeTrust() {
  if (!RAD_ARTICLE_URL) return null;
  return (
    <div className="sec home" style={{ background: "#fff", borderBottom: "1px solid var(--line)" }}>
      <div className="wrap row" style={{ padding: "26px 24px", gap: 24, justifyContent: "center", flexWrap: "wrap" }}>
        <span className="faint" style={{ fontSize: 13, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase" }}>As seen in</span>
        <span className="disp" style={{ fontSize: 22, fontWeight: 800, color: "#E11D48" }}>RAD Magazine</span>
        <a href={RAD_ARTICLE_URL} target="_blank" rel="noopener noreferrer" onClick={() => track("home_rad_article")}
          style={{ color: "#06776F", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>Read the article <ArrowRight size={14} style={{ verticalAlign: "-2px" }} /></a>
      </div>
    </div>
  );
}

// ---- 07 Final call to action ---------------------------------------------------
export function HomeFinalCta({ onJoin, onOpen, signedIn }) {
  return (
    <div className="sec home" style={{ background: "linear-gradient(160deg, var(--cyan-soft), #fff 75%)", borderTop: "1px solid var(--line)" }}>
      <div className="wrap" style={{ padding: "56px 24px", textAlign: "center" }}>
        <h2 className="disp" style={{ fontSize: 32, fontWeight: 700, margin: 0 }}>Your next role starts with one profile.</h2>
        <p className="muted" style={{ fontSize: 16, margin: "10px auto 22px", maxWidth: 520 }}>Free for healthcare professionals, always. Verified once, seen by organisations across every setting.</p>
        <ClinicianCta placement="final" onJoin={onJoin} onOpen={onOpen} signedIn={signedIn} />
      </div>
    </div>
  );
}
