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

export function TokenTypeFlowNode({ id, data }: NodeProps<TokenTypeFlowNodeProps>) {
  return (
    <div className="overflow-visible">
      <Handle
        type="target"
        position={Position.Top}
        style={{
          width: 6,
          height: 6,
          borderRadius: 0,
          border: "none",
          background: "var(--bg-accentStrong)",
        }}
      />
      <TokenTypeNode
        group={{ id, type: data.label, kind: data.kind, values: data.values }}
        selectedRowId={data.selectedRowId}
        onSelectRow={data.onSelectRow}
      />
    </div>
  );
}
