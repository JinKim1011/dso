"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("dso-theme") as Theme;

    if (saved) return saved;

    return window.matchMedia("prefers-color-scheme: dark").matches
      ? "dark"
      : "light";
  });

  useEffect(() => {
    const root = window.document.documentElement;

    root.setAttribute("data-theme", theme);
    localStorage.setItem("dso-theme", theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "light" ? "dark" : "light"));

  return { theme, setTheme, toggleTheme };
};
