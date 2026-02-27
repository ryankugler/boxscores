import type { CSSProperties } from "react";

import type { Theme, TopPerformer } from "../types";

interface TopPerformersLeaderboardProps {
  limit: number;
  dateLabel: string;
  performers: TopPerformer[];
  isLoading: boolean;
  error?: string | null;
  theme: Theme;
  transitionStyle: CSSProperties;
}

export function TopPerformersLeaderboard({
  limit,
  dateLabel,
  performers,
  isLoading,
  error,
  theme,
  transitionStyle,
}: TopPerformersLeaderboardProps) {
  return (
    <div
      style={{
        background: theme.cardBg,
        borderBottom: `1px solid ${theme.border}`,
        ...transitionStyle,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "10px",
          padding: "14px 22px",
          borderBottom: `1px solid ${theme.divider}`,
        }}
      >
        <div
          style={{
            fontSize: "16px",
            fontWeight: 800,
            letterSpacing: "1px",
            textTransform: "uppercase",
          }}
        >
          Top {limit} Performers
        </div>
        <div
          style={{
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "1px",
            color: theme.textMuted,
            textTransform: "uppercase",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          {isLoading && (
            <span
              style={{
                fontSize: "11px",
                lineHeight: 1,
              }}
            >
              ⏳
            </span>
          )}
          {dateLabel}
        </div>
      </div>

      {performers.length === 0 ? (
        <div
          style={{
            padding: "16px 22px",
            fontSize: "12px",
            color: theme.textMuted,
            letterSpacing: "0.4px",
            textTransform: "uppercase",
          }}
        >
          {error ?? (isLoading ? "Loading top performers..." : "No box score data available for this day.")}
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: theme.subHeader, borderBottom: `1px solid ${theme.border}` }}>
                <th style={headerCell(theme, "56px")}>Rank</th>
                <th style={headerCell(theme, "220px", "left")}>Player</th>
                <th style={headerCell(theme, "52px")}>Team</th>
                <th style={headerCell(theme, "48px")}>PTS</th>
                <th style={headerCell(theme, "48px")}>REB</th>
                <th style={headerCell(theme, "48px")}>AST</th>
                <th style={headerCell(theme, "48px")}>STL</th>
                <th style={headerCell(theme, "48px")}>BLK</th>
                <th style={headerCell(theme, "72px")}>Total</th>
              </tr>
            </thead>
            <tbody>
              {performers.map((performer, index) => {
                const rowBg = index % 2 === 0 ? theme.cardBg : theme.altRowBg;
                const isLeader = index === 0;

                return (
                  <tr
                    key={`${performer.gameId}-${performer.team}-${performer.name}`}
                    style={{ background: rowBg, borderBottom: `1px solid ${theme.divider}` }}
                  >
                    <td style={rankCell(theme, isLeader)}>
                      {getMedalForRank(index) ?? index + 1}
                    </td>
                    <td
                      style={{
                        padding: "10px 16px",
                        color: theme.textSecond,
                        fontWeight: 600,
                        letterSpacing: "0.2px",
                        textAlign: "left",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <PlayerAvatar
                          name={performer.name}
                          photoUrl={performer.photoUrl}
                          theme={theme}
                        />
                        <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                          <span style={{ fontWeight: isLeader ? 800 : 700, color: theme.textSecond }}>
                            {performer.name}
                          </span>
                          <span
                            style={{
                              fontSize: "10px",
                              textTransform: "uppercase",
                              letterSpacing: "0.8px",
                              color: theme.textMuted,
                              fontWeight: 700,
                            }}
                          >
                            {performer.pos || "N/A"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td style={valueCell(theme, false)}>{performer.team}</td>
                    <td style={valueCell(theme, false)}>{performer.pts}</td>
                    <td style={valueCell(theme, false)}>{performer.reb}</td>
                    <td style={valueCell(theme, false)}>{performer.ast}</td>
                    <td style={valueCell(theme, false)}>{performer.stl}</td>
                    <td style={valueCell(theme, false)}>{performer.blk}</td>
                    <td style={valueCell(theme, true)}>{performer.total}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function headerCell(
  theme: Theme,
  minWidth: string,
  textAlign: "left" | "center" = "center",
): CSSProperties {
  return {
    textAlign,
    padding: "10px 8px",
    fontWeight: 700,
    fontSize: "11px",
    color: theme.textMuted,
    letterSpacing: "1px",
    textTransform: "uppercase",
    minWidth,
  };
}

function rankCell(theme: Theme, isLeader: boolean): CSSProperties {
  return {
    textAlign: "center",
    padding: "10px 8px",
    color: isLeader ? "#e8401a" : theme.textMuted,
    fontWeight: 900,
    fontSize: isLeader ? "16px" : "13px",
  };
}

function valueCell(theme: Theme, isTotal: boolean): CSSProperties {
  return {
    textAlign: "center",
    padding: "10px 8px",
    color: isTotal ? theme.textPrimary : theme.textSecond,
    fontWeight: isTotal ? 800 : 600,
    fontSize: isTotal ? "15px" : "13px",
  };
}

interface PlayerAvatarProps {
  name: string;
  photoUrl?: string;
  theme: Theme;
}

function PlayerAvatar({ name, photoUrl, theme }: PlayerAvatarProps) {
  return (
    <div
      style={{
        width: "34px",
        height: "34px",
        borderRadius: "50%",
        overflow: "hidden",
        position: "relative",
        flexShrink: 0,
        border: `1px solid ${theme.border}`,
        background: theme.subHeader,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span
        style={{
          fontSize: "10px",
          letterSpacing: "0.5px",
          color: theme.textMuted,
          fontWeight: 800,
        }}
      >
        {getInitials(name)}
      </span>
      {photoUrl && (
        <img
          src={photoUrl}
          alt={name}
          loading="lazy"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      )}
    </div>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
  return initials || "NA";
}

function getMedalForRank(index: number): string | null {
  if (index === 0) {
    return "🥇";
  }

  if (index === 1) {
    return "🥈";
  }

  if (index === 2) {
    return "🥉";
  }

  return null;
}
