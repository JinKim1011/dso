"use client";

import { Button, useTheme } from "@repo/ui";

export default function Home() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="">
      <Button
        variant="fill"
        size="lg"
        onClick={toggleTheme}
        label={`${theme === "light" ? "Dark" : "Light"} Mode`}
      />
      <main className=""></main>
    </div>
  );
}
