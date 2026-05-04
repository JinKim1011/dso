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
      <Button variant="outlined" onClick={resetDraft}>
        Discard all
      </Button>
      <Button variant="fill" onClick={handleApply}>
        {isApplying ? "Applying..." : "Apply"}
      </Button>
      <ul>
        {changedRows.map((row) => (
          <li key={row.rowId} data-testid={row.rowId}>
            <button
              aria-pressed={selectedRowId === row.rowId}
              onClick={() => setSelectedRowId(row.rowId)}
            >
              {row.nameBefore !== row.nameAfter
                ? `${row.nameAfter}(prev. ${row.nameBefore})`
                : row.nameBefore}

              <span>{row.category}</span>
              <span>{row.kind}</span>
            </button>
          </li>
        ))}
      </ul>
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
