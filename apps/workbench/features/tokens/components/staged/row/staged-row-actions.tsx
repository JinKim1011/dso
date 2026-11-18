import { ResetIcon } from "@radix-ui/react-icons";
import { Button, Tooltip } from "@repo/ui";

type StagedRowActionsProps = {
  rowId: string;
  disabled: boolean;
  onDiscard: (rowId: string) => void;
};

export function StagedRowActions({ rowId, disabled, onDiscard }: StagedRowActionsProps) {
  return (
    <div className="gap-microPlus px-mini flex w-fit">
      <Tooltip content="DISCARD">
        <Button
          size="sm"
          iconOnly={true}
          overrideBgClass="bg-surface-tertiary hover:bg-surface-warn active:bg-surface-warn"
          overrideTextColorClass="text-content-tertiary hover:text-content-warn active:text-content-warn"
          aria-label="discard-row"
          leftIcon={ResetIcon}
          onClick={(event) => {
            event.stopPropagation();
            onDiscard(rowId);
          }}
          disabled={disabled}
        />
      </Tooltip>
    </div>
  );
}
