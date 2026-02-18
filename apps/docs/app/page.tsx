"use client";

import { useTheme, Button } from "@repo/ui";

export default function Home() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="">
      <Button variant="fill" size="lg" onClick={toggleTheme}>
        {theme === "light" ? "Dark" : "Light"} Mode
      </Button>
      <main className="">
        <h2>Getting Started</h2>
        <p>
          DSO(Design System Oracle) is a visual Git client for design tokens. It
          lets designer audit components, ajdust token value and mappings, and
          generate clean commits that keep code aligned with the design system.
        </p>
        <h3>Installation</h3>
      </main>
    </div>
  );
}
