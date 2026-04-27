"use client";

import {
  MiniMap,
  ReactFlow,
  ReactFlowInstance,
  type Node as FlowNode,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useMemo, useState } from "react";
import { CategoryFlowNode } from "./components/CategoryFlowNode";
import { RootFlowNode } from "./components/RootFlowNode";
import { TokenTypeFlowNode } from "./components/TokenTypeFlowNode";
import { TokenValueDetail } from "./components/TokenValueDetail";
import type { TokenGraphModel } from "./lib/manifestAdapter";
import { mapTokenGraphToFlow, type TokenTypeNodeData } from "./lib/mapToFlow";

type TokensViewProps = {
  model: TokenGraphModel;
};

type TokenRow = Pick<
  TokenGraphModel["tokenTypes"][number]["values"][number],
  "id" | "name" | "cssVar" | "meta"
>;

type InteractiveTokenTypeData = TokenTypeNodeData & {
  selectedRowId: string | null;
  onSelectRow: (rowId: string) => void;
};

function useTokenSelection(rows: TokenRow[]) {
  const rowById = useMemo(() => new Map(rows.map((row) => [row.id, row])), [rows]);

  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const selected = selectedRowId === null ? null : (rowById.get(selectedRowId) ?? null);

  return { selectedRowId, setSelectedRowId, selected };
}

export function TokensView({ model }: TokensViewProps) {
  const flowBase = useMemo(() => {
    return mapTokenGraphToFlow(model);
  }, [model]);

  const rows = useMemo(() => {
    return model.tokenTypes.flatMap((tokenType) =>
      tokenType.values.map((valueItem) => ({
        id: valueItem.id,
        name: valueItem.name,
        cssVar: valueItem.cssVar,
        meta: valueItem.meta,
      })),
    );
  }, [model]);

  const { selectedRowId, setSelectedRowId, selected } = useTokenSelection(rows);

  const nodeTypes = useMemo<NodeTypes>(
    () => ({
      root: RootFlowNode,
      category: CategoryFlowNode,
      tokenType: TokenTypeFlowNode,
    }),
    [],
  );

  const handleSelectRow = (rowId: string) => {
    setSelectedRowId((current) => (current === rowId ? null : rowId));
  };

  const nodes = useMemo<FlowNode[]>(() => {
    return flowBase.nodes.map((node) => {
      if (node.type !== "tokenType") return node;

      return {
        ...node,
        data: {
          ...(node.data as TokenTypeNodeData),
          selectedRowId,
          onSelectRow: handleSelectRow,
        } satisfies InteractiveTokenTypeData,
      };
    });
  }, [flowBase.nodes, selectedRowId]);

  const rootNodeId = useMemo(
    () => flowBase.nodes.find((node) => node.type === "root")?.id ?? null,
    [flowBase.nodes],
  );

  const handleInit = useCallback(
    (reactflow: ReactFlowInstance) => {
      if (!rootNodeId) return;

      reactflow.fitView({
        nodes: [{ id: rootNodeId }],
        padding: 0.5,
        minZoom: 1,
        maxZoom: 1,
      });
    },
    [flowBase.nodes, rootNodeId],
  );

  return (
    <div className="relative h-dvh w-full overflow-hidden">
      <ReactFlow
        className="h-full w-full"
        nodes={nodes}
        edges={flowBase.edges}
        nodeTypes={nodeTypes}
        minZoom={0.2}
        maxZoom={2}
        zoomOnScroll={true}
        zoomOnPinch={true}
        zoomOnDoubleClick={true}
        panOnDrag={true}
        panOnScroll={false}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
        onInit={handleInit}
      >
        <MiniMap pannable zoomable />
      </ReactFlow>

      {selected && (
        <TokenValueDetail
          name={selected.name}
          cssVar={selected.cssVar}
          meta={selected.meta}
        />
      )}
    </div>
  );
}
