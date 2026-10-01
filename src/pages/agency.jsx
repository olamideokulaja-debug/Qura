import React from "react";
import { ArrowRight } from "lucide-react";
import { track } from "../lib/analytics.js";

// The agency film, built 1 October 2026 as the third in the series after the
// launch film and the clinician film. Same player as ClinicianFilm: the
// context line sits ABOVE the player so an agency knows what it is about to
// watch, playback goes full screen, and captions are on by default because
// most of this audience will meet it muted. The call to action is the
// Founding Partner offer, which is exactly what the film ends on.
export function AgencyFilm() {
  const goFull = (ev) => {
    track("supplier_film_play");
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
        60 seconds on what Qura does for agencies.
      </div>
      <video
        controls
        preload="none"
        playsInline
        poster="/qura-agency-film-poster.jpg"
        onPlay={goFull}
        onEnded={leaveFull}
        style={{ width: "100%", display: "block", borderRadius: 16, background: "#0A1730", boxShadow: "0 18px 50px rgba(0,0,0,.35)" }}
      >
        <source src="/qura-agency-film.mp4" type="video/mp4" />
        <track kind="captions" srcLang="en" label="English" default src="/qura-agency-film-subtitles.vtt" />
      </video>
      <div style={{ textAlign: "center", marginTop: 16 }}>
        <a href="/founding-partner.html" onClick={() => track("supplier_film_cta")} className="btn lift"
          style={{ background: "var(--cyan)", color: "var(--navy)", fontWeight: 800, padding: "12px 24px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
          Join as a Founding Partner <ArrowRight size={16} />
        </a>
        <div style={{ color: "#AEBED6", fontSize: 12.5, marginTop: 9 }}>12 months of Qura Growth, free. Join by 31 December 2026.</div>
      </div>
    </div>
  );
}
