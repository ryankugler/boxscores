import type { CSSProperties } from "react";

import { getAccent } from "../data/constants";
import type { Game, Theme } from "../types";
import { TeamLogo } from "./TeamLogo";

interface GameSelectorProps {
  games: Game[];
  selectedGameId: string;
  dark: boolean;
  theme: Theme;
  transitionStyle: CSSProperties;
  onSelectGame: (game: Game) => void;
}

export function GameSelector({
  games,
  selectedGameId,
  dark,
  theme,
  transitionStyle,
  onSelectGame,
}: GameSelectorProps) {
  return (
    <div
      style={{
        display: "flex",
        overflowX: "auto",
        overflowY: "hidden",
        whiteSpace: "nowrap",
        borderBottom: `1px solid ${theme.border}`,
        background: theme.pageBg,
        ...transitionStyle,
      }}
    >
      {games.map((game) => {
        const isSelected = game.id === selectedGameId;
        const homeScore = game.score[game.home] ?? 0;
        const awayScore = game.score[game.away] ?? 0;
        const winner = homeScore > awayScore ? game.home : game.away;
        const homeAccent = getAccent(game.home, dark, game.teamColors?.[game.home]);
        const awayAccent = getAccent(game.away, dark, game.teamColors?.[game.away]);

        return (
          <button
            key={game.id}
            onClick={() => onSelectGame(game)}
            style={{
              background: isSelected ? theme.cardBg : "transparent",
              border: "none",
              borderTop: `3px solid ${isSelected ? "#e8401a" : "transparent"}`,
              padding: "12px 20px 16px",
              cursor: "pointer",
              minWidth: "200px",
              flex: "0 0 auto",
              transition: "background 0.15s",
            }}
          >
            <div
              style={{
                fontSize: "10px",
                color: theme.textMuted,
                letterSpacing: "2px",
                textTransform: "uppercase",
                marginBottom: "10px",
                fontWeight: 600,
              }}
            >
              {game.date}
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "5px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                  <TeamLogo abbr={game.away} logoUrl={game.teamLogos?.[game.away]} size={22} />
                  <span
                    style={{
                      fontSize: "16px",
                      fontWeight: 900,
                      letterSpacing: "1px",
                      color: winner === game.away ? theme.textPrimary : theme.scoreDim,
                    }}
                  >
                    {game.away}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: "22px",
                    fontWeight: 900,
                    lineHeight: 1,
                    paddingLeft: "29px",
                    color:
                      winner === game.away
                        ? isSelected
                          ? awayAccent
                          : theme.textPrimary
                        : theme.scoreDim,
                  }}
                >
                  {awayScore}
                </span>
              </div>
              <div style={{ fontSize: "10px", color: theme.textMuted, fontWeight: 700 }}>@</div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "5px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                  <span
                    style={{
                      fontSize: "16px",
                      fontWeight: 900,
                      letterSpacing: "1px",
                      color: winner === game.home ? theme.textPrimary : theme.scoreDim,
                    }}
                  >
                    {game.home}
                  </span>
                  <TeamLogo abbr={game.home} logoUrl={game.teamLogos?.[game.home]} size={22} />
                </div>
                <span
                  style={{
                    fontSize: "22px",
                    fontWeight: 900,
                    lineHeight: 1,
                    paddingRight: "29px",
                    color:
                      winner === game.home
                        ? isSelected
                          ? homeAccent
                          : theme.textPrimary
                        : theme.scoreDim,
                  }}
                >
                  {homeScore}
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
