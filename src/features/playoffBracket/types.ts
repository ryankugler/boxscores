import type { TeamCode } from "../boxscore/types";

export type ConferenceKey = "EAST" | "WEST";

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
