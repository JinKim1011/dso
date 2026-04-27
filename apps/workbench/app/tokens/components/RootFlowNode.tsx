"use client";

import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { RootNode } from "./RootNode";

type RootFlowData = {
  label: string;
};

type RootFlowNodeType = Node<RootFlowData>;

export function RootFlowNode({ data }: NodeProps<RootFlowNodeType>) {
  return (
    <div className="overflow-visible">
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          width: 6,
          height: 6,
          border: "none",
          background: "var(--stroke-accent)",
          borderRadius: "0%",
        }}
      ></Handle>
      <RootNode label={data.label}></RootNode>
    </div>
  );
}
