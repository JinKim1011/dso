"use client";

import { useStagedManifest } from "@/features/tokens/state/staged-manifest-context";
import { ChevronLeftIcon } from "@radix-ui/react-icons";
import { Button, Tooltip } from "@repo/ui";

type StagedHeaderProps = {
  onBack: () => void;
};

export function StagedHeader({ onBack }: StagedHeaderProps) {
  const {
    applyDraft,
    resetDraft,
    changedRowCount,
    isStaleDraft,
    draftLoadError,
    isApplying,
    canApply,
    outcomeUnknown,
  } = useStagedManifest();

  const handleBulkApply = async () => {
    await applyDraft();
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

      {changedRowCount > 0 || isStaleDraft || draftLoadError ? (
        <div className="gap-mini flex">
          <Tooltip
            content={`${changedRowCount} ${changedRowCount === 1 ? "CHANGE" : "CHANGES"}`}
          >
            <Button
              size="sm"
              label="DISCARD ALL"
              variant="void"
              onClick={resetDraft}
              disabled={isApplying || outcomeUnknown}
              overrideBgClass="bg-transparent hover:bg-surface-error active:bg-surface-error"
              overrideTextColorClass="text-content-error hover:text-content-error active:text-content-error"
            />
          </Tooltip>
          <Tooltip
            content={`${changedRowCount} ${changedRowCount === 1 ? "CHANGE" : "CHANGES"}`}
          >
            <Button
              size="sm"
              disabled={isApplying || !canApply || changedRowCount === 0}
              label={isApplying ? "PUSHING..." : "PUSH ALL"}
              variant="void"
              onClick={handleBulkApply}
              overrideBgClass="bg-transparent hover:bg-surface-success active:bg-surface-success"
              overrideTextColorClass="text-content-success hover:text-content-success active:text-content-success"
            />
          </Tooltip>
        </div>
      ) : null}
    </div>
  );
}
