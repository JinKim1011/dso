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
    const response = await applyDraft();
    setIsApplying(false);

    if (!response.ok) {
      console.error("Failed to apply manifest");
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
          <li key={row.rowId}>
            <button
              aria-pressed={selectedRowId === row.rowId}
              onClick={() => setSelectedRowId(row.rowId)}
            >
              <span>
                {row.nameBefore !== row.nameAfter
                  ? `${row.nameAfter}(prev. ${row.nameBefore})`
                  : row.nameBefore}
              </span>
              <span>${row.category}</span>
              <span>${row.kind}</span>
            </button>
          </li>
        ))}
      </ul>
      {selected && (
        <div data-testId={`detail: ${selected.rowId}`}>
          <div data-testId={`before: ${selected.rowId}`}>
            {selected.before.preview
              ? `show ${selected.before.preview.kind} preview`
              : null}
            {selected.before.meta}
          </div>
          <div data-testId={`after: ${selected.rowId}`}>
            {selected.after.preview
              ? `show ${selected.after.preview.kind} preview`
              : null}
            {selected.after.meta}
          </div>
        </div>
      )}
    </section>
  );
}
