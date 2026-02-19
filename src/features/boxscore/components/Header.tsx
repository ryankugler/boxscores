import type { CSSProperties } from "react";

import type { Theme } from "../types";

interface HeaderProps {
  dark: boolean;
  onToggleTheme: () => void;
  theme: Theme;
  transitionStyle: CSSProperties;
}

export function Header({ dark, onToggleTheme, theme, transitionStyle }: HeaderProps) {
  return (
    <div
      style={{
        background: theme.headerBg,
        borderBottom: `1px solid ${theme.border}`,
        padding: "14px 28px",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        ...transitionStyle,
      }}
    >
      <div
        style={{
          background: "#e8401a",
          color: "#fff",
          fontWeight: 900,
          fontSize: "12px",
          letterSpacing: "3px",
          padding: "4px 10px",
          flexShrink: 0,
        }}
      >
        NBA
      </div>
      <span
        style={{
          fontSize: "20px",
          fontWeight: 800,
          letterSpacing: "2px",
          textTransform: "uppercase",
        }}
      >
        Box Scores
      </span>
      <span
        style={{
          fontSize: "12px",
          color: theme.textMuted,
          letterSpacing: "1px",
          fontWeight: 500,
        }}
      >
        Last 7 Days
      </span>
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
        <span
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
