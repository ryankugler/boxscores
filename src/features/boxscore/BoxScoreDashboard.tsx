import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  fetchConferenceStandings,
  fetchGameById,
  fetchGameDetails,
  fetchScoreboardGames,
  fetchScoreboardGamesForDate,
} from "./api/espn";
import { SeasonLeaders } from "../leaders/SeasonLeaders";
import NBAPlayoffBracket from "../playoffBracket/NBAPlayoffBracket";
import { PlayersPage } from "../players/PlayersPage";
import styles from "./BoxScoreDashboard.module.css";
import { getReadableAccent, getTeamPalette } from "./color";
import { ConferenceStandings } from "./components/ConferenceStandings";
import { GameSelector } from "./components/GameSelector";
import { Header } from "./components/Header";
import { PlayerStatsTable } from "./components/PlayerStatsTable";
import { Scorebug } from "./components/Scorebug";
import { StatusBar } from "./components/StatusBar";
import { TeamTabs } from "./components/TeamTabs";
import { TopPerformersLeaderboard } from "./components/TopPerformersLeaderboard";
import { GAMES } from "./data/games";
import { useRoute, type View } from "./hooks/useRoute";
import { useThemePreference } from "./hooks/useThemePreference";
import { COL_KEY, getTopPerformersForDate, sortPlayers } from "./stats";

import type {
  ConferenceStandings as ConferenceStandingsData,
  Game,
  SortDirection,
  SortableStatKey,
  StatColumn,
  TeamCode,
  TopPerformer,
} from "./types";

const LIVE_REFRESH_INTERVAL_MS = 30_000;
const PREGAME_REFRESH_INTERVAL_MS = 60_000;
const TOP_PERFORMERS_LIMIT = 10;
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

function formatToday(): string {
  return DATE_FORMATTER.format(new Date());
}

