import type { CSSProperties } from "react";

import { getTeamPalette } from "../color";
import type { ConferenceStandingRow } from "../types";
import styles from "./ConferenceStandings.module.css";
import { TeamLogo } from "./TeamLogo";

interface ConferenceStandingsProps {
  eastern: ConferenceStandingRow[];
  western: ConferenceStandingRow[];
  loading: boolean;
  error: string | null;
}

interface TableProps {
  title: string;
  rows: ConferenceStandingRow[];
}

// Seeds 1–6 make the playoffs outright; 7–10 go to the play-in.
const PLAYOFF_CUTOFF = 6;
const PLAY_IN_CUTOFF = 10;

function parseWinPct(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function sortRowsByWinsDesc(rows: ConferenceStandingRow[]): ConferenceStandingRow[] {
  return [...rows].sort((a, b) => {
    if (a.wins !== b.wins) {
      return b.wins - a.wins;
    }

    if (a.losses !== b.losses) {
      return a.losses - b.losses;
    }

    return parseWinPct(b.winPct) - parseWinPct(a.winPct);
  });
}

function ConferenceTable({ title, rows }: TableProps) {
  const sortedRows = sortRowsByWinsDesc(rows);

  return (
    <section className={styles.panel}>
      <h2 className={styles.title}>{title}</h2>
      <div className={`${styles.scroll} scrollbar-hidden`}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.teamHead}>Team</th>
              <th>W</th>
              <th>L</th>
              <th>Pct</th>
              <th>GB</th>
              <th>Strk</th>
              <th>L10</th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((entry, index) => {
              const seed = entry.playoffSeed ?? entry.conferenceRank ?? index + 1;
              const position = index + 1;
              const zone =
                position <= PLAYOFF_CUTOFF
                  ? "playoff"
                  : position <= PLAY_IN_CUTOFF
                    ? "playin"
                    : "out";
              const isWinStreak = /^w/i.test(entry.streak);

              return (
                <tr
                  key={entry.team}
                  data-zone={zone}
                  data-cutoff={
                    position === PLAYOFF_CUTOFF
                      ? "playoff"
                      : position === PLAY_IN_CUTOFF
                        ? "playin"
                        : undefined
                  }
                  style={{ "--team-color": getTeamPalette(entry.team).primary } as CSSProperties}
                >
                  <td className={styles.teamCell}>
                    <div className={styles.teamInner}>
                      <span className={styles.seed}>{seed}</span>
                      <TeamLogo abbr={entry.team} logoUrl={entry.logo} size={26} />
                      <span className={styles.teamName}>{entry.teamName}</span>
                      <span className={styles.teamCode}>{entry.team}</span>
                    </div>
                  </td>
                  <td className={`${styles.strong} tabular`}>{entry.wins}</td>
                  <td className={`${styles.strong} tabular`}>{entry.losses}</td>
                  <td className="tabular">{entry.winPct}</td>
                  <td className="tabular">{entry.gamesBack}</td>
                  <td>
                    <span className={styles.streak} data-win={isWinStreak || undefined}>
                      {entry.streak}
                    </span>
                  </td>
                  <td className="tabular">{entry.lastTen}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function ConferenceStandings({ eastern, western, loading, error }: ConferenceStandingsProps) {
  if (loading) {
    return (
      <div className={styles.grid} aria-hidden="true">
        {[0, 1].map((key) => (
          <span key={key} className="skeleton" style={{ height: 560, borderRadius: 10 }} />
        ))}
      </div>
    );
  }

  if (error) {
    return <div className={styles.message}>{error}</div>;
  }

  return (
    <>
      <div className={styles.grid}>
        <ConferenceTable title="Eastern Conference" rows={eastern} />
        <ConferenceTable title="Western Conference" rows={western} />
      </div>
      <div className={styles.legend}>
        <span data-zone="playoff">Playoffs</span>
        <span data-zone="playin">Play-in</span>
      </div>
    </>
  );
}
