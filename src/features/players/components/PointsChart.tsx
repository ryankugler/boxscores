import { formatGameDate } from "../api";
import type { GameLogEntry } from "../types";
import styles from "./PointsChart.module.css";

interface PointsChartProps {
  games: GameLogEntry[];
  average?: number;
  onOpenGame: (eventId: string) => void;
}

function niceCeiling(value: number): number {
  if (value <= 10) {
    return 10;
  }

  return Math.ceil(value / 10) * 10;
}

// Opponent labels under each column only fit while the season is short.
const MAX_LABELED_GAMES = 16;

// Points per game as a single-series column chart, oldest game on the left.
// The game log table below doubles as the chart's table view.
export function PointsChart({ games, average, onOpenGame }: PointsChartProps) {
  const chronological = [...games].reverse();
  const maxValue = niceCeiling(Math.max(...chronological.map((game) => game.pts), average ?? 0));
  const ticks = [0, maxValue / 2, maxValue];
  const showLabels = chronological.length <= MAX_LABELED_GAMES;

  return (
    <figure className={styles.chart}>
      <figcaption className={styles.caption}>
        <span>Points by game</span>
        {average !== undefined && <span className={styles.avgKey}>Avg {average.toFixed(1)}</span>}
      </figcaption>

      <div className={styles.plot} data-labeled={showLabels || undefined}>
        <div className={styles.axis} aria-hidden="true">
          {ticks
            .slice()
            .reverse()
            .map((tick) => (
              <span key={tick}>{tick}</span>
            ))}
        </div>

        <div className={styles.area}>
          {ticks.map((tick) => (
            <span
              key={tick}
              className={styles.gridline}
              style={{ bottom: `${(tick / maxValue) * 100}%` }}
              aria-hidden="true"
            />
          ))}

          {average !== undefined && (
            <span
              className={styles.avgLine}
              style={{ bottom: `${(average / maxValue) * 100}%` }}
              aria-hidden="true"
            />
          )}

          <div className={styles.columns}>
            {chronological.map((game) => {
              const label = `${formatGameDate(game.date)} ${game.isHome ? "vs" : "@"} ${game.opponent}: ${game.pts} points${game.result ? `, ${game.result} ${game.score ?? ""}` : ""}`;

              return (
                <button
                  key={game.eventId}
                  className={styles.column}
                  aria-label={label}
                  onClick={() => onOpenGame(game.eventId)}
                >
                  <span
                    className={styles.bar}
                    data-above={average !== undefined && game.pts >= average ? true : undefined}
                    style={{ height: `${(game.pts / maxValue) * 100}%` }}
                  />
                  {showLabels && (
                    <span className={styles.xLabel} aria-hidden="true">
                      {game.opponent}
                    </span>
                  )}
                  <span className={styles.tooltip} role="presentation">
                    <strong className="tabular">{game.pts} PTS</strong>
                    <span>
                      {formatGameDate(game.date)} · {game.isHome ? "vs" : "@"} {game.opponent}
                    </span>
                    {game.result && (
                      <span>
                        {game.result} {game.score}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </figure>
  );
}
