import type { CSSProperties } from "react";

import { readableTextOn } from "../color";
import { COL_KEY, COLS, NUMERIC_STAT_COLUMNS, RATIO_COLUMNS } from "../stats";
import type {
  NumericStatKey,
  PlayerStats,
  SortDirection,
  SortableStatKey,
  StatColumn,
  TeamCode,
} from "../types";
import { PlayerAvatar } from "./PlayerAvatar";
import styles from "./PlayerStatsTable.module.css";

interface PlayerStatsTableProps {
  gameId: string;
  activeTeam: TeamCode;
  animKey: number;
  sortedPlayers: PlayerStats[];
  sortCol: SortableStatKey;
  sortDir: SortDirection;
  teamColor: string;
  accent: string;
  emptyMessage?: string | null;
  onSort: (column: StatColumn) => void;
}

export function PlayerStatsTable({
  gameId,
  activeTeam,
  animKey,
  sortedPlayers,
  sortCol,
  sortDir,
  teamColor,
  accent,
  emptyMessage,
  onSort,
}: PlayerStatsTableProps) {
  const leaders = getColumnLeaders(sortedPlayers);

  return (
    <div
      className={styles.panel}
      style={
        {
          "--team-color": teamColor,
          "--team-ink": readableTextOn(teamColor),
          "--accent": accent,
        } as CSSProperties
      }
    >
      <div className={`${styles.scroll} scrollbar-hidden`}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.playerHead}>Player</th>
              <th className={styles.posHead}>Pos</th>
              {COLS.map((column) => {
                const isActive = sortCol === COL_KEY[column];

                return (
                  <th
                    key={column}
                    className={styles.statHead}
                    aria-sort={isActive ? (sortDir === -1 ? "descending" : "ascending") : undefined}
                  >
                    <button onClick={() => onSort(column)} data-active={isActive || undefined}>
                      {column}
                      <span className={styles.sortArrow}>
                        {isActive ? (sortDir === -1 ? "▼" : "▲") : ""}
                      </span>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody key={`${gameId}-${activeTeam}-${animKey}`} className={styles.body}>
            {sortedPlayers.length === 0 && (
              <tr>
                <td className={styles.empty} colSpan={COLS.length + 2}>
                  {emptyMessage ?? "No box score yet."}
                </td>
              </tr>
            )}
            {sortedPlayers.map((player, index) => (
              <tr key={player.name} style={{ "--row-delay": `${index * 18}ms` } as CSSProperties}>
                <td className={styles.playerCell}>
                  <div className={styles.player}>
                    <PlayerAvatar
                      name={player.name}
                      photoUrl={player.photoUrl}
                      size={30}
                      className={styles.avatar}
                    />
                    <span className={styles.playerName}>{player.name}</span>
                  </div>
                </td>
                <td className={styles.posCell}>{player.pos}</td>
                {RATIO_COLUMNS.map(([made, attempted]) => (
                  <td
                    key={`${made}-${attempted}`}
                    className={`${styles.ratioCell} tabular`}
                    data-sorted={sortCol === made || undefined}
                    data-zero={player[attempted] === 0 || undefined}
                  >
                    {player[made]}-{player[attempted]}
                  </td>
                ))}
                {NUMERIC_STAT_COLUMNS.map((key) => {
                  const value = player[key] ?? 0;
                  const isLeader = value > 0 && leaders[key] === value && key !== "to";

                  return (
                    <td
                      key={key}
                      className={`${styles.numCell} tabular`}
                      data-sorted={sortCol === key || undefined}
                      data-leader={isLeader || undefined}
                      data-zero={value === 0 || undefined}
                      data-warn={(key === "to" && value >= 4) || undefined}
                      data-big={(key === "pts" && value >= 20) || undefined}
                    >
                      {value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function getColumnLeaders(players: PlayerStats[]): Record<NumericStatKey, number> {
  const leaders = {} as Record<NumericStatKey, number>;

  NUMERIC_STAT_COLUMNS.forEach((key) => {
    leaders[key] = players.reduce((max, player) => Math.max(max, player[key] ?? 0), 0);
  });

  return leaders;
}
