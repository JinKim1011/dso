"use client";

import { LaptopIcon, MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { Button, SegmentedControl, Text, useTheme, type ThemeMode } from "@repo/ui";

type HeaderProps = {
  currentBranch?: string;
  userName?: string;
};

const themeOptions = [
  { value: "light", iconName: SunIcon, ariaLabel: "Light mode" },
  { value: "dark", iconName: MoonIcon, ariaLabel: "Dark mode" },
  { value: "system", iconName: LaptopIcon, ariaLabel: "System mode" },
];

export function Header({ currentBranch, userName }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const handleThemeChange = (selected: string) => {
    if (selected === "light" || selected === "dark" || selected === "system") {
      setTheme(selected as ThemeMode);
    }
  };

  return (
    <div
      className="px-mini py-mini text-content-primary fixed top-0 z-10 flex w-full items-center justify-between backdrop-blur-[3px]"
      style={{ backgroundImage: "var(--header-gradient)" }}
    >
      <div className="gap-mini inline-flex">
        <Text variant="label-sm" as="span">
          DS0
        </Text>
        <Button variant="void" size="sm">
          GitHub
        </Button>
        <Button variant="void" size="sm">
          Docs
        </Button>
      </div>
      <div className="gap-miniPlus inline-flex w-fit">
        <div className="gap-micro inline-flex items-center">
          <Text variant="label-xs" as="span">
            {userName ? userName : "no user"}
          </Text>
          <Text variant="label-xs" as="span">
            ·
          </Text>
          <Text variant="label-xs" as="span">
            {currentBranch ? currentBranch : "no current branch"}
          </Text>
        </div>
        <SegmentedControl
          options={themeOptions}
          size="sm"
          iconOnly={true}
          onChange={handleThemeChange}
          value={theme}
        />
      </div>
    </div>
  );
}
