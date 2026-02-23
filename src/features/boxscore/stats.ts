import type {
  Game,
  NumericStatKey,
  PlayerStats,
  RatioStatKey,
  SortableStatKey,
  StatColumn,
  TopPerformer,
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
    (a, b) => sortDir * ((a[sortCol] ?? 0) - (b[sortCol] ?? 0)),
  );
}

const TOP_PERFORMER_STAT_KEYS: Array<keyof Pick<PlayerStats, "pts" | "reb" | "ast" | "stl" | "blk">> =
  ["pts", "reb", "ast", "stl", "blk"];

export function getTopPerformersForDate(
  games: Game[],
  date: string,
  limit = 5,
): TopPerformer[] {
  if (!date || limit <= 0) {
    return [];
  }

  const leaderboard = games
    .filter((game) => game.date === date && game.statusState !== "pre")
    .flatMap((game) => [game.away, game.home].flatMap((team) => {
      const players = game.players[team] ?? [];

      return players.map((player) => {
        const total = TOP_PERFORMER_STAT_KEYS.reduce(
          (sum, key) => sum + (player[key] ?? 0),
          0,
        );

        return {
          athleteId: player.athleteId,
          photoUrl: player.photoUrl,
          name: player.name,
          pos: player.pos,
          team,
          gameId: game.id,
          pts: player.pts ?? 0,
          reb: player.reb ?? 0,
          ast: player.ast ?? 0,
          stl: player.stl ?? 0,
          blk: player.blk ?? 0,
          total,
        };
      });
    }))
    .filter((entry) => entry.total > 0)
    .sort((a, b) => {
      if (b.total !== a.total) {
        return b.total - a.total;
      }

      if (b.pts !== a.pts) {
        return b.pts - a.pts;
      }

      if (b.reb !== a.reb) {
        return b.reb - a.reb;
      }

      if (b.ast !== a.ast) {
        return b.ast - a.ast;
      }

      return a.name.localeCompare(b.name);
    });

  return leaderboard.slice(0, limit);
}
