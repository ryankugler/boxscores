import { Fragment, type CSSProperties } from "react";

import { getTeamPalette } from "../../boxscore/color";
import { TeamLogo } from "../../boxscore/components/TeamLogo";
import { BRACKET_TOTAL_HEIGHT, CARD_HEIGHT, CONNECTOR_WIDTH } from "../layout";
import styles from "../PlayoffBracket.module.css";
import type { BracketTeam, PlayInGame } from "../types";

const LAST_DIRECT_SEED = 6;

function isPlaceholder(team: BracketTeam): boolean {
  return team.teamName === "TBD";
}

export function TeamSlot({ team }: { team: BracketTeam }) {
  if (isPlaceholder(team)) {
    return <TBDSlot label="TBD" seed={team.seed} />;
  }

  const zone = team.seed <= LAST_DIRECT_SEED ? "playoff" : "playin";

  return (
    <div
      className={styles.slot}
      data-zone={zone}
      title={team.teamName}
      style={{ "--team-color": getTeamPalette(team.team).primary } as CSSProperties}
    >
      <span className={styles.seed}>{team.seed}</span>
      <TeamLogo abbr={team.team} logoUrl={team.logo} size={24} />
      <span className={styles.code}>
        {team.team}
        {team.playIn && <span className={styles.piTag}>PI</span>}
      </span>
      <span className={styles.record}>
        {team.wins}-{team.losses}
      </span>
    </div>
  );
}

export function TBDSlot({ label, seed }: { label: string; seed?: number }) {
  return (
    <div className={styles.slot} data-zone="tbd">
      {seed !== undefined && <span className={styles.seed}>{seed}</span>}
      <span className={styles.tbdLabel}>{label}</span>
    </div>
  );
}

export function MatchupCard({
  high,
  low,
  cardWidth,
}: {
  high: BracketTeam;
  low: BracketTeam;
  cardWidth: number;
}) {
  return (
    <div className={styles.card} style={{ width: cardWidth, height: CARD_HEIGHT }}>
      <TeamSlot team={high} />
      <TeamSlot team={low} />
    </div>
  );
}

export function TBDCard({
  cardWidth,
  labels,
}: {
  cardWidth: number;
  labels: [string, string];
}) {
  return (
    <div className={styles.card} data-tbd style={{ width: cardWidth, height: CARD_HEIGHT }}>
      <TBDSlot label={labels[0]} />
      <TBDSlot label={labels[1]} />
    </div>
  );
}

export function Connector({ pairs }: { pairs: Array<{ y1: number; y2: number; midY: number }> }) {
  const branchWidth = CONNECTOR_WIDTH / 2;
  const lineHeight = 1.5;

  return (
    <div className={styles.connector} style={{ width: CONNECTOR_WIDTH, height: BRACKET_TOTAL_HEIGHT }}>
      {pairs.map((pair, index) => {
        const { y1, y2, midY } = pair;

        if (Math.abs(y2 - y1) < 4) {
          return (
            <div
              key={index}
              className={styles.connectorLine}
              style={{ left: 0, top: midY - lineHeight / 2, width: CONNECTOR_WIDTH, height: lineHeight }}
            />
          );
        }

        return (
          <Fragment key={index}>
            <div
              style={{
                left: 0,
                top: y1 - lineHeight / 2,
                width: branchWidth,
                height: y2 - y1 + lineHeight,
                borderStyle: "solid",
                borderWidth: `${lineHeight}px ${lineHeight}px ${lineHeight}px 0`,
                borderRadius: "0 6px 6px 0",
              }}
            />
            <div
              className={styles.connectorLine}
              style={{
                left: branchWidth,
                top: midY - lineHeight / 2,
                width: CONNECTOR_WIDTH - branchWidth,
                height: lineHeight,
              }}
            />
          </Fragment>
        );
      })}
    </div>
  );
}

export function PlayInGameCard({ game }: { game: PlayInGame }) {
  const [teamA, teamB] = game.teams;

  return (
    <div className={styles.playInGame}>
      <div className={styles.playInMeta}>
        <span className={styles.playInLabel}>{game.label}</span>
        <span className={styles.playInNote}>{game.note}</span>
      </div>
      <div className={styles.card} data-tbd={game.isProjected || undefined}>
        <TeamSlot team={teamA} />
        <TeamSlot team={teamB} />
      </div>
    </div>
  );
}
