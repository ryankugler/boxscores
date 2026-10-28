import type { CSSProperties } from "react";

import { getTeamPalette, readableTextOn } from "../color";
import type { Game, TeamCode } from "../types";
import { TeamLogo } from "./TeamLogo";
import styles from "./TeamTabs.module.css";

interface TeamTabsProps {
  game: Game;
  activeTeam: TeamCode;
  onSwitchTeam: (team: TeamCode) => void;
}

export function TeamTabs({ game, activeTeam, onSwitchTeam }: TeamTabsProps) {
  const teams: TeamCode[] = [game.away, game.home];

  return (
    <div className={styles.tabs} role="tablist" aria-label="Team box score">
      {teams.map((team) => {
        const color = getTeamPalette(team, game.teamColors?.[team]).primary;
        const name = team === game.home ? game.homeTeam : game.awayTeam;

        return (
          <button
            key={team}
            role="tab"
            aria-selected={activeTeam === team}
            className={styles.tab}
            onClick={() => onSwitchTeam(team)}
            style={{ "--team-color": color, "--team-ink": readableTextOn(color) } as CSSProperties}
          >
            <TeamLogo abbr={team} logoUrl={game.teamLogos?.[team]} size={26} />
            <span className={styles.name}>{name}</span>
            <span className={styles.code}>{team}</span>
          </button>
        );
      })}
    </div>
  );
}
