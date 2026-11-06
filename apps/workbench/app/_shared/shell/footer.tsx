"use client";

import { useTheme, type ThemeMode } from "@/_shared/theme/use-theme";
import { LaptopIcon, MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { Button, SegmentedControl } from "@repo/ui";
import { useEffect, useState } from "react";

const themeOptions = [
  { value: "light", iconName: SunIcon, ariaLabel: "Light mode" },
  { value: "dark", iconName: MoonIcon, ariaLabel: "Dark mode" },
  { value: "system", iconName: LaptopIcon, ariaLabel: "System mode" },
];

export function Footer() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleThemeChange = (selected: string) => {
    if (selected === "light" || selected === "dark" || selected === "system") {
      setTheme(selected as ThemeMode);
    }
  };

  return (
    <div className="px-mini py-mini text-content-primary flex h-10 w-full items-center justify-between">
      {mounted ? (
        <SegmentedControl
          options={themeOptions}
          size="sm"
          iconOnly
          onChange={handleThemeChange}
          value={theme}
        />
      ) : (
        <div className="h-7.5 w-22" aria-hidden="true" />
      )}

      <div className="gap-mini flex">
        <Button variant="void" size="sm" label="GITHUB" />
        <Button variant="void" size="sm" label="DOCS" />
      </div>
    </div>
  );
}
