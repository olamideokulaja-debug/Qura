// Qura design tokens, mirrored from the web app so both platforms stay visually identical.
export const colors = {
  navy: "#0A1A30",
  navy2: "#102A4F",
  blue: "#2D6BFF",
  blueInk: "#1E54E6",
  teal: "#0E8C7E",
  cyan: "#00C2B8",
  cyanSoft: "#E6F4F2",
  violet: "#7C5CFF",
  amber: "#FBAE40",
  text: "#1A2233",
  muted: "#5A6783",
  faint: "#8A97AE",
  line: "#E4EAF3",
  bg: "#F4F7FB",
  bg2: "#EEF1F7",
  white: "#FFFFFF",
  red: "#E11D48",
};

export const space = { xs: 6, sm: 10, md: 16, lg: 22, xl: 30 };
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 };

export const type = {
  display: { fontSize: 26, fontWeight: "700", color: colors.text },
  h1: { fontSize: 22, fontWeight: "700", color: colors.text },
  h2: { fontSize: 17, fontWeight: "600", color: colors.text },
  body: { fontSize: 14.5, color: colors.text, lineHeight: 21 },
  muted: { fontSize: 13.5, color: colors.muted, lineHeight: 20 },
  small: { fontSize: 12, color: colors.faint },
};

export const shadow = {
  shadowColor: "#0A1A30",
  shadowOpacity: 0.08,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 6 },
  elevation: 3,
};
