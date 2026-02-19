import type { CSSProperties } from "react";

import {
  COL_KEY,
  COLS,
  NUMERIC_STAT_COLUMNS,
  RATIO_COLUMNS,
} from "../stats";
import type {
  NumericStatKey,
  PlayerStats,
  SortDirection,
  SortableStatKey,
  StatColumn,
  TeamCode,
  Theme,
} from "../types";

interface PlayerStatsTableProps {
  gameId: string;
  activeTeam: TeamCode;
  animKey: number;
  sortedPlayers: PlayerStats[];
  sortCol: SortableStatKey;
  sortDir: SortDirection;
  accent: string;
  theme: Theme;
  transitionStyle: CSSProperties;
  onSort: (column: StatColumn) => void;
}

export function PlayerStatsTable({
  gameId,
  activeTeam,
  animKey,
  sortedPlayers,
  sortCol,
  sortDir,
  accent,
  theme,
  transitionStyle,
  onSort,
}: PlayerStatsTableProps) {
  return (
    <div style={{ background: theme.cardBg, overflowX: "auto", ...transitionStyle }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
        <thead>
          <tr style={{ background: theme.subHeader, borderBottom: `2px solid ${theme.border}` }}>
            <th
              style={{
                textAlign: "left",
                padding: "11px 16px",
                fontWeight: 700,
                letterSpacing: "2px",
                fontSize: "11px",
                color: theme.textMuted,
                textTransform: "uppercase",
                minWidth: "165px",
                position: "sticky",
                left: 0,
                background: theme.subHeader,
              }}
            >
              Player
            </th>
            <th
              style={{
                textAlign: "center",
                padding: "11px 8px",
                fontWeight: 700,
                fontSize: "11px",
                color: theme.textMuted,
                textTransform: "uppercase",
                minWidth: "38px",
                letterSpacing: "1px",
              }}
            >
              POS
            </th>
            {COLS.map((column) => {
              const key = COL_KEY[column];
              const isActive = sortCol === key;

              return (
                <th
                  key={column}
                  onClick={() => onSort(column)}
                  style={{
                    textAlign: "center",
                    padding: "11px 10px",
                    fontWeight: 700,
                    letterSpacing: "1px",
                    fontSize: "11px",
                    color: isActive ? accent : theme.textMuted,
                    textTransform: "uppercase",
                    cursor: "pointer",
                    userSelect: "none",
                    minWidth: column.includes("/") ? "68px" : "42px",
                    whiteSpace: "nowrap",
                    borderBottom: isActive ? `2px solid ${accent}` : "2px solid transparent",
                    transition: "color 0.15s, border-color 0.15s",
                  }}
                >
                  {column}
                  {isActive ? (sortDir === -1 ? " ↓" : " ↑") : ""}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody key={`${gameId}-${activeTeam}-${animKey}`}>
          {sortedPlayers.map((player, index) => {
            const rowBg = index % 2 === 0 ? theme.cardBg : theme.altRowBg;
            const isTop = index === 0;

            return (
              <tr
                key={player.name}
                style={{
                  background: rowBg,
                  borderBottom: `1px solid ${theme.divider}`,
                  transition: "background 0.1s",
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.background = theme.hoverBg;
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.background = rowBg;
                }}
              >
                <td
                  style={{
                    padding: "10px 16px",
                    fontWeight: isTop ? 800 : 600,
                    fontSize: isTop ? "15px" : "14px",
                    color: isTop ? theme.textPrimary : theme.textSecond,
                    letterSpacing: "0.5px",
                    position: "sticky",
                    left: 0,
                    background: rowBg,
                    whiteSpace: "nowrap",
                  }}
                >
                  {isTop && (
                    <span
                      style={{
                        display: "inline-block",
                        width: "6px",
                        height: "6px",
                        background: accent,
                        borderRadius: "50%",
                        marginRight: "8px",
                        verticalAlign: "middle",
                      }}
                    />
                  )}
                  {player.name}
                </td>
                <td
                  style={{
                    textAlign: "center",
                    padding: "10px 8px",
                    color: theme.posColor,
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "1px",
                  }}
                >
                  {player.pos}
                </td>
                {RATIO_COLUMNS.map(([made, attempted]) => (
                  <td
                    key={`${made}-${attempted}`}
                    style={{
                      textAlign: "center",
                      padding: "10px 10px",
                      color: theme.textMono,
                      fontFamily: "monospace",
                      fontSize: "13px",
                      fontWeight: 500,
                    }}
                  >
                    {player[made]}/{player[attempted]}
                  </td>
                ))}
                {NUMERIC_STAT_COLUMNS.map((key) => {
                  const value = player[key] ?? 0;
                  const isSort = sortCol === key;
                  const isBig = value >= 20;
                  const isMedium = value >= 10;
                  const isBadTurnovers = key === "to" && value >= 4;
                  const color = getStatColor({
                    key,
                    value,
                    isSort,
                    isBig,
                    isMedium,
                    accent,
                    theme,
                    isBadTurnovers,
                  });

                  return (
                    <td
                      key={key}
                      style={{
                        textAlign: "center",
                        padding: "10px 10px",
                        fontWeight: isBig ? 900 : isMedium ? 700 : 500,
                        fontSize: isBig ? "16px" : "14px",
                        color,
                        letterSpacing: "0.5px",
                        transition: "color 0.15s",
                      }}
                    >
                      {value}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

interface GetStatColorArgs {
  key: NumericStatKey;
  value: number;
  isSort: boolean;
  isBig: boolean;
  isMedium: boolean;
  accent: string;
  theme: Theme;
  isBadTurnovers: boolean;
}

function getStatColor({
  value,
  isSort,
  isBig,
  isMedium,
  accent,
  theme,
  isBadTurnovers,
}: GetStatColorArgs): string {
  if (isBadTurnovers) {
    return theme.toWarn;
  }

  if (isSort && value > 0) {
    return accent;
  }

  if (isBig) {
    return theme.textPrimary;
  }

  if (isMedium) {
    return theme.textSecond;
  }

  return theme.textDim;
}
