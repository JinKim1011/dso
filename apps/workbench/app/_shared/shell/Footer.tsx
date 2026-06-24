"use client";

import { LaptopIcon, MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { SegmentedControl, useTheme, type ThemeMode } from "@repo/ui";

const themeOptions = [
  { value: "light", iconName: SunIcon, ariaLabel: "Light mode" },
  { value: "dark", iconName: MoonIcon, ariaLabel: "Dark mode" },
  { value: "system", iconName: LaptopIcon, ariaLabel: "System mode" },
];

export function Footer() {
  const { theme, setTheme } = useTheme();
  const handleThemeChange = (selected: string) => {
    if (selected === "light" || selected === "dark" || selected === "system") {
      setTheme(selected as ThemeMode);
    }
  };

  return (
    <div className="px-mini py-mini text-content-primary flex h-10 w-full items-center justify-between">
      <SegmentedControl
        options={themeOptions}
        size="sm"
        iconOnly={true}
        onChange={handleThemeChange}
        value={theme}
      />
    </div>
  );
}
