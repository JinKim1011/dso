"use client";

import { AccountMenu } from "@/_shared/shell/footer/account-menu";
import { useTheme, type ThemeMode } from "@/_shared/theme/use-theme";
import { LaptopIcon, MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { SegmentedControl, Toaster } from "@repo/ui";
import { useEffect, useState } from "react";

const themeOptions = [
  { value: "light", iconName: SunIcon, ariaLabel: "Light mode" },
  { value: "dark", iconName: MoonIcon, ariaLabel: "Dark mode" },
  { value: "system", iconName: LaptopIcon, ariaLabel: "System mode" },
];

type FooterProps = {
  email: string;
};

export function Footer({ email }: FooterProps) {
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
    <>
      <Toaster />
      <div className="px-mini py-mini text-content-primary flex h-10 w-full items-center justify-between">
        <div className="-ml-mini">
          <AccountMenu email={email} />
        </div>

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
      </div>
    </>
  );
}
