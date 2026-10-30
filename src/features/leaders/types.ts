export type LeaderStatKey =
  | "gp"
  | "min"
  | "pts"
  | "reb"
  | "ast"
  | "stl"
  | "blk"
  | "to"
  | "fgm"
  | "fgPct"
  | "p3m"
  | "p3Pct"
  | "ftm"
  | "ftPct"
  | "dd2";

export interface SeasonLeaderRow {
  id: string;
  name: string;
  shortName: string;
  team: string;
  teamLogo?: string;
  headshot?: string;
  position?: string;
  stats: Record<LeaderStatKey, number>;
}

export interface SeasonLeaders {
  seasonLabel: string;
  seasonType: string;
  rows: SeasonLeaderRow[];
}
