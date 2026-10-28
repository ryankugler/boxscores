import { useCallback, useEffect, useState } from "react";

export type View = "boxscores" | "leaderboard" | "standings" | "playoffs" | "players";

export interface Route {
  view: View;
  gameId?: string;
  playerId?: string;
}

const VIEW_PATHS: Record<Exclude<View, "boxscores">, string> = {
  players: "/players",
  leaderboard: "/leaderboard",
  standings: "/standings",
  playoffs: "/playoffs",
};

export function parseRoute(pathname: string): Route {
  const path = pathname.replace(/\/+$/, "") || "/";
  const gameMatch = path.match(/^\/game\/([^/]+)$/);

  if (gameMatch) {
    return { view: "boxscores", gameId: decodeURIComponent(gameMatch[1]) };
  }

  const playerMatch = path.match(/^\/players\/([^/]+)$/);
  if (playerMatch) {
    return { view: "players", playerId: decodeURIComponent(playerMatch[1]) };
  }

  const view = (Object.keys(VIEW_PATHS) as Array<keyof typeof VIEW_PATHS>).find(
    (key) => VIEW_PATHS[key] === path,
  );

  return { view: view ?? "boxscores" };
}

export function routeToPath(route: Route): string {
  if (route.view === "boxscores") {
    return route.gameId ? `/game/${encodeURIComponent(route.gameId)}` : "/";
  }

  if (route.view === "players" && route.playerId) {
    return `/players/${encodeURIComponent(route.playerId)}`;
  }

  return VIEW_PATHS[route.view];
}

export function useRoute() {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.pathname));

  useEffect(() => {
    const handlePopState = () => setRoute(parseRoute(window.location.pathname));
    window.addEventListener("popstate", handlePopState);

    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // `replace` is for URL syncs that shouldn't add a history entry,
  // like reflecting the auto-selected game on first load.
  const navigate = useCallback((next: Route, options?: { replace?: boolean }) => {
    const path = routeToPath(next);
    if (path !== window.location.pathname) {
      if (options?.replace) {
        window.history.replaceState(null, "", path);
      } else {
        window.history.pushState(null, "", path);
        window.scrollTo({ top: 0 });
      }
    }
    setRoute(next);
  }, []);

  return { route, navigate };
}
