import type { KnownTeamCode, TeamCode, TeamColors } from "../types";

interface TeamBranding {
  logo: string;
  colors: TeamColors;
}

export const TEAM_ABBR_ALIASES: Record<string, TeamCode> = {
  GS: "GSW",
  NO: "NOP",
  NY: "NYK",
  PHO: "PHX",
  SA: "SAS",
};

export const TEAM_BRANDING: Record<KnownTeamCode, TeamBranding> = {
  ATL: {
    logo: "https://a.espncdn.com/i/teamlogos/nba/500/atl.png",
    colors: { dark: "#C1D32F", light: "#E03A3E" },
  },
  BOS: {
    logo: "https://a.espncdn.com/i/teamlogos/nba/500/bos.png",
    colors: { dark: "#BA9653", light: "#007A33" },
  },
  BKN: {
    logo: "https://a.espncdn.com/i/teamlogos/nba/500/bkn.png",
    colors: { dark: "#A7A9AC", light: "#000000" },
  },
  CHA: {
    logo: "https://a.espncdn.com/i/teamlogos/nba/500/cha.png",
    colors: { dark: "#00788C", light: "#1D1160" },
  },
  CHI: {
    logo: "https://a.espncdn.com/i/teamlogos/nba/500/chi.png",
    colors: { dark: "#CE1141", light: "#000000" },
  },
  CLE: {
    logo: "https://a.espncdn.com/i/teamlogos/nba/500/cle.png",
    colors: { dark: "#FDBB30", light: "#860038" },
  },
  DAL: {
    logo: "https://a.espncdn.com/i/teamlogos/nba/500/dal.png",
    colors: { dark: "#6CB4E8", light: "#0053BC" },
  },
  DEN: {
    logo: "https://a.espncdn.com/i/teamlogos/nba/500/den.png",
    colors: { dark: "#FEC524", light: "#0E2240" },
  },
  DET: {
    logo: "https://a.espncdn.com/i/teamlogos/nba/500/det.png",
    colors: { dark: "#1D42BA", light: "#C8102E" },
  },
  GSW: {
    logo: "https://a.espncdn.com/i/teamlogos/nba/500/gs.png",
    colors: { dark: "#FFC72C", light: "#1D428A" },
  },
  HOU: {
    logo: "https://a.espncdn.com/i/teamlogos/nba/500/hou.png",
    colors: { dark: "#CE1141", light: "#000000" },
  },
  IND: {
    logo: "https://a.espncdn.com/i/teamlogos/nba/500/ind.png",
    colors: { dark: "#FDBB30", light: "#002D62" },
  },
  LAC: {
    logo: "https://a.espncdn.com/i/teamlogos/nba/500/lac.png",
    colors: { dark: "#1D428A", light: "#C8102E" },
  },
  LAL: {
    logo: "https://a.espncdn.com/i/teamlogos/nba/500/lal.png",
    colors: { dark: "#FDB927", light: "#552583" },
  },
  MEM: {
    logo: "https://a.espncdn.com/i/teamlogos/nba/500/mem.png",
    colors: { dark: "#5D76A9", light: "#12173F" },
  },
  MIA: {
    logo: "https://a.espncdn.com/i/teamlogos/nba/500/mia.png",
    colors: { dark: "#F9A01B", light: "#98002E" },
  },
  MIL: {
    logo: "https://a.espncdn.com/i/teamlogos/nba/500/mil.png",
    colors: { dark: "#EEE1C6", light: "#00471B" },
  },
  MIN: {
    logo: "https://a.espncdn.com/i/teamlogos/nba/500/min.png",
    colors: { dark: "#78BE20", light: "#0C2340" },
  },
  NOP: {
    logo: "https://a.espncdn.com/i/teamlogos/nba/500/no.png",
    colors: { dark: "#C8102E", light: "#0C2340" },
  },
  NYK: {
    logo: "https://a.espncdn.com/i/teamlogos/nba/500/ny.png",
    colors: { dark: "#F58426", light: "#006BB6" },
  },
  OKC: {
    logo: "https://a.espncdn.com/i/teamlogos/nba/500/okc.png",
    colors: { dark: "#EF3B24", light: "#007AC1" },
  },
  ORL: {
    logo: "https://a.espncdn.com/i/teamlogos/nba/500/orl.png",
    colors: { dark: "#C4CED4", light: "#0077C0" },
  },
  PHI: {
    logo: "https://a.espncdn.com/i/teamlogos/nba/500/phi.png",
    colors: { dark: "#ED174C", light: "#006BB6" },
  },
  PHX: {
    logo: "https://a.espncdn.com/i/teamlogos/nba/500/phx.png",
    colors: { dark: "#E56020", light: "#1D1160" },
  },
  POR: {
    logo: "https://a.espncdn.com/i/teamlogos/nba/500/por.png",
    colors: { dark: "#E03A3E", light: "#C8102E" },
  },
  SAC: {
    logo: "https://a.espncdn.com/i/teamlogos/nba/500/sac.png",
    colors: { dark: "#63727A", light: "#5A2D81" },
  },
  SAS: {
    logo: "https://a.espncdn.com/i/teamlogos/nba/500/sa.png",
    colors: { dark: "#C4CED4", light: "#000000" },
  },
  TOR: {
    logo: "https://a.espncdn.com/i/teamlogos/nba/500/tor.png",
    colors: { dark: "#A1A1A4", light: "#CE1141" },
  },
  UTA: {
    logo: "https://a.espncdn.com/i/teamlogos/nba/500/utah.png",
    colors: { dark: "#F9A01B", light: "#002B5C" },
  },
  WAS: {
    logo: "https://a.espncdn.com/i/teamlogos/nba/500/wsh.png",
    colors: { dark: "#E31837", light: "#002B5C" },
  },
};

const DEFAULT_COLORS: TeamColors = { dark: "#e8401a", light: "#cc3300" };

export function normalizeTeamCode(team: string): TeamCode {
  const upper = team.trim().toUpperCase();
  return TEAM_ABBR_ALIASES[upper] ?? upper;
}

export function getTeamLogo(team: TeamCode, overrideLogo?: string): string | undefined {
  if (overrideLogo) {
    return overrideLogo;
  }

  const normalized = normalizeTeamCode(team);
  return TEAM_BRANDING[normalized as KnownTeamCode]?.logo;
}

export function getAccent(
  team: TeamCode,
  dark: boolean,
  overrideColors?: Partial<TeamColors>,
): string {
  const normalized = normalizeTeamCode(team);
  const baseColors = TEAM_BRANDING[normalized as KnownTeamCode]?.colors;
  const colors: TeamColors = {
    dark: overrideColors?.dark ?? baseColors?.dark ?? DEFAULT_COLORS.dark,
    light: overrideColors?.light ?? baseColors?.light ?? DEFAULT_COLORS.light,
  };

  return dark ? colors.dark : colors.light;
}
