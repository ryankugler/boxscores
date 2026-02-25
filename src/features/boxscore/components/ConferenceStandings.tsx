import type { CSSProperties } from "react";

import type { ConferenceStandingRow, Theme } from "../types";
import { TeamLogo } from "./TeamLogo";

interface ConferenceStandingsProps {
  eastern: ConferenceStandingRow[];
  western: ConferenceStandingRow[];
  loading: boolean;
  error: string | null;
  theme: Theme;
  transitionStyle: CSSProperties;
}

interface TableProps {
  title: string;
  rows: ConferenceStandingRow[];
  theme: Theme;
  transitionStyle: CSSProperties;
}

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

function ConferenceTable({ title, rows, theme, transitionStyle }: TableProps) {
  const sortedRows = sortRowsByWinsDesc(rows);

  return (
    <section
      style={{
        background: theme.cardBg,
        border: `1px solid ${theme.border}`,
        ...transitionStyle,
      }}
    >
      <div
        style={{
          padding: "10px 14px",
          borderBottom: `1px solid ${theme.border}`,
          textTransform: "uppercase",
          fontSize: "12px",
          letterSpacing: "1px",
          fontWeight: 800,
        }}
      >
        {title}
      </div>
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: "420px",
          }}
        >
          <thead>
            <tr
              style={{
                background: theme.subHeader,
                color: theme.textMuted,
                fontSize: "11px",
                letterSpacing: "0.8px",
                textTransform: "uppercase",
                textAlign: "left",
              }}
            >
              <th style={{ padding: "8px 12px", fontWeight: 700 }}>Team</th>
              <th style={{ padding: "8px 10px", fontWeight: 700 }}>W</th>
              <th style={{ padding: "8px 10px", fontWeight: 700 }}>L</th>
              <th style={{ padding: "8px 10px", fontWeight: 700 }}>PCT</th>
              <th style={{ padding: "8px 10px", fontWeight: 700 }}>GB</th>
              <th style={{ padding: "8px 10px", fontWeight: 700 }}>Strk</th>
              <th style={{ padding: "8px 10px", fontWeight: 700 }}>L10</th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((entry, index) => {
              const seed = entry.playoffSeed ?? entry.conferenceRank ?? index + 1;
              return (
              <tr
                key={entry.team}
                style={{
                  borderTop: `1px solid ${theme.divider}`,
                  fontSize: "14px",
                }}
              >
                <td style={{ padding: "10px 12px", fontWeight: 700 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <TeamLogo abbr={entry.team} logoUrl={entry.logo} size={20} />
                    <span>{seed}. {entry.team}</span>
                  </div>
                </td>
                <td style={{ padding: "10px 10px" }}>{entry.wins}</td>
                <td style={{ padding: "10px 10px" }}>{entry.losses}</td>
                <td style={{ padding: "10px 10px", color: theme.textSecond }}>{entry.winPct}</td>
                <td style={{ padding: "10px 10px", color: theme.textSecond }}>
                  {entry.gamesBack}
                </td>
                <td style={{ padding: "10px 10px", color: theme.textSecond }}>{entry.streak}</td>
                <td style={{ padding: "10px 10px", color: theme.textSecond }}>{entry.lastTen}</td>
              </tr>
            );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function ConferenceStandings({
  eastern,
  western,
  loading,
  error,
  theme,
  transitionStyle,
}: ConferenceStandingsProps) {
  if (loading) {
    return (
      <div
        style={{
          padding: "14px 0",
          fontSize: "12px",
          letterSpacing: "0.6px",
          color: theme.textMuted,
          textTransform: "uppercase",
          fontWeight: 600,
        }}
      >
        Loading conference standings...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: "14px 0",
          fontSize: "12px",
          letterSpacing: "0.6px",
          color: theme.textMuted,
          textTransform: "uppercase",
          fontWeight: 600,
        }}
      >
        {error}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: "16px",
      }}
    >
      <ConferenceTable
        title="Eastern Conference"
        rows={eastern}
        theme={theme}
        transitionStyle={transitionStyle}
      />
      <ConferenceTable
        title="Western Conference"
        rows={western}
        theme={theme}
        transitionStyle={transitionStyle}
      />
    </div>
  );
}
