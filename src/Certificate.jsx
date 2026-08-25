// Qura Academy certificate.
//
// Drawn as SVG rather than shipped as eight images, for three reasons:
//
//   1. The name, course, date and credential ID have to be filled in per
//      person. A flat image cannot do that.
//   2. There are five courses and there will be more. An SVG that takes the
//      course's own accent colour covers every future course for free; a set
//      of images has to be redrawn each time.
//   3. It stays sharp at any size, and downloads as a clean PNG.
//
// The layout follows the founder's designed certificates: corner sweep, ribbon,
// watermark, seal bottom-left, twin founder signatures, QR bottom-right,
// credential ID and a footer rule.

import React, { useEffect, useRef, useState } from "react";
import { Download, Share2, Check } from "lucide-react";
import QRCode from "qrcode";

const NAVY = "#0A1A30";

// Each course carries its own identity, matching the designed set.
const THEME = {
  "essentials": { accent: "#0E6B4F", tint: "#E7F3EE" },
  "career-ready": { accent: "#1D4ED8", tint: "#E8EEFD" },
  "provider-certified": { accent: "#0E8C7E", tint: "#E4F4F1" },
  "supplier-certified": { accent: "#5B2D8E", tint: "#EFE9F6" },
  "qbd": { accent: "#B8893B", tint: "#F7F0E2" },
};

const fmtDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  } catch (e) { return ""; }
};

