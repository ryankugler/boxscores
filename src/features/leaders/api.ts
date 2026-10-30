import type { LeaderStatKey, SeasonLeaderRow, SeasonLeaders } from "./types";

// ESPN's stats-by-athlete feed: every qualified player's season averages in
// one request (~200 KB gzipped), so sorting and filtering happen client-side.
const BY_ATHLETE_URL =
  "https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/statistics/byathlete" +
  "?region=us&lang=en&contentorigin=espn&isqualified=true&page=1&limit=500&sort=offensive.avgPoints:desc";

interface EspnCategoryMeta {
  name?: string;
  names?: string[];
}

interface EspnAthleteEntry {
  athlete?: {
    id?: string;
    displayName?: string;
    shortName?: string;
    teamShortName?: string;
    teamLogos?: Array<{ href?: string }>;
    headshot?: { href?: string };
    position?: { abbreviation?: string };
  };
  categories?: Array<{ name?: string; values?: number[] }>;
}

interface EspnByAthleteResponse {
  athletes?: EspnAthleteEntry[];
  categories?: EspnCategoryMeta[];
  requestedSeason?: { displayName?: string; type?: { name?: string } };
}

// Where each stat lives in ESPN's payload, as "category.statName".
const STAT_SOURCES: Record<LeaderStatKey, string> = {
  gp: "general.gamesPlayed",
  min: "general.avgMinutes",
  pts: "offensive.avgPoints",
  reb: "general.avgRebounds",
  ast: "offensive.avgAssists",
  stl: "defensive.avgSteals",
  blk: "defensive.avgBlocks",
  to: "offensive.avgTurnovers",
  fgm: "offensive.avgFieldGoalsMade",
  fgPct: "offensive.fieldGoalPct",
  p3m: "offensive.avgThreePointFieldGoalsMade",
  p3Pct: "offensive.threePointFieldGoalPct",
  ftm: "offensive.avgFreeThrowsMade",
  ftPct: "offensive.freeThrowPct",
  dd2: "general.doubleDouble",
};

let cached: Promise<SeasonLeaders> | null = null;

export function fetchSeasonLeaders(): Promise<SeasonLeaders> {
  cached ??= loadSeasonLeaders().catch((error: unknown) => {
    cached = null;
    throw error;
  });
  return cached;
}

async function loadSeasonLeaders(): Promise<SeasonLeaders> {
  const response = await fetch(BY_ATHLETE_URL);
  if (!response.ok) {
    throw new Error(`Season leaders request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as EspnByAthleteResponse;
  const indexOf = new Map<string, number>();
  payload.categories?.forEach((category) => {
    category.names?.forEach((name, index) => indexOf.set(`${category.name}.${name}`, index));
  });

  const rows = (payload.athletes ?? [])
    .map((entry) => parseRow(entry, indexOf))
    .filter((row): row is SeasonLeaderRow => row !== null);

  return {
    seasonLabel: payload.requestedSeason?.displayName ?? "",
    seasonType: payload.requestedSeason?.type?.name ?? "",
    rows,
  };
}

function parseRow(entry: EspnAthleteEntry, indexOf: Map<string, number>): SeasonLeaderRow | null {
  const athlete = entry.athlete;
  if (!athlete?.id || !athlete.displayName) {
    return null;
  }

  const valuesByCategory = new Map(
    (entry.categories ?? []).map((category) => [category.name, category.values ?? []]),
  );
  const stats = {} as Record<LeaderStatKey, number>;
  (Object.keys(STAT_SOURCES) as LeaderStatKey[]).forEach((key) => {
    const source = STAT_SOURCES[key];
    const [category] = source.split(".");
    const value = valuesByCategory.get(category)?.[indexOf.get(source) ?? -1];
    stats[key] = typeof value === "number" && Number.isFinite(value) ? value : 0;
  });

  return {
    id: athlete.id,
    name: athlete.displayName,
    shortName: athlete.shortName ?? athlete.displayName,
    team: athlete.teamShortName ?? "",
    teamLogo: athlete.teamLogos?.[0]?.href,
    headshot: athlete.headshot?.href,
    position: athlete.position?.abbreviation,
    stats,
  };
}
