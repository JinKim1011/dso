"use client";

import { useTheme } from "@/_shared/theme/use-theme";
import { Button } from "@repo/ui";

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
