import type { Theme } from "../boxscore/types";

import type { BracketTheme } from "./types";

export function createBracketTheme(theme: Theme, dark: boolean): BracketTheme {
  const eastAccent = dark ? "#4f7bdd" : "#2456c7";
  const westAccent = dark ? "#d36a49" : "#b03010";

  return {
    panelBg: theme.cardBg,
    panelBorder: theme.border,
    cardBg: theme.altRowBg,
    cardBorder: theme.border,
    tbd: dark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.03)",
    tbdBorder: theme.border,
    tbdText: theme.textMuted,
    teamName: theme.textPrimary,
    seedColor: theme.textMuted,
    record: theme.textSecond,
    divider: theme.divider,
    colLabel: theme.textMuted,
    line: dark ? "rgba(90,130,210,0.35)" : "rgba(60,100,200,0.3)",
    finBorder: dark ? "rgba(90,130,210,0.42)" : "rgba(36,86,199,0.3)",
    finBg: dark ? "rgba(90,130,210,0.08)" : "rgba(36,86,199,0.06)",
    finLabel: dark ? "#76a2ff" : "#2456c7",
    subtitle: theme.textMuted,
    noteText: theme.textMuted,
    piColor: dark ? "#f7a621" : "#9d6400",
    playInBg: theme.altRowBg,
    playInBorder: theme.border,
    projBorder: dark ? "rgba(247,166,33,0.5)" : "rgba(157,100,0,0.5)",
    rulesBg: dark ? "rgba(247,166,33,0.08)" : "rgba(157,100,0,0.06)",
    rulesBorder: dark ? "rgba(247,166,33,0.25)" : "rgba(157,100,0,0.25)",
    rulesText: theme.textSecond,
    toggleBg: theme.altRowBg,
    toggleBorder: theme.border,
    toggleText: theme.textMuted,
    buttonBg: "#e8401a",
    buttonText: "#ffffff",
    buttonTextInactive: theme.textSecond,
    EAST_accent: eastAccent,
    WEST_accent: westAccent,
  };
}
