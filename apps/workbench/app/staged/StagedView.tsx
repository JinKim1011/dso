"use client";

import { CheckIcon, ResetIcon } from "@radix-ui/react-icons";
import { Button } from "@repo/ui";
import { useState } from "react";
import { useStagedManifest } from "../_shared/context/StagedManifestContext";

export function StagedView() {
  const { changedRows, resetDraft, applyDraft, discardRow, applyRow } =
    useStagedManifest();
  const [isApplying, setIsApplying] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

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

  const handleRowApply = async (rowId: string) => {
    setIsApplying(true);

    try {
      const response = await applyRow(rowId);
      if (!response.ok) {
        console.error("Failed to apply manifest(row)");
      }
    } finally {
      setIsApplying(false);
    }
  };

  const selected = changedRows.find((row) => row.rowId === selectedRowId) ?? null;

  const listItems = changedRows.map((row) => ({
    id: row.rowId,
    text: row.nameAfter,
    subText: `${row.category} > ${row.tokenType}`,
    selected: selectedRowId === row.rowId,
    children: (
      <div className="gap-microPlus px-mini flex w-fit">
        <Button
          size="sm"
          iconOnly={true}
          overrideBgClass="bg-surface-tertiary hover:bg-surface-warn active:bg-surface-warn"
          overrideTextColorClass="text-content-tertiary hover:text-content-warn active:text-content-warn"
          aria-label="discard-row"
          leftIcon={ResetIcon}
          onClick={(event) => {
            event.stopPropagation();
            discardRow(row.rowId);
          }}
          disabled={isApplying}
        />
        <Button
          size="sm"
          iconOnly={true}
          overrideBgClass="bg-surface-tertiary hover:bg-surface-success active:bg-surface-success"
          overrideTextColorClass="text-content-tertiary hover:text-content-success active:text-content-success"
          aria-label="apply-row"
          leftIcon={CheckIcon}
          onClick={(event) => {
            event.stopPropagation();
            handleRowApply(row.rowId);
          }}
          disabled={isApplying}
        />
      </div>
    ),
    onSelect: () => setSelectedRowId(row.rowId),
  }));

  const pageWrapper = "flex ";

  return (
    <section className="py-large px-smallPlus m-auto flex w-full max-w-5xl flex-col">
      <Button variant="outlined" onClick={resetDraft} disabled={isApplying}>
        Discard all
      </Button>
      <Button variant="fill" onClick={handleBulkApply} disabled={isApplying}>
        {isApplying ? "Applying..." : "Apply"}
      </Button>
      <List listItems={listItems} />
      {selected && (
        <div data-testid={`detail: ${selected.rowId}`}>
          <div data-testid={`before: ${selected.rowId}`}>
            {selected.before.preview
              ? `show before ${selected.before.preview.kind} preview`
              : null}
            {selected.before.meta}
          </div>
          <div data-testid={`after: ${selected.rowId}`}>
            {selected.after.preview
              ? `show after ${selected.after.preview.kind} preview`
              : null}
            {selected.after.meta}
          </div>
        </div>
      )}
    </section>
  );
}
