import type { CSSProperties } from "react";

import type { Theme } from "../types";

export type TopNavTab = "boxscores" | "leaderboard" | "standings" | "playoffs";

interface HeaderProps {
  activeTab: TopNavTab;
  dark: boolean;
  onSelectTab: (tab: TopNavTab) => void;
  onToggleTheme: () => void;
  theme: Theme;
  transitionStyle: CSSProperties;
}

export function Header({
  activeTab,
  dark,
  onSelectTab,
  onToggleTheme,
  theme,
  transitionStyle,
}: HeaderProps) {
  const tabButtonBase = {
    borderRadius: "999px",
    padding: "5px 10px",
    fontSize: "11px",
    letterSpacing: "0.8px",
    fontWeight: 700,
    textTransform: "uppercase",
    cursor: "pointer",
    whiteSpace: "nowrap",
    flexShrink: 0,
  } as const;

  return (
    <div
      className="dashboard-header"
      style={{
        background: theme.headerBg,
        borderBottom: `1px solid ${theme.border}`,
        padding: "14px clamp(12px, 4vw, 28px)",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        flexWrap: "wrap",
        ...transitionStyle,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
        <div
          style={{
            background: "#e8401a",
            color: "#fff",
            fontWeight: 900,
            fontSize: "12px",
            letterSpacing: "3px",
            padding: "4px 10px",
            flexShrink: 0,
            whiteSpace: "nowrap",
          }}
        >
          NBA
        </div>
        <span
          className="dashboard-header-title"
          style={{
            fontSize: "clamp(16px, 2.5vw, 20px)",
            fontWeight: 800,
            letterSpacing: "clamp(1px, 0.4vw, 2px)",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        >
          NBA Dashboard
        </span>
      </div>
      <div
        className="dashboard-header-tabs scrollbar-hidden"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginLeft: "8px",
          minWidth: 0,
          overflowX: "auto",
          paddingBottom: "2px",
          flex: "1 1 auto",
        }}
      >
        <button
          onClick={() => onSelectTab("boxscores")}
          style={{
            border: `1px solid ${activeTab === "boxscores" ? "#e8401a" : theme.border}`,
            background: activeTab === "boxscores" ? "#e8401a" : theme.cardBg,
            color: activeTab === "boxscores" ? "#fff" : theme.textSecond,
            ...tabButtonBase,
          }}
        >
          Box Scores
        </button>
        <button
          onClick={() => onSelectTab("leaderboard")}
          style={{
            border: `1px solid ${activeTab === "leaderboard" ? "#e8401a" : theme.border}`,
            background: activeTab === "leaderboard" ? "#e8401a" : theme.cardBg,
            color: activeTab === "leaderboard" ? "#fff" : theme.textSecond,
            ...tabButtonBase,
          }}
        >
          Leaderboard
        </button>
        <button
          onClick={() => onSelectTab("standings")}
          style={{
            border: `1px solid ${activeTab === "standings" ? "#e8401a" : theme.border}`,
            background: activeTab === "standings" ? "#e8401a" : theme.cardBg,
            color: activeTab === "standings" ? "#fff" : theme.textSecond,
            ...tabButtonBase,
          }}
        >
          Conference Standings
        </button>
        <button
          onClick={() => onSelectTab("playoffs")}
          style={{
            border: `1px solid ${activeTab === "playoffs" ? "#e8401a" : theme.border}`,
            background: activeTab === "playoffs" ? "#e8401a" : theme.cardBg,
            color: activeTab === "playoffs" ? "#fff" : theme.textSecond,
            ...tabButtonBase,
          }}
        >
          Playoff Bracket
        </button>
      </div>
      <div
        className="dashboard-header-theme"
        style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}
      >
        <span
          className="dashboard-theme-label"
          style={{
            fontSize: "11px",
            color: theme.toggleLabel,
            fontWeight: 700,
            letterSpacing: "1px",
            textTransform: "uppercase",
          }}
        >
          {dark ? "Dark" : "Light"}
        </span>
        <button
          onClick={onToggleTheme}
          aria-label="Toggle theme"
          style={{
            position: "relative",
            width: "44px",
            height: "24px",
            borderRadius: "12px",
            border: `1px solid ${theme.border}`,
            background: theme.toggleBg,
            cursor: "pointer",
            transition: "background 0.25s",
            padding: 0,
            flexShrink: 0,
          }}
        >
          <span
            style={{
              position: "absolute",
              top: "3px",
              left: dark ? "22px" : "3px",
              width: "16px",
              height: "16px",
              borderRadius: "50%",
              background: dark ? "#FDB927" : "#552583",
              transition: "left 0.22s, background 0.22s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "9px",
            }}
          >
            {dark ? "🌙" : "☀️"}
          </span>
        </button>
      </div>
    </div>
  );
}
