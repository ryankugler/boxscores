import type { CSSProperties } from "react";

import { getTeamPalette } from "../color";
import type { TopPerformer } from "../types";
import { PlayerAvatar } from "./PlayerAvatar";
import { TeamLogo } from "./TeamLogo";
import styles from "./TopPerformersLeaderboard.module.css";

interface TopPerformersLeaderboardProps {
  limit: number;
  dateLabel: string;
  performers: TopPerformer[];
  isLoading: boolean;
  error?: string | null;
}

const FEATURED_COUNT = 3;
const STAT_KEYS = ["pts", "reb", "ast", "stl", "blk"] as const;

export function TopPerformersLeaderboard({
  limit,
  dateLabel,
  performers,
  isLoading,
  error,
}: TopPerformersLeaderboardProps) {
  const featured = performers.slice(0, FEATURED_COUNT);
  const rest = performers.slice(FEATURED_COUNT);

  return (
    <section className={styles.section}>
      <div className={styles.heading}>
        <h2>Top {limit} Performers</h2>
        <span className={styles.date}>{dateLabel}</span>
      </div>
      <p className={styles.caption}>Ranked by PTS + REB + AST + STL + BLK</p>

      {isLoading && performers.length === 0 ? (
        <LeaderboardSkeleton />
      ) : performers.length === 0 ? (
        <div className={styles.empty}>{error ?? "No box score data available for this day."}</div>
      ) : (
        <>
          <div className={styles.cards}>
            {featured.map((performer, index) => (
              <PerformerCard
                key={`${performer.gameId}-${performer.team}-${performer.name}`}
                performer={performer}
                rank={index + 1}
              />
            ))}
          </div>

          {rest.length > 0 && (
            <ol className={styles.list} start={FEATURED_COUNT + 1}>
              {rest.map((performer, index) => {
                const color = getTeamPalette(performer.team).primary;

                return (
                  <li
                    key={`${performer.gameId}-${performer.team}-${performer.name}`}
                    className={styles.row}
                    style={{ "--team-color": color } as CSSProperties}
                  >
                    <span className={styles.rowRank}>{index + FEATURED_COUNT + 1}</span>
                    <PlayerAvatar name={performer.name} photoUrl={performer.photoUrl} size={38} />
                    <div className={styles.rowName}>
                      <span>{performer.name}</span>
                      <span className={styles.rowMeta}>
                        <TeamLogo abbr={performer.team} size={14} />
                        {performer.team} · {performer.pos || "N/A"}
                      </span>
                    </div>
                    <div className={styles.rowStats}>
                      {STAT_KEYS.map((key) => (
                        <span key={key}>
                          <b className="tabular">{performer[key]}</b>
                          {key}
                        </span>
                      ))}
                    </div>
                    <span className={`${styles.rowTotal} tabular`}>{performer.total}</span>
                  </li>
                );
              })}
            </ol>
          )}
        </>
      )}
    </section>
  );
}

function PerformerCard({ performer, rank }: { performer: TopPerformer; rank: number }) {
  const palette = getTeamPalette(performer.team);

  return (
    <article
      className={styles.card}
      data-rank={rank}
      style={{ "--team-color": palette.primary, "--team-alt": palette.alternate } as CSSProperties}
    >
      <div className={styles.cardTop}>
        <span className={styles.cardRank}>#{rank}</span>
        <TeamLogo abbr={performer.team} size={30} className={styles.cardLogo} />
      </div>
      <div className={styles.cardPhoto}>
        <PlayerAvatar name={performer.name} photoUrl={performer.photoUrl} size={112} />
      </div>
      <div className={styles.cardName}>{performer.name}</div>
      <div className={styles.cardMeta}>
        {performer.team} · {performer.pos || "N/A"}
      </div>
      <div className={styles.cardTotal}>
        <span className="tabular">{performer.total}</span>
        <small>Total</small>
      </div>
      <div className={styles.cardStats}>
        {STAT_KEYS.map((key) => (
          <div key={key}>
            <b className="tabular">{performer[key]}</b>
            <span>{key}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

function LeaderboardSkeleton() {
  return (
    <div aria-hidden="true">
      <div className={styles.cards}>
        {Array.from({ length: FEATURED_COUNT }, (_, index) => (
          <span key={index} className="skeleton" style={{ height: 300, borderRadius: 12 }} />
        ))}
      </div>
      <div className={styles.list}>
        {Array.from({ length: 4 }, (_, index) => (
          <span key={index} className="skeleton" style={{ height: 52, marginTop: 8 }} />
        ))}
      </div>
    </div>
  );
}
