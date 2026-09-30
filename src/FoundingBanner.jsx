import { useEffect, useState } from "react";
import { supabase, supabaseEnabled } from "./supabase.js";

// The Founding Partner banner (30 September 2026). A slim bar above the site
// and the web app, until 31 December 2026:
//   signed out, or not yet on the offer   the offer and a link to the details
//   organisation waiting for its check     the year starts once confirmed
//   on the offer                           the date the free year runs to
// Mounted in main.jsx so it needs no change to App.jsx. Closing it hides it on
// this device for 7 days.

const HIDE_KEY = "qura_fp_banner_hidden";
const HIDE_MS = 7 * 86400000;
const hiddenNow = () => {
  try { const t = Number(window.localStorage.getItem(HIDE_KEY) || 0); return t && Date.now() - t < HIDE_MS; } catch (e) { return false; }
};
const ukDate = (iso) => {
  try { return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/London" }); }
  catch (e) { return ""; }
};

export default function FoundingBanner() {
  const [state, setState] = useState(null);
  const [hidden, setHidden] = useState(hiddenNow());
  const [narrow, setNarrow] = useState(typeof window !== "undefined" && window.innerWidth < 640);

  useEffect(() => {
    const onResize = () => setNarrow(window.innerWidth < 640);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    let dead = false;
    const load = async () => {
      let headers = {};
      try {
        if (supabaseEnabled && supabase) {
          const { data } = await supabase.auth.getSession();
          const token = data && data.session && data.session.access_token;
          if (token) headers = { Authorization: "Bearer " + token };
        }
      } catch (e) {}
      try {
        const r = await fetch("/api/founding", { headers });
        const j = await r.json();
        if (!dead) setState(j);
      } catch (e) {}
    };
    load();
    let unsub;
    try { if (supabaseEnabled && supabase) unsub = supabase.auth.onAuthStateChange(() => load()).data.subscription; } catch (e) {}
    return () => { dead = true; try { unsub && unsub.unsubscribe(); } catch (e) {} };
  }, []);

  if (!state || !state.offer) return null;
  const me = state.me || null;
  const running = me && me.running;
  if (!state.offer.open && !running) return null;
  if (hidden) return null;

  let text, link = "/founding-partner.html", cta = narrow ? "Details" : "See the offer";
  if (running) {
    text = "Founding Partner: Qura " + (me.planName || "") + " is yours free until " + ukDate(me.until) + ".";
    cta = "What is included";
  } else if (me && me.pendingCheck) {
    text = narrow ? "Your free Founding Partner year starts once we confirm your organisation."
      : "You are in for the Founding Partner year. It starts as soon as we confirm your organisation, usually within 1 working day.";
  } else {
    text = narrow ? "12 months of Qura's top plan, free. Join by 31 December."
      : "Founding Partner offer: join Qura by 31 December 2026 and get 12 months of our top plan, free.";
  }

  const close = () => {
    try { window.localStorage.setItem(HIDE_KEY, String(Date.now())); } catch (e) {}
    setHidden(true);
  };

  return (
    <div role="region" aria-label="Founding Partner offer"
      style={{ background: "linear-gradient(90deg,#0B1B36,#0E8C7E)", color: "#fff", fontFamily: "Inter,-apple-system,Arial,sans-serif",
        fontSize: narrow ? 12.5 : 13.5, lineHeight: 1.4, padding: narrow ? "8px 40px 8px 14px" : "9px 48px", position: "relative", textAlign: "center" }}>
      <span>{text}</span>{" "}
      <a href={link} style={{ color: "#7FF0E4", fontWeight: 700, textDecoration: "underline", whiteSpace: "nowrap", marginLeft: 6 }}>{cta}</a>
      <button onClick={close} aria-label="Close"
        style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#fff",
          fontSize: 18, lineHeight: 1, cursor: "pointer", padding: 6, opacity: 0.8 }}>×</button>
    </div>
  );
}
