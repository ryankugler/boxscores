import { normalizeTeamCode, TEAM_BRANDING } from "./data/constants";
import type { KnownTeamCode, TeamCode, TeamColors } from "./types";

const FALLBACK_PRIMARY = "#e8401a";
const FALLBACK_ALTERNATE = "#1d1f27";

export interface TeamPalette {
  primary: string;
  alternate: string;
}

// TeamColors stores ESPN's primary color as `light` and its alternate as `dark`.
export function getTeamPalette(team: TeamCode, override?: Partial<TeamColors>): TeamPalette {
  const base = TEAM_BRANDING[normalizeTeamCode(team) as KnownTeamCode]?.colors;

  return {
    primary: override?.light ?? base?.light ?? FALLBACK_PRIMARY,
    alternate: override?.dark ?? base?.dark ?? FALLBACK_ALTERNATE,
  };
}

// Picks a color for each side of a matchup, swapping the away team to its
// alternate color when both primaries are too close to tell apart.
export function getMatchupColors(
  away: TeamPalette,
  home: TeamPalette,
): { away: string; home: string } {
  if (colorDistance(away.primary, home.primary) > 90) {
    return { away: away.primary, home: home.primary };
  }

  return { away: away.alternate, home: home.primary };
}

export function hexToRgb(hex: string): [number, number, number] | null {
  const cleaned = hex.trim().replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(cleaned)) {
    return null;
  }

  return [
    Number.parseInt(cleaned.slice(0, 2), 16),
    Number.parseInt(cleaned.slice(2, 4), 16),
    Number.parseInt(cleaned.slice(4, 6), 16),
  ];
}

export function withAlpha(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return hex;
  }

  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

export function relativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return 0;
  }

  const [r, g, b] = rgb.map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function readableTextOn(hex: string): string {
  return relativeLuminance(hex) > 0.45 ? "#0b0c10" : "#ffffff";
}

// Team colors that are too dark (or too light) to read as text on the current
// page background get swapped for the team's other color.
export function getReadableAccent(palette: TeamPalette, dark: boolean): string {
  const primaryLum = relativeLuminance(palette.primary);
  const alternateLum = relativeLuminance(palette.alternate);

  if (dark) {
    if (primaryLum >= 0.08) {
      return palette.primary;
    }
    return alternateLum >= 0.08 ? palette.alternate : "#e8eaf0";
  }

  if (primaryLum <= 0.5) {
    return palette.primary;
  }
  return alternateLum <= 0.5 ? palette.alternate : "#0b0c10";
}

function colorDistance(a: string, b: string): number {
  const rgbA = hexToRgb(a);
  const rgbB = hexToRgb(b);
  if (!rgbA || !rgbB) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.hypot(rgbA[0] - rgbB[0], rgbA[1] - rgbB[1], rgbA[2] - rgbB[2]);
}
