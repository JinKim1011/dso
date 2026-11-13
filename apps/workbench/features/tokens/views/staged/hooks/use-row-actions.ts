type UseRowActionsProps = {
  applyRow: (rowId: string) => Promise<Response>;
  discardRow: (rowId: string) => void;
};

export function useRowActions({ applyRow, discardRow }: UseRowActionsProps) {
  const handleRowApply = async (rowId: string) => {
    await applyRow(rowId);
  };

  const handleRowDiscard = (rowId: string) => {
    discardRow(rowId);
  };

  return {
    handleRowApply,
    handleRowDiscard,
  };
}
