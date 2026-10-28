import type { CSSProperties } from "react";

import { getMatchupColors, getTeamPalette } from "../color";
import type { Game, Quarter, TeamCode } from "../types";
import { AnimatedScore } from "./AnimatedScore";
import styles from "./Scorebug.module.css";
import { TeamLogo } from "./TeamLogo";

const QUARTERS: Quarter[] = ["1", "2", "3", "4"];

interface ScorebugProps {
  game: Game;
}

export function Scorebug({ game }: ScorebugProps) {
  const isLive = game.statusState === "in";
  const isPregame = game.statusState === "pre";
  const isFinal = !isLive && !isPregame;
  const homeScore = game.score[game.home] ?? 0;
  const awayScore = game.score[game.away] ?? 0;
  const leader = homeScore === awayScore ? null : homeScore > awayScore ? game.home : game.away;
  const colors = getMatchupColors(
    getTeamPalette(game.away, game.teamColors?.[game.away]),
    getTeamPalette(game.home, game.teamColors?.[game.home]),
  );

  const statusLabel = isPregame
    ? game.statusText ?? "Scheduled"
    : isLive
      ? game.statusText ?? "Live"
      : game.statusText ?? "Final";

  const overtimes = game.overtimes ?? [];

  const sides: Array<{ team: TeamCode; name: string; score: number; side: "away" | "home" }> = [
    { team: game.away, name: game.awayTeam, score: awayScore, side: "away" },
    { team: game.home, name: game.homeTeam, score: homeScore, side: "home" },
  ];

  return (
    <section
      className={styles.bug}
      style={{ "--away-color": colors.away, "--home-color": colors.home } as CSSProperties}
      aria-label={`${game.awayTeam} at ${game.homeTeam}`}
    >
      <div className={styles.matchup}>
        {sides.map(({ team, name, score, side }) => {
          const dimmed = isFinal && leader !== null && leader !== team;

          return (
            <div
              key={team}
              className={`${styles.team} ${side === "home" ? styles.teamHome : ""}`}
              data-dimmed={dimmed || undefined}
            >
              <div className={styles.logoPlate}>
                <TeamLogo abbr={team} logoUrl={game.teamLogos?.[team]} size={64} />
              </div>
              <div className={styles.teamText}>
                <span className={styles.teamCity}>{name}</span>
                <span className={styles.teamMeta}>
                  {side === "away" ? "Away" : "Home"}
                  {game.records?.[team] ? ` · ${game.records[team]}` : ""}
                </span>
              </div>
              {!isPregame && (
                <div className={styles.score}>
                  <AnimatedScore value={score} />
                </div>
              )}
            </div>
          );
        })}

        <div className={styles.status} data-live={isLive || undefined}>
          {isLive && <span className="game-live-dot" />}
          <span>{isLive ? "Live" : isFinal ? "Final" : "Tip-off"}</span>
          {!isFinal && <span className={styles.statusDetail}>{statusLabel}</span>}
          {isFinal && statusLabel !== "Final" && (
            <span className={styles.statusDetail}>{statusLabel.replace(/^Final\/?/i, "")}</span>
          )}
        </div>
      </div>

      {!isPregame && (
        <div className={`${styles.linescoreWrap} scrollbar-hidden`}>
          <table className={styles.linescore}>
            <thead>
              <tr>
                <th />
                {QUARTERS.map((quarter) => (
                  <th key={quarter}>Q{quarter}</th>
                ))}
                {overtimes.map((_, index) => (
                  <th key={`ot-${index}`}>{index === 0 ? "OT" : `${index + 1}OT`}</th>
                ))}
                <th>T</th>
              </tr>
            </thead>
            <tbody>
              {sides.map(({ team, score, side }) => (
                <tr key={team} data-leader={leader === team || undefined}>
                  <td className={styles.linescoreTeam}>
                    <span className={styles.linescoreSwatch} style={{ background: colors[side] }} />
                    {team}
                  </td>
                  {[...QUARTERS.map((quarter) => game.periods[quarter]), ...overtimes].map(
                    (period, index) => {
                      const value = period?.[team];
                      const opponent = side === "away" ? game.home : game.away;
                      const won = (value ?? 0) > (period?.[opponent] ?? 0);

                      return (
                        <td key={index} data-won={won || undefined} className="tabular">
                          {value ?? "–"}
                        </td>
                      );
                    },
                  )}
                  <td className={`${styles.linescoreTotal} tabular`}>{score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
