import { useEffect, useRef, useState, type CSSProperties } from "react";

import { getMatchupColors, getTeamPalette } from "../color";
import type { Game } from "../types";
import { AnimatedScore } from "./AnimatedScore";
import styles from "./GameSelector.module.css";
import { TeamLogo } from "./TeamLogo";

interface GameSelectorProps {
  games: Game[];
  availableDates: string[];
  selectedDate: string;
  selectedGameId: string;
  showGames: boolean;
  loading: boolean;
  onSelectDate: (date: string) => void;
  onSelectGame: (game: Game) => void;
}

interface ScrollControls {
  canScrollLeft: boolean;
  canScrollRight: boolean;
}

const DEFAULT_SCROLL_CONTROLS: ScrollControls = {
  canScrollLeft: false,
  canScrollRight: false,
};

const SCROLL_STEP_PX = 480;
const SKELETON_CARD_COUNT = 5;

function getScrollControls(node: HTMLDivElement | null): ScrollControls {
  if (!node) {
    return DEFAULT_SCROLL_CONTROLS;
  }

  const maxScrollLeft = node.scrollWidth - node.clientWidth;

  return {
    canScrollLeft: node.scrollLeft > 1,
    canScrollRight: node.scrollLeft < maxScrollLeft - 1,
  };
}

// Live games first, then finals, then upcoming games in tip-off order.
function orderGames(games: Game[]): Game[] {
  const rank = (game: Game) =>
    game.statusState === "in" ? 0 : game.statusState === "pre" ? 2 : 1;

  return [...games].sort((a, b) => rank(a) - rank(b));
}

