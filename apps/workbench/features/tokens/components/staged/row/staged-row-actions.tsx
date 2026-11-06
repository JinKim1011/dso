import { CheckIcon, ResetIcon } from "@radix-ui/react-icons";
import { Button, Tooltip } from "@repo/ui";

type StagedRowActionsProps = {
  rowId: string;
  isApplying: boolean;
  onDiscard: (rowId: string) => void;
  onApply: (rowId: string) => void;
};

export function StagedRowActions({
  rowId,
  isApplying,
  onDiscard,
  onApply,
}: StagedRowActionsProps) {
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
          disabled={isApplying}
        />
      </Tooltip>
      <Tooltip content="PUSH">
        <Button
          size="sm"
          iconOnly={true}
          overrideBgClass="bg-surface-tertiary hover:bg-surface-success active:bg-surface-success"
          overrideTextColorClass="text-content-tertiary hover:text-content-success active:text-content-success"
          aria-label="apply-row"
          leftIcon={CheckIcon}
          onClick={(event) => {
            event.stopPropagation();
            onApply(rowId);
          }}
          disabled={isApplying}
        />
      </Tooltip>
    </div>
  );
}
