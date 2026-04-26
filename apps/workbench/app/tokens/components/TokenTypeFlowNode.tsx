"use client";

import { Handle, Node, Position, type NodeProps } from "@xyflow/react";
import { TokenTypeNode } from "./TokenTypeNode";

type TokenTypeFlowData = {
  label: string;
  kind: "primitive" | "semantic";
  values: {
    id: string;
    name: string;
    cssVar?: string;
    meta?: string;
  }[];
  selectedRowId: string | null;
  onSelectRow: (rowId: string) => void;
};

type TokenTypeFlowNodeProps = Node<TokenTypeFlowData>;

export function TokenTypeFlowNode({ data }: NodeProps<TokenTypeFlowNodeProps>) {
  return (
    <div>
      <Handle type="target" position={Position.Top}></Handle>
      <TokenTypeNode
        group={{ type: data.label, kind: data.kind, values: data.values }}
        selectedRowId={data.selectedRowId}
        onSelectRow={data.onSelectRow}
      ></TokenTypeNode>
    </div>
  );
}