export function GameSelector({
  games,
  availableDates,
  selectedDate,
  selectedGameId,
  showGames,
  loading,
  onSelectDate,
  onSelectGame,
}: GameSelectorProps) {
  const rowRef = useRef<HTMLDivElement | null>(null);
  const [controls, setControls] = useState<ScrollControls>(DEFAULT_SCROLL_CONTROLS);
  const orderedGames = orderGames(games);

  useEffect(() => {
    const syncControls = () => setControls(getScrollControls(rowRef.current));

    syncControls();
    window.addEventListener("resize", syncControls);

    return () => window.removeEventListener("resize", syncControls);
  }, [orderedGames.length, loading, showGames]);

  useEffect(() => {
    const row = rowRef.current;
    const selected = row?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!row || !selected) {
      return;
    }

    const rowBox = row.getBoundingClientRect();
    const cardBox = selected.getBoundingClientRect();
    if (cardBox.left < rowBox.left || cardBox.right > rowBox.right) {
      row.scrollBy({ left: cardBox.left - rowBox.left - 48, behavior: "smooth" });
    }
  }, [selectedGameId]);

  const scrollRowBy = (direction: 1 | -1) => {
    rowRef.current?.scrollBy({ left: direction * SCROLL_STEP_PX, behavior: "smooth" });
  };

  return (
    <div className={styles.wrap}>
      <div className={`${styles.dates} scrollbar-hidden`} role="tablist" aria-label="Game dates">
        {availableDates.map((date) => (
          <button
            key={date}
            role="tab"
            aria-selected={selectedDate === date}
            className={styles.dateChip}
            onClick={() => onSelectDate(date)}
          >
            {formatDateChip(date)}
          </button>
        ))}
      </div>

      {showGames && (
        <div className={styles.rowShell}>
          <button
            aria-label="Scroll games left"
            className={`${styles.arrow} ${styles.arrowLeft}`}
            onClick={() => scrollRowBy(-1)}
            disabled={!controls.canScrollLeft}
          >
            ‹
          </button>

          <div
            ref={rowRef}
            className={`${styles.row} scrollbar-hidden`}
            onScroll={() => setControls(getScrollControls(rowRef.current))}
          >
            {loading && orderedGames.length === 0
              ? Array.from({ length: SKELETON_CARD_COUNT }, (_, index) => (
                  <div key={index} className={styles.card} aria-hidden="true">
                    <span className="skeleton" style={{ width: "60%", height: 10 }} />
                    <span className="skeleton" style={{ width: "100%", height: 22, marginTop: 12 }} />
                    <span className="skeleton" style={{ width: "100%", height: 22, marginTop: 8 }} />
                  </div>
                ))
              : orderedGames.map((game) => (
                  <GameCard
                    key={game.id}
                    game={game}
                    selected={game.id === selectedGameId}
                    onSelect={() => onSelectGame(game)}
                  />
                ))}
          </div>

          <button
            aria-label="Scroll games right"
            className={`${styles.arrow} ${styles.arrowRight}`}
            onClick={() => scrollRowBy(1)}
            disabled={!controls.canScrollRight}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}

interface GameCardProps {
  game: Game;
  selected: boolean;
  onSelect: () => void;
}

function GameCard({ game, selected, onSelect }: GameCardProps) {
  const isLive = game.statusState === "in";
  const isPregame = game.statusState === "pre";
  const isPostgame = !isLive && !isPregame;
  const rawStatusText = game.statusText?.trim();
  const statusText =
    isLive && rawStatusText && /final/i.test(rawStatusText) ? null : rawStatusText;
  const statusLabel = isLive
    ? statusText ?? "In Progress"
    : statusText ?? (isPostgame ? "Final" : game.date);
  const pregameLabel = isPregame ? formatTipoff(statusLabel) : statusLabel;

  const homeScore = game.score[game.home] ?? 0;
  const awayScore = game.score[game.away] ?? 0;
  const leader = homeScore === awayScore ? null : homeScore > awayScore ? game.home : game.away;
  const matchupColors = getMatchupColors(
    getTeamPalette(game.away, game.teamColors?.[game.away]),
    getTeamPalette(game.home, game.teamColors?.[game.home]),
  );

  const rows = [
    { team: game.away, score: awayScore, color: matchupColors.away },
    { team: game.home, score: homeScore, color: matchupColors.home },
  ];

  return (
    <button
      className={styles.card}
      aria-pressed={selected}
      data-live={isLive || undefined}
      onClick={onSelect}
      style={
        {
          "--away-color": matchupColors.away,
          "--home-color": matchupColors.home,
        } as CSSProperties
      }
    >
      <div className={styles.cardStatus}>
        {isLive ? (
          <span className="game-live-indicator">
            <span className="game-live-dot" />
            {statusLabel}
          </span>
        ) : (
          <span>{pregameLabel}</span>
        )}
      </div>

      {rows.map((row) => {
        const dimmed = isPostgame && leader !== null && leader !== row.team;

        return (
          <div
            key={row.team}
            className={styles.teamRow}
            data-dimmed={dimmed || undefined}
            style={{ "--team-color": row.color } as CSSProperties}
          >
            <span className={styles.teamBar} />
            <TeamLogo abbr={row.team} logoUrl={game.teamLogos?.[row.team]} size={22} />
            <span className={styles.teamCode}>{row.team}</span>
            {game.records?.[row.team] && (
              <span className={styles.teamRecord}>{game.records[row.team]}</span>
            )}
            <span className={styles.teamScore}>
              {isPregame ? "" : <AnimatedScore value={row.score} />}
            </span>
          </div>
        );
      })}
    </button>
  );
}

function formatDateChip(date: string): string {
  const parsed = Date.parse(date);
  if (Number.isNaN(parsed)) {
    return date;
  }

  return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" })
    .format(new Date(parsed));
}

// ESPN's pregame text looks like "10/28 - 7:30 PM EDT"; the date is already
// implied by the selected tab, so keep just the tip-off time.
function formatTipoff(statusText: string): string {
  const parts = statusText.split(" - ");
  return parts.length > 1 ? parts.slice(1).join(" - ") : statusText;
}
