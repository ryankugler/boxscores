import type { Theme } from "./types";

// Colors live as CSS custom properties in index.css, so light/dark switching
// (including following the system setting) happens in CSS without re-rendering.
export const THEME: Theme = {
  pageBg: "var(--page-bg)",
  headerBg: "var(--header-bg)",
  cardBg: "var(--card-bg)",
  altRowBg: "var(--alt-row-bg)",
  border: "var(--border)",
  hoverBg: "var(--hover-bg)",
  subHeader: "var(--sub-header)",
  divider: "var(--divider)",
  textPrimary: "var(--text-primary)",
  textSecond: "var(--text-second)",
  textMuted: "var(--text-muted)",
  textDim: "var(--text-dim)",
  textMono: "var(--text-mono)",
  posColor: "var(--pos-color)",
  badgeOff: "var(--badge-off)",
  badgeTextOff: "var(--badge-text-off)",
  badgeTextOn: "var(--badge-text-on)",
  scoreDim: "var(--score-dim)",
  toWarn: "var(--to-warn)",
  toggleBg: "var(--toggle-bg)",
  toggleLabel: "var(--toggle-label)",
};

export const TRANSITION_STYLE = {
  transition: "background 0.22s, color 0.22s, border-color 0.22s",
} as const;
