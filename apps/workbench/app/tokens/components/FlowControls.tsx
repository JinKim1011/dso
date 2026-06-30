import {
  ChevronDownIcon,
  ChevronUpIcon,
  EnterFullScreenIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "@radix-ui/react-icons";
import { Button, Text } from "@repo/ui";
import { type ReactFlowInstance } from "@xyflow/react";

type FlowControlsProps = {
  instance: ReactFlowInstance | null;
  hasPreviousRow: boolean;
  hasNextRow: boolean;
  onPreviousRow: () => void;
  onNextRow: () => void;
  showRowNavigation: boolean;
};

export function FlowControls({
  instance,
  hasPreviousRow,
  hasNextRow,
  onPreviousRow,
  onNextRow,
  showRowNavigation,
}: FlowControlsProps) {
  return (
    <div className="p-microPlus border-stroke-secondary flex justify-between border-b-[0.5]">
      {showRowNavigation ? (
        <div className="gap-micro flex">
          <Button
            variant="void"
            size="sm"
            iconOnly={true}
            leftIcon={ChevronUpIcon}
            disabled={!hasPreviousRow}
            onClick={onPreviousRow}
          />
          <Button
            variant="void"
            size="sm"
            iconOnly={true}
            leftIcon={ChevronDownIcon}
            disabled={!hasNextRow}
            onClick={onNextRow}
          />
        </div>
      ) : (
        <div />
      )}
      <div className="gap-micro flex items-center">
        <Button
          variant="void"
          size="sm"
          iconOnly={true}
          leftIcon={ZoomOutIcon}
          disabled={false}
          onClick={() => instance?.zoomOut()}
        />
        <Button
          variant="void"
          size="sm"
          iconOnly={true}
          leftIcon={ZoomInIcon}
          disabled={false}
          onClick={() => instance?.zoomIn()}
        />
        <Text variant="label-xs" className="text-content-quaternary/30">
          {" "}
          |{" "}
        </Text>
        <Button
          variant="void"
          size="sm"
          iconOnly={true}
          leftIcon={EnterFullScreenIcon}
          disabled={false}
          onClick={() => instance?.fitView()}
        />
      </div>
    </div>
  );
}
