import React from "react";
import { View, Text } from "react-native";
import Svg, { Circle, Path, Rect, Defs, LinearGradient, Stop, Text as SvgText } from "react-native-svg";
import { colors } from "../theme";

// ---- Qura logo mark (circle + magnifier + three bars) ----
export function Logo({ size = 28, stroke = colors.navy, bright = false }) {
  const bars = bright ? ["#3DD6C8", "#22C7CE", "#1AA6D6"] : ["#2BB6A8", "#1FA0A6", "#178FB0"];
  return (
    <Svg width={size} height={size} viewBox="0 0 44 44">
      <Circle cx="20" cy="20" r="12.5" stroke={stroke} strokeWidth="3.4" fill="none" />
      <Path d="M26.5 26.5 L33 33" stroke={stroke} strokeWidth="3.6" strokeLinecap="round" />
      <Rect x="13.4" y="22" width="3.1" height="6" rx="1.2" fill={bars[0]} />
      <Rect x="18.1" y="18" width="3.1" height="10" rx="1.2" fill={bars[1]} />
      <Rect x="22.8" y="14" width="3.1" height="14" rx="1.2" fill={bars[2]} />
    </Svg>
  );
}

// ---- fit-score ring ----
export function FitRing({ value, size = 46 }) {
  const color = value >= 90 ? colors.teal : value >= 80 ? colors.blue : colors.violet;
  const r = 15, c = 2 * Math.PI * r, off = c * (1 - value / 100);
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Circle cx="20" cy="20" r={r} fill="none" stroke={colors.line} strokeWidth="4" />
      <Circle cx="20" cy="20" r={r} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={off} transform="rotate(-90 20 20)" />
      <SvgText x="20" y="24" textAnchor="middle" fontSize="11" fontWeight="800" fill={colors.text}>{String(value)}</SvgText>
    </Svg>
  );
}

// ---- verification donut (on the dark card) ----
export function VerifyDonut({ pct, size = 76 }) {
  const r = 26, c = 2 * Math.PI * r, off = c * (1 - pct / 100);
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="6" />
      <Circle cx="32" cy="32" r={r} fill="none" stroke={colors.cyan} strokeWidth="6" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={off} transform="rotate(-90 32 32)" />
      <SvgText x="32" y="37" textAnchor="middle" fontSize="16" fontWeight="800" fill="#fff">{pct + "%"}</SvgText>
    </Svg>
  );
}

// ---- market-mix mini bars ----
export function MarketMix({ counts }) {
  const keys = ["NHS", "Private", "International"];
  const tone = { NHS: colors.teal, Private: colors.blue, International: colors.violet };
  const max = Math.max(1, ...keys.map((k) => counts[k] || 0));
  return (
    <View>
      {keys.map((k) => (
        <View key={k} style={{ marginBottom: 9 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.muted }}>{k}</Text>
            <Text style={{ fontSize: 12, color: colors.faint }}>{(counts[k] || 0) + " live"}</Text>
          </View>
          <View style={{ height: 8, backgroundColor: colors.bg2, borderRadius: 99, overflow: "hidden" }}>
            <View style={{ height: 8, width: Math.round((counts[k] || 0) / max * 100) + "%", backgroundColor: tone[k], borderRadius: 99 }} />
          </View>
        </View>
      ))}
    </View>
  );
}

// ---- sparkline: new roles over the last 7 days ----
export function Sparkline({ vals = [2, 4, 3, 6, 5, 7, 6], width = 300, height = 54 }) {
  const max = Math.max(...vals), pad = 6;
  const step = (width - pad * 2) / (vals.length - 1);
  const pts = vals.map((v, i) => [pad + i * step, height - pad - (v / max) * (height - pad * 2)]);
  const line = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const area = line + " L" + pts[pts.length - 1][0].toFixed(1) + " " + (height - pad) + " L" + pts[0][0].toFixed(1) + " " + (height - pad) + " Z";
  const last = pts[pts.length - 1];
  return (
    <Svg width="100%" height={height} viewBox={"0 0 " + width + " " + height} preserveAspectRatio="none">
      <Defs>
        <LinearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors.cyan} stopOpacity="0.28" />
          <Stop offset="1" stopColor={colors.cyan} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Path d={area} fill="url(#sg)" />
      <Path d={line} fill="none" stroke={colors.teal} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={last[0].toFixed(1)} cy={last[1].toFixed(1)} r="3.5" fill={colors.teal} />
    </Svg>
  );
}
