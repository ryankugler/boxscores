import type { TeamColors } from "../boxscore/types";

export interface PlayerSearchResult {
  id: string;
  name: string;
  team?: string;
  teamName?: string;
  position?: string;
  jersey?: string;
  headshot?: string;
}

export interface PlayerRankedStat {
  name: string;
  label: string;
  value: string;
  rank?: string;
}

export interface PlayerProfile {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  jersey?: string;
  position?: string;
  positionName?: string;
  headshot?: string;
  team?: string;
  teamName?: string;
  teamLogo?: string;
  teamColors?: TeamColors;
  height?: string;
  weight?: string;
  age?: number;
  birthPlace?: string;
  college?: string;
  draft?: string;
  experience?: string;
  status?: string;
  seasonLabel?: string;
  rankedStats: PlayerRankedStat[];
}

// Stats a single game log row exposes, keyed by ESPN's stat names.
export interface GameLogStats {
  minutes: number;
  fgm: number;
  fga: number;
  fgPct: string;
  p3m: number;
  p3a: number;
  p3Pct: string;
  ftm: number;
  fta: number;
  ftPct: string;
  reb: number;
  ast: number;
  blk: number;
  stl: number;
  pf: number;
  to: number;
  pts: number;
}

export interface GameLogEntry extends GameLogStats {
  eventId: string;
  date: string;
  month: string;
  isHome: boolean;
  opponent: string;
  opponentName?: string;
  opponentLogo?: string;
  result?: "W" | "L" | string;
  score?: string;
}

export interface GameLogSummaryRow {
  label: string;
  values: string[];
}

export interface GameLogSeasonType {
  key: string;
  label: string;
  games: GameLogEntry[];
  averages?: GameLogSummaryRow;
  totals?: GameLogSummaryRow;
}

export interface PlayerGameLog {
  seasonLabel: string;
  labels: string[];
  seasonTypes: GameLogSeasonType[];
}
