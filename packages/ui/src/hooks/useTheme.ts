"use client";

import { useEffect, useState } from "react";

export type ThemeMode = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

function isThemeMode(value: string | null): value is ThemeMode {
  return value === "light" || value === "dark" || value === "system";
}

export const useTheme = () => {
  const [theme, setTheme] = useState<ThemeMode>("system");
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>("light");
  const [isMounted, setIsMounted] = useState(false); // guard so broswer only logic runs after mount

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemTheme(mediaQuery.matches ? "dark" : "light");

    const saved = localStorage.getItem("dso-theme");
    if (isThemeMode(saved)) {
      setTheme(saved);
    }

    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) {
      return;
    }

    const root = window.document.documentElement;
    const resolvedTheme = theme === "system" ? systemTheme : theme;

    root.setAttribute("data-theme", resolvedTheme);
    root.setAttribute("data-theme-mode", theme);
    localStorage.setItem("dso-theme", theme);
  }, [isMounted, systemTheme, theme]);

  useEffect(() => {
    if (!isMounted) {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystemTheme(mediaQuery.matches ? "dark" : "light");

    mediaQuery.addEventListener("change", onChange);

    // prevents setSystemTheme from callback consistenlty, even when this hook is no longer active
    return () => {
      mediaQuery.removeEventListener("change", onChange);
    };
  }, [isMounted]); //

  const toggleTheme = () =>
    setTheme((prev) => {
      const current = prev === "system" ? systemTheme : prev;
      return current === "light" ? "dark" : "light";
    });

  const resolvedTheme: ResolvedTheme = theme === "system" ? systemTheme : theme;

  return { theme, resolvedTheme, setTheme, toggleTheme };
};
