"use client";

import { useTheme as useNextTheme } from "next-themes";

export type ThemeMode = "light" | "dark" | "system";

export function useTheme() {
  const { theme, resolvedTheme, setTheme: setNextTheme } = useNextTheme();

  const currentTheme: ThemeMode =
    theme === "light" || theme === "dark" || theme === "system" ? theme : "system";

  const currentResolvedTheme = resolvedTheme === "dark" ? "dark" : "light";

  const setTheme = (nextTheme: ThemeMode) => {
    setNextTheme(nextTheme);
  };

  const toggleTheme = () => {
    setNextTheme(currentResolvedTheme === "dark" ? "light" : "dark");
  };

  return {
    theme: currentTheme,
    resolvedTheme: currentResolvedTheme,
    setTheme,
    toggleTheme,
  };
}
