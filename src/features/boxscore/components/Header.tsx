import type { ReactNode } from "react";

import type { View } from "../hooks/useRoute";
import styles from "./Header.module.css";

export type TopNavTab = View;

interface HeaderProps {
  activeTab: TopNavTab;
  dark: boolean;
  onSelectTab: (tab: TopNavTab) => void;
  onToggleTheme: () => void;
}

interface NavItem {
  tab: TopNavTab;
  label: string;
  shortLabel: string;
  icon: ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    tab: "boxscores",
    label: "Box Scores",
    shortLabel: "Scores",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M12 5v14M3 12h18" />
      </svg>
    ),
  },
  {
    tab: "leaderboard",
    label: "Leaderboard",
    shortLabel: "Leaders",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 20V11M12 20V5M19 20v-6" />
      </svg>
    ),
  },
  {
    tab: "standings",
    label: "Standings",
    shortLabel: "Standings",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 6h16M4 12h16M4 18h10" />
      </svg>
    ),
  },
  {
    tab: "playoffs",
    label: "Playoff Bracket",
    shortLabel: "Bracket",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 5h5v6h5M3 19h5v-6M13 12h8" />
      </svg>
    ),
  },
];

export function Header({ activeTab, dark, onSelectTab, onToggleTheme }: HeaderProps) {
  return (
    <>
      <header className={styles.header}>
        <div className={styles.inner}>
          <button className={styles.brand} onClick={() => onSelectTab("boxscores")}>
            <span className={styles.brandBadge}>NBA</span>
            <span className={styles.brandTitle}>
              Who<span className={styles.brandAccent}>Won</span>
            </span>
          </button>

          <nav className={styles.tabs} aria-label="Sections">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.tab}
                className={styles.tab}
                aria-current={activeTab === item.tab ? "page" : undefined}
                onClick={() => onSelectTab(item.tab)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <button
            className={styles.themeToggle}
            onClick={onToggleTheme}
            aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
            title={dark ? "Switch to light theme" : "Switch to dark theme"}
          >
            {dark ? (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
              </svg>
            )}
          </button>
        </div>
        <div className={styles.stripe} />
      </header>

      <nav className={styles.bottomNav} aria-label="Sections">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.tab}
            className={styles.bottomTab}
            aria-current={activeTab === item.tab ? "page" : undefined}
            onClick={() => onSelectTab(item.tab)}
          >
            {item.icon}
            <span>{item.shortLabel}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
