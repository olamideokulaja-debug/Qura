// Qura's social channels, in one place (moved out of App.jsx on 10 October 2026).
// Olamide's brief: the links were too quiet (small outlined icons under the
// copyright line) and could be missed. They now show as labelled buttons in each
// network's own colour, near the top of the footer and on the Our story page.
// To hide a channel that is not ready, set live: false.

import React from "react";
import { Linkedin, Instagram } from "lucide-react";

// The company pages, not a founder's personal profile.
export const LINKEDIN = "https://www.linkedin.com/company/qura-healthcare/";
export const INSTAGRAM = "https://www.instagram.com/qura_healthcare?igsh=MXR1Y2loYXZ5cDR3Yw%3D%3D&utm_source=qr";
export const TIKTOK = "https://www.tiktok.com/@qura_healthcare?_r=1&_t=ZN-98jlSUXN57u";

export function TikTokIcon({ size = 17 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5 2.59 2.59 0 1 1 .74-5.07v-3.1a5.66 5.66 0 0 0-.74-.05A5.66 5.66 0 1 0 15.54 15.4V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3a4.29 4.29 0 0 1-3.24-1.48Z" />
    </svg>
  );
}

export const SOCIALS = [
  { name: "LinkedIn", url: LINKEDIN, icon: Linkedin, bg: "#0A66C2", live: true },
  { name: "Instagram", url: INSTAGRAM, icon: Instagram, bg: "linear-gradient(45deg,#F58529,#DD2A7B 45%,#8134AF 75%,#515BD4)", live: true },
  { name: "TikTok", url: TIKTOK, icon: null, bg: "#111111", live: true },
];

const CSS = ".qs-soc{display:inline-flex;align-items:center;gap:9px;height:46px;padding:0 20px 0 16px;border-radius:999px;color:#fff;font-weight:700;font-size:15px;text-decoration:none;box-shadow:0 6px 16px rgba(10,23,48,.18);transition:transform .15s ease,box-shadow .15s ease}"
  + ".qs-soc:hover{transform:translateY(-2px);box-shadow:0 10px 22px rgba(10,23,48,.26)}"
  + ".qs-soc:focus-visible{outline:3px solid #00C2B8;outline-offset:3px}";

// The row of labelled buttons on its own.
export function SocialButtons({ justify = "center" }) {
  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: justify }}>
      <style>{CSS}</style>
      {SOCIALS.filter((x) => x.live).map((x) => (
        <a key={x.name} href={x.url} target="_blank" rel="noreferrer" className="qs-soc"
          aria-label={"Follow Qura on " + x.name} title={"Follow Qura on " + x.name} style={{ background: x.bg }}>
          {x.icon ? <x.icon size={19} /> : <TikTokIcon size={19} />}
          {x.name}
        </a>
      ))}
    </div>
  );
}

// A heading, one line and the buttons. dark = for navy backgrounds.
export function FollowQura({ dark = false, title = "Follow Qura", line = "Launches, sector insight and the people building Qura." }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div className="disp" style={{ fontSize: 22, fontWeight: 700, color: dark ? "#fff" : "var(--navy)" }}>{title}</div>
      <div style={{ fontSize: 14.5, color: dark ? "#B8C7DD" : "var(--muted, #5B6B84)", margin: "6px 0 16px" }}>{line}</div>
      <SocialButtons />
    </div>
  );
}
