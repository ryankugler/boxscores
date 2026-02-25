import type { ConferenceStandingRow, ConferenceStandings } from "../boxscore/types";

import type { BracketByConference, BracketTeam, ConferenceBracket, ConferenceKey } from "./types";

const WIN_PCT_TIE_EPSILON = 0.0005;
const MAX_SEEDED_TEAMS = 10;

const CONFERENCE_META: Record<ConferenceKey, { label: string }> = {
  EAST: { label: "Eastern Conference" },
  WEST: { label: "Western Conference" },
};

export function buildBracketByConference(standings: ConferenceStandings): BracketByConference {
  return {
    EAST: buildConferenceBracket("EAST", standings.eastern),
    WEST: buildConferenceBracket("WEST", standings.western),
  };
}

function buildConferenceBracket(
  conference: ConferenceKey,
  sourceRows: ConferenceStandingRow[],
): ConferenceBracket {
  const sortedRows = sortConferenceRows(sourceRows);
  const seededRows = sortedRows.slice(0, MAX_SEEDED_TEAMS);
  const seededTeams = seededRows.map((row, index) => toBracketTeam(row, index + 1));

  const teamBySeed = new Map<number, BracketTeam>();
  seededTeams.forEach((team) => {
    teamBySeed.set(team.seed, team);
  });

  const getSeedTeam = (seed: number): BracketTeam => {
    return teamBySeed.get(seed) ?? createPlaceholderTeam(seed);
  };

  const seed1 = getSeedTeam(1);
  const seed2 = getSeedTeam(2);
  const seed3 = getSeedTeam(3);
  const seed4 = getSeedTeam(4);
  const seed5 = getSeedTeam(5);
  const seed6 = getSeedTeam(6);
  const seed7 = getSeedTeam(7);
  const seed8 = getSeedTeam(8);
  const seed9 = getSeedTeam(9);
  const seed10 = getSeedTeam(10);

  const notes = [
    "Seeds are generated from live conference standings.",
    "Tie-breakers use API conference rank when present, then win percentage and wins.",
    ...buildTieNotes(seededRows),
  ];

  return {
    conf: CONFERENCE_META[conference].label,
    round1: [
      { high: seed1, low: seed8 },
      { high: seed4, low: seed5 },
      { high: seed3, low: seed6 },
      { high: seed2, low: seed7 },
    ],
    playIn: [
      {
        label: "Game 1",
        note: "Winner secures the 7 seed",
        teams: [seed7, seed8],
      },
      {
        label: "Game 2",
        note: "Winner advances to Game 3",
        teams: [seed9, seed10],
      },
      {
        label: "Game 3 (Projected)",
        note: "Winner secures the 8 seed",
        teams: [seed8, seed9],
        isProjected: true,
      },
    ],
    notes,
  };
}

function sortConferenceRows(rows: ConferenceStandingRow[]): ConferenceStandingRow[] {
  const prepared = rows.map((row, index) => {
    const rank = row.conferenceRank ?? row.playoffSeed;
    const winPctValue = resolveWinPct(row);
    const gamesBackValue = parseGamesBack(row.gamesBack);

    return {
      row,
      index,
      rank: typeof rank === "number" && rank > 0 ? rank : undefined,
      winPctValue,
      gamesBackValue,
    };
  });

  prepared.sort((a, b) => {
    if (a.rank !== undefined && b.rank !== undefined && a.rank !== b.rank) {
      return a.rank - b.rank;
    }

    if (Math.abs(a.winPctValue - b.winPctValue) > WIN_PCT_TIE_EPSILON) {
      return b.winPctValue - a.winPctValue;
    }

    if (a.row.wins !== b.row.wins) {
      return b.row.wins - a.row.wins;
    }

    if (a.row.losses !== b.row.losses) {
      return a.row.losses - b.row.losses;
    }

    if (a.gamesBackValue !== b.gamesBackValue) {
      return a.gamesBackValue - b.gamesBackValue;
    }

    if (a.rank !== undefined && b.rank === undefined) {
      return -1;
    }

    if (a.rank === undefined && b.rank !== undefined) {
      return 1;
    }

    return a.index - b.index;
  });

  return prepared.map((entry) => entry.row);
}

function resolveWinPct(row: ConferenceStandingRow): number {
  const parsed = Number.parseFloat(row.winPct);
  if (Number.isFinite(parsed)) {
    return parsed;
  }

  const gamesPlayed = row.wins + row.losses;
  if (gamesPlayed <= 0) {
    return 0;
  }

  return row.wins / gamesPlayed;
}

function parseGamesBack(value: string): number {
  const normalized = value.trim().toUpperCase();
  if (normalized === "E" || normalized === "-" || normalized.length === 0) {
    return 0;
  }

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
}

function toBracketTeam(row: ConferenceStandingRow, seed: number): BracketTeam {
  const winPct = resolveWinPct(row);

  return {
    team: row.team,
    teamName: row.teamName,
    seed,
    wins: row.wins,
    losses: row.losses,
    winPct,
    winPctLabel: formatWinPct(winPct),
    logo: row.logo,
    playIn: seed >= 7 && seed <= 10,
  };
}

function createPlaceholderTeam(seed: number): BracketTeam {
  return {
    team: `TBD${seed}`,
    teamName: "TBD",
    seed,
    wins: 0,
    losses: 0,
    winPct: 0,
    winPctLabel: "-",
    playIn: seed >= 7 && seed <= 10,
  };
}

function buildTieNotes(rows: ConferenceStandingRow[]): string[] {
  if (rows.length === 0) {
    return ["No standings data returned for this conference."];
  }

  const notes: string[] = [];
  let index = 0;

  while (index < rows.length) {
    const start = index;
    index += 1;

    while (
      index < rows.length &&
      areRecordsTied(rows[start], rows[index])
    ) {
      index += 1;
    }

    const tieSize = index - start;
    if (tieSize < 2) {
      continue;
    }

    const tiedTeams = rows
      .slice(start, index)
      .map((row) => String(row.team))
      .join(", ");

    const record = `${rows[start].wins}-${rows[start].losses}`;

    notes.push(`Tie at ${record} between ${tiedTeams}; order follows tie-break rules.`);
  }

  if (notes.length === 0) {
    notes.push("No tied records in the current top 10 seeds.");
  }

  return notes;
}

function areRecordsTied(a: ConferenceStandingRow, b: ConferenceStandingRow): boolean {
  if (a.wins === b.wins && a.losses === b.losses) {
    return true;
  }

  return Math.abs(resolveWinPct(a) - resolveWinPct(b)) <= WIN_PCT_TIE_EPSILON;
}

function formatWinPct(value: number): string {
  const normalized = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
  return normalized.toFixed(3).replace(/^0/, "");
}
