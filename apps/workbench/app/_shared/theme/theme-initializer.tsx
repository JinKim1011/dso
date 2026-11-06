"use client";

import { useEffect } from "react";

function isThemeMode(value: string | null): value is "light" | "dark" | "system" {
  return value === "light" || value === "dark" || value === "system";
}

export function ThemeInitializer() {
  useEffect(() => {
    const saved = window.localStorage.getItem("dso-theme");
    const mode = isThemeMode(saved) ? saved : "system";

    const resolved =
      mode === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : mode;

    document.documentElement.setAttribute("data-theme", resolved);
    document.documentElement.setAttribute("data-theme-mode", mode);
  }, []);

  return null;
}
