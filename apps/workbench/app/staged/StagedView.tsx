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

  return (
    <section className="py-largePlus flex flex-col items-center justify-center">
      <Button variant="outlined" onClick={resetDraft} disabled={isApplying}>
        Discard all
      </Button>
      <Button variant="fill" onClick={handleBulkApply} disabled={isApplying}>
        {isApplying ? "Applying..." : "Apply"}
      </Button>
      <table>
        <thead>
          <tr>
            <th scope="col">NAME</th>
            <th scope="col">CATEGORY</th>
            <th scope="col">TOKEN TYPE</th>
            <th scope="col"> </th>
          </tr>
        </thead>
        <tbody>
          {changedRows.map((row) => (
            <tr
              key={row.rowId}
              data-testid={row.rowId}
              aria-selected={selectedRowId === row.rowId}
              tabIndex={0}
              onClick={() => setSelectedRowId(row.rowId)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSelectedRowId(row.rowId);
                }
              }}
            >
              <td>
                {row.nameBefore !== row.nameAfter
                  ? `${row.nameAfter}(prev. ${row.nameBefore})`
                  : row.nameBefore}
              </td>
              <td>{row.category}</td>
              <td>{row.tokenType}</td>
              <td>
                <Button
                  variant="void"
                  aria-label="discard-row"
                  inline={true}
                  iconOnly={true}
                  leftIcon={ResetIcon}
                  onClick={(event) => {
                    event.stopPropagation();
                    discardRow(row.rowId);
                  }}
                  disabled={isApplying}
                />
                <Button
                  variant="void"
                  aria-label="apply-row"
                  inline={true}
                  iconOnly={true}
                  leftIcon={CheckIcon}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleRowApply(row.rowId);
                  }}
                  disabled={isApplying}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
