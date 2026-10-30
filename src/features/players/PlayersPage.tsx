import { useEffect, useState, type CSSProperties } from "react";

import { getReadableAccent, getTeamPalette, readableTextOn } from "../boxscore/color";
import { PlayerAvatar } from "../boxscore/components/PlayerAvatar";
import { GameLogTable } from "./components/GameLogTable";
import { PlayerComparison } from "./components/PlayerComparison";
import { PlayerHero } from "./components/PlayerHero";
import { PlayerSearch } from "./components/PlayerSearch";
import { PointsChart } from "./components/PointsChart";
import styles from "./PlayersPage.module.css";
import { readRecentPlayers, rememberPlayer } from "./recentPlayers";
import type { PlayerProfile, PlayerSearchResult } from "./types";
import { usePlayerData } from "./usePlayerData";

interface PlayersPageProps {
  playerId?: string;
  compareId?: string;
  dark: boolean;
  onSelectPlayer: (playerId: string) => void;
  onCompare: (playerId: string, compareId: string | undefined) => void;
  onOpenGame: (eventId: string) => void;
}

function toRecentPlayer(profile: PlayerProfile): PlayerSearchResult {
  return {
    id: profile.id,
    name: profile.name,
    team: profile.team,
    position: profile.position,
    jersey: profile.jersey,
    headshot: profile.headshot,
  };
}

export function PlayersPage({
  playerId,
  compareId,
  dark,
  onSelectPlayer,
  onCompare,
  onOpenGame,
}: PlayersPageProps) {
  const player = usePlayerData(playerId);
  const rival = usePlayerData(compareId);
  const [seasonTypeKey, setSeasonTypeKey] = useState<string | null>(null);
  const [comparing, setComparing] = useState(false);

  const profile = player.profile;
  const rivalProfile = rival.profile;

  // A new player starts on their first season type with the compare picker closed.
  const [shownPlayerId, setShownPlayerId] = useState(playerId);
  if (shownPlayerId !== playerId) {
    setShownPlayerId(playerId);
    setSeasonTypeKey(null);
    setComparing(false);
  }

  useEffect(() => {
    if (profile) {
      rememberPlayer(toRecentPlayer(profile));
    }
  }, [profile]);

  useEffect(() => {
    if (rivalProfile) {
      rememberPlayer(toRecentPlayer(rivalProfile));
    }
  }, [rivalProfile]);

  useEffect(() => {
    if (!playerId) {
      document.title = "Players · whowon";
    } else if (compareId && profile && rivalProfile) {
      document.title = `${profile.name} vs ${rivalProfile.name} · whowon`;
    } else if (!compareId && profile) {
      document.title = `${profile.name} · whowon`;
    }
  }, [playerId, compareId, profile, rivalProfile]);

  const search = (
    <PlayerSearch
      size={playerId ? "compact" : "large"}
      autoFocus={!playerId}
      onSelect={(player) => onSelectPlayer(player.id)}
    />
  );

  if (!playerId) {
    const recentPlayers = readRecentPlayers();

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

  if (compareId) {
    const loadingPair = player.loading || rival.loading;
    const pairError = player.error ?? rival.error;

    return (
      <div className={styles.page}>
        <div className={styles.compareToolbar}>
          <div className={styles.compareSlot}>
            <span>Player 1</span>
            <PlayerSearch onSelect={(next) => onCompare(next.id, compareId)} />
          </div>
          <button
            className={styles.swapButton}
            onClick={() => onCompare(compareId, playerId)}
            aria-label="Swap players"
            title="Swap players"
          >
            ⇄
          </button>
          <div className={styles.compareSlot}>
            <span>Player 2</span>
            <PlayerSearch onSelect={(next) => onCompare(playerId, next.id)} />
          </div>
          <button
            className={styles.exitCompare}
            onClick={() => onCompare(playerId, undefined)}
            aria-label="Exit compare"
            title="Exit compare"
          >
            <span className={styles.exitLong}>Exit compare</span>
            <span className={styles.exitShort} aria-hidden="true">
              ✕
            </span>
          </button>
        </div>

        {loadingPair && (
          <div aria-hidden="true">
            <span className="skeleton" style={{ height: 150, borderRadius: 12 }} />
            <span className="skeleton" style={{ height: 460, marginTop: 20, borderRadius: 10 }} />
          </div>
        )}

        {!loadingPair && pairError && <div className={styles.message}>{pairError}</div>}

        {profile && rivalProfile && (
          <PlayerComparison
            left={{ profile, gameLog: player.gameLog }}
            right={{ profile: rivalProfile, gameLog: rival.gameLog }}
            dark={dark}
            onOpenPlayer={onSelectPlayer}
          />
        )}
      </div>
    );
  }

  const loading = player.loading;
  const gameLog = player.gameLog;
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
      <div className={styles.toolbarRow}>
        <div className={styles.toolbar}>{search}</div>
        {profile && (
          <div className={styles.compareEntry}>
            {comparing ? (
              <PlayerSearch
                autoFocus
                onSelect={(next) => {
                  setComparing(false);
                  onCompare(profile.id, next.id);
                }}
              />
            ) : (
              <button className={styles.compareButton} onClick={() => setComparing(true)}>
                Compare with…
              </button>
            )}
          </div>
        )}
      </div>

      {loading && (
        <div aria-hidden="true">
          <span className="skeleton" style={{ height: 230, borderRadius: 12 }} />
          <span className="skeleton" style={{ height: 210, marginTop: 20, borderRadius: 10 }} />
          <span className="skeleton" style={{ height: 420, marginTop: 20, borderRadius: 10 }} />
        </div>
      )}

      {!loading && player.error && <div className={styles.message}>{player.error}</div>}

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
