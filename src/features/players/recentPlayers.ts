import type { PlayerSearchResult } from "./types";

const STORAGE_KEY = "whowon-recent-players";
const MAX_RECENT = 8;

// Recently viewed players are a per-browser convenience; storage can be
// unavailable (private mode, blocked site data), so every access is guarded.
export function readRecentPlayers(): PlayerSearchResult[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter(
          (item): item is PlayerSearchResult =>
            typeof item?.id === "string" && typeof item?.name === "string",
        )
      : [];
  } catch {
    return [];
  }
}

export function rememberPlayer(player: PlayerSearchResult): PlayerSearchResult[] {
  const next = [player, ...readRecentPlayers().filter((item) => item.id !== player.id)].slice(
    0,
    MAX_RECENT,
  );

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Not persisted; the list just won't survive a reload.
  }

  return next;
}
