import { useMemo, useState, type CSSProperties } from "react";

import type { ConferenceStandings, Theme } from "../boxscore/types";
import {
  BRACKET_TOTAL_HEIGHT,
  CARD_HEIGHT,
  CONFERENCE_FINALS_CARD_WIDTH,
  CONFERENCE_FINALS_CENTER,
  CONFERENCE_FINALS_POSITION,
  CONNECTOR_WIDTH,
  NBA_FINALS_CARD_WIDTH,
  NBA_FINALS_POSITION,
  ROUND_ONE_CARD_WIDTH,
  ROUND_ONE_POSITIONS,
  ROUND_TWO_CARD_WIDTH,
  ROUND_TWO_POSITIONS,
} from "./layout";
import { buildBracketByConference } from "./logic";
import { createBracketTheme } from "./theme";
import type { ConferenceKey } from "./types";
import {
  Connector,
  MatchupCard,
  PlayInGameCard,
  TBDCard,
} from "./components/BracketPrimitives";

export interface PlayoffBracketPageProps {
  dark: boolean;
  theme: Theme;
  transitionStyle: CSSProperties;
  standings: ConferenceStandings;
  loading: boolean;
  error: string | null;
}

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export default function PlayoffBracketPage({
  dark,
  theme,
  transitionStyle,
  standings,
  loading,
  error,
}: PlayoffBracketPageProps) {
  const [conference, setConference] = useState<ConferenceKey>("EAST");
  const [showPlayIn, setShowPlayIn] = useState(false);

  const bracketTheme = useMemo(() => createBracketTheme(theme, dark), [theme, dark]);
  const bracketByConference = useMemo(() => buildBracketByConference(standings), [standings]);
  const activeBracket = bracketByConference[conference];

  const hasStandings = standings.eastern.length > 0 || standings.western.length > 0;
  const statusMessage = !hasStandings
    ? loading
      ? "Loading live standings for bracket projection..."
      : error ?? "Standings are unavailable right now."
    : null;

  const accent = conference === "EAST" ? bracketTheme.EAST_accent : bracketTheme.WEST_accent;

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

  const asOfLabel = useMemo(() => DATE_FORMATTER.format(new Date()), []);

  const renderColumnLabel = (label: string, override: CSSProperties = {}) => (
    <div
      style={{
        fontSize: 10,
        color: bracketTheme.colLabel,
        fontFamily: "monospace",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        textAlign: "center",
        ...override,
      }}
    >
      {label}
    </div>
  );

  return (
    <div style={{ paddingTop: 14, ...transitionStyle }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 20,
          flexWrap: "wrap",
          gap: 14,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10.5,
              color: accent,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              fontFamily: "monospace",
              marginBottom: 7,
              fontWeight: 700,
            }}
          >
            Live Projection
          </div>
          <h2
            style={{
              fontSize: 30,
              fontWeight: 900,
              margin: 0,
              lineHeight: 1,
              fontFamily: "'Barlow Condensed', sans-serif",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: bracketTheme.teamName,
            }}
          >
            Playoff Bracket
          </h2>
          <p
            style={{
              color: bracketTheme.subtitle,
              fontSize: 11,
              marginTop: 8,
              marginBottom: 0,
              fontFamily: "monospace",
              textTransform: "uppercase",
            }}
          >
            Live standings snapshot as of {asOfLabel}. PI = play-in projected.
          </p>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            display: "inline-flex",
            background: bracketTheme.toggleBg,
            border: `1px solid ${bracketTheme.toggleBorder}`,
            borderRadius: 10,
            padding: 4,
          }}
        >
          {(["EAST", "WEST"] as ConferenceKey[]).map((key) => {
            const isActive = conference === key;
            const conferenceAccent =
              key === "EAST" ? bracketTheme.EAST_accent : bracketTheme.WEST_accent;

            return (
              <button
                key={key}
                onClick={() => {
                  setConference(key);
                  setShowPlayIn(false);
                }}
                style={{
                  background: isActive ? bracketTheme.buttonBg : "transparent",
                  border: isActive ? `1px solid ${bracketTheme.buttonBg}` : "1px solid transparent",
                  borderRadius: 7,
                  padding: "9px 22px",
                  color: isActive
                    ? bracketTheme.buttonText
                    : bracketTheme.buttonTextInactive,
                  fontSize: 12,
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 700,
                  cursor: "pointer",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  transition: "all 0.2s",
                  boxShadow: isActive ? `0 0 0 1px ${conferenceAccent}55 inset` : "none",
                }}
              >
                {key === "EAST" ? "Eastern" : "Western"}
              </button>
            );
          })}
        </div>
      </div>

      {statusMessage && (
        <div
          style={{
            padding: "12px 0",
            fontSize: "12px",
            letterSpacing: "0.6px",
            color: theme.textMuted,
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          {statusMessage}
        </div>
      )}

      {!statusMessage && (
        <>
          <div style={{ marginBottom: 20 }}>
            <button
              onClick={() => setShowPlayIn((value) => !value)}
              style={{
                background: showPlayIn ? `${accent}1c` : "transparent",
                border: `1px solid ${showPlayIn ? `${accent}66` : bracketTheme.toggleBorder}`,
                borderRadius: 20,
                padding: "7px 18px",
                color: showPlayIn ? accent : bracketTheme.toggleText,
                fontSize: 11,
                fontFamily: "monospace",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {showPlayIn ? "Hide" : "Show"} Play-In Tournament Details
            </button>
          </div>

          {showPlayIn && (
            <div
              style={{
                background: bracketTheme.panelBg,
                border: `1px solid ${bracketTheme.panelBorder}`,
                borderRadius: 12,
                padding: "20px 22px",
                marginBottom: 22,
                ...transitionStyle,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontFamily: "monospace",
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  color: accent,
                  marginBottom: 16,
                  fontWeight: 700,
                }}
              >
                {activeBracket.conf} Play-In - Seeds 7-10
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {activeBracket.playIn.map((game) => (
                  <PlayInGameCard key={game.label} game={game} theme={bracketTheme} />
                ))}
              </div>
              <div
                style={{
                  marginTop: 16,
                  padding: "10px 14px",
                  background: bracketTheme.rulesBg,
                  borderRadius: 8,
                  border: `1px solid ${bracketTheme.rulesBorder}`,
                  display: "inline-block",
                }}
              >
                <span
                  style={{
                    color: bracketTheme.piColor,
                    fontSize: 10,
                    fontFamily: "monospace",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    fontWeight: 700,
                  }}
                >
                  Format:
                </span>
                <span
                  style={{
                    color: bracketTheme.rulesText,
                    fontSize: 10.5,
                    fontFamily: "monospace",
                  }}
                >
                  {" #7 vs #8 -> winner = 7 seed | #9 vs #10 -> winner advances | loser of 7/8 vs winner of 9/10 -> winner = 8 seed"}
                </span>
              </div>
            </div>
          )}

          <div
            style={{
              background: bracketTheme.panelBg,
              border: `1px solid ${bracketTheme.panelBorder}`,
              borderRadius: 14,
              padding: "22px 20px 24px",
              overflowX: "auto",
              ...transitionStyle,
            }}
          >
            <div
              style={{
                display: "flex",
                marginBottom: 14,
                paddingBottom: 12,
                borderBottom: `1px solid ${bracketTheme.panelBorder}`,
              }}
            >
              <div style={{ width: ROUND_ONE_CARD_WIDTH }}>{renderColumnLabel("First Round")}</div>
              <div style={{ width: CONNECTOR_WIDTH }} />
              <div style={{ width: ROUND_TWO_CARD_WIDTH }}>{renderColumnLabel("Conf. Semis")}</div>
              <div style={{ width: CONNECTOR_WIDTH }} />
              <div style={{ width: CONFERENCE_FINALS_CARD_WIDTH }}>
                {renderColumnLabel("Conf. Finals")}
              </div>
              <div style={{ width: CONNECTOR_WIDTH }} />
              <div style={{ width: NBA_FINALS_CARD_WIDTH }}>
                {renderColumnLabel("NBA Finals", {
                  color: accent,
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                })}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                minWidth:
                  ROUND_ONE_CARD_WIDTH +
                  CONNECTOR_WIDTH +
                  ROUND_TWO_CARD_WIDTH +
                  CONNECTOR_WIDTH +
                  CONFERENCE_FINALS_CARD_WIDTH +
                  CONNECTOR_WIDTH +
                  NBA_FINALS_CARD_WIDTH,
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: ROUND_ONE_CARD_WIDTH,
                  height: BRACKET_TOTAL_HEIGHT,
                  flexShrink: 0,
                }}
              >
                {activeBracket.round1.map((matchup, index) => (
                  <div key={`${matchup.high.team}-${matchup.low.team}`} style={{ position: "absolute", top: ROUND_ONE_POSITIONS[index] }}>
                    <MatchupCard
                      high={matchup.high}
                      low={matchup.low}
                      cardWidth={ROUND_ONE_CARD_WIDTH}
                      theme={bracketTheme}
                    />
                  </div>
                ))}
              </div>

              <Connector pairs={roundOneToRoundTwo} theme={bracketTheme} />

              <div
                style={{
                  position: "relative",
                  width: ROUND_TWO_CARD_WIDTH,
                  height: BRACKET_TOTAL_HEIGHT,
                  flexShrink: 0,
                }}
              >
                {ROUND_TWO_POSITIONS.map((y) => (
                  <div key={y} style={{ position: "absolute", top: y }}>
                    <TBDCard cardWidth={ROUND_TWO_CARD_WIDTH} theme={bracketTheme} />
                  </div>
                ))}
              </div>

              <Connector pairs={roundTwoToConferenceFinals} theme={bracketTheme} />

              <div
                style={{
                  position: "relative",
                  width: CONFERENCE_FINALS_CARD_WIDTH,
                  height: BRACKET_TOTAL_HEIGHT,
                  flexShrink: 0,
                }}
              >
                <div style={{ position: "absolute", top: CONFERENCE_FINALS_POSITION }}>
                  <TBDCard
                    cardWidth={CONFERENCE_FINALS_CARD_WIDTH}
                    label="Conf. Finals"
                    theme={bracketTheme}
                  />
                </div>
              </div>

              <Connector pairs={conferenceFinalsToNbaFinals} theme={bracketTheme} />

              <div
                style={{
                  position: "relative",
                  width: NBA_FINALS_CARD_WIDTH,
                  height: BRACKET_TOTAL_HEIGHT,
                  flexShrink: 0,
                }}
              >
                <div style={{ position: "absolute", top: NBA_FINALS_POSITION }}>
                  <div
                    style={{
                      width: NBA_FINALS_CARD_WIDTH,
                      height: CARD_HEIGHT,
                      background: bracketTheme.finBg,
                      border: `1.5px solid ${bracketTheme.finBorder}`,
                      borderRadius: 8,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        padding: "5px 12px",
                        textAlign: "center",
                        borderBottom: `1px solid ${bracketTheme.finBorder}`,
                        background: `${bracketTheme.finBorder}33`,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 9.5,
                          color: bracketTheme.finLabel,
                          fontFamily: "monospace",
                          letterSpacing: "0.16em",
                          textTransform: "uppercase",
                          fontWeight: 700,
                        }}
                      >
                        NBA Finals
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 9,
                        padding: "11px 13px",
                      }}
                    >
                      <div
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 13,
                          border: `1px dashed ${bracketTheme.tbdBorder}`,
                          background: bracketTheme.tbd,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <span style={{ color: bracketTheme.tbdText, fontSize: 13 }}>?</span>
                      </div>
                      <div>
                        <div
                          style={{ color: bracketTheme.tbdText, fontSize: 10.5, fontFamily: "monospace" }}
                        >
                          TBD
                        </div>
                        <div
                          style={{
                            color: bracketTheme.tbdText,
                            fontSize: 8.5,
                            fontFamily: "monospace",
                            textTransform: "uppercase",
                            letterSpacing: "0.07em",
                          }}
                        >
                          {conference} Champion
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: 18,
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              alignItems: "center",
            }}
          >
            <span style={{ color: bracketTheme.piColor, fontSize: 10.5, fontFamily: "monospace" }}>
              PI = projected via play-in
            </span>
            {activeBracket.notes.map((note) => (
              <span
                key={note}
                style={{ color: bracketTheme.noteText, fontSize: 10.5, fontFamily: "monospace" }}
              >
                {`- ${note}`}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
