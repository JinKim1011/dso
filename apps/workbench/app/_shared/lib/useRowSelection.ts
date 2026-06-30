import { useEffect, useState } from "react";

type UseRowSelectionProps = {
  resetTrigger?: unknown;
};

export function useRowSelection({ resetTrigger }: UseRowSelectionProps = {}) {
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedRowId(null);
  }, [resetTrigger]);

  const toggleRowSelection = (rowId: string) => {
    setSelectedRowId((current) => (current === rowId ? null : rowId));
  };

  const clearSelection = () => {
    setSelectedRowId(null);
  };

  return {
    selectedRowId,
    toggleRowSelection,
    clearSelection,
  };
}
