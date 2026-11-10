"use client";

import type { TokenTypographyOptions } from "@/features/tokens/components/form/token-typography-form";
import { FlowControls } from "@/features/tokens/components/react-flow/flow-controls";
import {
  TokenValueDetail,
  type TokenValueDetailUpdate,
} from "@/features/tokens/components/token-value/token-value-detail";
import { TokenRowViewModel } from "@/features/tokens/model/token-row";
import type { TokenReferenceOption } from "@/features/tokens/model/token-graph";
import { createMotionTransition } from "@repo/ui";
import { type ReactFlowInstance } from "@xyflow/react";
import { AnimatePresence, motion } from "framer-motion";
import useMeasure from "react-use-measure";

type TokenPanelProps = {
  selectedRow: TokenRowViewModel | null;
  hasNextRow: boolean;
  hasPreviousRow: boolean;
  flowInstance: ReactFlowInstance | null;
  typographyOptions: TokenTypographyOptions;
  colorOptions: TokenReferenceOption[];
  selectPreviousRow: () => void;
  selectNextRow: () => void;
  handleSaveRow: (rowId: string, update: TokenValueDetailUpdate) => void;
  clearSelection: () => void;
};

export function TokenPanel({
  selectedRow,
  hasNextRow,
  hasPreviousRow,
  flowInstance,
  typographyOptions,
  colorOptions,
  selectPreviousRow,
  selectNextRow,
  handleSaveRow,
  clearSelection,
}: TokenPanelProps) {
  const [ref, bounds] = useMeasure();

  const panelTween = {
    type: "tween" as const,
    ...createMotionTransition("regular", "inOutCirc"),
  };

  return (
    <motion.aside
      className="p-mini absolute top-0 right-0 overflow-hidden"
      animate={{ height: bounds.height + 16, width: selectedRow ? 385 + 16 : 110.2 }}
      transition={{
        height: panelTween,
        width: panelTween,
      }}
    >
      <div
        ref={ref}
        className="bg-surface-primary rounded-mini border-stroke-primary border-[0.5px]"
      >
        <FlowControls
          instance={flowInstance}
          hasPreviousRow={hasPreviousRow}
          hasNextRow={hasNextRow}
          onPreviousRow={selectPreviousRow}
          onNextRow={selectNextRow}
          showRowNavigation={selectedRow !== null}
        />
        <AnimatePresence>
          {selectedRow ? (
            <motion.div
              className="overflow-hidden"
              transition={panelTween}
              initial={{ opacity: 0, x: 25, height: "auto" }}
              animate={{ opacity: 1, x: 0, height: "auto" }}
              exit={{ opacity: 0, x: 25, height: 0 }}
            >
              <TokenValueDetail
                rowId={selectedRow.id}
                name={selectedRow.name ?? ""}
                cssVar={selectedRow.cssVar}
                meta={selectedRow.meta}
                category={selectedRow.category}
                kind={selectedRow.kind}
                value={selectedRow.value}
                typographyOptions={typographyOptions}
                colorOptions={colorOptions}
                onSave={handleSaveRow}
                onClose={clearSelection}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
}
