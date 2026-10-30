import { useState, type CSSProperties } from "react";

import {
  colorDistance,
  getMatchupColors,
  getTeamPalette,
  readableTextOn,
  relativeLuminance,
  type TeamPalette,
} from "../../boxscore/color";
import { PlayerAvatar } from "../../boxscore/components/PlayerAvatar";
import { TeamLogo } from "../../boxscore/components/TeamLogo";
import { formatGameDate } from "../api";
import type { GameLogEntry, GameLogStats, PlayerGameLog, PlayerProfile } from "../types";
import styles from "./PlayerComparison.module.css";

export interface ComparedPlayer {
  profile: PlayerProfile;
  gameLog: PlayerGameLog | null;
}

interface PlayerComparisonProps {
  left: ComparedPlayer;
  right: ComparedPlayer;
  dark: boolean;
  onOpenPlayer: (playerId: string) => void;
}

type Side = "left" | "right";

interface StatDef {
  label: string;
  compute: (games: GameLogEntry[]) => number | null;
  digits: number;
  lowerIsBetter?: boolean;
  // Shown for context but not scored as an edge (more minutes isn't "better").
  unscored?: boolean;
}

const TREND_GAMES = 10;
const MIN_COLOR_DISTANCE = 90;
const NEUTRAL_COLORS = ["#8a8e9e", "#e8401a"];

function average(key: keyof GameLogStats) {
  return (games: GameLogEntry[]) =>
    games.length === 0 ? null : games.reduce((sum, game) => sum + Number(game[key]), 0) / games.length;
}

function percentage(made: keyof GameLogStats, attempted: keyof GameLogStats) {
  return (games: GameLogEntry[]) => {
    const attempts = games.reduce((sum, game) => sum + Number(game[attempted]), 0);
    if (attempts === 0) {
      return null;
    }

    return (games.reduce((sum, game) => sum + Number(game[made]), 0) / attempts) * 100;
  };
}

const STATS: StatDef[] = [
  { label: "PTS", compute: average("pts"), digits: 1 },
  { label: "REB", compute: average("reb"), digits: 1 },
  { label: "AST", compute: average("ast"), digits: 1 },
  { label: "STL", compute: average("stl"), digits: 1 },
  { label: "BLK", compute: average("blk"), digits: 1 },
  { label: "FG%", compute: percentage("fgm", "fga"), digits: 1 },
  { label: "3P%", compute: percentage("p3m", "p3a"), digits: 1 },
  { label: "FT%", compute: percentage("ftm", "fta"), digits: 1 },
  { label: "3PM", compute: average("p3m"), digits: 1 },
  { label: "MIN", compute: average("minutes"), digits: 1, unscored: true },
  { label: "TO", compute: average("to"), digits: 1, lowerIsBetter: true },
];

function leaderOf(stat: StatDef, left: number | null, right: number | null): Side | null {
  if (stat.unscored) {
    return null;
  }

  if (left === null || right === null) {
    return left === null ? (right === null ? null : "right") : "left";
  }

  const a = Number(left.toFixed(stat.digits));
  const b = Number(right.toFixed(stat.digits));
  if (a === b) {
    return null;
  }

  return a > b !== Boolean(stat.lowerIsBetter) ? "left" : "right";
}

function isVisibleOnSurface(color: string, dark: boolean): boolean {
  const luminance = relativeLuminance(color);
  return dark ? luminance >= 0.06 : luminance <= 0.45;
}

