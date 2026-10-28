import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

import { PlayerAvatar } from "../../boxscore/components/PlayerAvatar";
import { searchPlayers } from "../api";
import type { PlayerSearchResult } from "../types";
import styles from "./PlayerSearch.module.css";

interface PlayerSearchProps {
  autoFocus?: boolean;
  size?: "large" | "compact";
  onSelect: (player: PlayerSearchResult) => void;
}

const DEBOUNCE_MS = 220;

export function PlayerSearch({ autoFocus, size = "compact", onSelect }: PlayerSearchProps) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlayerSearchResult[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [activeIndex, setActiveIndex] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      setStatus("loading");
      searchPlayers(trimmed, controller.signal)
        .then((found) => {
          setResults(found);
          setActiveIndex(0);
          setStatus("done");
        })
        .catch((error: unknown) => {
          if (!(error instanceof DOMException && error.name === "AbortError")) {
            setStatus("error");
          }
        });
    }, DEBOUNCE_MS);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [query]);

  const hasQuery = query.trim().length >= 2;
  const visibleResults = hasQuery ? results : [];
  const showList = open && hasQuery;

  const choose = (player: PlayerSearchResult) => {
    onSelect(player);
    setQuery("");
    setResults([]);
    setStatus("idle");
    setOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" && visibleResults.length > 0) {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => (index + 1) % visibleResults.length);
    } else if (event.key === "ArrowUp" && visibleResults.length > 0) {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + visibleResults.length) % visibleResults.length);
    } else if (event.key === "Enter" && visibleResults[activeIndex]) {
      event.preventDefault();
      choose(visibleResults[activeIndex]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className={styles.search} data-size={size}>
      <div className={styles.field}>
        <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.icon}>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          ref={inputRef}
          type="search"
          value={query}
          placeholder="Search NBA players"
          aria-label="Search NBA players"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            showList && visibleResults[activeIndex] ? `${listId}-${activeIndex}` : undefined
          }
          autoComplete="off"
          spellCheck={false}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onKeyDown={handleKeyDown}
        />
        {status === "loading" && <span className={styles.spinner} aria-hidden="true" />}
      </div>

      {showList && (
        <ul id={listId} role="listbox" className={styles.results}>
          {visibleResults.map((player, index) => (
            <li
              key={player.id}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              className={styles.result}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseDown={(event) => {
                event.preventDefault();
                choose(player);
              }}
            >
              <PlayerAvatar name={player.name} photoUrl={player.headshot} size={36} />
              <span className={styles.resultName}>{player.name}</span>
              <span className={styles.resultMeta}>
                {[player.team, player.position, player.jersey ? `#${player.jersey}` : null]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </li>
          ))}
          {status === "done" && visibleResults.length === 0 && (
            <li className={styles.empty}>No NBA players match “{query.trim()}”.</li>
          )}
          {status === "error" && (
            <li className={styles.empty}>Search is unavailable right now. Try again shortly.</li>
          )}
        </ul>
      )}
    </div>
  );
}
