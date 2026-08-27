import React, { useState } from "react";
import { Check } from "lucide-react";
import { StoreBadges } from "../components/store.jsx";

// Extracted from App.jsx on 27 July 2026. Behaviour unchanged.

export const CLIN_TAGLINES = [
  "Take your career into your own hands and track your application process in real time.",
  "No more sending your CV and hoping. Build your verified profile once and be visible to the organisations looking for your skills.",
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

// The film sits directly under the hero, above everything else on the page.
// This is the one page where the call to action is live: organisations wait
// until 22 September, clinicians can join today, which is exactly what the
// film argues. The context line goes ABOVE the player, so a clinician knows
// what they are about to watch before deciding whether to press play.
function ClinicianFilm({ onEnter }) {
  const goFull = (ev) => {
    const v = ev.currentTarget;
    if (document.fullscreenElement || document.webkitFullscreenElement) return;
    const go = v.requestFullscreen || v.webkitRequestFullscreen || v.webkitEnterFullscreen || v.msRequestFullscreen;
    try { const r = go && go.call(v); if (r && r.catch) r.catch(() => {}); } catch (e) {}
  };
  const leaveFull = () => {
    try {
      if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitFullscreenElement && document.webkitExitFullscreen) document.webkitExitFullscreen();
    } catch (e) {}
  };
  return (
    <div style={{ maxWidth: 760, margin: "0 auto 34px" }}>
      <div style={{ textAlign: "center", color: "#AEBED6", fontSize: 13.5, marginBottom: 12 }}>
        70 seconds on why clinicians join before we open. Launching 22 September 2026.
      </div>
      <video
        controls
        preload="none"
        playsInline
        poster="/qura-clinician-film-poster.jpg"
        onPlay={goFull}
        onEnded={leaveFull}
        style={{ width: "100%", display: "block", borderRadius: 16, background: "#0A1730", boxShadow: "0 18px 50px rgba(0,0,0,.35)" }}
      >
        <source src="/qura-clinician-film.mp4" type="video/mp4" />
        <track kind="captions" srcLang="en" label="English" default src="/qura-clinician-film-subtitles.vtt" />
      </video>
      <div style={{ textAlign: "center", marginTop: 16 }}>
        <button onClick={onEnter} className="btn lift" style={{ background: "var(--cyan)", color: "var(--navy)", fontWeight: 800, padding: "12px 24px" }}>
          Create your free account
        </button>
        <div style={{ color: "#AEBED6", fontSize: 12.5, marginTop: 9 }}>Free to join. Verified before we open.</div>
      </div>
    </div>
  );
}

