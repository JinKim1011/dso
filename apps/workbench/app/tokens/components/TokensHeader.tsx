"use client";

import { ChevronRightIcon } from "@radix-ui/react-icons";
import { Button, Text } from "@repo/ui";
import { useRouter } from "next/navigation";
import { useStagedManifest } from "../../_shared/context/StagedManifestContext";

type TokensHeaderProps = {
  stagedHref: string;
};

export function TokensHeader({ stagedHref }: TokensHeaderProps) {
  const router = useRouter();
  const { changedRowCount, addedManifestLineCount, deletedManifestLineCount } =
    useStagedManifest();

  const wrapperClasses =
    "px-mini py-mini text-content-primary flex h-10 w-full items-center justify-between";
  const overrideLinkButtonBGClass =
    "bg-transparent hover:bg-transparent active:bg-transparent";
  const overrideLinkButtonTextClass =
    "text-content-primary hover:text-content-accent active:text-content-accentStrong";

  const displayLabel =
    changedRowCount != null && changedRowCount > 1
      ? `${String(changedRowCount)} TOKENS CHANGED`
      : changedRowCount === 1
        ? "1 TOKEN CHANGED"
        : "NO TOKENS CHANGED";

  return (
    <div className={wrapperClasses}>
      <div className="gap-mini pointer-events-none inline-flex items-center">
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
      <div className="gap-microPlus flex">
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
