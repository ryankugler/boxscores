import type {
  NumericStatKey,
  PlayerStats,
  RatioStatKey,
  SortableStatKey,
  StatColumn,
} from "./types";

export const COLS: StatColumn[] = [
  "FGM/A",
  "3PM/A",
  "FTM/A",
  "PTS",
  "REB",
  "AST",
  "STL",
  "BLK",
  "TO",
];

export const COL_KEY: Record<StatColumn, SortableStatKey> = {
  "FGM/A": "fgm",
  "3PM/A": "p3m",
  "FTM/A": "ftm",
  PTS: "pts",
  REB: "reb",
  AST: "ast",
  STL: "stl",
  BLK: "blk",
  TO: "to",
};

export const RATIO_COLUMNS: Array<[RatioStatKey, RatioStatKey]> = [
  ["fgm", "fga"],
  ["p3m", "p3a"],
  ["ftm", "fta"],
];

export const NUMERIC_STAT_COLUMNS: NumericStatKey[] = [
  "pts",
  "reb",
  "ast",
  "stl",
  "blk",
  "to",
];

export function sortPlayers(
  players: PlayerStats[],
  sortCol: SortableStatKey,
  sortDir: 1 | -1,
): PlayerStats[] {
  return [...players].sort(
    (a, b) => sortDir * ((b[sortCol] ?? 0) - (a[sortCol] ?? 0)),
  );
}
