"use client";

import { CheckIcon, ResetIcon } from "@radix-ui/react-icons";
import { Button, List, Text } from "@repo/ui";
import { useEffect, useRef, useState } from "react";
import { useStagedManifest } from "../_shared/context/StagedManifestContext";
import { StagedRowDetail } from "./component/StagedRowDetail";
import { StagedViewHeader } from "./component/StagedViewHeader";
import { UseStagedRowKeyboardNavigation } from "./lib/useStagedRowKeyboardNavigation";

export function StagedView() {
  const { changedRows, resetDraft, applyDraft, discardRow, applyRow } =
    useStagedManifest();
  const [isApplying, setIsApplying] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;

      if (event.target instanceof Node && !container.contains(event.target)) {
        setSelectedRowId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
  const rowsLength = changedRows.length;

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
    onSelect: () => setSelectedRowId(selectedRowId === row.rowId ? null : row.rowId),
  }));

  UseStagedRowKeyboardNavigation({
    rows: changedRows,
    selectedRowId,
    onSelectRow: (rowId) => setSelectedRowId(rowId),
  });

  return (
    <section className="flex h-dvh w-full flex-col">
      {rowsLength === 0 && (
        <div className="bg-dot-pattern flex h-full w-full items-center justify-center overflow-hidden">
          <Text
            variant="meta-xs"
            className="text-content-accentStrong w-full text-center"
          >
            No staged changes
          </Text>
        </div>
      )}
      {rowsLength !== 0 && (
        <div ref={containerRef}>
          <StagedViewHeader length={rowsLength} guidedText={!!selected}>
            <Button
              variant="outlined"
              size="lg"
              onClick={resetDraft}
              disabled={isApplying}
              label="Discard all"
            />
            <Button
              variant="outlined"
              size="lg"
              onClick={handleBulkApply}
              disabled={isApplying}
              label={isApplying ? "Pushing..." : "Push all"}
            />
          </StagedViewHeader>
          <div className="grid h-full grid-cols-2">
            <List listItems={listItems} />
            {selected && (
              <StagedRowDetail
                id={selected.rowId}
                beforeName={selected.nameBefore}
                afterName={selected.nameAfter}
                before={selected.before}
                after={selected.after}
              />
            )}
            {!selected && (
              <div className="py-regular px-small bg-dot-pattern flex h-full w-full justify-center overflow-hidden">
                <Text
                  variant="meta-xs"
                  className="text-content-accentStrong w-full text-center"
                >
                  select to review
                </Text>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
