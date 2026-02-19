import { normalizeTeamCode } from "../data/constants";
import type { Game, PlayerStats, Quarter, TeamCode, TeamColors } from "../types";

const ESPN_NBA_API_BASE = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba";

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

interface EspnScoreboardResponse {
  events?: EspnEvent[];
}

interface EspnSummaryResponse {
  header?: {
    competitions?: EspnCompetition[];
  };
  boxscore?: {
    players?: EspnBoxscoreTeam[];
  };
}

interface EspnEvent {
  id?: string;
  date?: string;
  competitions?: EspnCompetition[];
}

interface EspnCompetition {
  competitors?: EspnCompetitor[];
  status?: {
    type?: {
      state?: string;
      shortDetail?: string;
    };
  };
}

interface EspnCompetitor {
  homeAway?: "home" | "away" | string;
  score?: string;
  team?: EspnTeam;
  linescores?: Array<{ value?: number; displayValue?: string }>;
}

interface EspnTeam {
  abbreviation?: string;
  displayName?: string;
  shortDisplayName?: string;
  logos?: Array<{ href?: string }>;
  logo?: string;
  color?: string;
  alternateColor?: string;
}

interface EspnBoxscoreTeam {
  team?: EspnTeam;
  statistics?: EspnBoxscoreStatBlock[];
}

interface EspnBoxscoreStatBlock {
  labels?: string[];
  athletes?: EspnAthleteStats[];
}

interface EspnAthleteStats {
  athlete?: {
    displayName?: string;
    position?: {
      abbreviation?: string;
    };
  };
  stats?: string[];
}

interface TeamDescriptor {
  code: TeamCode;
  name: string;
  logo?: string;
  colors?: TeamColors;
}

interface GameDetails {
  score: Record<string, number>;
  periods: Record<Quarter, Record<string, number>>;
  players: Record<string, PlayerStats[]>;
  teamLogos: Record<string, string>;
  teamColors: Record<string, TeamColors>;
  statusState?: string;
  statusText?: string;
}

export async function fetchScoreboardGames(lastDays = 7): Promise<Game[]> {
  const range = getDateRange(lastDays);
  const url = `${ESPN_NBA_API_BASE}/scoreboard?dates=${range}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Scoreboard request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as EspnScoreboardResponse;
  const sortedEvents = [...(payload.events ?? [])].sort((a, b) => {
    const aTime = new Date(a.date ?? 0).getTime();
    const bTime = new Date(b.date ?? 0).getTime();
    return bTime - aTime;
  });

  const games = sortedEvents
    .map((event) => parseEventGame(event))
    .filter((game): game is Game => game !== null);

  return games;
}

export async function fetchGameDetails(eventId: string): Promise<GameDetails> {
  const url = `${ESPN_NBA_API_BASE}/summary?event=${eventId}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Summary request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as EspnSummaryResponse;
  const competition = payload.header?.competitions?.[0];
  if (!competition) {
    throw new Error("Missing competition data in summary response");
  }

  const homeCompetitor = competition.competitors?.find(
    (competitor) => competitor.homeAway === "home",
  );
  const awayCompetitor = competition.competitors?.find(
    (competitor) => competitor.homeAway === "away",
  );

  if (
    !homeCompetitor ||
    !awayCompetitor ||
    !homeCompetitor.team ||
    !awayCompetitor.team
  ) {
    throw new Error("Missing home/away teams in summary response");
  }

  const homeTeam = parseTeamDescriptor(homeCompetitor.team);
  const awayTeam = parseTeamDescriptor(awayCompetitor.team);

  const score: Record<string, number> = {
    [homeTeam.code]: parseScore(homeCompetitor.score),
    [awayTeam.code]: parseScore(awayCompetitor.score),
  };

  const periods = parsePeriods(homeTeam.code, awayTeam.code, homeCompetitor, awayCompetitor);
  const players = parsePlayers(payload.boxscore?.players ?? []);
  const teamLogos = mapTeamLogos([homeTeam, awayTeam]);
  const teamColors = mapTeamColors([homeTeam, awayTeam]);

  return {
    score,
    periods,
    players,
    teamLogos,
    teamColors,
    statusState: competition.status?.type?.state,
    statusText: competition.status?.type?.shortDetail,
  };
}

