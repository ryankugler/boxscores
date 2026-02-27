import type { CSSProperties } from "react";

import { getAccent } from "../data/constants";
import type { Game, TeamCode, Theme } from "../types";
import { TeamLogo } from "./TeamLogo";

interface TeamTabsProps {
  game: Game;
  activeTeam: TeamCode;
  dark: boolean;
  theme: Theme;
  transitionStyle: CSSProperties;
  onSwitchTeam: (team: TeamCode) => void;
}

export function TeamTabs({ game, activeTeam, dark, theme, transitionStyle, onSwitchTeam }: TeamTabsProps) {
  const teams: TeamCode[] = [game.away, game.home];

  const getTeamName = (abbr: TeamCode): string => {
    return abbr === game.home ? game.homeTeam : game.awayTeam;
  };

  return (
    <div
      className="team-tabs-row scrollbar-hidden"
      style={{
        display: "flex",
        background: theme.cardBg,
        borderBottom: `1px solid ${theme.border}`,
        overflowX: "auto",
        ...transitionStyle,
      }}
    >
      {teams.map((team) => {
        const isActive = activeTeam === team;
        const accent = getAccent(team, dark, game.teamColors?.[team]);

        return (
          <button
            key={team}
            onClick={() => onSwitchTeam(team)}
            style={{
              background: isActive ? theme.cardBg : theme.subHeader,
              border: "none",
              borderBottom: `3px solid ${isActive ? accent : "transparent"}`,
              padding: "12px clamp(12px, 3.4vw, 22px)",
              cursor: "pointer",
              color: isActive ? theme.textPrimary : theme.textMuted,
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 800,
              fontSize: "14px",
              letterSpacing: "2px",
              textTransform: "uppercase",
              transition: "all 0.15s",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexShrink: 0,
              minWidth: "max-content",
            }}
          >
            <TeamLogo
              abbr={team}
              logoUrl={game.teamLogos?.[team]}
              size={24}
              style={{ opacity: isActive ? 1 : 0.4, transition: "opacity 0.15s" }}
            />
            <span>{getTeamName(team)}</span>
            <span
              style={{
                background: isActive ? accent : theme.badgeOff,
                color: isActive ? theme.badgeTextOn : theme.badgeTextOff,
                fontSize: "13px",
                padding: "1px 8px",
                fontWeight: 900,
                borderRadius: "2px",
              }}
            >
              {game.score[team] ?? 0}
            </span>
          </button>
        );
      })}
    </div>
  );
}
