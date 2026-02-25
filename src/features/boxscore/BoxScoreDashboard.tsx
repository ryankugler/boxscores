import { useEffect, useMemo, useState } from "react";

import { fetchGameDetails, fetchScoreboardGames } from "./api/espn";
import { GameSelector } from "./components/GameSelector";
import { Header } from "./components/Header";
import { PlayerStatsTable } from "./components/PlayerStatsTable";
import { QuarterBreakdown } from "./components/QuarterBreakdown";
import { TeamTabs } from "./components/TeamTabs";
import { getAccent } from "./data/constants";
import { GAMES } from "./data/games";
import { COL_KEY, getTopPerformersForDate, sortPlayers } from "./stats";
import { mkTheme, TRANSITION_STYLE } from "./theme";
import { TopPerformersLeaderboard } from "./components/TopPerformersLeaderboard";

import type {
  Game,
  SortDirection,
  SortableStatKey,
  StatColumn,
  TeamCode,
} from "./types";

const LIVE_REFRESH_INTERVAL_MS = 30_000;
const TOP_PERFORMERS_LIMIT = 5;
const TODAY_TAB = "Today";
const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});
type GameDetailsPayload = Awaited<ReturnType<typeof fetchGameDetails>>;

function parseGameDate(value: string): number {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function gameHasBoxscoreData(game: Game): boolean {
  return (
    (game.players[game.home]?.length ?? 0) > 0 &&
    (game.players[game.away]?.length ?? 0) > 0
  );
}

function isCompletedGame(game: Game): boolean {
  if (game.statusState === "post") {
    return true;
  }

  if (game.statusState === "pre" || game.statusState === "in") {
    return false;
  }

  return gameHasBoxscoreData(game);
}

function mergeGameWithDetails(game: Game, details: GameDetailsPayload): Game {
  return {
    ...game,
    score: details.score,
    periods: details.periods,
    players: {
      ...game.players,
      ...details.players,
    },
    teamLogos: {
      ...game.teamLogos,
      ...details.teamLogos,
    },
    teamColors: {
      ...game.teamColors,
      ...details.teamColors,
    },
    statusState: details.statusState ?? game.statusState,
    statusText: details.statusText ?? game.statusText,
  };
}

export function BoxScoreDashboard() {
  const [games, setGames] = useState<Game[]>(GAMES);
  const [selectedDateTab, setSelectedDateTab] = useState<string>(TODAY_TAB);
  const [selectedGameId, setSelectedGameId] = useState<string>(GAMES[0]?.id ?? "");
  const [activeTeam, setActiveTeam] = useState<TeamCode>(GAMES[0]?.home ?? "LAL");
  const [sortCol, setSortCol] = useState<SortableStatKey>("pts");
  const [sortDir, setSortDir] = useState<SortDirection>(-1);
  const [animKey, setAnimKey] = useState(0);
  const [dark, setDark] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [detailsLoadingByGame, setDetailsLoadingByGame] = useState<Record<string, boolean>>({});
  const [loadingGames, setLoadingGames] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loadingDateDetails, setLoadingDateDetails] = useState(false);
  const [detailsFetchedAtByGame, setDetailsFetchedAtByGame] = useState<
    Record<string, number>
  >({});

  const theme = useMemo(() => mkTheme(dark), [dark]);
  const todayLabel = useMemo(() => DATE_FORMATTER.format(new Date()), []);
  const completedGames = useMemo(() => games.filter(isCompletedGame), [games]);
  const availableHistoricalDates = useMemo(() => {
    const unique = new Set(completedGames.map((item) => item.date).filter(Boolean));
    unique.delete(todayLabel);
    return [...unique].sort((a, b) => parseGameDate(b) - parseGameDate(a));
  }, [completedGames, todayLabel]);
  const availableDateTabs = useMemo(() => {
    return [TODAY_TAB, ...availableHistoricalDates];
  }, [availableHistoricalDates]);
  const gamesForToday = useMemo(() => {
    return games
      .filter((item) => item.date === todayLabel)
      .sort((a, b) => parseGameDate(b.date) - parseGameDate(a.date));
  }, [games, todayLabel]);
  const gamesForSelectedDate = useMemo(() => {
    if (selectedDateTab === TODAY_TAB) {
      return gamesForToday;
    }

    return completedGames
      .filter((item) => item.date === selectedDateTab)
      .sort((a, b) => parseGameDate(b.date) - parseGameDate(a.date));
  }, [completedGames, gamesForToday, selectedDateTab]);

  const game = useMemo(() => {
    return (
      gamesForSelectedDate.find((item) => item.id === selectedGameId) ??
      gamesForSelectedDate[0] ??
      null
    );
  }, [gamesForSelectedDate, selectedGameId]);

  useEffect(() => {
    if (!game) {
      return;
    }

    if (game.id !== selectedGameId) {
      setSelectedGameId(game.id);
      setActiveTeam(game.home);
      setSortCol("pts");
      setSortDir(-1);
      setAnimKey((key) => key + 1);
    }
  }, [game, selectedGameId]);

  useEffect(() => {
    let cancelled = false;

    const loadScoreboard = async () => {
      setLoadingGames(true);

      try {
        const apiGames = await fetchScoreboardGames(7);
        if (cancelled || apiGames.length === 0) {
          return;
        }

        const preferredGame = apiGames.find((item) => item.statusState !== "pre") ?? apiGames[0];
        const todayGame = apiGames.find((item) => item.date === todayLabel);
        const initialGame = todayGame ?? preferredGame;

        setGames(apiGames);
        setSelectedDateTab(todayGame ? TODAY_TAB : initialGame.date);
        setSelectedGameId(initialGame.id);
        setActiveTeam(initialGame.home);
        setSortCol("pts");
        setSortDir(-1);
        setAnimKey((key) => key + 1);
        setApiError(null);
      } catch {
        if (!cancelled) {
          setApiError("Live API unavailable. Showing fallback sample data.");
        }
      } finally {
        if (!cancelled) {
          setLoadingGames(false);
        }
      }
    };

    void loadScoreboard();

    return () => {
      cancelled = true;
    };
  }, [todayLabel]);

  useEffect(() => {
    if (availableDateTabs.length === 0) {
      return;
    }

    if (!availableDateTabs.includes(selectedDateTab)) {
      setSelectedDateTab(availableDateTabs[0]);
    }
  }, [availableDateTabs, selectedDateTab]);

  const hasBoxscoreData = useMemo(() => {
    if (!game) {
      return false;
    }

      return gameHasBoxscoreData(game);
  }, [game]);

  const isPregame = game?.statusState === "pre";
  const isLiveGame = game?.statusState === "in";
  const lastDetailsFetchAt = game ? detailsFetchedAtByGame[game.id] ?? 0 : 0;

  useEffect(() => {
    if (!game || isPregame || (!isLiveGame && hasBoxscoreData)) {
      return;
    }

    let cancelled = false;
    let timeoutId: number | undefined;

    const loadDetails = async () => {
      setLoadingDetails(true);

      try {
        const details = await fetchGameDetails(game.id);
        if (cancelled) {
          return;
        }

        setGames((currentGames) =>
          currentGames.map((existingGame) => {
            if (existingGame.id !== game.id) {
              return existingGame;
            }

            return mergeGameWithDetails(existingGame, details);
          }),
        );
        setApiError(null);
      } catch {
        if (!cancelled) {
          setApiError((currentError) => {
            return (
              currentError ??
              "Could not load full box score for the selected game from the API."
            );
          });
        }
      } finally {
        if (!cancelled) {
          setLoadingDetails(false);
          setDetailsFetchedAtByGame((current) => ({
            ...current,
            [game.id]: Date.now(),
          }));
        }
      }
    };

    if (!isLiveGame && lastDetailsFetchAt > 0) {
      return;
    }

    if (isLiveGame && lastDetailsFetchAt > 0) {
      const elapsed = Date.now() - lastDetailsFetchAt;
      const waitMs = Math.max(LIVE_REFRESH_INTERVAL_MS - elapsed, 0);
      timeoutId = window.setTimeout(() => {
        void loadDetails();
      }, waitMs);
    } else {
      void loadDetails();
    }

    return () => {
      cancelled = true;
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [game, hasBoxscoreData, isPregame, isLiveGame, lastDetailsFetchAt]);

  useEffect(() => {
  if (!game) {
    return;
  }

  const sameDateGames = games.filter(
    (candidate) =>
      candidate.date === game.date &&
      candidate.id !== game.id &&
      candidate.statusState !== "pre",
  );

  const missingGames = sameDateGames.filter((candidate) => {
    const hasData = gameHasBoxscoreData(candidate);
    const wasFetchedSuccessfully = (detailsFetchedAtByGame[candidate.id] ?? 0) > 0;
    const isCurrentlyLoading = detailsLoadingByGame[candidate.id] === true;

    // Only fetch if:
    // - no boxscore data yet
    // - not already fetched successfully
    // - not already in flight
    return !hasData && !wasFetchedSuccessfully && !isCurrentlyLoading;
  });

  if (missingGames.length === 0) {
    return;
  }

  let cancelled = false;

  // Mark these requests as in-flight immediately (prevents duplicate requests on rerender)
  setDetailsLoadingByGame((current) => {
    const next = { ...current };
    for (const candidate of missingGames) {
      next[candidate.id] = true;
    }
    return next;
  });

  const loadDateDetails = async () => {
    setLoadingDateDetails(true);

    try {
      const results = await Promise.all(
        missingGames.map(async (candidate) => {
          try {
            const details = await fetchGameDetails(candidate.id);
            return { id: candidate.id, details };
          } catch {
            // Optional: log for debugging
            // console.warn(`Failed to fetch details for game ${candidate.id}`);
            return null;
          }
        }),
      );

      if (cancelled) {
        return;
      }

      const successfulResults = results.filter(
        (result): result is { id: string; details: GameDetailsPayload } => result !== null,
      );

      // Merge successful detail payloads into games
      if (successfulResults.length > 0) {
        const detailsByGame = new Map(
          successfulResults.map((result) => [result.id, result.details]),
        );

        setGames((currentGames) =>
          currentGames.map((existingGame) => {
            const details = detailsByGame.get(existingGame.id);
            return details
              ? mergeGameWithDetails(existingGame, details)
              : existingGame;
          }),
        );

        // Mark ONLY successful fetches as fetched
        setDetailsFetchedAtByGame((current) => {
          const next = { ...current };
          const fetchedAt = Date.now();

          for (const result of successfulResults) {
            next[result.id] = fetchedAt;
          }

          return next;
        });
      }
    } finally {
      if (!cancelled) {
        // Clear in-flight flags for all attempted games (success or failure)
        setDetailsLoadingByGame((current) => {
          const next = { ...current };

          for (const candidate of missingGames) {
            delete next[candidate.id];
          }

          return next;
        });

        setLoadingDateDetails(false);
      }
    }
  };

  void loadDateDetails();

  return () => {
    cancelled = true;
  };
}, [game, games, detailsFetchedAtByGame, detailsLoadingByGame]);

  const players = useMemo(() => {
    if (!game) {
      return [];
    }

    return game.players[activeTeam] ?? [];
  }, [game, activeTeam]);
  const sortedPlayers = useMemo(
    () => sortPlayers(players, sortCol, sortDir),
    [players, sortCol, sortDir],
  );

  const topPerformers = useMemo(
    () =>
      getTopPerformersForDate(
        completedGames,
        selectedDateTab === TODAY_TAB ? todayLabel : selectedDateTab,
        TOP_PERFORMERS_LIMIT,
      ),
    [completedGames, selectedDateTab, todayLabel],
  );

  const leaderboardIsLoading = loadingGames || loadingDetails || loadingDateDetails;

  const accent = game ? getAccent(activeTeam, dark, game.teamColors?.[activeTeam]) : "#e8401a";
  const homeScore = game ? (game.score[game.home] ?? 0) : 0;
  const awayScore = game ? (game.score[game.away] ?? 0) : 0;
  const winTeam = game ? (homeScore > awayScore ? game.home : game.away) : "";

  const handleGameSelect = (selected: Game) => {
    setSelectedGameId(selected.id);
    if (selectedDateTab !== TODAY_TAB) {
      setSelectedDateTab(selected.date);
    }
    setActiveTeam(selected.home);
    setSortCol("pts");
    setSortDir(-1);
    setAnimKey((key) => key + 1);
    setApiError(null);
  };

  const handleTeamSwitch = (team: TeamCode) => {
    setActiveTeam(team);
    setSortCol("pts");
    setSortDir(-1);
    setAnimKey((key) => key + 1);
  };

  const handleSort = (column: StatColumn) => {
    const key = COL_KEY[column];

    if (sortCol === key) {
      setSortDir((direction) => (direction === -1 ? 1 : -1));
      return;
    }

    setSortCol(key);
    setSortDir(-1);
  };

  const handleDateSelect = (dateTab: string) => {
    if (dateTab === selectedDateTab) {
      return;
    }

    const nextGames =
      dateTab === TODAY_TAB
        ? gamesForToday
        : completedGames.filter((item) => item.date === dateTab);
    const nextGame = nextGames[0];
    setSelectedDateTab(dateTab);

    if (!nextGame) {
      return;
    }

    setSelectedGameId(nextGame.id);
    setActiveTeam(nextGame.home);
    setSortCol("pts");
    setSortDir(-1);
    setAnimKey((key) => key + 1);
    setApiError(null);
  };

  const scheduleMessage =
    isPregame && game.statusText
      ? `${game.statusText} - box score will appear at tip-off.`
      : isPregame
        ? "Game has not started yet. Box score will appear at tip-off."
        : isLiveGame && !hasBoxscoreData
          ? "Live game in progress. Box score is populating."
          : null;

  const statusMessage = loadingGames
    ? "Loading live NBA games..."
    : loadingDetails
      ? "Loading live box score..."
      : apiError ?? scheduleMessage;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: theme.pageBg,
        fontFamily: "'Barlow Condensed', sans-serif",
        color: theme.textPrimary,
        ...TRANSITION_STYLE,
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;500;600;700;800;900&display=swap"
        rel="stylesheet"
      />

      <Header
        dark={dark}
        onToggleTheme={() => setDark((value) => !value)}
        theme={theme}
        transitionStyle={TRANSITION_STYLE}
      />

      {availableDateTabs.length > 0 && (
        <GameSelector
          games={gamesForSelectedDate}
          availableDates={availableDateTabs}
          selectedDate={selectedDateTab}
          selectedGameId={game?.id ?? ""}
          dark={dark}
          theme={theme}
          transitionStyle={TRANSITION_STYLE}
          onSelectDate={handleDateSelect}
          onSelectGame={handleGameSelect}
        />
      )}

      <div style={{ padding: "0 28px 40px" }}>
        {availableDateTabs.length === 0 && (
          <div
            style={{
              padding: "12px 0",
              fontSize: "12px",
              letterSpacing: "0.6px",
              color: theme.textMuted,
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            No completed games found in the current range.
          </div>
        )}

        {statusMessage && (
          <div
            style={{
              padding: "10px 0",
              fontSize: "12px",
              letterSpacing: "0.6px",
              color: theme.textMuted,
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            {statusMessage}
          </div>
        )}

        {game && (
          <>
            <QuarterBreakdown
              game={game}
              winTeam={winTeam}
              dark={dark}
              theme={theme}
              transitionStyle={TRANSITION_STYLE}
            />

            <TeamTabs
              game={game}
              activeTeam={activeTeam}
              dark={dark}
              theme={theme}
              transitionStyle={TRANSITION_STYLE}
              onSwitchTeam={handleTeamSwitch}
            />

            <PlayerStatsTable
              gameId={game.id}
              activeTeam={activeTeam}
              animKey={animKey}
              sortedPlayers={sortedPlayers}
              sortCol={sortCol}
              sortDir={sortDir}
              accent={accent}
              theme={theme}
              transitionStyle={TRANSITION_STYLE}
              onSort={handleSort}
            />
          </>
        )}

      </div>
      <button
        onClick={() => setIsLeaderboardOpen(true)}
        style={{
          position: "fixed",
          right: "20px",
          bottom: "20px",
          border: "none",
          borderRadius: "999px",
          padding: "10px 14px",
          background: "#e8401a",
          color: "#fff",
          fontWeight: 800,
          fontSize: "12px",
          letterSpacing: "1px",
          textTransform: "uppercase",
          cursor: "pointer",
          zIndex: 20,
          boxShadow: dark ? "0 8px 24px rgba(0, 0, 0, 0.45)" : "0 8px 24px rgba(0, 0, 0, 0.2)",
        }}
      >
        Top {TOP_PERFORMERS_LIMIT}
      </button>

      {isLeaderboardOpen && (
        <button
          aria-label="Close leaderboard panel"
          onClick={() => setIsLeaderboardOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            border: "none",
            background: "rgba(0, 0, 0, 0.4)",
            zIndex: 29,
            padding: 0,
            cursor: "pointer",
          }}
        />
      )}

      <aside
        aria-hidden={!isLeaderboardOpen}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: "min(520px, 100vw)",
          height: "100vh",
          background: theme.pageBg,
          borderLeft: `1px solid ${theme.border}`,
          transform: isLeaderboardOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.2s ease-out",
          zIndex: 30,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "12px 14px",
            borderBottom: `1px solid ${theme.border}`,
            background: theme.headerBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              fontWeight: 800,
              letterSpacing: "1px",
              textTransform: "uppercase",
            }}
          >
            Daily Leaderboard
          </div>
          <button
            aria-label="Close leaderboard panel"
            onClick={() => setIsLeaderboardOpen(false)}
            style={{
              border: `1px solid ${theme.border}`,
              background: theme.cardBg,
              color: theme.textPrimary,
              borderRadius: "4px",
              padding: "4px 8px",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.5px",
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
        <div style={{ overflow: "auto" }}>
          <TopPerformersLeaderboard
            limit={TOP_PERFORMERS_LIMIT}
            dateLabel={selectedDateTab === TODAY_TAB ? todayLabel : selectedDateTab}
            performers={topPerformers}
            isLoading={leaderboardIsLoading}
            theme={theme}
            transitionStyle={TRANSITION_STYLE}
          />
        </div>
      </aside>
    </div>
  );
}
