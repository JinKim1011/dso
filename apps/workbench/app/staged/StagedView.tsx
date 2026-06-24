"use client";

import { CheckIcon, ResetIcon } from "@radix-ui/react-icons";
import { Button, List, Text } from "@repo/ui";
import { useEffect, useMemo, useRef, useState } from "react";
import { useStagedManifest } from "../_shared/context/StagedManifestContext";
import { StagedFilter } from "./component/StagedFilter";
import { StagedRowDetail } from "./component/StagedRowDetail";
import FILTER_OPTIONS, { type StagedFilterOption } from "./lib/StageFilterOption";
import { UseStagedRowKeyboardNavigation } from "./lib/useStagedRowKeyboardNavigation";

export function StagedView() {
  const { changedRows, discardRow, applyRow } = useStagedManifest();
  const [isApplying, setIsApplying] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<StagedFilterOption>("All");
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

  useEffect(() => {
    setSelectedRowId(null);
  }, [activeFilter]);

  const filteredCategories = useMemo(() => {
    const categories = FILTER_OPTIONS.filter(
      (option) =>
        option === "All" ||
        changedRows.some((row) => row.category.toUpperCase() === option),
    );

    return categories;
  }, [changedRows]);

  useEffect(() => {
    if (activeFilter === "All") return;

    if (!filteredCategories.includes(activeFilter)) {
      setActiveFilter("All");
    }
  }, [activeFilter, filteredCategories]);

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

  const filteredRows = changedRows.filter(
    (row) => activeFilter === "All" || row.category.toUpperCase() === activeFilter,
  );

  const selected = filteredRows.find((row) => row.rowId === selectedRowId) ?? null;
  const rowsLength = filteredRows.length;

  const listItems = filteredRows.map((row) => ({
    id: row.rowId,
    text: row.nameAfter,
    subText: row.tokenType,
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
    rows: filteredRows,
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
        <div ref={containerRef} className="m-auto h-full w-full">
          <div className="flex h-full">
            <div className="bg-surface-secondary flex w-full max-w-100 flex-col">
              <StagedFilter
                activeFilter={activeFilter}
                onChange={setActiveFilter}
                availableOptions={filteredCategories}
              />
              <List listItems={listItems} className="w-full max-w-md" />
            </div>
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
