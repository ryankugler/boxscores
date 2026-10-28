import { Fragment } from "react";

import { TeamLogo } from "../../boxscore/components/TeamLogo";
import { formatGameDate } from "../api";
import type { GameLogEntry, GameLogSeasonType } from "../types";
import styles from "./GameLogTable.module.css";

interface Column {
  label: string;
  value: (game: GameLogEntry) => string | number;
  emphasis?: boolean;
}

// Labels match ESPN's game log labels so summary rows can be looked up by name.
const COLUMNS: Column[] = [
  { label: "MIN", value: (game) => game.minutes },
  { label: "PTS", value: (game) => game.pts, emphasis: true },
  { label: "REB", value: (game) => game.reb },
  { label: "AST", value: (game) => game.ast },
  { label: "FG", value: (game) => `${game.fgm}-${game.fga}` },
  { label: "FG%", value: (game) => game.fgPct },
  { label: "3PT", value: (game) => `${game.p3m}-${game.p3a}` },
  { label: "3P%", value: (game) => game.p3Pct },
  { label: "FT", value: (game) => `${game.ftm}-${game.fta}` },
  { label: "FT%", value: (game) => game.ftPct },
  { label: "STL", value: (game) => game.stl },
  { label: "BLK", value: (game) => game.blk },
  { label: "TO", value: (game) => game.to },
  { label: "PF", value: (game) => game.pf },
];

interface GameLogTableProps {
  seasonType: GameLogSeasonType;
  labels: string[];
  onOpenGame: (eventId: string) => void;
}

function getMilestone(game: GameLogEntry): "TD" | "DD" | null {
  const doubleDigits = [game.pts, game.reb, game.ast, game.stl, game.blk].filter(
    (value) => value >= 10,
  ).length;

  return doubleDigits >= 3 ? "TD" : doubleDigits === 2 ? "DD" : null;
}

export function GameLogTable({ seasonType, labels, onOpenGame }: GameLogTableProps) {
  const summaryValue = (values: string[] | undefined, label: string) => {
    const index = labels.indexOf(label);
    return index >= 0 ? (values?.[index] ?? "") : "";
  };

  return (
    <div className={styles.panel}>
      <div className={`${styles.scroll} scrollbar-hidden`}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.gameHead}>Game</th>
              <th className={styles.resultHead}>Result</th>
              {COLUMNS.map((column) => (
                <th key={column.label}>{column.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {seasonType.games.map((game, index) => {
              const showMonth = index === 0 || seasonType.games[index - 1].month !== game.month;
              const milestone = getMilestone(game);

              return (
                <Fragment key={game.eventId}>
                  {showMonth && (
                    <tr className={styles.monthRow}>
                      <td colSpan={COLUMNS.length + 2}>{game.month}</td>
                    </tr>
                  )}
                  <tr
                    className={styles.gameRow}
                    tabIndex={0}
                    onClick={() => onOpenGame(game.eventId)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        onOpenGame(game.eventId);
                      }
                    }}
                    aria-label={`Open box score: ${formatGameDate(game.date)} ${game.isHome ? "vs" : "at"} ${game.opponentName ?? game.opponent}`}
                  >
                    <td className={styles.gameCell}>
                      <div className={styles.game}>
                        <span className={styles.date}>{formatGameDate(game.date)}</span>
                        <span className={styles.atVs}>{game.isHome ? "vs" : "@"}</span>
                        <TeamLogo abbr={game.opponent} logoUrl={game.opponentLogo} size={20} />
                        <span className={styles.opponent}>{game.opponent}</span>
                      </div>
                    </td>
                    <td className={styles.resultCell}>
                      {game.result && (
                        <span className={styles.result} data-result={game.result}>
                          {game.result}
                        </span>
                      )}
                      <span className="tabular">{game.score}</span>
                      {milestone && <span className={styles.milestone}>{milestone}</span>}
                    </td>
                    {COLUMNS.map((column) => {
                      const value = column.value(game);

                      return (
                        <td
                          key={column.label}
                          className={`${styles.statCell} tabular`}
                          data-emphasis={column.emphasis || undefined}
                          data-big={(column.emphasis && game.pts >= 30) || undefined}
                        >
                          {value}
                        </td>
                      );
                    })}
                  </tr>
                </Fragment>
              );
            })}
          </tbody>
          {(seasonType.averages || seasonType.totals) && (
            <tfoot>
              {[seasonType.averages, seasonType.totals].map(
                (row) =>
                  row && (
                    <tr key={row.label}>
                      <th className={styles.gameCell} scope="row" colSpan={2}>
                        {row.label}
                      </th>
                      {COLUMNS.map((column) => (
                        <td
                          key={column.label}
                          className={`${styles.statCell} tabular`}
                          data-emphasis={column.emphasis || undefined}
                        >
                          {summaryValue(row.values, column.label)}
                        </td>
                      ))}
                    </tr>
                  ),
              )}
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
