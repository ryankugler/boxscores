import { Fragment } from "react";

import { TeamLogo } from "../../boxscore/components/TeamLogo";
import { BRACKET_TOTAL_HEIGHT, CARD_HEIGHT, CONNECTOR_WIDTH } from "../layout";
import type { BracketTheme, BracketTeam, PlayInGame } from "../types";

function formatRecord(team: BracketTeam): string {
  if (team.teamName === "TBD") {
    return "--";
  }

  return `${team.wins}-${team.losses}`;
}

export function TeamSlot({
  team,
  isTop,
  theme,
}: {
  team: BracketTeam;
  isTop: boolean;
  theme: BracketTheme;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "0 11px",
        height: CARD_HEIGHT / 2,
        borderBottom: isTop ? `1px solid ${theme.divider}` : "none",
      }}
    >
      <span
        style={{
          color: theme.seedColor,
          fontSize: 10,
          fontWeight: 800,
          width: 14,
          textAlign: "right",
          fontFamily: "monospace",
          flexShrink: 0,
        }}
      >
        {team.seed}
      </span>
      <TeamLogo abbr={team.team} logoUrl={team.logo} size={20} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <span
          title={team.teamName}
          style={{
            color: theme.teamName,
            fontSize: 12,
            fontWeight: 700,
            fontFamily: "'Barlow Condensed', sans-serif",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          {team.teamName === "TBD" ? "TBD" : team.team}
        </span>
        {team.playIn && team.teamName !== "TBD" && (
          <span
            style={{
              marginLeft: 5,
              fontSize: 9,
              color: theme.piColor,
              fontFamily: "monospace",
              fontWeight: 700,
            }}
          >
            PI
          </span>
        )}
      </div>
      <span
        style={{
          color: theme.record,
          fontSize: 9.5,
          fontFamily: "monospace",
          whiteSpace: "nowrap",
        }}
      >
        {formatRecord(team)}
      </span>
    </div>
  );
}

export function MatchupCard({
  high,
  low,
  cardWidth,
  theme,
}: {
  high: BracketTeam;
  low: BracketTeam;
  cardWidth: number;
  theme: BracketTheme;
}) {
  return (
    <div
      style={{
        width: cardWidth,
        height: CARD_HEIGHT,
        background: theme.cardBg,
        border: `1px solid ${theme.cardBorder}`,
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      <TeamSlot team={high} isTop theme={theme} />
      <TeamSlot team={low} isTop={false} theme={theme} />
    </div>
  );
}

export function TBDCard({
  cardWidth,
  theme,
  label = "TBD",
}: {
  cardWidth: number;
  theme: BracketTheme;
  label?: string;
}) {
  return (
    <div
      style={{
        width: cardWidth,
        height: CARD_HEIGHT,
        background: theme.tbd,
        border: `1px dashed ${theme.tbdBorder}`,
        borderRadius: 8,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
      }}
    >
      <span style={{ color: theme.tbdText, fontSize: 15 }}>?</span>
      <span style={{ color: theme.tbdText, fontSize: 9, fontFamily: "monospace" }}>
        {label}
      </span>
    </div>
  );
}

export function Connector({
  pairs,
  theme,
}: {
  pairs: Array<{ y1: number; y2: number; midY: number }>;
  theme: BracketTheme;
}) {
  const branchWidth = 13;
  const lineHeight = 1.5;

  return (
    <div
      style={{
        position: "relative",
        width: CONNECTOR_WIDTH,
        height: BRACKET_TOTAL_HEIGHT,
        flexShrink: 0,
      }}
    >
      {pairs.map((pair, index) => {
        const { y1, y2, midY } = pair;

        if (Math.abs(y2 - y1) < 4) {
          return (
            <div
              key={index}
              style={{
                position: "absolute",
                left: 0,
                top: midY - lineHeight / 2,
                width: CONNECTOR_WIDTH,
                height: lineHeight,
                background: theme.line,
              }}
            />
          );
        }

        const border = `${lineHeight}px solid ${theme.line}`;

        return (
          <Fragment key={index}>
            <div
              style={{
                position: "absolute",
                left: 0,
                top: y1,
                width: branchWidth,
                height: y2 - y1,
                borderTop: border,
                borderRight: border,
                borderBottom: border,
                boxSizing: "border-box",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: branchWidth,
                top: midY - lineHeight / 2,
                width: CONNECTOR_WIDTH - branchWidth,
                height: lineHeight,
                background: theme.line,
              }}
            />
          </Fragment>
        );
      })}
    </div>
  );
}

export function PlayInGameCard({ game, theme }: { game: PlayInGame; theme: BracketTheme }) {
  const [teamA, teamB] = game.teams;

  return (
    <div
      style={{
        background: theme.playInBg,
        border: game.isProjected
          ? `1px dashed ${theme.projBorder}`
          : `1px solid ${theme.playInBorder}`,
        borderRadius: 9,
        padding: "10px 14px",
        minWidth: 190,
        flex: 1,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <span
          style={{
            color: theme.colLabel,
            fontSize: 10,
            fontFamily: "monospace",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          {game.label}
        </span>
        {game.isProjected && (
          <span
            style={{
              fontSize: 9,
              color: theme.piColor,
              background: `${theme.piColor}1a`,
              padding: "2px 6px",
              borderRadius: 4,
              fontFamily: "monospace",
            }}
          >
            PROJ
          </span>
        )}
      </div>
      {[teamA, teamB].map((team, index) => (
        <div
          key={`${team.team}-${index}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "5px 0",
            borderBottom: index === 0 ? `1px solid ${theme.divider}` : "none",
          }}
        >
          <span
            style={{
              color: theme.seedColor,
              fontSize: 10,
              width: 14,
              textAlign: "right",
              fontFamily: "monospace",
            }}
          >
            {team.seed}
          </span>
          <TeamLogo abbr={team.team} logoUrl={team.logo} size={18} />
          <span
            style={{
              color: theme.teamName,
              fontSize: 11,
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              flex: 1,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {team.teamName === "TBD" ? "TBD" : team.team}
          </span>
          <span style={{ color: theme.record, fontSize: 9, fontFamily: "monospace" }}>
            {formatRecord(team)}
          </span>
        </div>
      ))}
      <div style={{ marginTop: 7, color: theme.colLabel, fontSize: 9.5, fontFamily: "monospace" }}>
        {game.note}
      </div>
    </div>
  );
}
