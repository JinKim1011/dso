"use client";

import { Button } from "@repo/ui";
import { useState } from "react";
import { useStagedManifest } from "../_shared/context/StagedManifestContext";

export function StagedView() {
  const { resetDraft, applyDraft } = useStagedManifest();
  const [isApplying, setIsApplying] = useState(false);

  const handleApply = async () => {
    setIsApplying(true);
    const response = await applyDraft();
    setIsApplying(false);

    if (!response.ok) {
      console.error("Failed to apply manifest");
    }
  };

  return (
    <section>
      <Button variant="outlined" onClick={resetDraft}>
        Discard all
      </Button>
      <Button variant="fill" size="sm" onClick={handleApply}>
        {isApplying ? "Applying..." : "Apply"}
      </Button>
    </section>
  );
}
