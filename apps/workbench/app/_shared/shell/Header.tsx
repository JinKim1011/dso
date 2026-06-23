"use client";

import { ChevronRightIcon } from "@radix-ui/react-icons";
import { Button, Text } from "@repo/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStagedManifest } from "../context/StagedManifestContext";

export function Header() {
  const { changedRowCount, addedManifestLineCount, deletedManifestLineCount } =
    useStagedManifest();
  const path = usePathname();
  const menu = "/staged";
  const isActive = path === menu;
  const displayLabel =
    changedRowCount != null && changedRowCount > 1
      ? `${String(changedRowCount)} TOKENS CHANGED`
      : changedRowCount === 1
        ? "1 TOKEN CHANGED"
        : "NO TOKENS CHANGED";

  return (
    <div
      className="px-mini py-mini text-content-primary flex h-10 w-full items-center justify-between"
      style={{ backgroundImage: "var(--header-gradient)" }}
    >
      <div className="gap-mini inline-flex">
        <Text variant="label-sm" as="span">
          DS0
        </Text>
        <Button variant="void" size="sm" label="GitHub" />
        <Button variant="void" size="sm" label="Docs" />
      </div>

      <Link
        key="staged"
        href="/staged"
        aria-label="staged"
        aria-current={isActive ? "page" : undefined}
        className="px-microPlus gap-micro hover:text-content-accent active:text-content-accentStrong flex cursor-pointer items-center"
      >
        <Text variant="control-xs">{displayLabel}</Text>
        <ChevronRightIcon className="size-3.5 shrink-0" />
      </Link>
    </div>
  );
}
