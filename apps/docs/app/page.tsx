"use client";

import { Button, useTheme } from "@repo/ui";

export default function Home() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="">
      <Button variant="fill" size="lg" onClick={toggleTheme}>
        {theme === "light" ? "Dark" : "Light"} Mode
      </Button>
      <main className=""></main>
    </div>
  );
}
