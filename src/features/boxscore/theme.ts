import type { Theme } from "./types";

export function mkTheme(dark: boolean): Theme {
  return dark
    ? {
        pageBg: "#0a0a0f",
        headerBg: "#0d0d1a",
        cardBg: "#16162e",
        altRowBg: "#13132a",
        border: "#1e1e3a",
        hoverBg: "#1d1d36",
        subHeader: "#0d0d1a",
        divider: "#1a1a32",
        textPrimary: "#f0f0fa",
        textSecond: "#ccccdd",
        textMuted: "#555570",
        textDim: "#888899",
        textMono: "#aaaacc",
        posColor: "#444460",
        badgeOff: "#1e1e3a",
        badgeTextOff: "#555570",
        badgeTextOn: "#000",
        scoreDim: "#606080",
        toWarn: "#ff6666",
        toggleBg: "#2a2a4a",
        toggleLabel: "#888899",
      }
    : {
        pageBg: "#eef0f8",
        headerBg: "#ffffff",
        cardBg: "#ffffff",
        altRowBg: "#f6f7fc",
        border: "#dde0ee",
        hoverBg: "#eaecf8",
        subHeader: "#f4f5fb",
        divider: "#e2e4f0",
        textPrimary: "#0a0a1e",
        textSecond: "#2a2a4a",
        textMuted: "#9090aa",
        textDim: "#aaaacc",
        textMono: "#555577",
        posColor: "#b0b0cc",
        badgeOff: "#e8eaf6",
        badgeTextOff: "#9090aa",
        badgeTextOn: "#ffffff",
        scoreDim: "#b8b8d0",
        toWarn: "#cc2222",
        toggleBg: "#c8cae0",
        toggleLabel: "#9090aa",
      };
}

export const TRANSITION_STYLE = {
  transition: "background 0.22s, color 0.22s, border-color 0.22s",
} as const;
