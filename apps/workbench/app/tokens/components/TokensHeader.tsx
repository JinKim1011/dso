"use client";

import { ChevronRightIcon } from "@radix-ui/react-icons";
import { Button, Text } from "@repo/ui";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useStagedManifest } from "../../_shared/context/StagedManifestContext";
import { tokenNavigationItems } from "../lib/navigation";

type TokensHeaderProps = {
  stagedHref: string;
};

export function TokensHeader({ stagedHref }: TokensHeaderProps) {
  const path = usePathname();
  const router = useRouter();
  const { changedRowCount, addedManifestLineCount, deletedManifestLineCount } =
    useStagedManifest();

  const wrapperClasses =
    "px-mini py-mini text-content-primary flex h-10 w-full items-center justify-between";
  const leftwrapperClasses =
    "flex-1 gap-mini p-mini pointer-events-none inline-flex items-center justify-start";
  const centerWrapperClasses = "flex-1 gap-micro flex justify-center";
  const rightWrapperClasses = "flex-1 gap-microPlus flex justify-end";

  const overrideLinkButtonBGClass =
    "bg-transparent hover:bg-transparent active:bg-transparent";
  const overrideLinkButtonTextClass =
    "text-content-primary hover:text-content-accent active:text-content-accentStrong";

  const menuItemStyles = [
    "h-7.5 w-fit shrink-0",
    "inline-flex items-center justify-center",
    "p-mini rounded-mini",
    "bg-transparent text-content-quaternary",
    "transition-colors duration-highlightFadeIn ease-outCubic hover:bg-surface-secondary hover:text-content-primary",
    "aria-[current=page]:bg-surface-tertiary aria-[current=page]:text-content-primary",
  ].join(" ");

  const displayLabel =
    changedRowCount != null && changedRowCount > 1
      ? `${String(changedRowCount)} TOKENS CHANGED`
      : changedRowCount === 1
        ? "1 TOKEN CHANGED"
        : "NO TOKENS CHANGED";

  return (
    <div className={wrapperClasses}>
      <div className={leftwrapperClasses}>
        <Text variant="label-sm" as="span">
          DS0
        </Text>
        <Text variant="label-xxs" as="span" className="text-content-tertiary/30">
          |
        </Text>
        <Text variant="label-xxs" as="span" className="text-content-tertiary/70">
          DESIGN TOKEN MANAGER
        </Text>
      </div>
      <div className={centerWrapperClasses}>
        {tokenNavigationItems.map((menu) => {
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
              {Icon ? <Icon aria-hidden className="size-3.5 shrink-0" /> : null}
            </Link>
          );
        })}
      </div>
      <div className={rightWrapperClasses}>
        {addedManifestLineCount > 0 ? (
          <Text variant="label-xs" className="text-content-success pointer-events-none">
            +{String(addedManifestLineCount)}
          </Text>
        ) : null}
        {deletedManifestLineCount > 0 ? (
          <Text variant="label-xs" className="text-content-error pointer-events-none">
            -{String(deletedManifestLineCount)}
          </Text>
        ) : null}
        <Button
          size="sm"
          label={displayLabel}
          variant="void"
          rightIcon={ChevronRightIcon}
          onClick={() => router.push(stagedHref)}
          overrideBgClass={overrideLinkButtonBGClass}
          overrideTextColorClass={overrideLinkButtonTextClass}
          aria-label="staged"
          className="ml-mini"
        />
      </div>
    </div>
  );
}
