"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useContext } from "react";
import { workbenchNavigation } from "../../_config/navigation";
import { NavigationSlotContentContext } from "../context/NavigationSlotContext";
import { useStagedManifest } from "../context/StagedManifestContext";

export function Navigation() {
  const path = usePathname();
  const navigationSlot = useContext(NavigationSlotContentContext);
  const { changedRowCount } = useStagedManifest();
  const stagedCount = changedRowCount;

  return (
    <nav
      aria-label="navigation"
      className="p-mini bg-surface-primary shadow-overlay-floating gap-mini fixed bottom-10 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center rounded-[1.625rem]"
    >
      {navigationSlot}
      <div className="gap-microPlus inline-flex w-fit p-0">
        {workbenchNavigation.map((menu) => {
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
              className="rounded-round gap-microPlus p-mini text-content-quaternary duration-highlightFadeIn ease-outCubic hover:bg-surface-tertiary hover:text-content-primary aria-[current=page]:bg-surface-quaternary aria-[current=page]:text-content-primary inline-flex h-9 w-fit shrink-0 items-center justify-center bg-transparent transition-colors"
            >
              {Icon ? <Icon aria-hidden className="size-5 shrink-0" /> : null}
              {!menu.iconOnly ? displayLabel : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
