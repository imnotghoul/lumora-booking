import type { ViewStyle } from "react-native";

export const colors = {
  canvas: "#F7F8FC",
  surface: "#FFFFFF",
  surfaceMuted: "#F0F2F8",
  ink: "#172033",
  muted: "#657085",
  line: "#E3E6EF",
  accent: "#6366F1",
  accentDark: "#4744C5",
  accentSoft: "#EEF2FF",
  accentMid: "#C7D2FE",
  success: "#16855B",
  successSoft: "#E7F7F0",
  warning: "#B76812",
  warningSoft: "#FFF4E5",
  danger: "#C93D4B",
  dangerSoft: "#FDECEE",
  white: "#FFFFFF",
  black: "#000000",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

export const cardShadow: ViewStyle = {
  shadowColor: "#1F2A48",
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.08,
  shadowRadius: 18,
  elevation: 3,
};

export const typography = {
  hero: 34,
  h1: 28,
  h2: 22,
  h3: 17,
  body: 15,
  small: 13,
  caption: 12,
} as const;
