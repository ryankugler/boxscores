import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MutableRefObject,
} from "react";

import { getAccent } from "../data/constants";
import type { Game, Theme } from "../types";
import { TeamLogo } from "./TeamLogo";

interface GameSelectorProps {
  games: Game[];
  availableDates: string[];
  selectedDate: string;
  showUpcomingGames: boolean;
  selectedGameId: string;
  dark: boolean;
  theme: Theme;
  transitionStyle: CSSProperties;
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

const SCROLL_STEP_PX = 320;

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

export function GameSelector({
  games,
  availableDates,
  selectedDate,
  showUpcomingGames,
  selectedGameId,
  dark,
  theme,
  transitionStyle,
  onSelectDate,
  onSelectGame,
}: GameSelectorProps) {
  const upcomingGames = games.filter((game) => game.statusState === "pre");
  const primaryGames = games.filter((game) => game.statusState !== "pre");
  const visiblePrimaryGames = primaryGames.length > 0 ? primaryGames : games;

  const primaryRowRef = useRef<HTMLDivElement | null>(null);
  const upcomingRowRef = useRef<HTMLDivElement | null>(null);
  const [primaryControls, setPrimaryControls] = useState<ScrollControls>(
    DEFAULT_SCROLL_CONTROLS,
  );
  const [upcomingControls, setUpcomingControls] = useState<ScrollControls>(
    DEFAULT_SCROLL_CONTROLS,
  );

  useEffect(() => {
    const syncControls = () => {
      setPrimaryControls(getScrollControls(primaryRowRef.current));
      setUpcomingControls(getScrollControls(upcomingRowRef.current));
    };

    syncControls();
    window.addEventListener("resize", syncControls);

    return () => {
      window.removeEventListener("resize", syncControls);
    };
  }, [visiblePrimaryGames.length, upcomingGames.length]);

  const scrollRowBy = (row: HTMLDivElement | null, direction: 1 | -1) => {
    if (!row) {
      return;
    }

    row.scrollBy({
      left: direction * SCROLL_STEP_PX,
      behavior: "smooth",
    });
  };

  const renderGameButtons = (list: Game[]) =>
    list.map((game) => {
      const isSelected = game.id === selectedGameId;
      const isLive = game.statusState === "in";
      const isPregame = game.statusState === "pre";
      const isPostgame = game.statusState === "post";
      const rawStatusText = game.statusText?.trim();
      const sanitizedStatusText =
        isLive && rawStatusText && /final/i.test(rawStatusText) ? null : rawStatusText;
      const statusLabel = isLive
        ? sanitizedStatusText ?? "In Progress"
        : sanitizedStatusText ?? (isPostgame ? "Final" : game.date);
      const homeScore = game.score[game.home] ?? 0;
      const awayScore = game.score[game.away] ?? 0;
      const winner =
        homeScore === awayScore ? null : homeScore > awayScore ? game.home : game.away;
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
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "8px",
            }}
          >
            <span>{statusLabel}</span>
            {isLive && (
              <span className="game-live-indicator">
                <span className="game-live-dot" />
                Live
              </span>
            )}
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
                {isPregame ? "--" : awayScore}
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
                {isPregame ? "--" : homeScore}
              </span>
            </div>
          </div>
        </button>
      );
    });

  const renderScrollableRow = (
    list: Game[],
    rowRef: MutableRefObject<HTMLDivElement | null>,
    controls: ScrollControls,
    setControls: (next: ScrollControls) => void,
  ) => (
    <div style={{ position: "relative" }}>
      <button
        aria-label="Scroll games left"
        onClick={() => scrollRowBy(rowRef.current, -1)}
        disabled={!controls.canScrollLeft}
        style={{
          position: "absolute",
          left: "8px",
          top: "50%",
          transform: "translateY(-50%)",
          width: "24px",
          height: "24px",
          borderRadius: "999px",
          border: `1px solid ${theme.border}`,
          background: theme.cardBg,
          color: theme.textPrimary,
          cursor: controls.canScrollLeft ? "pointer" : "default",
          opacity: controls.canScrollLeft ? 0.9 : 0.3,
          zIndex: 2,
          padding: 0,
          lineHeight: 1,
          fontSize: "15px",
        }}
      >
        ‹
      </button>

      <div
        ref={rowRef}
        className="scrollbar-hidden"
        onScroll={() => setControls(getScrollControls(rowRef.current))}
        style={{
          display: "flex",
          overflowX: "auto",
          overflowY: "hidden",
          whiteSpace: "nowrap",
          padding: "0 36px",
          scrollBehavior: "smooth",
        }}
      >
        {renderGameButtons(list)}
      </div>

      <button
        aria-label="Scroll games right"
        onClick={() => scrollRowBy(rowRef.current, 1)}
        disabled={!controls.canScrollRight}
        style={{
          position: "absolute",
          right: "8px",
          top: "50%",
          transform: "translateY(-50%)",
          width: "24px",
          height: "24px",
          borderRadius: "999px",
          border: `1px solid ${theme.border}`,
          background: theme.cardBg,
          color: theme.textPrimary,
          cursor: controls.canScrollRight ? "pointer" : "default",
          opacity: controls.canScrollRight ? 0.9 : 0.3,
          zIndex: 2,
          padding: 0,
          lineHeight: 1,
          fontSize: "15px",
        }}
      >
        ›
      </button>
    </div>
  );

  return (
    <div style={{ borderBottom: `1px solid ${theme.border}`, background: theme.pageBg, ...transitionStyle }}>
      <div
        className="scrollbar-hidden"
        style={{
          display: "flex",
          gap: "8px",
          overflowX: "auto",
          padding: "10px 20px",
          borderBottom: `1px solid ${theme.border}`,
          background: theme.headerBg,
        }}
      >
        {availableDates.map((date) => {
          const isActive = selectedDate === date;

          return (
            <button
              key={date}
              onClick={() => onSelectDate(date)}
              style={{
                border: `1px solid ${isActive ? "#e8401a" : theme.border}`,
                background: isActive ? theme.cardBg : theme.subHeader,
                color: isActive ? theme.textPrimary : theme.textMuted,
                borderRadius: "999px",
                padding: "6px 10px",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.8px",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                cursor: "pointer",
              }}
            >
              {date}
            </button>
          );
        })}
      </div>

      {renderScrollableRow(
        visiblePrimaryGames,
        primaryRowRef,
        primaryControls,
        setPrimaryControls,
      )}

      {showUpcomingGames && upcomingGames.length > 0 && (
        <div
          style={{
            borderTop: `1px solid ${theme.border}`,
          }}
        >
          <div
            style={{
              padding: "6px 20px",
              fontSize: "10px",
              letterSpacing: "1.4px",
              textTransform: "uppercase",
              fontWeight: 700,
              color: theme.textMuted,
            }}
          >
            Upcoming Games
          </div>
          {renderScrollableRow(
            upcomingGames,
            upcomingRowRef,
            upcomingControls,
            setUpcomingControls,
          )}
        </div>
      )}
    </div>
  );
}
