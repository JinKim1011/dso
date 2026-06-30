import { useCallback, useMemo } from "react";

type RowLike = {
  id: string;
};

type useRowNavigationProps = {
  rows: RowLike[];
  selectedRowId: string | null;
  onSelectRow: (rowId: string) => void;
};

export function useRowNavigation({
  rows,
  selectedRowId,
  onSelectRow,
}: useRowNavigationProps) {
  const selectedRowIndex = useMemo(() => {
    if (selectedRowId === null) return -1;

    return rows.findIndex((row) => row.id === selectedRowId);
  }, [rows, selectedRowId]);

  const hasPreviousRow = selectedRowIndex > 0;
  const hasNextRow = selectedRowIndex >= 0 && selectedRowIndex < rows.length - 1;

  const selectPreviousRow = useCallback(() => {
    if (selectedRowIndex <= 0) return;

    const previousRow = rows[selectedRowIndex - 1];
    if (!previousRow) return;

    onSelectRow(previousRow.id);
  }, [rows, selectedRowIndex, onSelectRow]);

  const selectNextRow = useCallback(() => {
    if (selectedRowIndex < 0 || selectedRowIndex >= rows.length - 1) return;

    const nextRow = rows[selectedRowIndex + 1];
    if (!nextRow) return;

    onSelectRow(nextRow.id);
  }, [rows, selectedRowIndex, onSelectRow]);

  return {
    hasPreviousRow,
    hasNextRow,
    selectPreviousRow,
    selectNextRow,
  };
}
