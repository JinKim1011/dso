"use client";

import { List, Text } from "@repo/ui";
import { useEffect, useMemo, useRef } from "react";
import { useStagedManifest } from "../_shared/context/StagedManifestContext";
import { StagedFilter } from "./component/StagedFilter";
import { StagedRowActions } from "./component/StagedRowActions";
import { StagedRowDetail } from "./component/StagedRowDetail";
import { useFilterState } from "./lib/useFilterState";
import { useRowActions } from "./lib/useRowActions";
import { useRowSelection } from "./lib/useRowSelection";
import { useStagedRowKeyboardNavigation } from "./lib/useStagedRowKeyboardNavigation";

export function StagedView() {
  const { changedRows, discardRow, applyRow } = useStagedManifest();
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
      (row) => activeFilter === "All" || row.category.toUpperCase() === activeFilter,
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
        <div ref={containerRef} className="m-auto h-full w-full">
          <div className="flex h-full">
            <div className="bg-surface-secondary border-stroke-primary flex w-full max-w-sm flex-col border-r-[0.5]">
              <StagedFilter
                activeFilter={activeFilter}
                onChange={setActiveFilter}
                availableOptions={filteredCategories}
              />
              <List listItems={listItems} className="py-microPlus w-full" />
            </div>
            {selectedRow && (
              <StagedRowDetail
                id={selectedRow.rowId}
                beforeName={selectedRow.nameBefore}
                afterName={selectedRow.nameAfter}
                before={selectedRow.before}
                after={selectedRow.after}
              />
            )}
            {!selectedRow && (
              <div className="px-small bg-dot-pattern flex h-full w-full justify-center overflow-hidden">
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
