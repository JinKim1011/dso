"use client";

import { StagedRowActions } from "@/features/tokens/components/staged/row/staged-row-actions";
import { StagedRowDetail } from "@/features/tokens/components/staged/row/staged-row-detail";
import { StagedFilter } from "@/features/tokens/components/staged/staged-filter";
import { useRowSelection } from "@/features/tokens/navigation/use-row-selection";
import { useStagedManifest } from "@/features/tokens/state/staged-manifest-context";
import { useFilterState } from "@/features/tokens/views/staged/hooks/use-filter-state";
import { useRowActions } from "@/features/tokens/views/staged/hooks/use-row-actions";
import { useStagedRowKeyboardNavigation } from "@/features/tokens/views/staged/hooks/use-staged-row-keyboard-navigation";
import { List, Text } from "@repo/ui";
import { useEffect, useMemo, useRef } from "react";

export function StagedView() {
  const {
    baseModel,
    draftModel,
    changedRows,
    discardRow,
    applyRow,
    isStaleDraft,
    draftLoadError,
  } = useStagedManifest();
  const { activeFilter, setActiveFilter, filteredCategories } = useFilterState({
    changedRows,
  });
  const { selectedRowId, toggleRowSelection } = useRowSelection({
    resetTrigger: activeFilter,
  });
  const { isApplying, handleRowApply, handleRowDiscard } = useRowActions({
    applyRow,
    discardRow,
  });

  const filteredRows = useMemo(() => {
    return changedRows.filter(
      (row) => activeFilter === "ALL" || row.category.toUpperCase() === activeFilter,
    );
  }, [changedRows, activeFilter]);

  const selectedRow = useMemo(() => {
    return filteredRows.find((row) => row.rowId === selectedRowId) ?? null;
  }, [filteredRows, selectedRowId]);

  const rowsLength = filteredRows.length;

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;

      if (event.target instanceof Node && !container.contains(event.target)) {
        if (selectedRowId) {
          toggleRowSelection(selectedRowId);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedRowId, toggleRowSelection]);

  const listItems = filteredRows.map((row) => ({
    id: row.rowId,
    text: row.nameAfter,
    subText: row.tokenType,
    selected: selectedRowId === row.rowId,
    children: (
      <StagedRowActions
        rowId={row.rowId}
        isApplying={isApplying}
        onDiscard={handleRowDiscard}
        onApply={handleRowApply}
      />
    ),
    onSelect: () => toggleRowSelection(row.rowId),
  }));

  useStagedRowKeyboardNavigation({
    rows: filteredRows,
    selectedRowId,
    onSelectRow: (rowId) => {
      if (selectedRowId !== rowId) {
        toggleRowSelection(rowId);
      }
    },
  });

  return (
    <section className="flex h-full w-full flex-col">
      {/* // will be replaced by toaster later */}
      {isStaleDraft && (
        <p role="alert" className="text-content-error p-small">
          Project data changed since this draft was created. Your edits are preserved, but
          applying is disabled. Discard all changes to use the current project data.
        </p>
      )}
      {draftLoadError && (
        <p role="alert" className="text-content-error p-small">
          The saved draft could not be restored. Applying is disabled. Discard all to
          remove it and start from the current project data.
        </p>
      )}
      {rowsLength === 0 && (
        <div className="bg-dot-pattern rounded-mini border-stroke-secondary flex h-full w-full items-center justify-center overflow-hidden border">
          <Text
            variant="meta-xs"
            className="text-content-accentStrong w-full text-center"
          >
            No staged changes
          </Text>
        </div>
      )}
      {rowsLength !== 0 && (
        <div className="m-auto h-full w-full">
          <div className="flex h-full">
            <div className="flex w-full max-w-90 flex-col">
              <StagedFilter
                activeFilter={activeFilter}
                onChange={setActiveFilter}
                availableOptions={filteredCategories}
              />
              <div ref={containerRef}>
                <List listItems={listItems} className="py-micro w-full" />
              </div>
            </div>
            {selectedRow && (
              <StagedRowDetail
                id={selectedRow.rowId}
                beforeName={selectedRow.nameBefore}
                afterName={selectedRow.nameAfter}
                before={selectedRow.before}
                after={selectedRow.after}
                references={selectedRow.change.references}
                baseModel={baseModel}
                draftModel={draftModel}
              />
            )}
            {!selectedRow && (
              <div className="px-small bg-dot-pattern rounded-mini border-stroke-secondary flex h-full w-full items-center justify-center overflow-hidden border">
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
