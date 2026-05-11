export const theme = {
  colors: {
    bg: "#0B1220",
    surface: "#0F1A2E",
    surface2: "#12213A",
    text: "#EAF0FF",
    muted: "#A7B2CC",
    placeholder: "rgba(167,178,204,0.35)",
    subtle: "rgba(234,240,255,0.08)",
    border: "rgba(234,240,255,0.12)",
    primary: "#4ADE80",
    danger: "#FB7185",
    warning: "#FBBF24",
    info: "#38BDF8",
    white: "#FFFFFF",
    black: "#000000",
  },
  radius: {
    sm: 12,
    md: 16,
    lg: 22,
    xl: 28,
  },
  space: {
    xs: 6,
    sm: 10,
    md: 14,
    lg: 18,
    xl: 24,
    xxl: 32,
  },
  type: {
    h1: { fontSize: 34, fontWeight: "800" as const },
    h2: { fontSize: 28, fontWeight: "800" as const },
    h3: { fontSize: 22, fontWeight: "800" as const },
    body: { fontSize: 16, fontWeight: "600" as const },
    small: { fontSize: 13, fontWeight: "600" as const },
    micro: { fontSize: 11, fontWeight: "700" as const },
  },
} as const;

export function hairlineColor(alpha = 0.12) {
  return `rgba(234,240,255,${alpha})`;
}

