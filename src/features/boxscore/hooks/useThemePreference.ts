import { useCallback, useEffect, useState } from "react";

export type ThemePreference = "system" | "light" | "dark";

const STORAGE_KEY = "whowon-theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";

function readStoredPreference(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : "system";
  } catch {
    return "system";
  }
}

function systemPrefersDark(): boolean {
  return typeof window.matchMedia === "function" && window.matchMedia(DARK_QUERY).matches;
}

export function useThemePreference() {
  const [preference, setPreference] = useState<ThemePreference>(readStoredPreference);
  const [systemDark, setSystemDark] = useState(systemPrefersDark);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") {
      return;
    }

    const media = window.matchMedia(DARK_QUERY);
    const handleChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    media.addEventListener("change", handleChange);

    return () => media.removeEventListener("change", handleChange);
  }, []);

  const dark = preference === "system" ? systemDark : preference === "dark";

  useEffect(() => {
    const root = document.documentElement;
    if (preference === "system") {
      delete root.dataset.theme;
    } else {
      root.dataset.theme = preference;
    }

    try {
      if (preference === "system") {
        window.localStorage.removeItem(STORAGE_KEY);
      } else {
        window.localStorage.setItem(STORAGE_KEY, preference);
      }
    } catch {
      // Storage can be unavailable (private mode); the preference just won't persist.
    }
  }, [preference]);

  // Toggling flips the visible theme; landing back on the system's choice
  // clears the override so the page keeps following the OS setting.
  const toggle = useCallback(() => {
    const nextDark = !dark;
    setPreference(nextDark === systemDark ? "system" : nextDark ? "dark" : "light");
  }, [dark, systemDark]);

  return { dark, preference, toggle };
}
