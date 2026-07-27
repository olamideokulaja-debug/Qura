import React from "react";
import { Play } from "lucide-react";

// Extracted from App.jsx on 27 July 2026. Behaviour unchanged.

export const APPSTORE_URL = "";

export const PLAYSTORE_URL = "";

export const APP_LAUNCH = "22 September 2026";

export function StoreBadge({ href, children }) {
  const live = !!href;
  const inner = (
    <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#000", color: "#fff", borderRadius: 12, padding: "10px 18px", minWidth: 180, opacity: live ? 1 : 0.55 }}>
      {children}
    </div>
  );
  if (!live) return <div style={{ cursor: "default" }} title={"Launching " + APP_LAUNCH}>{inner}</div>;
  return <a href={href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>{inner}</a>;
}

export function StoreBadges({ compact }) {
  const live = !!APPSTORE_URL || !!PLAYSTORE_URL;
  return (
    <div>
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: compact ? "flex-start" : "center" }}>
      <StoreBadge href={APPSTORE_URL}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><path d="M17.05 12.04c-.03-2.6 2.12-3.85 2.22-3.91-1.21-1.77-3.09-2.01-3.76-2.04-1.6-.16-3.12.94-3.93.94-.81 0-2.06-.92-3.39-.9-1.74.03-3.35 1.01-4.25 2.57-1.81 3.14-.46 7.79 1.3 10.34.86 1.25 1.88 2.65 3.22 2.6 1.29-.05 1.78-.83 3.34-.83 1.56 0 1.99.83 3.35.81 1.38-.03 2.26-1.27 3.11-2.53.98-1.45 1.38-2.85 1.4-2.92-.03-.01-2.69-1.03-2.72-4.09zM14.53 4.5c.71-.86 1.19-2.06 1.06-3.25-1.02.04-2.26.68-2.99 1.54-.66.76-1.23 1.98-1.08 3.15 1.14.09 2.3-.58 3.01-1.44z"/></svg>
          <div style={{ textAlign: "left" }}><div style={{ fontSize: 9, opacity: .85 }}>Download on the</div><div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1 }}>App Store</div></div>
      </StoreBadge>
      <StoreBadge href={PLAYSTORE_URL}>
          <svg width="22" height="22" viewBox="0 0 24 24"><path fill="#00D9FF" d="M3.6 2.3c-.3.3-.5.8-.5 1.4v16.6c0 .6.2 1.1.5 1.4l.1.1L13 12.1v-.2L3.6 2.3z"/><path fill="#00F076" d="M16.3 15.4l-3.3-3.3v-.2l3.3-3.3.1.1 3.9 2.2c1.1.6 1.1 1.7 0 2.3l-4 2.2z"/><path fill="#FF3A44" d="M16.4 15.3L13 11.9 3.6 21.7c.4.4 1 .4 1.7.1l11.1-6.5z"/><path fill="#FFC800" d="M16.4 8.5L5.3 2.1c-.7-.4-1.3-.3-1.7.1L13 11.9l3.4-3.4z"/></svg>
          <div style={{ textAlign: "left" }}><div style={{ fontSize: 9, opacity: .85 }}>GET IT ON</div><div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1 }}>Google Play</div></div>
      </StoreBadge>
    </div>
    {!live ? (
      <div style={{ fontSize: 12, opacity: .8, marginTop: 10, textAlign: compact ? "left" : "center" }}>Launching {APP_LAUNCH}</div>
    ) : null}
    </div>
  );
}
