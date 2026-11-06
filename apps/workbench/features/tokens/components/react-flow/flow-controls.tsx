import {
  ChevronDownIcon,
  ChevronUpIcon,
  EnterFullScreenIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "@radix-ui/react-icons";
import { Button, Text, Tooltip } from "@repo/ui";
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
    <div className="p-microPlus border-stroke-secondary flex justify-between border-b-[0.5px]">
      {showRowNavigation ? (
        <div className="gap-micro flex">
          <Tooltip content="PREV">
            <Button
              variant="void"
              size="sm"
              iconOnly={true}
              aria-label="prev row"
              leftIcon={ChevronUpIcon}
              disabled={!hasPreviousRow}
              onClick={onPreviousRow}
            />
          </Tooltip>
          <Tooltip content="NEXT">
            <Button
              variant="void"
              size="sm"
              iconOnly={true}
              aria-label="next row"
              leftIcon={ChevronDownIcon}
              disabled={!hasNextRow}
              onClick={onNextRow}
            />
          </Tooltip>
        </div>
      ) : (
        <div />
      )}
      <div className="gap-micro flex items-center">
        <Tooltip content="ZOOM OUT">
          <Button
            variant="void"
            size="sm"
            iconOnly={true}
            aria-label="zoom out"
            leftIcon={ZoomOutIcon}
            disabled={false}
            onClick={() => instance?.zoomOut()}
          />
        </Tooltip>
        <Tooltip content="ZOOM IN">
          <Button
            variant="void"
            size="sm"
            iconOnly={true}
            aria-label="zoom in"
            leftIcon={ZoomInIcon}
            disabled={false}
            onClick={() => instance?.zoomIn()}
          />
        </Tooltip>
        <Text variant="label-xs" className="text-content-quaternary/30">
          {" "}
          |{" "}
        </Text>
        <Tooltip content="FIT VIEW">
          <Button
            variant="void"
            size="sm"
            iconOnly={true}
            aria-label="fit view"
            leftIcon={EnterFullScreenIcon}
            disabled={false}
            onClick={() => instance?.fitView()}
          />
        </Tooltip>
      </div>
    </div>
  );
}
