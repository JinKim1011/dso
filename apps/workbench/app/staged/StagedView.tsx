"use client";

import { Button } from "@repo/ui";
import { useState } from "react";
import { useStagedManifest } from "../_shared/context/StagedManifestContext";

export function StagedView() {
  const { changedRows, resetDraft, applyDraft } = useStagedManifest();
  const [isApplying, setIsApplying] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  const handleApply = async () => {
    setIsApplying(true);

    try {
      const response = await applyDraft();
      if (!response.ok) {
        console.error("Failed to apply manifest");
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
      <Button variant="fill" onClick={handleApply} disabled={isApplying}>
        {isApplying ? "Applying..." : "Apply"}
      </Button>
      <table>
        <thead>
          <tr>
            <th scope="col">NAME</th>
            <th scope="col">CATEGORY</th>
            <th scope="col">TOKEN TYPE</th>
            <th scope="col">KIND</th>
            <th scope="col"> </th>
          </tr>
        </thead>
        <tbody>
          {changedRows.map((row) => (
            <tr
              key={row.rowId}
              data-testid={row.rowId}
              aria-selected={selectedRowId === row.rowId}
              onClick={() => setSelectedRowId(row.rowId)}
            >
              <td>
                {row.nameBefore !== row.nameAfter
                  ? `${row.nameAfter}(prev. ${row.nameBefore})`
                  : row.nameBefore}
              </td>
              <td>{row.category}</td>
              <td>{row.tokenType}</td>
              <td>{row.kind}</td>
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
                />
                <Button
                  variant="void"
                  aria-label="apply-row"
                  inline={true}
                  iconOnly={true}
                  leftIcon={CheckIcon}
                  onClick={(event) => {
                    event.stopPropagation();
                    applyRow(row.rowId);
                  }}
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
