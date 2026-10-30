import { useEffect, useState } from "react";

import { fetchPlayerGameLog, fetchPlayerProfile } from "./api";
import type { PlayerGameLog, PlayerProfile } from "./types";

interface PlayerData {
  playerId: string;
  profile: PlayerProfile | null;
  gameLog: PlayerGameLog | null;
  error: string | null;
}

export interface PlayerDataState {
  loading: boolean;
  profile: PlayerProfile | null;
  gameLog: PlayerGameLog | null;
  error: string | null;
}

// Loads a player's profile and season game log. The game log is optional:
// a player without one still renders from the profile.
export function usePlayerData(playerId: string | undefined): PlayerDataState {
  const [data, setData] = useState<PlayerData | null>(null);

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
        setData({
          playerId,
          profile,
          gameLog: gameLogResult.status === "fulfilled" ? gameLogResult.value : null,
          error: profile ? null : "We couldn't load this player. Check the link or try another search.",
        });
      },
    );

    return () => {
      cancelled = true;
    };
  }, [playerId]);

  const loading = Boolean(playerId) && data?.playerId !== playerId;
  if (loading || !data) {
    return { loading, profile: null, gameLog: null, error: null };
  }

  return { loading: false, profile: data.profile, gameLog: data.gameLog, error: data.error };
}
