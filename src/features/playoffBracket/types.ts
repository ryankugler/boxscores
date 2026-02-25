import type { TeamCode } from "../boxscore/types";

export type ConferenceKey = "EAST" | "WEST";

export interface BracketTheme {
  panelBg: string;
  panelBorder: string;
  cardBg: string;
  cardBorder: string;
  tbd: string;
  tbdBorder: string;
  tbdText: string;
  teamName: string;
  seedColor: string;
  record: string;
  divider: string;
  colLabel: string;
  line: string;
  finBorder: string;
  finBg: string;
  finLabel: string;
  subtitle: string;
  noteText: string;
  piColor: string;
  playInBg: string;
  playInBorder: string;
  projBorder: string;
  rulesBg: string;
  rulesBorder: string;
  rulesText: string;
  toggleBg: string;
  toggleBorder: string;
  toggleText: string;
  buttonBg: string;
  buttonText: string;
  buttonTextInactive: string;
  EAST_accent: string;
  WEST_accent: string;
}

export interface BracketTeam {
  team: TeamCode;
  teamName: string;
  seed: number;
  wins: number;
  losses: number;
  winPct: number;
  winPctLabel: string;
  logo?: string;
  playIn?: boolean;
}

export interface PlayInGame {
  label: string;
  note: string;
  teams: [BracketTeam, BracketTeam];
  isProjected?: boolean;
}

export interface ConferenceBracket {
  conf: string;
  round1: Array<{ high: BracketTeam; low: BracketTeam }>;
  playIn: PlayInGame[];
  notes: string[];
}

export interface BracketByConference {
  EAST: ConferenceBracket;
  WEST: ConferenceBracket;
}
