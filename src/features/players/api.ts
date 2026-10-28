import { normalizeTeamCode } from "../boxscore/data/constants";
import type {
  GameLogEntry,
  GameLogSeasonType,
  GameLogSummaryRow,
  PlayerGameLog,
  PlayerProfile,
  PlayerRankedStat,
  PlayerSearchResult,
} from "./types";

const ESPN_COMMON_API_BASE = "https://site.web.api.espn.com/apis/common/v3";
const ESPN_ATHLETE_API_BASE = `${ESPN_COMMON_API_BASE}/sports/basketball/nba/athletes`;
const ESPN_PLAYER_HEADSHOT_BASE = "https://a.espncdn.com/i/headshots/nba/players/full";

const MONTH_FORMATTER = new Intl.DateTimeFormat("en-US", { month: "long" });
const GAME_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "numeric",
  day: "numeric",
});

interface EspnSearchResponse {
  items?: EspnSearchItem[];
}

interface EspnSearchItem {
  id?: string;
  displayName?: string;
  type?: string;
  league?: string;
  jersey?: string;
  position?: { abbreviation?: string };
  headshot?: { href?: string };
  teamRelationships?: Array<{
    core?: { abbreviation?: string; displayName?: string };
  }>;
}

interface EspnAthleteResponse {
  athlete?: {
    id?: string;
    displayName?: string;
    firstName?: string;
    lastName?: string;
    jersey?: string;
    position?: { abbreviation?: string; displayName?: string };
    headshot?: { href?: string };
    team?: {
      abbreviation?: string;
      displayName?: string;
      color?: string;
      alternateColor?: string;
      logos?: Array<{ href?: string }>;
    };
    displayHeight?: string;
    displayWeight?: string;
    age?: number;
    displayBirthPlace?: string;
    college?: { name?: string };
    displayDraft?: string;
    displayExperience?: string;
    status?: { name?: string };
    statsSummary?: {
      displayName?: string;
      statistics?: Array<{
        name?: string;
        abbreviation?: string;
        shortDisplayName?: string;
        displayValue?: string;
        rankDisplayValue?: string;
      }>;
    };
  };
}

interface EspnGameLogResponse {
  filters?: Array<{
    name?: string;
    value?: string;
    options?: Array<{ value?: string; displayValue?: string }>;
  }>;
  labels?: string[];
  names?: string[];
  events?: Record<string, EspnGameLogEvent>;
  seasonTypes?: Array<{
    displayName?: string;
    categories?: Array<{
      type?: string;
      events?: Array<{ eventId?: string; stats?: string[] }>;
    }>;
    summary?: {
      stats?: Array<{ displayName?: string; type?: string; stats?: string[] }>;
    };
  }>;
}

interface EspnGameLogEvent {
  id?: string;
  atVs?: string;
  gameDate?: string;
  score?: string;
  gameResult?: string;
  opponent?: { abbreviation?: string; displayName?: string; logo?: string };
}

export async function searchPlayers(query: string, signal?: AbortSignal): Promise<PlayerSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  const params = new URLSearchParams({
    query: trimmed,
    limit: "10",
    type: "player",
    sport: "basketball",
    league: "nba",
  });
  const response = await fetch(`${ESPN_COMMON_API_BASE}/search?${params}`, { signal });
  if (!response.ok) {
    throw new Error(`Player search failed with status ${response.status}`);
  }

  const payload = (await response.json()) as EspnSearchResponse;

  return (payload.items ?? [])
    .filter((item) => item.id && item.displayName && item.league === "nba")
    .map((item) => {
      const team = item.teamRelationships?.[0]?.core;

      return {
        id: item.id as string,
        name: item.displayName as string,
        team: team?.abbreviation ? normalizeTeamCode(team.abbreviation) : undefined,
        teamName: team?.displayName,
        position: item.position?.abbreviation,
        jersey: item.jersey,
        headshot: item.headshot?.href,
      };
    });
}

export async function fetchPlayerProfile(playerId: string): Promise<PlayerProfile> {
  const response = await fetch(`${ESPN_ATHLETE_API_BASE}/${encodeURIComponent(playerId)}`);
  if (!response.ok) {
    throw new Error(`Player request failed with status ${response.status}`);
  }

  const athlete = ((await response.json()) as EspnAthleteResponse).athlete;
  if (!athlete?.id || !athlete.displayName) {
    throw new Error("Missing athlete in player response");
  }

  const team = athlete.team;
  const rankedStats: PlayerRankedStat[] = (athlete.statsSummary?.statistics ?? [])
    .filter((stat) => stat.name && stat.displayValue)
    .map((stat) => ({
      name: stat.name as string,
      label: stat.abbreviation ?? stat.shortDisplayName ?? (stat.name as string),
      value: stat.displayValue as string,
      rank: stat.rankDisplayValue,
    }));

  return {
    id: athlete.id,
    name: athlete.displayName,
    firstName: athlete.firstName,
    lastName: athlete.lastName,
    jersey: athlete.jersey,
    position: athlete.position?.abbreviation,
    positionName: athlete.position?.displayName,
    headshot: athlete.headshot?.href ?? `${ESPN_PLAYER_HEADSHOT_BASE}/${athlete.id}.png`,
    team: team?.abbreviation ? normalizeTeamCode(team.abbreviation) : undefined,
    teamName: team?.displayName,
    teamLogo: team?.logos?.[0]?.href,
    teamColors:
      team?.color || team?.alternateColor
        ? {
            light: toHex(team.color) ?? toHex(team.alternateColor) ?? "#e8401a",
            dark: toHex(team.alternateColor) ?? toHex(team.color) ?? "#e8401a",
          }
        : undefined,
    height: athlete.displayHeight,
    weight: athlete.displayWeight,
    age: athlete.age,
    birthPlace: athlete.displayBirthPlace,
    college: athlete.college?.name,
    draft: athlete.displayDraft,
    experience: athlete.displayExperience,
    status: athlete.status?.name,
    seasonLabel: athlete.statsSummary?.displayName,
    rankedStats,
  };
}

