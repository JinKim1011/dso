"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import { Button, Text } from "@repo/ui";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useStagedManifest } from "../context/StagedManifestContext";

export function Header() {
  const {
    applyDraft,
    resetDraft,
    changedRowCount,
    addedManifestLineCount,
    deletedManifestLineCount,
  } = useStagedManifest();
  const [isApplying, setIsApplying] = useState(false);
  const path = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const displayLabel =
    changedRowCount != null && changedRowCount > 1
      ? `${String(changedRowCount)} TOKENS CHANGED`
      : changedRowCount === 1
        ? "1 TOKEN CHANGED"
        : "NO TOKENS CHANGED";
  const returnTo = searchParams.get("from");
  const stagedHref =
    path === "/staged"
      ? `/staged?from=${encodeURIComponent(returnTo ?? "/tokens/color")}`
      : `/staged?from=${encodeURIComponent(path)}`;

  const handleBack = () => {
    if (returnTo && returnTo.startsWith("/") && returnTo !== "/staged") {
      router.push(returnTo);
      return;
    }

    router.back();
  };

  const handleBulkApply = async () => {
    setIsApplying(true);

    try {
      const response = await applyDraft();
      if (!response.ok) {
        console.error("Failed to apply manifest(bulk)");
      }
    } finally {
      setIsApplying(false);
    }
  };

  const overrideLinkButtonBGClass =
    "bg-transparent hover:bg-transparent active:bg-transparent";
  const overrideLinkButtonTextClass =
    "text-content-primary hover:text-content-accent active:text-content-accentStrong";
  const wrapperClasses =
    "px-mini py-mini text-content-primary flex h-10 w-full items-center justify-between";

  return path === "/staged" ? (
    <div className={wrapperClasses}>
      <div className="gap-mini inline-flex">
        <Button
          size="sm"
          label="BACK"
          variant="void"
          leftIcon={ChevronLeftIcon}
          onClick={handleBack}
          overrideBgClass={overrideLinkButtonBGClass}
          overrideTextColorClass={overrideLinkButtonTextClass}
        />
      </div>

      {changedRowCount != null && changedRowCount > 1 ? (
        <div className="gap-mini flex">
          <Button
            size="sm"
            label="DISCARD ALL"
            variant="void"
            onClick={resetDraft}
            overrideBgClass="bg-transparent hover:bg-surface-error active:bg-surface-error"
            overrideTextColorClass="text-content-error hover:text-content-error active:text-content-error"
          />
          <Button
            size="sm"
            disabled={isApplying}
            label={isApplying ? "PUSHING..." : "PUSH ALL"}
            variant="void"
            onClick={handleBulkApply}
            overrideBgClass="bg-transparent hover:bg-surface-success active:bg-surface-success"
            overrideTextColorClass="text-content-success hover:text-content-success active:text-content-success"
          />
        </div>
      ) : null}
    </div>
  ) : (
    <div className={wrapperClasses}>
      <div className="gap-mini inline-flex">
        <Text variant="label-sm" as="span">
          DS0
        </Text>
        <Button variant="void" size="sm" label="GitHub" />
        <Button variant="void" size="sm" label="Docs" />
      </div>
      <div className="gap-small flex">
        {addedManifestLineCount > 0 ? (
          <Text variant="label-xs" className="text-content-success">
            +{String(addedManifestLineCount)}
          </Text>
        ) : null}
        {deletedManifestLineCount > 0 ? (
          <Text variant="label-xs" className="text-content-error">
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
        />
      </div>
    </div>
  );
}
