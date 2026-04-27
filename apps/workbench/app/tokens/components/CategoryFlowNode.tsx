"use client";

import { Handle, Node, Position, type NodeProps } from "@xyflow/react";
import { CategoryNode } from "./CategoryNode";

type CategoryFlowData = {
  label: string;
  id: string;
};

type CategoryFlowNodeProps = Node<CategoryFlowData>;

export function CategoryFlowNode({ id, data }: NodeProps<CategoryFlowNodeProps>) {
  return (
    <div className="overflow-visible">
      <Handle
        type="target"
        position={Position.Top}
        style={{
          opacity: 0,
        }}
      ></Handle>
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          opacity: 0,
        }}
      ></Handle>
      <CategoryNode testId={id} label={data.label}></CategoryNode>
    </div>
  );
}
