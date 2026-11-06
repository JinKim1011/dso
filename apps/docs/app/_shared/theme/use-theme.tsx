"use client";

import { useTheme as useNextTheme } from "next-themes";

export type ThemeMode = "light" | "dark" | "system";

export function useTheme() {
  const { theme, resolvedTheme, setTheme: setNextTheme } = useNextTheme();

  const currentTheme: ThemeMode =
    theme === "light" || theme === "dark" || theme === "system" ? theme : "system";

  const currentResolvedTheme = resolvedTheme === "dark" ? "dark" : "light";

  return {
    theme: currentTheme,
    resolvedTheme: currentResolvedTheme,
    setTheme: (nextTheme: ThemeMode) => setNextTheme(nextTheme),
    toggleTheme: () => setNextTheme(currentResolvedTheme === "dark" ? "light" : "dark"),
  };
}
