import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

import { getTeamPalette, readableTextOn } from "../boxscore/color";
import { PlayerAvatar } from "../boxscore/components/PlayerAvatar";
import { TeamLogo } from "../boxscore/components/TeamLogo";
import { fetchSeasonLeaders } from "./api";
import styles from "./SeasonLeaders.module.css";
import type { LeaderStatKey, SeasonLeaderRow, SeasonLeaders as SeasonLeadersData } from "./types";

interface SeasonLeadersProps {
  onOpenPlayer: (playerId: string) => void;
  onCompare: (playerId: string, compareId: string) => void;
}

interface Column {
  key: LeaderStatKey;
  label: string;
  title: string;
  digits: number;
  // Shooting percentages only rank players with enough makes, using the
  // NBA's season minimums (300 FGM, 82 3PM, 125 FTM) scaled to per game.
  qualifies?: (stats: SeasonLeaderRow["stats"]) => boolean;
}

const COLUMNS: Column[] = [
  { key: "gp", label: "GP", title: "Games played", digits: 0 },
  { key: "min", label: "MIN", title: "Minutes per game", digits: 1 },
  { key: "pts", label: "PTS", title: "Points per game", digits: 1 },
  { key: "reb", label: "REB", title: "Rebounds per game", digits: 1 },
  { key: "ast", label: "AST", title: "Assists per game", digits: 1 },
  { key: "stl", label: "STL", title: "Steals per game", digits: 1 },
  { key: "blk", label: "BLK", title: "Blocks per game", digits: 1 },
  { key: "p3m", label: "3PM", title: "3-pointers made per game", digits: 1 },
  { key: "fgPct", label: "FG%", title: "Field goal percentage", digits: 1, qualifies: (stats) => stats.fgm >= 300 / 82 },
  { key: "p3Pct", label: "3P%", title: "3-point percentage", digits: 1, qualifies: (stats) => stats.p3m >= 82 / 82 },
  { key: "ftPct", label: "FT%", title: "Free throw percentage", digits: 1, qualifies: (stats) => stats.ftm >= 125 / 82 },
  { key: "dd2", label: "DD2", title: "Double-doubles", digits: 0 },
];

const FEATURED: Array<{ key: LeaderStatKey; title: string }> = [
  { key: "pts", title: "Points" },
  { key: "reb", title: "Rebounds" },
  { key: "ast", title: "Assists" },
  { key: "stl", title: "Steals" },
  { key: "blk", title: "Blocks" },
  { key: "p3m", title: "3-Pointers" },
];

const POSITIONS = ["All", "G", "F", "C"] as const;
type PositionFilter = (typeof POSITIONS)[number];

const PAGE_SIZE = 25;
const FEATURED_COUNT = 5;

function columnFor(key: LeaderStatKey): Column {
  return COLUMNS.find((column) => column.key === key) ?? COLUMNS[2];
}

function formatStat(column: Column, value: number): string {
  return value.toFixed(column.digits);
}

// Sorted, qualified rows with competition ranking (ties share a rank).
function rankRows(rows: SeasonLeaderRow[], column: Column) {
  const sorted = rows
    .filter((row) => !column.qualifies || column.qualifies(row.stats))
    .sort((a, b) => b.stats[column.key] - a.stats[column.key] || b.stats.gp - a.stats.gp);

  let previous = "";
  let rank = 0;
  return sorted.map((row, index) => {
    const display = formatStat(column, row.stats[column.key]);
    if (display !== previous) {
      rank = index + 1;
      previous = display;
    }
    return { row, rank };
  });
}

