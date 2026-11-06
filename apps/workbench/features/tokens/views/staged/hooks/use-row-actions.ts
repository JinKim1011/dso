import { useState } from "react";

type UseRowActionsProps = {
  applyRow: (rowId: string) => Promise<Response>;
  discardRow: (rowId: string) => void;
};

export function useRowActions({ applyRow, discardRow }: UseRowActionsProps) {
  const [isApplying, setIsApplying] = useState(false);

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

  const handleRowDiscard = (rowId: string) => {
    discardRow(rowId);
  };

  return {
    isApplying,
    handleRowApply,
    handleRowDiscard,
  };
}
