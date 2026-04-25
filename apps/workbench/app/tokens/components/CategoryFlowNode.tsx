"use client";

import { Handle, Node, Position, type NodeProps } from "@xyflow/react";
import { CategoryNode } from "./CategoryNode";

type CategoryFlowData = {
  label: string;
};

type CategoryFlowNodeProps = Node<CategoryFlowData>;

export function CategoryFlowNode({ data }: NodeProps<CategoryFlowNodeProps>) {
  return (
    <div>
      <Handle type="source" position={Position.Top}></Handle>
      <Handle type="target" position={Position.Bottom}></Handle>
      <CategoryNode label={data.label}></CategoryNode>
    </div>
  );
}