function parseEventGame(event: EspnEvent): Game | null {
  const competition = event.competitions?.[0];
  if (!competition) {
    return null;
  }

  const homeCompetitor = competition.competitors?.find(
    (competitor) => competitor.homeAway === "home",
  );
  const awayCompetitor = competition.competitors?.find(
    (competitor) => competitor.homeAway === "away",
  );

  if (!event.id || !homeCompetitor?.team || !awayCompetitor?.team) {
    return null;
  }

  const homeTeam = parseTeamDescriptor(homeCompetitor.team);
  const awayTeam = parseTeamDescriptor(awayCompetitor.team);

  return {
    id: event.id,
    date: event.date ? DATE_FORMATTER.format(new Date(event.date)) : "",
    home: homeTeam.code,
    away: awayTeam.code,
    homeTeam: homeTeam.name,
    awayTeam: awayTeam.name,
    score: {
      [homeTeam.code]: parseScore(homeCompetitor.score),
      [awayTeam.code]: parseScore(awayCompetitor.score),
    },
    periods: parsePeriods(homeTeam.code, awayTeam.code, homeCompetitor, awayCompetitor),
    players: {
      [homeTeam.code]: [],
      [awayTeam.code]: [],
    },
    teamLogos: mapTeamLogos([homeTeam, awayTeam]),
    teamColors: mapTeamColors([homeTeam, awayTeam]),
    statusState: competition.status?.type?.state,
    statusText: competition.status?.type?.shortDetail,
  };
}

function parseTeamDescriptor(team: EspnTeam): TeamDescriptor {
  const rawCode = team.abbreviation ?? team.shortDisplayName ?? team.displayName ?? "UNK";
  const code = normalizeTeamCode(rawCode);
  const primary = normalizeHexColor(team.color);
  const alternate = normalizeHexColor(team.alternateColor);

  const colors =
    primary || alternate
      ? {
          dark: alternate ?? primary ?? "#e8401a",
          light: primary ?? alternate ?? "#cc3300",
        }
      : undefined;

  return {
    code,
    name: team.displayName ?? team.shortDisplayName ?? String(code),
    logo: team.logos?.[0]?.href ?? team.logo,
    colors,
  };
}

function parseScore(raw?: string): number {
  const value = Number.parseInt(raw ?? "0", 10);
  return Number.isNaN(value) ? 0 : value;
}

function parsePeriods(
  home: TeamCode,
  away: TeamCode,
  homeCompetitor: EspnCompetitor,
  awayCompetitor: EspnCompetitor,
): Record<Quarter, Record<string, number>> {
  const periods = createEmptyPeriods();

  (homeCompetitor.linescores ?? []).slice(0, 4).forEach((line, index) => {
    const quarter = String(index + 1) as Quarter;
    periods[quarter][home] = parseLineScore(line);
  });

  (awayCompetitor.linescores ?? []).slice(0, 4).forEach((line, index) => {
    const quarter = String(index + 1) as Quarter;
    periods[quarter][away] = parseLineScore(line);
  });

  return periods;
}