// Line and bar colors for each side: team colors that show up on the card
// surface, picking the most distinct pair (primaries preferred). When the two
// teams can't be told apart, the right side falls back to a neutral.
function pickSideColors(left: TeamPalette, right: TeamPalette, dark: boolean) {
  const candidates = (palette: TeamPalette) =>
    [
      { color: palette.primary, penalty: 0 },
      { color: palette.alternate, penalty: 30 },
    ].filter((candidate) => isVisibleOnSurface(candidate.color, dark));
  const fallback = { color: dark ? "#e8eaf0" : "#0b0c10", penalty: 0 };
  const leftOptions = candidates(left);
  const rightOptions = candidates(right);

  let best = { left: (leftOptions[0] ?? fallback).color, right: (rightOptions[0] ?? fallback).color };
  let bestScore = Number.NEGATIVE_INFINITY;
  for (const leftOption of leftOptions.length > 0 ? leftOptions : [fallback]) {
    for (const rightOption of rightOptions.length > 0 ? rightOptions : [fallback]) {
      const score =
        colorDistance(leftOption.color, rightOption.color) - leftOption.penalty - rightOption.penalty;
      if (score > bestScore) {
        bestScore = score;
        best = { left: leftOption.color, right: rightOption.color };
      }
    }
  }

  if (colorDistance(best.left, best.right) < MIN_COLOR_DISTANCE) {
    best.right =
      NEUTRAL_COLORS.find((color) => colorDistance(best.left, color) >= MIN_COLOR_DISTANCE) ??
      NEUTRAL_COLORS[0];
  }

  return best;
}

function lastName(profile: PlayerProfile): string {
  return profile.lastName ?? profile.name.split(" ").slice(-1)[0];
}