export function SeasonLeaders({ onOpenPlayer, onCompare }: SeasonLeadersProps) {
  const [data, setData] = useState<SeasonLeadersData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<LeaderStatKey>("pts");
  const [position, setPosition] = useState<PositionFilter>("All");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const tableRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchSeasonLeaders()
      .then((leaders) => {
        if (!cancelled) {
          setData(leaders);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Season leaders are unavailable right now.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const sortColumn = columnFor(sortKey);
  const filteredRows = useMemo(() => {
    const rows = data?.rows ?? [];
    return position === "All" ? rows : rows.filter((row) => row.position?.includes(position));
  }, [data, position]);
  const ranked = useMemo(() => rankRows(filteredRows, sortColumn), [filteredRows, sortColumn]);
  const rowsById = useMemo(() => new Map(data?.rows.map((row) => [row.id, row])), [data]);
  const selected = selectedIds.map((id) => rowsById.get(id)).filter(Boolean) as SeasonLeaderRow[];

  const sortBy = (key: LeaderStatKey, scroll = false) => {
    setSortKey(key);
    setVisibleCount(PAGE_SIZE);
    if (scroll) {
      tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Keeps at most two picks; a third replaces the older one.
  const toggleSelected = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id].slice(-2),
    );
  };

  if (error) {
    return <div className={styles.message}>{error}</div>;
  }

  if (!data) {
    return (
      <div aria-hidden="true">
        <div className={styles.featuredGrid}>
          {FEATURED.map((stat) => (
            <span key={stat.key} className="skeleton" style={{ height: 300, borderRadius: 10 }} />
          ))}
        </div>
        <span className="skeleton" style={{ height: 480, marginTop: 24, borderRadius: 10 }} />
      </div>
    );
  }

  return (
    <div className={styles.leaders}>
      <p className={styles.caption}>
        {[data.seasonLabel, data.seasonType].filter(Boolean).join(" ")} · Per-game averages ·{" "}
        {data.rows.length} qualified players
      </p>

      <div className={styles.featuredGrid}>
        {FEATURED.map((stat) => (
          <FeaturedCard
            key={stat.key}
            title={stat.title}
            column={columnFor(stat.key)}
            entries={rankRows(data.rows, columnFor(stat.key)).slice(0, FEATURED_COUNT)}
            onOpenPlayer={onOpenPlayer}
            onShowAll={() => sortBy(stat.key, true)}
          />
        ))}
      </div>

      <section ref={tableRef} className={styles.panel} aria-label="All season leaders">
        <div className={styles.panelTitle}>
          <h2>{sortColumn.title}</h2>
          <div className={styles.positions} role="group" aria-label="Filter by position">
            {POSITIONS.map((option) => (
              <button
                key={option}
                aria-pressed={position === option}
                onClick={() => {
                  setPosition(option);
                  setVisibleCount(PAGE_SIZE);
                }}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.scroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.pickHead}>
                  <span className={styles.visuallyHidden}>Compare</span>
                </th>
                <th className={styles.rankHead}>#</th>
                <th className={styles.playerHead}>Player</th>
                <th className={styles.focusHead} aria-hidden="true">
                  {sortColumn.label}
                </th>
                {COLUMNS.map((column) => (
                  <th
                    key={column.key}
                    className={styles.statHead}
                    aria-sort={column.key === sortKey ? "descending" : undefined}
                  >
                    <button
                      title={column.title}
                      data-active={column.key === sortKey || undefined}
                      onClick={() => sortBy(column.key)}
                    >
                      {column.label}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ranked.slice(0, visibleCount).map(({ row, rank }) => {
                const isSelected = selectedIds.includes(row.id);
                return (
                  <tr
                    key={row.id}
                    data-selected={isSelected || undefined}
                    style={{ "--team-color": getTeamPalette(row.team).primary } as CSSProperties}
                  >
                    <td className={styles.pickCell}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelected(row.id)}
                        aria-label={`Select ${row.name} to compare`}
                      />
                    </td>
                    <td className={`${styles.rankCell} tabular`}>{rank}</td>
                    <td className={styles.playerCell}>
                      <div className={styles.player}>
                        <PlayerAvatar name={row.name} photoUrl={row.headshot} size={32} />
                        <div className={styles.playerText}>
                          <button className={styles.playerName} onClick={() => onOpenPlayer(row.id)}>
                            {row.name}
                          </button>
                          <span className={styles.playerMeta}>
                            <TeamLogo abbr={row.team} logoUrl={row.teamLogo} size={14} />
                            {row.team}
                            {row.position && ` · ${row.position}`}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className={`${styles.focusCell} tabular`} aria-hidden="true">
                      {formatStat(sortColumn, row.stats[sortKey])}
                    </td>
                    {COLUMNS.map((column) => (
                      <td
                        key={column.key}
                        className="tabular"
                        data-active={column.key === sortKey || undefined}
                      >
                        {column.qualifies && !column.qualifies(row.stats) ? (
                          <span className={styles.unqualified}>{formatStat(column, row.stats[column.key])}</span>
                        ) : (
                          formatStat(column, row.stats[column.key])
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {ranked.length === 0 && <div className={styles.emptyRow}>No qualified players yet.</div>}

        {ranked.length > visibleCount && (
          <button className={styles.more} onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>
            Show more · {ranked.length - visibleCount} left
          </button>
        )}
      </section>

      <p className={styles.footnote}>
        Qualified players per ESPN. Shooting percentages also require per-game minimums of 3.7 FGM, 1.0
        3PM or 1.5 FTM (the NBA's season minimums, scaled per game); dimmed values fall short. Tick two
        players to compare them head to head.
      </p>

      {selected.length > 0 && (
        <div className={styles.compareBar} role="region" aria-label="Compare players">
          <div className={styles.comparePicks}>
            {selected.map((row) => (
              <span key={row.id} className={styles.comparePick}>
                <PlayerAvatar name={row.name} photoUrl={row.headshot} size={28} />
                {row.shortName}
              </span>
            ))}
            {selected.length === 1 && <span className={styles.compareHint}>Pick one more</span>}
          </div>
          <button className={styles.clearButton} onClick={() => setSelectedIds([])}>
            Clear
          </button>
          <button
            className={styles.compareButton}
            disabled={selected.length < 2}
            onClick={() => onCompare(selected[0].id, selected[1].id)}
          >
            Compare
          </button>
        </div>
      )}
    </div>
  );
}

interface FeaturedCardProps {
  title: string;
  column: Column;
  entries: Array<{ row: SeasonLeaderRow; rank: number }>;
  onOpenPlayer: (playerId: string) => void;
  onShowAll: () => void;
}

function FeaturedCard({ title, column, entries, onOpenPlayer, onShowAll }: FeaturedCardProps) {
  const [leader, ...rest] = entries;
  if (!leader) {
    return null;
  }

  const palette = getTeamPalette(leader.row.team);

  return (
    <article className={styles.featured}>
      <button className={styles.featuredTitle} onClick={onShowAll}>
        <span>{title}</span>
        <small>Full list →</small>
      </button>

      <div
        className={styles.featuredLeader}
        style={
          {
            "--team-color": palette.primary,
            "--team-alt": palette.alternate,
            "--team-ink": readableTextOn(palette.primary),
          } as CSSProperties
        }
      >
        <PlayerAvatar name={leader.row.name} photoUrl={leader.row.headshot} size={64} />
        <div className={styles.leaderText}>
          <span className={styles.leaderTeam}>
            <TeamLogo abbr={leader.row.team} logoUrl={leader.row.teamLogo} size={16} />
            {leader.row.team}
          </span>
          <button className={styles.leaderName} onClick={() => onOpenPlayer(leader.row.id)}>
            {leader.row.name}
          </button>
        </div>
        <span className={`${styles.leaderValue} tabular`}>
          {formatStat(column, leader.row.stats[column.key])}
          <small>{column.label}</small>
        </span>
      </div>

      <ol className={styles.featuredList}>
        {rest.map(({ row, rank }) => (
          <li key={row.id}>
            <span className={`${styles.featuredRank} tabular`}>{rank}</span>
            <TeamLogo abbr={row.team} logoUrl={row.teamLogo} size={18} />
            <button className={styles.featuredName} onClick={() => onOpenPlayer(row.id)}>
              {row.shortName}
            </button>
            <span className={`${styles.featuredValue} tabular`}>
              {formatStat(column, row.stats[column.key])}
            </span>
          </li>
        ))}
      </ol>
    </article>
  );
}
