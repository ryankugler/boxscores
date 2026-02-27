import type { CSSProperties } from "react";

import { getAccent } from "../data/constants";
import type { Game, Quarter, TeamCode, Theme } from "../types";
import { TeamLogo } from "./TeamLogo";

const QUARTERS: Quarter[] = ["1", "2", "3", "4"];
const QUARTER_LABELS = ["Q1", "Q2", "Q3", "Q4", "FINAL"];

interface QuarterBreakdownProps {
  game: Game;
  winTeam: TeamCode;
  dark: boolean;
  theme: Theme;
  transitionStyle: CSSProperties;
}

export function QuarterBreakdown({ game, winTeam, dark, theme, transitionStyle }: QuarterBreakdownProps) {
  const teams: TeamCode[] = [game.away, game.home];

  return (
    <div
      style={{
        background: theme.cardBg,
        padding: "14px clamp(10px, 3.5vw, 22px)",
        borderBottom: `1px solid ${theme.border}`,
        ...transitionStyle,
      }}
    >
      <div className="scrollbar-hidden" style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          minWidth: "540px",
          borderCollapse: "collapse",
          fontSize: "13px",
        }}
      >
        <thead>
          <tr>
            <th
              style={{
                textAlign: "left",
                color: theme.textMuted,
                fontWeight: 700,
                letterSpacing: "1px",
                padding: "3px 12px 3px 0",
                textTransform: "uppercase",
              }}
            >
              Team
            </th>
            {QUARTER_LABELS.map((quarterLabel) => (
              <th
                key={quarterLabel}
                style={{
                  textAlign: "center",
                  color: theme.textMuted,
                  fontWeight: 700,
                  letterSpacing: "1px",
                  padding: "3px 14px",
                  textTransform: "uppercase",
                }}
              >
                {quarterLabel}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {teams.map((team) => {
            const isWinner = winTeam === team;
            const accent = getAccent(team, dark, game.teamColors?.[team]);

            return (
              <tr key={team}>
                <td style={{ padding: "7px 12px 7px 0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <TeamLogo abbr={team} logoUrl={game.teamLogos?.[team]} size={28} />
                    <span
                      style={{
                        fontWeight: 800,
                        fontSize: "15px",
                        letterSpacing: "1px",
                        color: isWinner ? accent : theme.textMuted,
                      }}
                    >
                      {team}
                    </span>
                  </div>
                </td>
                {QUARTERS.map((quarter) => (
                  <td
                    key={quarter}
                    style={{
                      textAlign: "center",
                      padding: "5px 14px",
                      color: theme.textSecond,
                      fontWeight: 600,
                      fontSize: "15px",
                    }}
                  >
                    {game.periods[quarter]?.[team] ?? 0}
                  </td>
                ))}
                <td
                  style={{
                    textAlign: "center",
                    padding: "5px 14px",
                    fontWeight: 900,
                    fontSize: "20px",
                    color: isWinner ? accent : theme.textMuted,
                  }}
                >
                  {game.score[team] ?? 0}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </div>
  );
}
