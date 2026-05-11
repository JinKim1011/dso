import { useEffect } from "react";

type useStagedRowKeyboardNavigationParams = {
  rows: Array<{ rowId: string }>;
  selectedRowId: string | null;
  onSelectRow: (rowId: string) => void;
};

export function UseStagedRowKeyboardNavigation({
  rows,
  selectedRowId,
  onSelectRow,
}: useStagedRowKeyboardNavigationParams) {
  useEffect(() => {
    if (!selectedRowId) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const isMoveUp = event.metaKey && event.shiftKey && event.key === "ArrowUp";
      const isMoveDown = event.metaKey && event.shiftKey && event.key === "ArrowDown";

      if (!isMoveUp && !isMoveDown) return;

      const currentIndex = rows.findIndex((row) => row.rowId === selectedRowId);
      if (currentIndex === -1) return;

      event.preventDefault();

      const nextIndex = isMoveUp
        ? Math.max(0, currentIndex - 1)
        : Math.min(rows.length - 1, currentIndex + 1);

      if (nextIndex !== currentIndex && rows[nextIndex]) {
        onSelectRow(rows[nextIndex].rowId);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [rows, selectedRowId, onSelectRow]);
}
