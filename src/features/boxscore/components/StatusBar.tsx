import { useEffect, useState } from "react";

import styles from "./StatusBar.module.css";

interface StatusBarProps {
  usingSampleData: boolean;
  refreshFailed: boolean;
  lastUpdatedAt: number | null;
  live: boolean;
  onRetry: () => void;
}

const TICK_MS = 15_000;

export function StatusBar({
  usingSampleData,
  refreshFailed,
  lastUpdatedAt,
  live,
  onRetry,
}: StatusBarProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (lastUpdatedAt === null) {
      return;
    }

    const intervalId = window.setInterval(() => setNow(Date.now()), TICK_MS);
    return () => window.clearInterval(intervalId);
  }, [lastUpdatedAt]);

  if (usingSampleData) {
    return (
      <div className={styles.banner} role="status">
        <span>
          <strong>Live scores unavailable.</strong> Showing sample games until ESPN responds.
        </span>
        <button onClick={onRetry}>Retry</button>
      </div>
    );
  }

  if (lastUpdatedAt === null || (!live && !refreshFailed)) {
    return null;
  }

  const ago = formatAgo(Math.max(now, lastUpdatedAt) - lastUpdatedAt);

  return (
    <div className={styles.strip} role="status" data-warn={refreshFailed || undefined}>
      {refreshFailed ? (
        <span>Couldn't refresh scores · showing data from {ago}</span>
      ) : (
        <>
          <span className="game-live-indicator">
            <span className="game-live-dot" />
            Live
          </span>
          <span>Scores update automatically · updated {ago}</span>
        </>
      )}
    </div>
  );
}

function formatAgo(elapsedMs: number): string {
  const seconds = Math.max(0, Math.round(elapsedMs / 1000));
  if (seconds < 30) {
    return "just now";
  }

  const minutes = Math.round(seconds / 60);
  if (minutes < 1) {
    return `${seconds}s ago`;
  }

  return minutes === 1 ? "1 min ago" : `${minutes} min ago`;
}
