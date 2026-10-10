import React from "react";
import { ArrowRight } from "lucide-react";
import { track } from "../lib/analytics.js";

// Shared by both films: playback goes full screen, and leaves it at the end.
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
const PLAYER = { width: "100%", display: "block", borderRadius: 16, background: "#0A1730", boxShadow: "0 18px 50px rgba(0,0,0,.35)" };

// The agency film, built 1 October 2026 as the third in the series after the
// launch film and the clinician film. Same player as ClinicianFilm: the
// context line sits ABOVE the player so an agency knows what it is about to
// watch, playback goes full screen, and captions are on by default because
// most of this audience will meet it muted. The call to action is the
// Founding Partner offer, which is exactly what the film ends on.
// 10 October 2026: the 66s cut, with a SEND Intelligence beat before the offer.
export function AgencyFilm() {
  return (
    <div style={{ maxWidth: 760, margin: "0 auto 34px" }}>
      <div style={{ textAlign: "center", color: "#AEBED6", fontSize: 13.5, marginBottom: 12 }}>
        66 seconds on what Qura does for agencies.
      </div>
      <video
        controls
        preload="none"
        playsInline
        poster="/qura-agency-film-poster.jpg"
        onPlay={(ev) => { track("supplier_film_play"); goFull(ev); }}
        onEnded={leaveFull}
        style={PLAYER}
      >
        <source src="/qura-agency-film-66s.mp4" type="video/mp4" />
        <track kind="captions" srcLang="en" label="English" default src="/qura-agency-film-66s-subtitles.vtt" />
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

// The SEND Intelligence film (9 October 2026), for specialist SEND staffing and
// therapy suppliers. It sits under the agency film and ends on the Founding
// SEND Partner offer, so the call to action goes to the SEND tab (/send).
// On the SEND tab itself the button is hidden (cta={false}).
export function SendFilm({ cta = true }) {
  return (
    <div style={{ maxWidth: 760, margin: "0 auto 34px" }}>
      <div style={{ textAlign: "center", color: "#AEBED6", fontSize: 13.5, marginBottom: 12 }}>
        Place SEND staff? 62 seconds on SEND Intelligence.
      </div>
      <video
        controls
        preload="none"
        playsInline
        poster="/qura-send-film-poster.jpg"
        onPlay={(ev) => { track("send_film_play"); goFull(ev); }}
        onEnded={leaveFull}
        style={PLAYER}
      >
        <source src="/qura-send-film.mp4" type="video/mp4" />
        <track kind="captions" srcLang="en" label="English" default src="/qura-send-film-subtitles.vtt" />
      </video>
      {cta && <div style={{ textAlign: "center", marginTop: 16 }}>
        <a href="/send" onClick={() => track("send_film_cta")} className="btn lift"
          style={{ background: "transparent", color: "#fff", border: "1px solid #3B5A88", fontWeight: 800, padding: "12px 24px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
          See SEND Intelligence <ArrowRight size={16} />
        </a>
        <div style={{ color: "#AEBED6", fontSize: 12.5, marginTop: 9 }}>5 Founding SEND Partner places, 50% off for 12 months.</div>
      </div>}
    </div>
  );
}
