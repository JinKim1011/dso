"use client";

import { ChevronLeftIcon } from "@radix-ui/react-icons";
import { Button } from "@repo/ui";
import { useState } from "react";
import { useStagedManifest } from "../../_shared/context/StagedManifestContext";

type StagedHeaderProps = {
  onBack: () => void;
};

export function StagedHeader({ onBack }: StagedHeaderProps) {
  const { applyDraft, resetDraft, changedRowCount } = useStagedManifest();
  const [isApplying, setIsApplying] = useState(false);

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

  const wrapperClasses =
    "pr-mini py-mini text-content-primary flex h-10 w-full items-center justify-between";
  const overrideLinkButtonBGClass =
    "bg-transparent hover:bg-transparent active:bg-transparent";
  const overrideLinkButtonTextClass =
    "text-content-primary hover:text-content-accent active:text-content-accentStrong";

  return (
    <div className={wrapperClasses}>
      <div className="gap-mini inline-flex">
        <Button
          size="sm"
          label="BACK"
          variant="void"
          leftIcon={ChevronLeftIcon}
          onClick={onBack}
          overrideBgClass={overrideLinkButtonBGClass}
          overrideTextColorClass={overrideLinkButtonTextClass}
        />
      </div>

      {changedRowCount > 0 ? (
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
  );
}
