import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { colors, radius, shadow, type } from "../theme";

export function Card({ children, style }) {
  return (
    <View style={[{ backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1,
      borderColor: colors.line, padding: 16, marginBottom: 12 }, shadow, style]}>
      {children}
    </View>
  );
}

export function Chip({ label, tone = "grey" }) {
  const map = {
    grey: [colors.bg2, colors.muted],
    cyan: [colors.cyanSoft, "#06776F"],
    blue: ["#EEF3FF", colors.blueInk],
    violet: ["#F3EEFF", colors.violet],
    amber: ["#FFF4E0", "#9A5E00"],
  };
  const [bg, fg] = map[tone] || map.grey;
  return (
    <View style={{ backgroundColor: bg, paddingHorizontal: 10, paddingVertical: 4,
      borderRadius: radius.pill, alignSelf: "flex-start", marginRight: 6, marginTop: 6 }}>
      <Text style={{ color: fg, fontSize: 11.5, fontWeight: "600" }}>{label}</Text>
    </View>
  );
}

export function Button({ title, onPress, variant = "primary", disabled, loading }) {
  const styles = {
    primary: { bg: colors.teal, fg: colors.white, border: colors.teal },
    light: { bg: colors.bg2, fg: colors.text, border: colors.line },
    dark: { bg: colors.navy, fg: colors.white, border: colors.navy },
  }[variant];
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={{ backgroundColor: styles.bg, borderColor: styles.border, borderWidth: 1,
        paddingVertical: 13, borderRadius: radius.pill, alignItems: "center",
        opacity: disabled ? 0.5 : 1 }}>
      {loading
        ? <ActivityIndicator color={styles.fg} />
        : <Text style={{ color: styles.fg, fontWeight: "700", fontSize: 15 }}>{title}</Text>}
    </TouchableOpacity>
  );
}

export function PageHead({ title, sub }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <View style={{ width: 26, height: 3, backgroundColor: colors.teal, borderRadius: 2, marginBottom: 10 }} />
      <Text style={type.display}>{title}</Text>
      {sub ? <Text style={[type.muted, { marginTop: 4 }]}>{sub}</Text> : null}
    </View>
  );
}

export function Empty({ text }) {
  return (
    <View style={{ padding: 30, alignItems: "center" }}>
      <Text style={type.muted}>{text}</Text>
    </View>
  );
}