export default function Certificate({ cert, onClose }) {
  const svgRef = useRef(null);
  const [qr, setQr] = useState("");
  const [saved, setSaved] = useState(false);

  const t = THEME[cert.courseId] || THEME.essentials;

  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(cert.verifyUrl || "https://www.qurahealth.org", {
      margin: 0, width: 240, color: { dark: NAVY, light: "#FFFFFF" },
    }).then((url) => { if (alive) setQr(url); }).catch(() => {});
    return () => { alive = false; };
  }, [cert.verifyUrl]);

  // Rasterise the SVG to PNG in the browser. Everything is inline — fonts are
  // converted to paths by the browser at draw time and the QR is already a data
  // URL — so nothing external is fetched and the canvas is never tainted.
  const download = async () => {
    const svg = svgRef.current;
    if (!svg) return;
    const xml = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = 2100; c.height = 1485;               // A4 landscape at 180dpi
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      c.toBlob((b) => {
        if (!b) return;
        const a = document.createElement("a");
        a.href = URL.createObjectURL(b);
        a.download = "Qura-" + String(cert.course).replace(/[^A-Za-z0-9]+/g, "-") + "-" + cert.credentialId + ".png";
        a.click();
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }, "image/png");
    };
    img.src = url;
  };

  const W = 1400, H = 990;

  return (
    <div>
      <svg ref={svgRef} viewBox={"0 0 " + W + " " + H} xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", height: "auto", display: "block", borderRadius: 12, boxShadow: "0 18px 50px rgba(10,26,48,.18)" }}>
        <defs>
          <clipPath id="card"><rect x="0" y="0" width={W} height={H} rx="18" /></clipPath>
        </defs>
        <g clipPath="url(#card)">
          <rect width={W} height={H} fill="#FFFFFF" />

          {/* corner sweep, top left */}
          <path d={"M0,0 L470,0 C300,120 150,300 96," + H + " L0," + H + " Z"} fill={t.tint} />
          <path d={"M0,0 L400,0 C250,120 120,300 74," + H + " L0," + H + " Z"} fill={t.accent} opacity="0.16" />

          {/* watermark */}
          <g opacity="0.05" transform={"translate(" + (W - 330) + ",330)"}>
            <circle cx="0" cy="0" r="150" fill="none" stroke={NAVY} strokeWidth="26" />
            <rect x="-58" y="-14" width="30" height="70" rx="10" fill={NAVY} />
            <rect x="-14" y="-54" width="30" height="110" rx="10" fill={NAVY} />
            <rect x="30" y="-92" width="30" height="148" rx="10" fill={NAVY} />
            <rect x="96" y="96" width="150" height="40" rx="20" fill={NAVY} transform="rotate(45 96 96)" />
          </g>

          {/* ribbon, top right */}
          <path d={"M" + (W - 190) + ",0 L" + (W - 60) + ",0 L" + (W - 60) + ",176 L" + (W - 125) + ",132 L" + (W - 190) + ",176 Z"} fill={t.accent} />

          {/* lockup */}
          <g transform={"translate(" + (W / 2 - 168) + ",46)"}>
            <circle cx="30" cy="34" r="26" fill="none" stroke={NAVY} strokeWidth="7" />
            <rect x="17" y="30" width="8" height="18" rx="3" fill={t.accent} />
            <rect x="29" y="20" width="8" height="28" rx="3" fill={t.accent} />
            <rect x="41" y="10" width="8" height="38" rx="3" fill={t.accent} />
            <line x1="48" y1="52" x2="64" y2="68" stroke={NAVY} strokeWidth="8" strokeLinecap="round" />
            <text x="82" y="34" fontFamily="Inter, Helvetica, Arial, sans-serif" fontSize="42" fontWeight="800" letterSpacing="5" fill={NAVY}>QURA</text>
            <text x="84" y="62" fontFamily="Inter, Helvetica, Arial, sans-serif" fontSize="19" fontWeight="700" letterSpacing="7" fill={t.accent}>ACADEMY</text>
          </g>

          <text x={W / 2} y="212" textAnchor="middle" fontFamily="Inter, Helvetica, Arial, sans-serif"
            fontSize="72" fontWeight="800" letterSpacing="4" fill={NAVY}>CERTIFICATE</text>
          <line x1={W / 2 - 300} y1="248" x2={W / 2 - 130} y2="248" stroke={t.accent} strokeWidth="2.5" />
          <line x1={W / 2 + 130} y1="248" x2={W / 2 + 300} y2="248" stroke={t.accent} strokeWidth="2.5" />
          <text x={W / 2} y="257" textAnchor="middle" fontFamily="Inter, Helvetica, Arial, sans-serif"
            fontSize="25" fontWeight="700" letterSpacing="6" fill={t.accent}>OF COMPLETION</text>

          <text x={W / 2} y="308" textAnchor="middle" fontFamily="Inter, Helvetica, Arial, sans-serif"
            fontSize="22" fill={NAVY}>This is to certify that</text>

          {/* the name */}
          <text x={W / 2} y="404" textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif"
            fontSize={String(cert.name).length > 26 ? "60" : "78"} fontStyle="italic" fill={t.accent}>{cert.name}</text>

          <text x={W / 2} y="452" textAnchor="middle" fontFamily="Inter, Helvetica, Arial, sans-serif"
            fontSize="22" fill={NAVY}>has successfully completed the course</text>

          <text x={W / 2} y="510" textAnchor="middle" fontFamily="Inter, Helvetica, Arial, sans-serif"
            fontSize={String(cert.course).length > 30 ? "38" : "46"} fontWeight="800" letterSpacing="1" fill={NAVY}>
            {String(cert.course).toUpperCase()}
          </text>

          {cert.strapline ? (
            <text x={W / 2} y="550" textAnchor="middle" fontFamily="Inter, Helvetica, Arial, sans-serif"
              fontSize="21" fontWeight="700" fill={t.accent}>{cert.strapline}</text>
          ) : null}

          {/* seal */}
          <g transform="translate(196,700)">
            <circle cx="0" cy="0" r="92" fill={t.accent} />
            <circle cx="0" cy="0" r="80" fill="none" stroke="#fff" strokeWidth="2" opacity="0.85" />
            <circle cx="0" cy="-30" r="26" fill="#fff" />
            <rect x="-13" y="-34" width="7" height="15" rx="2.5" fill={t.accent} />
            <rect x="-3" y="-42" width="7" height="23" rx="2.5" fill={t.accent} />
            <rect x="7" y="-50" width="7" height="31" rx="2.5" fill={t.accent} />
            <text x="0" y="18" textAnchor="middle" fontFamily="Inter, Helvetica, Arial, sans-serif"
              fontSize="15" fontWeight="800" letterSpacing="1" fill="#fff">CERTIFIED</text>
            <text x="0" y="48" textAnchor="middle" fontSize="19" fill="#fff">★ ★ ★</text>
          </g>

          {/* signatures */}
          <text x={W / 2} y="646" textAnchor="middle" fontFamily="Inter, Helvetica, Arial, sans-serif"
            fontSize="19" fontWeight="700" fill={t.accent}>Qura Founders</text>
          <path d="M470,706 c26,-26 44,10 66,-8 c18,-14 30,10 52,-6" fill="none" stroke={NAVY} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="452" y1="726" x2="640" y2="726" stroke={NAVY} strokeWidth="1.5" />
          <text x="546" y="752" textAnchor="middle" fontFamily="Inter, Helvetica, Arial, sans-serif" fontSize="19" fontWeight="700" fill={NAVY}>Ola Folawiyo</text>
          <text x="546" y="776" textAnchor="middle" fontFamily="Inter, Helvetica, Arial, sans-serif" fontSize="17" fill="#5A6783">Co-Founder, Qura</text>

          <line x1={W / 2} y1="694" x2={W / 2} y2="778" stroke="#D8DEE9" strokeWidth="1.5" />

          <path d="M772,708 c30,-30 40,16 64,-6 c20,-18 34,12 58,-10" fill="none" stroke={NAVY} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="756" y1="726" x2="944" y2="726" stroke={NAVY} strokeWidth="1.5" />
          <text x="850" y="752" textAnchor="middle" fontFamily="Inter, Helvetica, Arial, sans-serif" fontSize="19" fontWeight="700" fill={NAVY}>Dr. Olamide Okulaja</text>
          <text x="850" y="776" textAnchor="middle" fontFamily="Inter, Helvetica, Arial, sans-serif" fontSize="17" fill="#5A6783">Co-Founder, Qura</text>

          {/* QR — resolves to the public verification page */}
          {qr ? (
            <g>
              <rect x={W - 250} y="636" width="164" height="164" rx="12" fill="#fff" stroke={t.accent} strokeWidth="2" />
              <image href={qr} x={W - 238} y="648" width="140" height="140" />
              <text x={W - 168} y="822" textAnchor="middle" fontFamily="Inter, Helvetica, Arial, sans-serif"
                fontSize="14" fill="#5A6783">Scan to verify</text>
            </g>
          ) : null}

          <text x="452" y="862" fontFamily="Inter, Helvetica, Arial, sans-serif" fontSize="17" fill={NAVY}>
            Date of completion: <tspan fontWeight="700">{fmtDate(cert.issuedAt)}</tspan>
          </text>
          <line x1="800" y1="846" x2="800" y2="868" stroke="#D8DEE9" strokeWidth="1.5" />
          <text x="830" y="862" fontFamily="Inter, Helvetica, Arial, sans-serif" fontSize="17" fill={NAVY}>
            Certificate ID: <tspan fontWeight="700">{cert.credentialId}</tspan>
          </text>

          {/* footer */}
          <rect x="0" y={H - 62} width={W} height="62" fill={NAVY} />
          <text x={W / 2} y={H - 22} textAnchor="middle" fontFamily="Inter, Helvetica, Arial, sans-serif"
            fontSize="21" fontWeight="700" letterSpacing="5" fill="#fff">
            LEARN. CONNECT. <tspan fill={t.accent === "#B8893B" ? "#E4B75F" : "#6FE3D4"}>GROW.</tspan>
          </text>
        </g>
      </svg>

      <div className="row" style={{ gap: 10, marginTop: 16, flexWrap: "wrap", justifyContent: "center" }}>
        <button className="btn btn-primary" onClick={download}>
          {saved ? <><Check size={16} /> Saved</> : <><Download size={16} /> Download certificate</>}
        </button>
        <a className="btn btn-light" target="_blank" rel="noreferrer"
          href={"https://www.linkedin.com/sharing/share-offsite/?url=" + encodeURIComponent(cert.verifyUrl || "https://www.qurahealth.org")}>
          <Share2 size={16} /> Share on LinkedIn
        </a>
        {onClose ? <button className="btn btn-light" onClick={onClose}>Close</button> : null}
      </div>
      <div className="muted" style={{ fontSize: 12.5, textAlign: "center", marginTop: 10 }}>
        Anyone can check this credential at qurahealth.org/verify — no account needed.
      </div>
    </div>
  );
}
