"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useContext } from "react";
import { workbenchNavigation } from "../../_config/navigation";
import { NavigationSlotDetailContext } from "../context/NavigationSlotContext";
import { useStagedManifest } from "../context/StagedManifestContext";

export function Navigation() {
  const path = usePathname();
  const navigationSlot = useContext(NavigationSlotDetailContext);
  const { changedRowCount } = useStagedManifest();
  const stagedCount = changedRowCount;

  const tokensMenuItems = workbenchNavigation.filter((menu) => menu.id !== "staged");
  const stagedMenuItem = workbenchNavigation.filter((menu) => menu.id === "staged");

  const navWrapperStyles =
    "p-microPlus bg-surface-primary shadow-overlay-floating gap-mini flex-col items-center rounded-mini h-fit";
  const menuItemStyles =
    "rounded-micro gap-microPlus p-mini text-content-quaternary duration-highlightFadeIn ease-outCubic hover:bg-surface-tertiary hover:text-content-primary aria-[current=page]:bg-surface-quaternary aria-[current=page]:text-content-primary inline-flex h-9 w-fit shrink-0 items-center justify-center bg-transparent transition-colors";

  return (
    <div className="gap-microPlus fixed bottom-10 left-1/2 z-10 flex -translate-x-1/2">
      <nav aria-label="navigation" className={navWrapperStyles}>
        {navigationSlot}
        <div className="gap-microPlus inline-flex w-fit p-0">
          {tokensMenuItems.map((menu) => {
            const isActive = path === menu.href;
            const Icon = menu.icon;

            return (
              <Link
                key={menu.href}
                href={menu.href}
                aria-label={menu.id}
                aria-current={isActive ? "page" : undefined}
                className={menuItemStyles}
              >
                {Icon ? <Icon aria-hidden className="size-5 shrink-0" /> : null}
              </Link>
            );
          })}
        </div>
      </nav>
      <nav aria-label="navigation" className={navWrapperStyles}>
        <div className="gap-microPlus inline-flex w-fit p-0">
          {stagedMenuItem.map((menu) => {
            const isActive = path === menu.href;
            const Icon = menu.icon;
            const displayLabel =
              menu.id === "staged" && stagedCount != null && stagedCount > 0
                ? String(stagedCount)
                : null;

            return (
              <Link
                key={menu.href}
                href={menu.href}
                aria-label={menu.id}
                aria-current={isActive ? "page" : undefined}
                className={menuItemStyles}
              >
                {Icon ? <Icon aria-hidden className="size-5 shrink-0" /> : null}
                {!menu.iconOnly ? displayLabel : null}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
