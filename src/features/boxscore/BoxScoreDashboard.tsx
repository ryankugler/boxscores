import { useEffect, useMemo, useRef, useState } from "react";

import {
  fetchConferenceStandings,
  fetchGameDetails,
  fetchScoreboardGames,
  fetchScoreboardGamesForDate,
} from "./api/espn";
import NBAPlayoffBracket from "../playoffBracket/NBAPlayoffBracket";
import { ConferenceStandings } from "./components/ConferenceStandings";
import { GameSelector } from "./components/GameSelector";
import { Header, type TopNavTab } from "./components/Header";
import { PlayerStatsTable } from "./components/PlayerStatsTable";
import { QuarterBreakdown } from "./components/QuarterBreakdown";
import { TeamTabs } from "./components/TeamTabs";
import { getAccent } from "./data/constants";
import { GAMES } from "./data/games";
import { COL_KEY, getTopPerformersForDate, sortPlayers } from "./stats";
import { mkTheme, TRANSITION_STYLE } from "./theme";
import { TopPerformersLeaderboard } from "./components/TopPerformersLeaderboard";

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
const TOP_PERFORMERS_LIMIT = 10;
const TODAY_TAB = "Today";
const VIEW_TAB_BOXSCORES: TopNavTab = "boxscores";
const VIEW_TAB_LEADERBOARD: TopNavTab = "leaderboard";
const VIEW_TAB_STANDINGS: TopNavTab = "standings";
const VIEW_TAB_PLAYOFFS: TopNavTab = "playoffs";
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
  const [activeViewTab, setActiveViewTab] = useState<TopNavTab>(VIEW_TAB_BOXSCORES);
  const [selectedDateTab, setSelectedDateTab] = useState<string>(TODAY_TAB);
  const [selectedGameId, setSelectedGameId] = useState<string>(GAMES[0]?.id ?? "");
  const [activeTeam, setActiveTeam] = useState<TeamCode>(GAMES[0]?.home ?? "LAL");
  const [sortCol, setSortCol] = useState<SortableStatKey>("pts");
  const [sortDir, setSortDir] = useState<SortDirection>(-1);
  const [animKey, setAnimKey] = useState(0);
  const [dark, setDark] = useState(false);
  const [loadingGames, setLoadingGames] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
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
  const selectedDateLabel = selectedDateTab === TODAY_TAB ? todayLabel : selectedDateTab;

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
    if (activeViewTab !== VIEW_TAB_LEADERBOARD || !selectedDateLabel) {
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
  }, [activeViewTab, selectedDateLabel]);

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

  const leaderboardIsLoading = loadingLeaderboard;

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
        activeTab={activeViewTab}
        dark={dark}
        onSelectTab={setActiveViewTab}
        onToggleTheme={() => setDark((value) => !value)}
        theme={theme}
        transitionStyle={TRANSITION_STYLE}
      />

      <div className="dashboard-content" style={{ padding: "0 clamp(10px, 3.8vw, 28px) 32px" }}>
        {(activeViewTab === VIEW_TAB_BOXSCORES ||
          activeViewTab === VIEW_TAB_LEADERBOARD) &&
          availableDateTabs.length > 0 && (
            <GameSelector
              games={gamesForSelectedDate}
              availableDates={availableDateTabs}
              selectedDate={selectedDateTab}
              showUpcomingGames={selectedDateTab === TODAY_TAB}
              selectedGameId={game?.id ?? ""}
              dark={dark}
              theme={theme}
              transitionStyle={TRANSITION_STYLE}
              onSelectDate={handleDateSelect}
              onSelectGame={handleGameSelect}
            />
          )}

        {activeViewTab === VIEW_TAB_BOXSCORES && (
          <>
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
          </>
        )}

        {activeViewTab === VIEW_TAB_LEADERBOARD && (
          <>
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
                No games found in the current range.
              </div>
            )}
            <TopPerformersLeaderboard
              limit={TOP_PERFORMERS_LIMIT}
              dateLabel={selectedDateLabel}
              performers={leaderboardPerformers}
              isLoading={leaderboardIsLoading}
              error={leaderboardError}
              theme={theme}
              transitionStyle={TRANSITION_STYLE}
            />
          </>
        )}

        {activeViewTab === VIEW_TAB_STANDINGS && (
          <ConferenceStandings
            eastern={conferenceStandings.eastern}
            western={conferenceStandings.western}
            loading={loadingStandings}
            error={standingsError}
            theme={theme}
            transitionStyle={TRANSITION_STYLE}
          />
        )}

        {activeViewTab === VIEW_TAB_PLAYOFFS && (
          <NBAPlayoffBracket
            dark={dark}
            theme={theme}
            transitionStyle={TRANSITION_STYLE}
            standings={conferenceStandings}
            loading={loadingStandings}
            error={standingsError}
          />
        )}
      </div>
    </div>
  );
}