// The Today slate is today's games plus any game still in progress from an
// earlier date, so a late tip-off doesn't vanish when the clock passes midnight.
function isInTodaySlate(game: Game, todayLabel: string): boolean {
  return game.date === todayLabel || game.statusState === "in";
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
    overtimes: details.overtimes,
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

// Folds a fresh scoreboard snapshot into the current games, keeping any
// box score detail already loaded for each game.
function mergeScoreboardUpdate(current: Game[], fresh: Game[]): Game[] {
  const freshById = new Map(fresh.map((game) => [game.id, game]));
  const merged = current.map((game) => {
    const update = freshById.get(game.id);
    if (!update) {
      return game;
    }

    freshById.delete(game.id);
    return {
      ...game,
      score: update.score,
      periods: update.periods,
      overtimes: update.overtimes,
      records: update.records ?? game.records,
      statusState: update.statusState,
      statusText: update.statusText,
    };
  });

  return [...merged, ...freshById.values()];
}

export function BoxScoreDashboard() {
  const { route, navigate } = useRoute();
  const { dark, toggle: toggleTheme } = useThemePreference();
  const activeView = route.view;
  const showSeasonLeaders = activeView === "leaderboard" && Boolean(route.season);

  const [games, setGames] = useState<Game[]>([]);
  const [selectedDateTab, setSelectedDateTab] = useState<string>(TODAY_TAB);
  const [selectedGameId, setSelectedGameId] = useState<string>("");
  const [activeTeam, setActiveTeam] = useState<TeamCode>("");
  const [sortCol, setSortCol] = useState<SortableStatKey>("pts");
  const [sortDir, setSortDir] = useState<SortDirection>(-1);
  const [animKey, setAnimKey] = useState(0);
  const [loadingGames, setLoadingGames] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [usingSampleData, setUsingSampleData] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [refreshFailed, setRefreshFailed] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [scoreboardRequest, setScoreboardRequest] = useState(0);
  const [leaderboardPerformers, setLeaderboardPerformers] = useState<TopPerformer[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);
  const [conferenceStandings, setConferenceStandings] = useState<ConferenceStandingsData>({
    eastern: [],
    western: [],
  });
  const [loadingStandings, setLoadingStandings] = useState(false);
  const [standingsError, setStandingsError] = useState<string | null>(null);
  const [detailsFetchedAtByGame, setDetailsFetchedAtByGame] = useState<
    Record<string, number>
  >({});
  const leaderboardRequestIdRef = useRef(0);
  const appliedRouteGameIdRef = useRef<string | undefined>(undefined);

  const [todayLabel, setTodayLabel] = useState(formatToday);
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
    return games.filter((item) => isInTodaySlate(item, todayLabel));
  }, [games, todayLabel]);
  const gamesForSelectedDate = useMemo(() => {
    if (selectedDateTab === TODAY_TAB) {
      return gamesForToday;
    }

    return completedGames.filter((item) => item.date === selectedDateTab);
  }, [completedGames, gamesForToday, selectedDateTab]);
  const selectedDateLabel = selectedDateTab === TODAY_TAB ? todayLabel : selectedDateTab;

  const game = useMemo(() => {
    const selected = gamesForSelectedDate.find((item) => item.id === selectedGameId);
    if (selected) {
      return selected;
    }

    // A carried-over game that just went final leaves the Today slate; stay
    // on it rather than jumping to another game (the tab follows it below).
    const finishedCarryover =
      selectedDateTab === TODAY_TAB
        ? completedGames.find((item) => item.id === selectedGameId)
        : undefined;

    return finishedCarryover ?? gamesForSelectedDate[0] ?? null;
  }, [completedGames, gamesForSelectedDate, selectedDateTab, selectedGameId]);

  const selectGame = useCallback((selected: Game) => {
    setSelectedGameId(selected.id);
    setActiveTeam(selected.home);
    setSortCol("pts");
    setSortDir(-1);
    setAnimKey((key) => key + 1);
    setDetailsError(null);
  }, []);

  useEffect(() => {
    if (game && game.id !== selectedGameId) {
      selectGame(game);
    }
  }, [game, selectedGameId, selectGame]);

  useEffect(() => {
    if (selectedDateTab === TODAY_TAB && game && !gamesForToday.includes(game)) {
      setSelectedDateTab(game.date);
    }
  }, [game, gamesForToday, selectedDateTab]);

  // Roll the Today slate over at midnight for pages left open overnight.
  useEffect(() => {
    const syncToday = () => setTodayLabel(formatToday());
    const intervalId = window.setInterval(syncToday, 60_000);
    document.addEventListener("visibilitychange", syncToday);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", syncToday);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadScoreboard = async () => {
      setLoadingGames(true);

      try {
        const apiGames = await fetchScoreboardGames(7);
        if (cancelled) {
          return;
        }

        const today = formatToday();
        const todayGame =
          apiGames.find((item) => item.statusState === "in") ??
          apiGames.find((item) => item.date === today);
        const preferredGame = apiGames.find((item) => item.statusState !== "pre") ?? apiGames[0];
        const initialGame = todayGame ?? preferredGame;

        setGames(apiGames);
        setUsingSampleData(false);
        setLastUpdatedAt(Date.now());
        if (initialGame) {
          setSelectedDateTab(todayGame ? TODAY_TAB : initialGame.date);
          selectGame(initialGame);
        }
      } catch {
        if (!cancelled) {
          setGames((current) => (current.length > 0 ? current : GAMES));
          setUsingSampleData(true);
          if (GAMES[0]) {
            setSelectedDateTab(GAMES[0].date);
            selectGame(GAMES[0]);
          }
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
  }, [scoreboardRequest, selectGame]);

  // Apply a /game/:id URL (first load, or back/forward navigation). Games
  // outside the loaded scoreboard window are fetched individually.
  useEffect(() => {
    const routeGameId = route.gameId;
    if (!routeGameId || routeGameId === appliedRouteGameIdRef.current || loadingGames) {
      return;
    }

    const applyGame = (target: Game) => {
      appliedRouteGameIdRef.current = target.id;
      setSelectedDateTab(isInTodaySlate(target, todayLabel) ? TODAY_TAB : target.date);
      selectGame(target);
    };

    const existing = games.find((item) => item.id === routeGameId);
    if (existing) {
      applyGame(existing);
      return;
    }

    let cancelled = false;
    appliedRouteGameIdRef.current = routeGameId;

    fetchGameById(routeGameId)
      .then((fetched) => {
        if (cancelled) {
          return;
        }

        setGames((current) =>
          current.some((item) => item.id === fetched.id) ? current : [...current, fetched],
        );
        applyGame(fetched);
      })
      .catch(() => {
        if (!cancelled) {
          setDetailsError("That game couldn't be found.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [route.gameId, games, loadingGames, todayLabel, selectGame]);

  useEffect(() => {
    let cancelled = false;

    const loadStandings = async () => {
      setLoadingStandings(true);
      try {
        const standings = await fetchConferenceStandings();
        if (cancelled) {
          return;
        }

        setConferenceStandings(standings);
        if (standings.eastern.length === 0 && standings.western.length === 0) {
          setStandingsError("No standings data available right now.");
        } else {
          setStandingsError(null);
        }
      } catch {
        if (!cancelled) {
          setStandingsError("Could not load conference standings from the API.");
        }
      } finally {
        if (!cancelled) {
          setLoadingStandings(false);
        }
      }
    };

    void loadStandings();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!availableDateTabs.includes(selectedDateTab)) {
      setSelectedDateTab(availableDateTabs[0]);
    }
  }, [availableDateTabs, selectedDateTab]);

  // Keep today's scoreboard fresh while games are live or about to start.
  const todayHasLiveGame = gamesForToday.some((item) => item.statusState === "in");
  const todayHasPendingGame = gamesForToday.some((item) => item.statusState === "pre");
  // Live games from last night live on an earlier scoreboard date, so refresh
  // those dates too.
  const refreshDatesKey = [
    ...new Set([todayLabel, ...gamesForToday.map((item) => item.date).filter(Boolean)]),
  ].join("|");

  useEffect(() => {
    if (usingSampleData || (!todayHasLiveGame && !todayHasPendingGame)) {
      return;
    }

    let cancelled = false;
    const interval = todayHasLiveGame ? LIVE_REFRESH_INTERVAL_MS : PREGAME_REFRESH_INTERVAL_MS;

    const refresh = async () => {
      if (document.hidden) {
        return;
      }

      try {
        const dates = refreshDatesKey.split("|").map((label) => new Date(parseGameDate(label)));
        const fresh = (await Promise.all(dates.map(fetchScoreboardGamesForDate))).flat();
        if (cancelled) {
          return;
        }

        setGames((current) => mergeScoreboardUpdate(current, fresh));
        setLastUpdatedAt(Date.now());
        setRefreshFailed(false);
      } catch {
        if (!cancelled) {
          setRefreshFailed(true);
        }
      }
    };

    const intervalId = window.setInterval(() => void refresh(), interval);
    document.addEventListener("visibilitychange", refresh);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [usingSampleData, todayHasLiveGame, todayHasPendingGame, refreshDatesKey]);

  const hasBoxscoreData = game ? gameHasBoxscoreData(game) : false;
  const isPregame = game?.statusState === "pre";
  const isLiveGame = game?.statusState === "in";
  const lastDetailsFetchAt = game ? detailsFetchedAtByGame[game.id] ?? 0 : 0;

  useEffect(() => {
    if (!game || usingSampleData || isPregame || (!isLiveGame && hasBoxscoreData)) {
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
        setDetailsError(null);
        setLastUpdatedAt(Date.now());
      } catch {
        if (!cancelled) {
          setDetailsError("Couldn't load the full box score for this game.");
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
  }, [game, usingSampleData, hasBoxscoreData, isPregame, isLiveGame, lastDetailsFetchAt]);

  useEffect(() => {
    if (activeView !== "leaderboard" || showSeasonLeaders || !selectedDateLabel) {
      return;
    }

    const parsedDate = parseGameDate(selectedDateLabel);
    if (parsedDate <= 0) {
      setLeaderboardPerformers([]);
      setLeaderboardError("Invalid date selected for leaderboard.");
      return;
    }

    let cancelled = false;
    const requestId = leaderboardRequestIdRef.current + 1;
    leaderboardRequestIdRef.current = requestId;

    const loadDailyLeaderboard = async () => {
      setLoadingLeaderboard(true);
      setLeaderboardError(null);
      setLeaderboardPerformers([]);

      try {
        const dailyGames = await fetchScoreboardGamesForDate(new Date(parsedDate));
        if (cancelled || requestId !== leaderboardRequestIdRef.current) {
          return;
        }

        const nonPregameGames = dailyGames.filter((candidate) => candidate.statusState !== "pre");
        const detailedGames = await Promise.all(
          nonPregameGames.map(async (candidate) => {
            try {
              const details = await fetchGameDetails(candidate.id);
              return mergeGameWithDetails(candidate, details);
            } catch {
              return candidate;
            }
          }),
        );

        if (cancelled || requestId !== leaderboardRequestIdRef.current) {
          return;
        }

        const top = getTopPerformersForDate(
          detailedGames,
          selectedDateLabel,
          TOP_PERFORMERS_LIMIT,
        );
        setLeaderboardPerformers(top);
      } catch {
        if (!cancelled && requestId === leaderboardRequestIdRef.current) {
          setLeaderboardError("Could not load daily leaderboard from the API.");
        }
      } finally {
        if (!cancelled && requestId === leaderboardRequestIdRef.current) {
          setLoadingLeaderboard(false);
        }
      }
    };

    void loadDailyLeaderboard();

    return () => {
      cancelled = true;
    };
  }, [activeView, showSeasonLeaders, selectedDateLabel]);

  useEffect(() => {
    if (activeView === "boxscores" && game && game.statusState !== "pre") {
      document.title = `${game.away} ${game.score[game.away] ?? 0} – ${game.score[game.home] ?? 0} ${game.home} · whowon`;
      return;
    }

    if (activeView === "players") {
      return;
    }

    const viewTitles: Record<Exclude<View, "players">, string> = {
      boxscores: "Box Scores",
      leaderboard: "Leaderboard",
      standings: "Standings",
      playoffs: "Playoff Bracket",
    };
    document.title = `${showSeasonLeaders ? "Season Leaders" : viewTitles[activeView]} · whowon`;
  }, [activeView, showSeasonLeaders, game]);

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

  const activePalette = game
    ? getTeamPalette(activeTeam, game.teamColors?.[activeTeam])
    : null;

  const handleGameSelect = (selected: Game) => {
    appliedRouteGameIdRef.current = selected.id;
    selectGame(selected);
    navigate({ view: "boxscores", gameId: selected.id });
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

    selectGame(nextGame);
    if (activeView === "boxscores" && route.gameId) {
      appliedRouteGameIdRef.current = nextGame.id;
      navigate({ view: "boxscores", gameId: nextGame.id }, { replace: true });
    }
  };

  const handleOpenPlayer = (playerId: string) => {
    navigate({ view: "players", playerId });
  };

  const handleComparePlayers = (playerId: string, compareId: string | undefined) => {
    navigate({ view: "players", playerId, compareId });
  };

  const handleOpenGame = (gameId: string) => {
    navigate({ view: "boxscores", gameId });
  };

  const handleSelectView = (view: View) => {
    if (view === "boxscores" && game) {
      navigate({ view, gameId: route.gameId ? game.id : undefined });
      return;
    }

    navigate({ view });
  };

  const showGameSelector =
    activeView === "boxscores" || (activeView === "leaderboard" && !showSeasonLeaders);
  const boxScoreEmptyMessage =
    isLiveGame && !hasBoxscoreData
      ? "Live game in progress. Box score is populating."
      : detailsError;

  return (
    <div className={styles.app}>
      <Header
        activeTab={activeView}
        dark={dark}
        onSelectTab={handleSelectView}
        onToggleTheme={toggleTheme}
      />

      {showGameSelector && (
        <GameSelector
          games={gamesForSelectedDate}
          availableDates={availableDateTabs}
          selectedDate={selectedDateTab}
          selectedGameId={game?.id ?? ""}
          showGames={activeView === "boxscores"}
          loading={loadingGames}
          onSelectDate={handleDateSelect}
          onSelectGame={handleGameSelect}
        />
      )}

      <main className={styles.main}>
        {activeView !== "players" && (
          <StatusBar
            usingSampleData={usingSampleData}
            refreshFailed={refreshFailed}
            lastUpdatedAt={lastUpdatedAt}
            live={todayHasLiveGame && !usingSampleData}
            onRetry={() => setScoreboardRequest((count) => count + 1)}
          />
        )}

        {activeView === "boxscores" && (
          <>
            {loadingGames && !game && (
              <div aria-hidden="true">
                <span className="skeleton" style={{ height: 210, borderRadius: 12 }} />
                <span className="skeleton" style={{ height: 380, marginTop: 20, borderRadius: 10 }} />
              </div>
            )}

            {!loadingGames && !game && (
              <div className={styles.emptyCard}>No games on this date.</div>
            )}

            {game && (
              <div className={styles.gameView}>
                <Scorebug game={game} />

                {isPregame ? (
                  <div className={styles.emptyCard}>
                    Box score appears at tip-off
                    {game.statusText ? <span>{game.statusText}</span> : null}
                  </div>
                ) : (
                  <>
                    <TeamTabs game={game} activeTeam={activeTeam} onSwitchTeam={handleTeamSwitch} />
                    {loadingDetails && sortedPlayers.length === 0 ? (
                      <span
                        className="skeleton"
                        style={{ height: 380, borderRadius: "0 0 10px 10px" }}
                        aria-hidden="true"
                      />
                    ) : (
                      <PlayerStatsTable
                        gameId={game.id}
                        activeTeam={activeTeam}
                        animKey={animKey}
                        sortedPlayers={sortedPlayers}
                        sortCol={sortCol}
                        sortDir={sortDir}
                        teamColor={activePalette?.primary ?? "#e8401a"}
                        accent={activePalette ? getReadableAccent(activePalette, dark) : "#e8401a"}
                        emptyMessage={boxScoreEmptyMessage}
                        onSort={handleSort}
                        onOpenPlayer={handleOpenPlayer}
                      />
                    )}
                  </>
                )}
              </div>
            )}
          </>
        )}

        {activeView === "leaderboard" && (
          <div className={styles.leaderMode} role="tablist" aria-label="Leaderboard range">
            <button
              role="tab"
              aria-selected={!showSeasonLeaders}
              onClick={() => navigate({ view: "leaderboard" })}
            >
              Daily
            </button>
            <button
              role="tab"
              aria-selected={showSeasonLeaders}
              onClick={() => navigate({ view: "leaderboard", season: true })}
            >
              Season
            </button>
          </div>
        )}

        {activeView === "leaderboard" && !showSeasonLeaders && (
          <TopPerformersLeaderboard
            limit={TOP_PERFORMERS_LIMIT}
            dateLabel={selectedDateLabel}
            performers={leaderboardPerformers}
            isLoading={loadingLeaderboard}
            error={leaderboardError}
            onOpenPlayer={handleOpenPlayer}
          />
        )}

        {showSeasonLeaders && (
          <div className={styles.seasonLeaders}>
            <SeasonLeaders onOpenPlayer={handleOpenPlayer} onCompare={handleComparePlayers} />
          </div>
        )}

        {activeView === "players" && (
          <PlayersPage
            playerId={route.playerId}
            compareId={route.compareId}
            dark={dark}
            onSelectPlayer={handleOpenPlayer}
            onCompare={handleComparePlayers}
            onOpenGame={handleOpenGame}
          />
        )}

        {activeView === "standings" && (
          <ConferenceStandings
            eastern={conferenceStandings.eastern}
            western={conferenceStandings.western}
            loading={loadingStandings}
            error={standingsError}
          />
        )}

        {activeView === "playoffs" && (
          <NBAPlayoffBracket
            standings={conferenceStandings}
            loading={loadingStandings}
            error={standingsError}
          />
        )}
      </main>
    </div>
  );
}