export function ClinicianSection({ onEnter }) {
  const [country, setCountry] = useState(CLIN_TABS[0]);
  const c = CLIN_COUNTRIES[country];
  return (
    <div id="clinicians" className="sec clinicians" style={{ background: "var(--navy)", color: "#fff", padding: "84px 24px" }}>
      <div className="wrap">
        <div style={{ textAlign: "center", maxWidth: 760, margin: "0 auto 10px" }}>
          <span className="chip chip-cyan" style={{ background: "rgba(0,194,184,.15)", color: "var(--cyan)" }}>For clinicians</span>
          <h2 className="disp" style={{ fontSize: "clamp(26px,4vw,40px)", fontWeight: 700, margin: "16px 0 8px", lineHeight: 1.1 }}>Get verified once. Be seen everywhere.</h2>
          <p style={{ fontSize: 16.5, lineHeight: 1.6, color: "#C6D4E8", margin: "0 auto", maxWidth: 640 }}>
            One healthcare profile connecting you with opportunities across the NHS,
            private healthcare and internationally.
          </p>
          {/* The journey, so a clinician can see at a glance that this is not a
              jobs board they have to keep checking. */}
          <div className="row" style={{ gap: 8, justifyContent: "center", flexWrap: "wrap", marginTop: 16 }}>
            {["Search", "Match", "Be discovered", "Apply", "Track"].map((step, i) => (
              <span key={step} className="row" style={{ gap: 8, fontSize: 13, color: "#AEBED6" }}>
                {i ? <span style={{ color: "var(--cyan)" }}>&rsaquo;</span> : null}
                <span style={{ fontWeight: 600 }}>{step}</span>
              </span>
            ))}
          </div>
        </div>

        <ClinicianFilm onEnter={onEnter} />

        <div style={{ display: "grid", gap: 12, maxWidth: 820, margin: "0 auto 20px", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))" }}>
          {CLIN_TAGLINES.map((t, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 14, padding: "16px 18px", fontSize: 15, lineHeight: 1.5 }}>{t}</div>
          ))}
        </div>
        <div style={{ maxWidth: 820, margin: "0 auto 26px", textAlign: "center", color: "#AEBED6", fontSize: 14.5, lineHeight: 1.65 }}>
          Clinical managers rarely give feedback in the time frames shown in adverts. It is not that they do not want to, they are overwhelmed and cannot keep up. Qura puts your verified profile in front of them, so the people hiring can find you rather than losing you in a pile of applications. You stay in control of what happens next.
        </div>

        {/* Discoverability without a clear answer on control is a reason not to
            join. Said plainly and near the sign-up, not buried in a policy. */}
        <div style={{ maxWidth: 820, margin: "0 auto 26px", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 18, padding: "20px 22px" }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>You control who sees you</div>
          <div style={{ fontSize: 14, lineHeight: 1.65, color: "#C6D4E8" }}>
            Your profile is only visible to verified healthcare organisations on Qura, and
            only once a person has checked your registration. Your contact details are never
            shown until you accept an introduction. You can pause your visibility or delete
            your profile at any time, and nothing is sold to anyone.
          </div>
        </div>

        {/* The strongest clinician argument, and the one the site was not making:
            you do not have to be job hunting for Qura to be worth joining. */}
        <div style={{ maxWidth: 820, margin: "0 auto 26px", background: "rgba(0,194,184,.08)", border: "1px solid rgba(0,194,184,.25)", borderRadius: 18, padding: "22px 24px" }}>
          <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 8 }}>Happy where you are? Stay discoverable.</div>
          <div style={{ fontSize: 14.5, lineHeight: 1.65, color: "#C6D4E8" }}>
            You do not have to be looking to be worth finding. Keep a verified profile,
            set your profession, specialty and preferences, and let relevant opportunities
            come to you. You choose what happens next, and nothing is shared without you.
          </div>
        </div>

        <div style={{ maxWidth: 900, margin: "0 auto", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 18, padding: 22 }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4, textAlign: "center" }}>Where can your skills take you?</div>
          <div className="muted" style={{ fontSize: 13.5, textAlign: "center", marginBottom: 16, color: "#AEBED6" }}>
            Regulators, requirements and routes, country by country. Useful whether you are
            moving, considering it, or just want to know what your registration is worth elsewhere.
          </div>
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
          {/* Naming the parts is what makes the badge worth something. A single
              generic tick tells a hospital nothing about what was checked. */}
          <div style={{ marginTop: 22, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,.1)" }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6, textAlign: "center" }}>What Qura Verified means</div>
            <div style={{ fontSize: 13.5, color: "#AEBED6", textAlign: "center", marginBottom: 14, lineHeight: 1.6 }}>
              Not an automated tick. A member of the Qura team opens the official public
              register and finds you, before any organisation can see your profile.
            </div>
            <div className="row" style={{ gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
              {["Registration number checked against the official register",
                "Profession and specialty confirmed",
                "Experience and country of residence recorded"].map((t) => (
                <span key={t} className="row" style={{ gap: 7, fontSize: 13, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 999, padding: "7px 14px" }}>
                  <Check size={13} color="var(--cyan)" />{t}
                </span>
              ))}
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: 22 }}>
            <button className="btn btn-primary" onClick={onEnter} style={{ padding: "12px 28px", fontSize: 15 }}>Create my free clinician profile</button>
            <div style={{ fontSize: 13.5, color: "var(--cyan)", marginTop: 12, fontWeight: 600 }}>Joining and applying on Qura is free. Always.</div>
            <div style={{ fontSize: 12, color: "#8697B0", marginTop: 10, marginBottom: 22 }}>Guidance only, not immigration advice. Requirements are confirmed during verification.</div>
            <div style={{ fontSize: 13.5, color: "#AEBED6", marginBottom: 14, fontWeight: 600 }}>Track your applications in real time. Get the app.</div>
            <StoreBadges />
            <div style={{ fontSize: 12, color: "#8697B0", marginTop: 12 }}>Free on Android. iOS to follow.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