function parseLineScore(line: { value?: number; displayValue?: string }): number {
  if (typeof line.value === "number") {
    return line.value;
  }

  const parsed = Number.parseInt(line.displayValue ?? "0", 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function createEmptyPeriods(): Record<Quarter, Record<string, number>> {
  return {
    "1": {},
    "2": {},
    "3": {},
    "4": {},
  };
}

function mapTeamLogos(teams: TeamDescriptor[]): Record<string, string> {
  const logos: Record<string, string> = {};

  teams.forEach((team) => {
    if (team.logo) {
      logos[team.code] = team.logo;
    }
  });

  return logos;
}

function mapTeamColors(teams: TeamDescriptor[]): Record<string, TeamColors> {
  const colors: Record<string, TeamColors> = {};

  teams.forEach((team) => {
    if (team.colors) {
      colors[team.code] = team.colors;
    }
  });

  return colors;
}

function parsePlayers(boxscoreTeams: EspnBoxscoreTeam[]): Record<string, PlayerStats[]> {
  const playersByTeam: Record<string, PlayerStats[]> = {};

  boxscoreTeams.forEach((teamBlock) => {
    const code = normalizeTeamCode(teamBlock.team?.abbreviation ?? "");
    if (!code) {
      return;
    }

    playersByTeam[code] = parseTeamPlayerBlock(teamBlock.statistics ?? []);
  });

  return playersByTeam;
}

function parseTeamPlayerBlock(statBlocks: EspnBoxscoreStatBlock[]): PlayerStats[] {
  const players: PlayerStats[] = [];
  const seen = new Set<string>();

  statBlocks.forEach((block) => {
    const labels = block.labels ?? [];
    if (labels.length === 0) {
      return;
    }

    const indexes = {
      fg: findLabelIndex(labels, ["FG", "FGM-A", "FGM/A"]),
      threePt: findLabelIndex(labels, ["3PT", "3PM-A", "3PTM-A"]),
      ft: findLabelIndex(labels, ["FT", "FTM-A", "FTM/A"]),
      reb: findLabelIndex(labels, ["REB", "TREB"]),
      ast: findLabelIndex(labels, ["AST"]),
      stl: findLabelIndex(labels, ["STL"]),
      blk: findLabelIndex(labels, ["BLK"]),
      turnovers: findLabelIndex(labels, ["TO", "TOV"]),
      pts: findLabelIndex(labels, ["PTS", "POINTS"]),
    };

    (block.athletes ?? []).forEach((entry) => {
      const name = entry.athlete?.displayName?.trim();
      if (!name || seen.has(name)) {
        return;
      }

      const stats = entry.stats ?? [];
      const [fgm, fga] = parseMadeAttempt(stats[indexes.fg]);
      const [p3m, p3a] = parseMadeAttempt(stats[indexes.threePt]);
      const [ftm, fta] = parseMadeAttempt(stats[indexes.ft]);

      players.push({
        name,
        pos: entry.athlete?.position?.abbreviation ?? "",
        fgm,
        fga,
        p3m,
        p3a,
        ftm,
        fta,
        pts: parseNumberStat(stats[indexes.pts]),
        reb: parseNumberStat(stats[indexes.reb]),
        ast: parseNumberStat(stats[indexes.ast]),
        stl: parseNumberStat(stats[indexes.stl]),
        blk: parseNumberStat(stats[indexes.blk]),
        to: parseNumberStat(stats[indexes.turnovers]),
      });

      seen.add(name);
    });
  });

  return players;
}

function findLabelIndex(labels: string[], candidates: string[]): number {
  const normalizedCandidates = candidates.map(normalizeLabel);

  for (let index = 0; index < labels.length; index += 1) {
    const normalized = normalizeLabel(labels[index]);
    if (normalizedCandidates.includes(normalized)) {
      return index;
    }
  }

  return -1;
}

function normalizeLabel(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function parseMadeAttempt(raw: string | undefined): [number, number] {
  if (!raw) {
    return [0, 0];
  }

  const matched = raw.match(/(\d+)\s*-\s*(\d+)/);
  if (!matched) {
    return [0, 0];
  }

  return [Number.parseInt(matched[1], 10), Number.parseInt(matched[2], 10)];
}

function parseNumberStat(raw: string | undefined): number {
  const value = Number.parseInt(raw ?? "0", 10);
  return Number.isNaN(value) ? 0 : value;
}

function normalizeHexColor(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const cleaned = value.trim().replace("#", "");
  if (!/^[A-Fa-f0-9]{6}$/.test(cleaned)) {
    return undefined;
  }

  return `#${cleaned.toUpperCase()}`;
}

function getDateRange(lastDays: number): string {
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - Math.max(lastDays - 1, 0));

  return `${formatDate(start)}-${formatDate(end)}`;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}${month}${day}`;
}
