"use client";

import {
  Background,
  ReactFlow,
  type Node as FlowNode,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useMemo, useState } from "react";
import { CategoryFlowNode } from "./components/CategoryFlowNode";
import { CategoryNode } from "./components/CategoryNode";
import { RootFlowNode } from "./components/RootFlowNode";
import { RootNode } from "./components/RootNode";
import { TokenTypeFlowNode } from "./components/TokenTypeFlowNode";
import { TokenTypeNode } from "./components/TokenTypeNode";
import { TokenValueDetail } from "./components/TokenValueDetail";
import { TokenTypeModel } from "./lib/manifest/types";
import type { TokenGraphModel } from "./lib/manifestAdapter";
import { mapTokenGraphToFlow } from "./lib/mapToFlow";

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
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const selected = rows.find((row) => row.id === selectedRowId) ?? null;

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

  const nodes = useMemo<FlowNode[]>(() => {
    return flowBase.nodes.map((node) => {
      if (node.type !== "tokenType") return node;

      return {
        ...node,
        data: {
          ...(node.data as TokenTypeNodeData),
          selectedRowId,
          onSelectRow: setSelectedRowId,
        } satisfies InteractiveTokenTypeData,
      };
    });
  }, [flowBase.nodes, selectedRowId]);

  return (
    <div className="relative h-dvh w-full overflow-hidden">
      <ReactFlow
        className="h-full w-full"
        nodes={nodes}
        edges={flowBase.edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
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
      >
        <Background />
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