export function PlayerComparison({ left, right, dark, onOpenPlayer }: PlayerComparisonProps) {
  const leftPalette = getTeamPalette(left.profile.team ?? "", left.profile.teamColors);
  const rightPalette = getTeamPalette(right.profile.team ?? "", right.profile.teamColors);
  const heroColors = getMatchupColors(leftPalette, rightPalette);
  const sideColors = pickSideColors(leftPalette, rightPalette, dark);

  // Only season types both players have can be compared.
  const rightKeys = new Set(right.gameLog?.seasonTypes.map((seasonType) => seasonType.key));
  const sharedTypes = (left.gameLog?.seasonTypes ?? []).filter((seasonType) =>
    rightKeys.has(seasonType.key),
  );
  const [seasonTypeKey, setSeasonTypeKey] = useState<string | null>(null);
  const activeType = sharedTypes.find((seasonType) => seasonType.key === seasonTypeKey) ?? sharedTypes[0];
  const leftGames = left.gameLog?.seasonTypes.find((type) => type.key === activeType?.key)?.games ?? [];
  const rightGames = right.gameLog?.seasonTypes.find((type) => type.key === activeType?.key)?.games ?? [];

  const rows = STATS.map((stat) => {
    const leftValue = stat.compute(leftGames);
    const rightValue = stat.compute(rightGames);
    return { stat, leftValue, rightValue, leader: leaderOf(stat, leftValue, rightValue) };
  });
  const edges = {
    left: rows.filter((row) => row.leader === "left").length,
    right: rows.filter((row) => row.leader === "right").length,
  };
  const leftName = lastName(left.profile);
  const rightName = lastName(right.profile);
  const edgeSummary =
    edges.left === edges.right
      ? `Dead even, ${edges.left}–${edges.right}`
      : `${edges.left > edges.right ? leftName : rightName} leads ${Math.max(edges.left, edges.right)}–${Math.min(edges.left, edges.right)}`;

  return (
    <div
      className={styles.comparison}
      style={{ "--left-color": sideColors.left, "--right-color": sideColors.right } as CSSProperties}
    >
      <section className={styles.tape}>
        <TapeSide
          side="left"
          profile={left.profile}
          color={heroColors.away}
          alternate={leftPalette.alternate}
          onOpenPlayer={onOpenPlayer}
        />
        <div className={styles.versus} aria-hidden="true">
          VS
        </div>
        <TapeSide
          side="right"
          profile={right.profile}
          color={heroColors.home}
          alternate={rightPalette.alternate}
          onOpenPlayer={onOpenPlayer}
        />
      </section>

      <div className={styles.sectionHead}>
        <h2>
          Head to Head <span>{left.gameLog?.seasonLabel}</span>
        </h2>
        {sharedTypes.length > 1 && (
          <div className={styles.seasonTabs} role="tablist" aria-label="Season type">
            {sharedTypes.map((seasonType) => (
              <button
                key={seasonType.key}
                role="tab"
                aria-selected={seasonType.key === activeType?.key}
                onClick={() => setSeasonTypeKey(seasonType.key)}
              >
                {seasonType.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {!activeType ? (
        <div className={styles.message}>
          These players don't have games in the same season yet.
        </div>
      ) : (
        <>
          <section className={styles.panel} aria-label="Per-game averages">
            <div className={styles.panelHead}>
              <span className={styles.gp}>
                <strong className="tabular">{leftGames.length}</strong> GP
              </span>
              <span className={styles.edge}>{edgeSummary}</span>
              <span className={styles.gp}>
                <strong className="tabular">{rightGames.length}</strong> GP
              </span>
            </div>
            {rows.map(({ stat, leftValue, rightValue, leader }) => {
              const max = Math.max(leftValue ?? 0, rightValue ?? 0) || 1;
              return (
                <div key={stat.label} className={styles.statRow}>
                  <span className={styles.value} data-leader={leader === "left" || undefined}>
                    {leftValue === null ? "–" : leftValue.toFixed(stat.digits)}
                  </span>
                  <span className={styles.track} data-side="left">
                    <span
                      className={styles.bar}
                      data-leader={leader === "left" || undefined}
                      style={{ width: `${((leftValue ?? 0) / max) * 100}%` }}
                    />
                  </span>
                  <span className={styles.statLabel}>
                    {stat.label}
                    {stat.lowerIsBetter && <small>Lower wins</small>}
                  </span>
                  <span className={styles.track} data-side="right">
                    <span
                      className={styles.bar}
                      data-leader={leader === "right" || undefined}
                      style={{ width: `${((rightValue ?? 0) / max) * 100}%` }}
                    />
                  </span>
                  <span className={styles.value} data-leader={leader === "right" || undefined}>
                    {rightValue === null ? "–" : rightValue.toFixed(stat.digits)}
                  </span>
                </div>
              );
            })}
          </section>

          <TrendChart
            leftName={leftName}
            rightName={rightName}
            leftGames={leftGames}
            rightGames={rightGames}
          />
        </>
      )}
    </div>
  );
}

interface TapeSideProps {
  side: Side;
  profile: PlayerProfile;
  color: string;
  alternate: string;
  onOpenPlayer: (playerId: string) => void;
}

function TapeSide({ side, profile, color, alternate, onOpenPlayer }: TapeSideProps) {
  const facts = [
    profile.position,
    [profile.height, profile.weight].filter(Boolean).join(", "),
    profile.age ? `Age ${profile.age}` : "",
  ].filter(Boolean);

  return (
    <div
      className={styles.tapeSide}
      data-side={side}
      style={
        { "--team-color": color, "--team-alt": alternate, "--team-ink": readableTextOn(color) } as CSSProperties
      }
    >
      <PlayerAvatar name={profile.name} photoUrl={profile.headshot} size={96} />
      <div className={styles.tapeText}>
        <div className={styles.teamLine}>
          {profile.team && <TeamLogo abbr={profile.team} logoUrl={profile.teamLogo} size={18} />}
          <span>{profile.team ?? "FA"}</span>
          {profile.jersey && <span>#{profile.jersey}</span>}
        </div>
        <button className={styles.name} onClick={() => onOpenPlayer(profile.id)}>
          {profile.firstName && profile.lastName ? (
            <>
              <span className={styles.firstName}>{profile.firstName}</span>
              <span>{profile.lastName}</span>
            </>
          ) : (
            profile.name
          )}
        </button>
        {facts.length > 0 && <div className={styles.facts}>{facts.join(" · ")}</div>}
      </div>
    </div>
  );
}

interface TrendChartProps {
  leftName: string;
  rightName: string;
  leftGames: GameLogEntry[];
  rightGames: GameLogEntry[];
}

function niceCeiling(value: number): number {
  return value <= 10 ? 10 : Math.ceil(value / 10) * 10;
}

// Points over each player's last games, aligned so the most recent game sits
// on the right. The games don't share dates, so the x-axis is "games ago".
function TrendChart({ leftName, rightName, leftGames, rightGames }: TrendChartProps) {
  const slots = Math.min(TREND_GAMES, Math.max(leftGames.length, rightGames.length));
  if (slots < 2) {
    return null;
  }

  const align = (games: GameLogEntry[]): Array<GameLogEntry | undefined> => {
    const recent = games.slice(0, slots).reverse();
    return [...Array<undefined>(slots - recent.length).fill(undefined), ...recent];
  };
  const series = [
    { side: "left" as const, name: leftName, games: align(leftGames) },
    { side: "right" as const, name: rightName, games: align(rightGames) },
  ];
  const maxValue = niceCeiling(
    Math.max(...series.flatMap((line) => line.games.map((game) => game?.pts ?? 0))),
  );
  const ticks = [maxValue, maxValue / 2, 0];
  const x = (index: number) => ((index + 0.5) / slots) * 100;
  const y = (points: number) => 100 - (points / maxValue) * 100;

  return (
    <figure className={styles.chart}>
      <figcaption className={styles.caption}>
        <span>Points · last {slots} games</span>
        <span className={styles.legend}>
          {series.map((line) => (
            <span key={line.side} className={styles.legendItem} data-side={line.side}>
              {line.name}
            </span>
          ))}
        </span>
      </figcaption>

      <div className={styles.plot}>
        <div className={styles.axis} aria-hidden="true">
          {ticks.map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </div>

        <div className={styles.area}>
          {ticks.map((tick) => (
            <span key={tick} className={styles.gridline} style={{ top: `${y(tick)}%` }} aria-hidden="true" />
          ))}

          <svg className={styles.lines} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {series.map((line) => {
              const points = line.games
                .map((game, index) => (game ? `${x(index)},${y(game.pts)}` : null))
                .filter(Boolean)
                .join(" ");
              return <polyline key={line.side} data-side={line.side} points={points} />;
            })}
          </svg>

          {series.map((line) =>
            line.games.map((game, index) =>
              game ? (
                <span
                  key={`${line.side}-${game.eventId}`}
                  className={styles.dot}
                  data-side={line.side}
                  style={{ left: `${x(index)}%`, top: `${y(game.pts)}%` }}
                  aria-hidden="true"
                />
              ) : null,
            ),
          )}

          <div className={styles.columns}>
            {Array.from({ length: slots }, (_, index) => {
              const gamesAgo = slots - index;
              const slotTitle = gamesAgo === 1 ? "Latest game" : `${gamesAgo} games ago`;
              const entries = series.map((line) => ({ ...line, game: line.games[index] }));
              const label = entries
                .map((entry) =>
                  entry.game
                    ? `${entry.name} ${entry.game.pts} points ${entry.game.isHome ? "vs" : "at"} ${entry.game.opponent}`
                    : `${entry.name} no game`,
                )
                .join(", ");

              return (
                <div key={index} className={styles.column} tabIndex={0} aria-label={`${slotTitle}: ${label}`}>
                  <span className={styles.tooltip} role="presentation">
                    <span className={styles.tooltipTitle}>{slotTitle}</span>
                    {entries.map((entry) => (
                      <span key={entry.side} className={styles.tooltipRow} data-side={entry.side}>
                        <strong className="tabular">{entry.game ? entry.game.pts : "–"}</strong>
                        <span>
                          {entry.name}
                          {entry.game &&
                            ` · ${formatGameDate(entry.game.date)} ${entry.game.isHome ? "vs" : "@"} ${entry.game.opponent}`}
                        </span>
                      </span>
                    ))}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </figure>
  );
}
