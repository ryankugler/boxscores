import { useEffect, useState, type CSSProperties } from "react";

import { getReadableAccent, getTeamPalette, readableTextOn } from "../boxscore/color";
import { PlayerAvatar } from "../boxscore/components/PlayerAvatar";
import { fetchPlayerGameLog, fetchPlayerProfile } from "./api";
import { GameLogTable } from "./components/GameLogTable";
import { PlayerHero } from "./components/PlayerHero";
import { PlayerSearch } from "./components/PlayerSearch";
import { PointsChart } from "./components/PointsChart";
import styles from "./PlayersPage.module.css";
import { readRecentPlayers, rememberPlayer } from "./recentPlayers";
import type { PlayerGameLog, PlayerProfile, PlayerSearchResult } from "./types";

interface PlayersPageProps {
  playerId?: string;
  dark: boolean;
  onSelectPlayer: (playerId: string) => void;
  onOpenGame: (eventId: string) => void;
}

interface PlayerData {
  playerId: string;
  profile: PlayerProfile | null;
  gameLog: PlayerGameLog | null;
  error: string | null;
}

export function PlayersPage({ playerId, dark, onSelectPlayer, onOpenGame }: PlayersPageProps) {
  const [data, setData] = useState<PlayerData | null>(null);
  const [recentPlayers, setRecentPlayers] = useState<PlayerSearchResult[]>(readRecentPlayers);
  const [seasonTypeKey, setSeasonTypeKey] = useState<string | null>(null);

  useEffect(() => {
    if (!playerId) {
      return;
    }

    let cancelled = false;

    Promise.allSettled([fetchPlayerProfile(playerId), fetchPlayerGameLog(playerId)]).then(
      ([profileResult, gameLogResult]) => {
        if (cancelled) {
          return;
        }

        const profile = profileResult.status === "fulfilled" ? profileResult.value : null;
        const gameLog = gameLogResult.status === "fulfilled" ? gameLogResult.value : null;

        setData({
          playerId,
          profile,
          gameLog,
          error: profile ? null : "We couldn't load this player. Check the link or try another search.",
        });
        setSeasonTypeKey(null);

        if (profile) {
          setRecentPlayers(
            rememberPlayer({
              id: profile.id,
              name: profile.name,
              team: profile.team,
              position: profile.position,
              jersey: profile.jersey,
              headshot: profile.headshot,
            }),
          );
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, [playerId]);

  useEffect(() => {
    if (data?.profile && data.playerId === playerId) {
      document.title = `${data.profile.name} · whowon`;
    } else if (!playerId) {
      document.title = "Players · whowon";
    }
  }, [data, playerId]);

  const search = (
    <PlayerSearch
      size={playerId ? "compact" : "large"}
      autoFocus={!playerId}
      onSelect={(player) => onSelectPlayer(player.id)}
    />
  );

  if (!playerId) {
    return (
      <div className={styles.page}>
        <section className={styles.landing}>
          <h1 className={styles.landingTitle}>Player Stats</h1>
          <p className={styles.landingText}>
            Search any NBA player for their season averages and game-by-game log.
          </p>
          {search}

          {recentPlayers.length > 0 && (
            <div className={styles.recent}>
              <h2>Recently viewed</h2>
              <div className={styles.recentList}>
                {recentPlayers.map((player) => (
                  <button
                    key={player.id}
                    className={styles.recentChip}
                    onClick={() => onSelectPlayer(player.id)}
                  >
                    <PlayerAvatar name={player.name} photoUrl={player.headshot} size={30} />
                    <span>{player.name}</span>
                    {player.team && <span className={styles.recentTeam}>{player.team}</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    );
  }

  const loading = data?.playerId !== playerId;
  const profile = loading ? null : data?.profile;
  const gameLog = loading ? null : data?.gameLog;
  const seasonTypes = gameLog?.seasonTypes ?? [];
  const activeSeasonType =
    seasonTypes.find((seasonType) => seasonType.key === seasonTypeKey) ?? seasonTypes[0];

  const palette = getTeamPalette(profile?.team ?? "", profile?.teamColors);
  const accent = getReadableAccent(palette, dark);
  const averagePoints = activeSeasonType?.averages
    ? Number.parseFloat(
        activeSeasonType.averages.values[gameLog?.labels.indexOf("PTS") ?? -1] ?? "",
      )
    : undefined;

  return (
    <div
      className={styles.page}
      style={
        {
          "--team-color": palette.primary,
          "--team-ink": readableTextOn(palette.primary),
          "--accent": accent,
        } as CSSProperties
      }
    >
      <div className={styles.toolbar}>{search}</div>

      {loading && (
        <div aria-hidden="true">
          <span className="skeleton" style={{ height: 230, borderRadius: 12 }} />
          <span className="skeleton" style={{ height: 210, marginTop: 20, borderRadius: 10 }} />
          <span className="skeleton" style={{ height: 420, marginTop: 20, borderRadius: 10 }} />
        </div>
      )}

      {!loading && data?.error && <div className={styles.message}>{data.error}</div>}

      {profile && (
        <>
          <PlayerHero profile={profile} />

          <div className={styles.sectionHead}>
            <h2>
              Game Log <span>{gameLog?.seasonLabel}</span>
            </h2>
            {seasonTypes.length > 1 && (
              <div className={styles.seasonTabs} role="tablist" aria-label="Season type">
                {seasonTypes.map((seasonType) => (
                  <button
                    key={seasonType.key}
                    role="tab"
                    aria-selected={seasonType.key === activeSeasonType?.key}
                    onClick={() => setSeasonTypeKey(seasonType.key)}
                  >
                    {seasonType.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {!activeSeasonType ? (
            <div className={styles.message}>
              {gameLog ? "No games played yet this season." : "The game log is unavailable right now."}
            </div>
          ) : (
            <>
              <SeasonSummary
                gamesPlayed={activeSeasonType.games.length}
                labels={gameLog?.labels ?? []}
                averages={activeSeasonType.averages?.values}
              />
              <PointsChart
                games={activeSeasonType.games}
                average={Number.isFinite(averagePoints) ? averagePoints : undefined}
                onOpenGame={onOpenGame}
              />
              <GameLogTable
                seasonType={activeSeasonType}
                labels={gameLog?.labels ?? []}
                onOpenGame={onOpenGame}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}

const SUMMARY_LABELS = ["MIN", "PTS", "REB", "AST", "FG%", "3P%", "FT%", "STL", "BLK", "TO"];

interface SeasonSummaryProps {
  gamesPlayed: number;
  labels: string[];
  averages?: string[];
}

function SeasonSummary({ gamesPlayed, labels, averages }: SeasonSummaryProps) {
  const tiles = [
    { label: "GP", value: String(gamesPlayed) },
    ...SUMMARY_LABELS.map((label) => ({
      label,
      value: averages?.[labels.indexOf(label)] ?? "-",
    })),
  ];

  return (
    <dl className={styles.summary} aria-label="Season averages">
      {tiles.map((tile) => (
        <div key={tile.label} data-emphasis={tile.label === "PTS" || undefined}>
          <dt>{tile.label}</dt>
          <dd className="tabular">{tile.value}</dd>
        </div>
      ))}
    </dl>
  );
}
