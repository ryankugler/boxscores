export type KnownTeamCode =
  | "ATL"
  | "BOS"
  | "BKN"
  | "CHA"
  | "CHI"
  | "CLE"
  | "DAL"
  | "DEN"
  | "DET"
  | "GSW"
  | "HOU"
  | "IND"
  | "LAC"
  | "LAL"
  | "MEM"
  | "MIA"
  | "MIL"
  | "MIN"
  | "NOP"
  | "NYK"
  | "OKC"
  | "ORL"
  | "PHI"
  | "PHX"
  | "POR"
  | "SAC"
  | "SAS"
  | "TOR"
  | "UTA"
  | "WAS";

export type TeamCode = KnownTeamCode | string;

export type Quarter = "1" | "2" | "3" | "4";

export type RatioStatKey = "fgm" | "fga" | "p3m" | "p3a" | "ftm" | "fta";

export type NumericStatKey = "pts" | "reb" | "ast" | "stl" | "blk" | "to";

export type SortableStatKey = "fgm" | "p3m" | "ftm" | NumericStatKey;

export type StatColumn =
  | "FGM/A"
  | "3PM/A"
  | "FTM/A"
  | "PTS"
  | "REB"
  | "AST"
  | "STL"
  | "BLK"
  | "TO";

export type SortDirection = 1 | -1;

export interface PlayerStats {
  athleteId?: string;
  photoUrl?: string;
  name: string;
  pos: string;
  fgm: number;
  fga: number;
  p3m: number;
  p3a: number;
  ftm: number;
  fta: number;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  to: number;
}

export interface TopPerformer {
  athleteId?: string;
  photoUrl?: string;
  name: string;
  pos: string;
  team: TeamCode;
  gameId: string;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  total: number;
}

export interface Game {
  id: string;
  date: string;
  home: TeamCode;
  away: TeamCode;
  homeTeam: string;
  awayTeam: string;
  score: Record<string, number>;
  periods: Record<Quarter, Record<string, number>>;
  players: Record<string, PlayerStats[]>;
  teamLogos?: Record<string, string>;
  teamColors?: Record<string, TeamColors>;
  statusState?: "pre" | "in" | "post" | string;
  statusText?: string;
}

export interface TeamColors {
  dark: string;
  light: string;
}

export interface Theme {
  pageBg: string;
  headerBg: string;
  cardBg: string;
  altRowBg: string;
  border: string;
  hoverBg: string;
  subHeader: string;
  divider: string;
  textPrimary: string;
  textSecond: string;
  textMuted: string;
  textDim: string;
  textMono: string;
  posColor: string;
  badgeOff: string;
  badgeTextOff: string;
  badgeTextOn: string;
  scoreDim: string;
  toWarn: string;
  toggleBg: string;
  toggleLabel: string;
}
