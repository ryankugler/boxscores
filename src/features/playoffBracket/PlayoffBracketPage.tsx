import { useMemo, useState } from "react";

import type { ConferenceStandings } from "../boxscore/types";
import {
  BRACKET_TOTAL_HEIGHT,
  CARD_HEIGHT,
  CONFERENCE_FINALS_CARD_WIDTH,
  CONFERENCE_FINALS_CENTER,
  CONFERENCE_FINALS_POSITION,
  CONNECTOR_WIDTH,
  NBA_FINALS_CARD_HEIGHT,
  NBA_FINALS_CARD_WIDTH,
  NBA_FINALS_POSITION,
  ROUND_ONE_CARD_WIDTH,
  ROUND_ONE_POSITIONS,
  ROUND_TWO_CARD_WIDTH,
  ROUND_TWO_POSITIONS,
} from "./layout";
import { buildBracketByConference } from "./logic";
import styles from "./PlayoffBracket.module.css";
import type { ConferenceKey } from "./types";
import {
  Connector,
  MatchupCard,
  PlayInGameCard,
  TBDCard,
  TBDSlot,
} from "./components/BracketPrimitives";

export interface PlayoffBracketPageProps {
  standings: ConferenceStandings;
  loading: boolean;
  error: string | null;
}

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const CONFERENCES: Array<{ key: ConferenceKey; label: string; short: string }> = [
  { key: "EAST", label: "Eastern Conference", short: "East" },
  { key: "WEST", label: "Western Conference", short: "West" },
];

const ROUND_TWO_LABELS: Array<[string, string]> = [
  ["Winner 1 / 8", "Winner 4 / 5"],
  ["Winner 3 / 6", "Winner 2 / 7"],
];

const ROUNDS = [
  { label: "First Round", width: ROUND_ONE_CARD_WIDTH },
  { label: "Conf. Semis", width: ROUND_TWO_CARD_WIDTH },
  { label: "Conf. Finals", width: CONFERENCE_FINALS_CARD_WIDTH },
  { label: "NBA Finals", width: NBA_FINALS_CARD_WIDTH, finals: true },
];

const roundOneToRoundTwo = [
  {
    y1: ROUND_ONE_POSITIONS[0] + CARD_HEIGHT / 2,
    y2: ROUND_ONE_POSITIONS[1] + CARD_HEIGHT / 2,
    midY: ROUND_TWO_POSITIONS[0] + CARD_HEIGHT / 2,
  },
  {
    y1: ROUND_ONE_POSITIONS[2] + CARD_HEIGHT / 2,
    y2: ROUND_ONE_POSITIONS[3] + CARD_HEIGHT / 2,
    midY: ROUND_TWO_POSITIONS[1] + CARD_HEIGHT / 2,
  },
];

const roundTwoToConferenceFinals = [
  {
    y1: ROUND_TWO_POSITIONS[0] + CARD_HEIGHT / 2,
    y2: ROUND_TWO_POSITIONS[1] + CARD_HEIGHT / 2,
    midY: CONFERENCE_FINALS_CENTER,
  },
];

const conferenceFinalsToNbaFinals = [
  {
    y1: CONFERENCE_FINALS_CENTER,
    y2: CONFERENCE_FINALS_CENTER,
    midY: CONFERENCE_FINALS_CENTER,
  },
];

