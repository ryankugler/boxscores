import type { CSSProperties } from "react";

import { getTeamPalette } from "../../boxscore/color";
import { PlayerAvatar } from "../../boxscore/components/PlayerAvatar";
import { TeamLogo } from "../../boxscore/components/TeamLogo";
import type { PlayerProfile } from "../types";
import styles from "./PlayerHero.module.css";

// Headline stats shown on the hero, in display order, by ESPN stat name.
const HEADLINE_STATS: Array<{ name: string; label: string }> = [
  { name: "avgPoints", label: "PPG" },
  { name: "avgRebounds", label: "RPG" },
  { name: "avgAssists", label: "APG" },
  { name: "fieldGoalPct", label: "FG%" },
];

interface PlayerHeroProps {
  profile: PlayerProfile;
}

export function PlayerHero({ profile }: PlayerHeroProps) {
  const palette = getTeamPalette(profile.team ?? "", profile.teamColors);
  const headline = HEADLINE_STATS.map((stat) => ({
    ...stat,
    match: profile.rankedStats.find((ranked) => ranked.name === stat.name),
  })).filter((stat) => stat.match);

  const facts = [
    { label: "Height / Weight", value: [profile.height, profile.weight].filter(Boolean).join(", ") },
    { label: "Age", value: profile.age ? String(profile.age) : "" },
    { label: "Experience", value: profile.experience ?? "" },
    { label: "Draft", value: profile.draft ?? "" },
    { label: profile.college ? "College" : "Birthplace", value: profile.college ?? profile.birthPlace ?? "" },
  ].filter((fact) => fact.value);

  return (
    <section
      className={styles.hero}
      style={{ "--team-color": palette.primary, "--team-alt": palette.alternate } as CSSProperties}
    >
      <div className={styles.identity}>
        <div className={styles.photo}>
          <PlayerAvatar name={profile.name} photoUrl={profile.headshot} size={148} />
          {profile.jersey && <span className={styles.jersey}>#{profile.jersey}</span>}
        </div>

        <div className={styles.text}>
          <div className={styles.teamLine}>
            {profile.team && (
              <TeamLogo abbr={profile.team} logoUrl={profile.teamLogo} size={22} className={styles.teamLogo} />
            )}
            <span>{[profile.teamName ?? "Free agent", profile.positionName].filter(Boolean).join(" · ")}</span>
          </div>
          <h1 className={styles.name}>
            {profile.firstName && profile.lastName ? (
              <>
                <span className={styles.firstName}>{profile.firstName}</span>
                <span>{profile.lastName}</span>
              </>
            ) : (
              profile.name
            )}
          </h1>
          {facts.length > 0 && (
            <dl className={styles.facts}>
              {facts.map((fact) => (
                <div key={fact.label}>
                  <dt>{fact.label}</dt>
                  <dd>{fact.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>

      {headline.length > 0 && (
        <div className={styles.headline}>
          <div className={styles.headlineTitle}>{profile.seasonLabel ?? "Season stats"}</div>
          <div className={styles.headlineGrid}>
            {headline.map((stat) => (
              <div key={stat.name} className={styles.tile}>
                <span className={`${styles.tileValue} tabular`}>{stat.match?.value}</span>
                <span className={styles.tileLabel}>{stat.label}</span>
                {stat.match?.rank && <span className={styles.tileRank}>{stat.match.rank} in NBA</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