export async function fetchPlayerGameLog(playerId: string): Promise<PlayerGameLog> {
  const response = await fetch(`${ESPN_ATHLETE_API_BASE}/${encodeURIComponent(playerId)}/gamelog`);
  if (!response.ok) {
    throw new Error(`Game log request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as EspnGameLogResponse;
  const names = payload.names ?? [];
  const events = payload.events ?? {};
  const seasonFilter = payload.filters?.find((filter) => filter.name === "season");
  const seasonLabel =
    seasonFilter?.options?.find((option) => option.value === seasonFilter.value)?.displayValue ??
    "";

  const seasonTypes: GameLogSeasonType[] = (payload.seasonTypes ?? []).map((seasonType, index) => {
    const games = (seasonType.categories ?? [])
      .filter((category) => category.type === "event")
      .flatMap((category) => category.events ?? [])
      .map((row) => parseGameLogRow(row.eventId, row.stats ?? [], names, events))
      .filter((entry): entry is GameLogEntry => entry !== null)
      .sort((a, b) => Date.parse(b.date) - Date.parse(a.date));

    const summaryRow = (type: string): GameLogSummaryRow | undefined => {
      const match = seasonType.summary?.stats?.find((stat) => stat.type === type);
      return match?.stats ? { label: match.displayName ?? type, values: match.stats } : undefined;
    };

    const label = (seasonType.displayName ?? "")
      .replace(seasonLabel, "")
      .trim()
      .replace(/^Postseason$/i, "Playoffs");

    return {
      key: `${index}-${label}`,
      label: label || `Season type ${index + 1}`,
      games,
      averages: summaryRow("avg"),
      totals: summaryRow("total"),
    };
  });

  return {
    seasonLabel,
    labels: payload.labels ?? [],
    seasonTypes: seasonTypes.filter((seasonType) => seasonType.games.length > 0),
  };
}

export function formatGameDate(isoDate: string): string {
  const parsed = Date.parse(isoDate);
  return Number.isNaN(parsed) ? "" : GAME_DATE_FORMATTER.format(new Date(parsed));
}

function parseGameLogRow(
  eventId: string | undefined,
  stats: string[],
  names: string[],
  events: Record<string, EspnGameLogEvent>,
): GameLogEntry | null {
  const event = eventId ? events[eventId] : undefined;
  if (!eventId || !event?.gameDate) {
    return null;
  }

  const read = (name: string) => stats[names.indexOf(name)];
  const [fgm, fga] = parseMadeAttempt(read("fieldGoalsMade-fieldGoalsAttempted"));
  const [p3m, p3a] = parseMadeAttempt(
    read("threePointFieldGoalsMade-threePointFieldGoalsAttempted"),
  );
  const [ftm, fta] = parseMadeAttempt(read("freeThrowsMade-freeThrowsAttempted"));

  return {
    eventId,
    date: event.gameDate,
    month: MONTH_FORMATTER.format(new Date(event.gameDate)),
    isHome: event.atVs !== "@",
    opponent: normalizeTeamCode(event.opponent?.abbreviation ?? "—"),
    opponentName: event.opponent?.displayName,
    opponentLogo: event.opponent?.logo,
    result: event.gameResult,
    score: event.score,
    minutes: toNumber(read("minutes")),
    fgm,
    fga,
    fgPct: read("fieldGoalPct") ?? "-",
    p3m,
    p3a,
    p3Pct: read("threePointPct") ?? "-",
    ftm,
    fta,
    ftPct: read("freeThrowPct") ?? "-",
    reb: toNumber(read("totalRebounds")),
    ast: toNumber(read("assists")),
    blk: toNumber(read("blocks")),
    stl: toNumber(read("steals")),
    pf: toNumber(read("fouls")),
    to: toNumber(read("turnovers")),
    pts: toNumber(read("points")),
  };
}

function parseMadeAttempt(raw: string | undefined): [number, number] {
  const matched = raw?.match(/(\d+)\s*-\s*(\d+)/);
  return matched ? [Number(matched[1]), Number(matched[2])] : [0, 0];
}

function toNumber(raw: string | undefined): number {
  const value = Number.parseFloat(raw ?? "");
  return Number.isFinite(value) ? value : 0;
}

function toHex(value: string | undefined): string | undefined {
  const cleaned = value?.trim().replace("#", "");
  return cleaned && /^[0-9a-fA-F]{6}$/.test(cleaned) ? `#${cleaned.toUpperCase()}` : undefined;
}