export default function PlayoffBracketPage({ standings, loading, error }: PlayoffBracketPageProps) {
  const [conference, setConference] = useState<ConferenceKey>("EAST");

  const bracketByConference = useMemo(() => buildBracketByConference(standings), [standings]);
  const activeBracket = bracketByConference[conference];
  const activeShort = conference === "EAST" ? "East" : "West";
  const otherShort = conference === "EAST" ? "West" : "East";

  const hasStandings = standings.eastern.length > 0 || standings.western.length > 0;
  const statusMessage = !hasStandings
    ? loading
      ? "Loading live standings for bracket projection..."
      : error ?? "Standings are unavailable right now."
    : null;

  const asOfLabel = useMemo(() => DATE_FORMATTER.format(new Date()), []);

  return (
    <div className={styles.page}>
      <div className={styles.intro}>
        <div>
          <div className={styles.kicker}>Live projection · {asOfLabel}</div>
          <h1 className={styles.title}>Playoff Bracket</h1>
        </div>
      </div>

      {statusMessage ? (
        <div className={styles.message}>{statusMessage}</div>
      ) : (
        <>
          <div className={styles.tabs} role="tablist" aria-label="Conference">
            {CONFERENCES.map(({ key, label, short }) => (
              <button
                key={key}
                role="tab"
                aria-selected={conference === key}
                className={styles.tab}
                onClick={() => setConference(key)}
              >
                <span className={styles.tabLong}>{label}</span>
                <span className={styles.tabShort}>{short}</span>
              </button>
            ))}
          </div>

          <section className={`${styles.panel} ${styles.bracketPanel}`}>
            <div className={styles.scroll}>
              <div className={styles.bracketInner}>
                <div className={styles.rounds}>
                  {ROUNDS.map((round, index) => (
                    <div key={round.label} style={{ display: "contents" }}>
                      {index > 0 && <div style={{ width: CONNECTOR_WIDTH, flexShrink: 0 }} />}
                      <div
                        className={styles.roundLabel}
                        data-finals={round.finals || undefined}
                        style={{ width: round.width }}
                      >
                        {round.label}
                      </div>
                    </div>
                  ))}
                </div>

                <div className={styles.columns}>
                  <div
                    className={styles.column}
                    style={{ width: ROUND_ONE_CARD_WIDTH, height: BRACKET_TOTAL_HEIGHT }}
                  >
                    {activeBracket.round1.map((matchup, index) => (
                      <div
                        key={`${matchup.high.team}-${matchup.low.team}-${index}`}
                        style={{ top: ROUND_ONE_POSITIONS[index] }}
                      >
                        <MatchupCard
                          high={matchup.high}
                          low={matchup.low}
                          cardWidth={ROUND_ONE_CARD_WIDTH}
                        />
                      </div>
                    ))}
                  </div>

                  <Connector pairs={roundOneToRoundTwo} />

                  <div
                    className={styles.column}
                    style={{ width: ROUND_TWO_CARD_WIDTH, height: BRACKET_TOTAL_HEIGHT }}
                  >
                    {ROUND_TWO_POSITIONS.map((y, index) => (
                      <div key={y} style={{ top: y }}>
                        <TBDCard cardWidth={ROUND_TWO_CARD_WIDTH} labels={ROUND_TWO_LABELS[index]} />
                      </div>
                    ))}
                  </div>

                  <Connector pairs={roundTwoToConferenceFinals} />

                  <div
                    className={styles.column}
                    style={{ width: CONFERENCE_FINALS_CARD_WIDTH, height: BRACKET_TOTAL_HEIGHT }}
                  >
                    <div style={{ top: CONFERENCE_FINALS_POSITION }}>
                      <TBDCard
                        cardWidth={CONFERENCE_FINALS_CARD_WIDTH}
                        labels={["Top half winner", "Bottom half winner"]}
                      />
                    </div>
                  </div>

                  <Connector pairs={conferenceFinalsToNbaFinals} />

                  <div
                    className={styles.column}
                    style={{ width: NBA_FINALS_CARD_WIDTH, height: BRACKET_TOTAL_HEIGHT }}
                  >
                    <div style={{ top: NBA_FINALS_POSITION }}>
                      <div
                        className={`${styles.card} ${styles.finals}`}
                        style={{ width: NBA_FINALS_CARD_WIDTH, height: NBA_FINALS_CARD_HEIGHT }}
                      >
                        <div className={styles.finalsHeader}>NBA Finals</div>
                        <TBDSlot label={`${activeShort} champion`} />
                        <TBDSlot label={`${otherShort} champion`} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className={styles.legend}>
            <span className={styles.legendItem}>
              <span className={styles.legendSwatch} data-zone="playoff" />
              Direct seed
            </span>
            <span className={styles.legendItem}>
              <span className={styles.legendSwatch} />
              Play-in seed
            </span>
            <span className={styles.legendItem}>
              <span className={styles.piTag}>PI</span>
              Projected via play-in
            </span>
          </div>

          <section className={`${styles.panel} ${styles.playIn}`}>
            <h2 className={styles.panelTitle}>
              {activeShort} Play-In Tournament
              <small>Seeds 7–10</small>
            </h2>
            <div className={styles.playInGrid}>
              {activeBracket.playIn.map((game) => (
                <PlayInGameCard key={game.label} game={game} />
              ))}
            </div>
          </section>

          <ul className={styles.notes}>
            {activeBracket.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
