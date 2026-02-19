import { useEffect, useMemo, useState } from "react";

import { fetchGameDetails, fetchScoreboardGames } from "./api/espn";
import { GameSelector } from "./components/GameSelector";
import { Header } from "./components/Header";
import { PlayerStatsTable } from "./components/PlayerStatsTable";
import { QuarterBreakdown } from "./components/QuarterBreakdown";
import { TeamTabs } from "./components/TeamTabs";
import { getAccent } from "./data/constants";
import { GAMES } from "./data/games";
import { COL_KEY, sortPlayers } from "./stats";
import { mkTheme, TRANSITION_STYLE } from "./theme";
import type {
  Game,
  SortDirection,
  SortableStatKey,
  StatColumn,
  TeamCode,
} from "./types";

export function BoxScoreDashboard() {
  const [games, setGames] = useState<Game[]>(GAMES);
  const [selectedGameId, setSelectedGameId] = useState<string>(GAMES[0]?.id ?? "");
  const [activeTeam, setActiveTeam] = useState<TeamCode>(GAMES[0]?.home ?? "LAL");
  const [sortCol, setSortCol] = useState<SortableStatKey>("pts");
  const [sortDir, setSortDir] = useState<SortDirection>(-1);
  const [animKey, setAnimKey] = useState(0);
  const [dark, setDark] = useState(true);
  const [loadingGames, setLoadingGames] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const theme = useMemo(() => mkTheme(dark), [dark]);

  const game = useMemo(() => {
    return games.find((item) => item.id === selectedGameId) ?? games[0] ?? null;
  }, [games, selectedGameId]);

  useEffect(() => {
    let cancelled = false;

    const loadScoreboard = async () => {
      setLoadingGames(true);

      try {
        const apiGames = await fetchScoreboardGames(7);
        if (cancelled || apiGames.length === 0) {
          return;
        }

        setGames(apiGames);
        setSelectedGameId(apiGames[0].id);
        setActiveTeam(apiGames[0].home);
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
  }, []);

  const hasBoxscoreData = useMemo(() => {
    if (!game) {
      return false;
    }

    return (
      (game.players[game.home]?.length ?? 0) > 0 ||
      (game.players[game.away]?.length ?? 0) > 0
    );
  }, [game]);

  useEffect(() => {
    if (!game || hasBoxscoreData) {
      return;
    }

    let cancelled = false;

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

            return {
              ...existingGame,
              score: details.score,
              periods: details.periods,
              players: {
                ...existingGame.players,
                ...details.players,
              },
              teamLogos: {
                ...existingGame.teamLogos,
                ...details.teamLogos,
              },
              teamColors: {
                ...existingGame.teamColors,
                ...details.teamColors,
              },
              statusText: details.statusText ?? existingGame.statusText,
            };
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
        }
      }
    };

    void loadDetails();

    return () => {
      cancelled = true;
    };
  }, [game, hasBoxscoreData]);

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

  if (!game) {
    return null;
  }

  const accent = getAccent(activeTeam, dark, game.teamColors?.[activeTeam]);
  const homeScore = game.score[game.home] ?? 0;
  const awayScore = game.score[game.away] ?? 0;
  const winTeam = homeScore > awayScore ? game.home : game.away;

  const handleGameSelect = (selected: Game) => {
    setSelectedGameId(selected.id);
    setActiveTeam(selected.home);
    setSortCol("pts");
    setSortDir(-1);
    setAnimKey((key) => key + 1);
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

  const statusMessage = loadingGames
    ? "Loading live NBA games..."
    : loadingDetails
      ? "Loading live box score..."
      : apiError;

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

      <GameSelector
        games={games}
        selectedGameId={game.id}
        dark={dark}
        theme={theme}
        transitionStyle={TRANSITION_STYLE}
        onSelectGame={handleGameSelect}
      />

      <div style={{ padding: "0 28px 40px" }}>
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
      </div>
    </div>
  );
}
