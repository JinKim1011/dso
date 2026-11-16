"use client";

import { useTheme, type ThemeMode } from "@/_shared/theme/use-theme";
import { ExitIcon, LaptopIcon, MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { Button, SegmentedControl, Text, Toaster } from "@repo/ui";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const themeOptions = [
  { value: "light", iconName: SunIcon, ariaLabel: "Light mode" },
  { value: "dark", iconName: MoonIcon, ariaLabel: "Dark mode" },
  { value: "system", iconName: LaptopIcon, ariaLabel: "System mode" },
];

type FooterProps = {
  email: string;
  role: string;
};

export function Footer({ email, role }: FooterProps) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleThemeChange = (selected: string) => {
    if (selected === "light" || selected === "dark" || selected === "system") {
      setTheme(selected as ThemeMode);
    }
  };

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok && response.status !== 401) {
        Toaster.toast.error("Unable to log out. Please try again.");
        return;
      }

      router.replace("/login");
      router.refresh();
    } catch {
      Toaster.toast.error("Unable to log out. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="px-mini py-mini text-content-primary flex h-10 w-full items-center">
      <Toaster />
      <div className="gap-mini flex flex-1 items-center">
        <Text variant="meta-xs" as="span" className="text-content-secondary">
          {email}
        </Text>
        <Text variant="label-xxs" as="span" className="text-content-tertiary/30">
          |
        </Text>
        <Text variant="meta-xs" as="span" className="text-content-tertiary/70">
          {role}
        </Text>
        <Button
          variant="void"
          size="sm"
          aria-label={loggingOut ? "LOGGING OUT..." : "LOG OUT"}
          iconOnly={true}
          leftIcon={ExitIcon}
          onClick={handleLogout}
          disabled={loggingOut}
        />
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
  );
}
