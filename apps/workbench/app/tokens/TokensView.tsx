"use client";

import {
  ReactFlow,
  ReactFlowInstance,
  type BuiltInEdge,
  type Node as FlowNode,
  type NodeTypes,
} from "@xyflow/react";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { WorkbenchShellActionsContext } from "../_shared/context/WorkbenchShellContext";
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

export function TokensView({ model }: TokensViewProps) {
  const shellActions = useContext(WorkbenchShellActionsContext);

  const flowBase = useMemo(() => {
    return mapTokenGraphToFlow(model);
  }, [model]);

  const rows = useMemo<TokenRow[]>(() => {
    return model.tokenTypes.flatMap((tokenType) =>
      tokenType.values.map((valueItem) => ({
        id: valueItem.id,
        name: valueItem.name,
        cssVar: valueItem.cssVar,
        meta: valueItem.meta,
      })),
    );
  }, [model]);

  const rowById = useMemo(() => new Map(rows.map((row) => [row.id, row])), [rows]);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  const nodeTypes = useMemo<NodeTypes>(
    () => ({
      root: RootFlowNode,
      category: CategoryFlowNode,
      tokenType: TokenTypeFlowNode,
    }),
    [],
  );

  useEffect(() => {
    return () => {
      shellActions?.clearNavigationDetail();
    };
  }, [shellActions]);

  const handleSelectRow = useCallback(
    (rowId: string) => {
      const nextRow = rows.find((row) => row.id === rowId) ?? null;

      if (!nextRow) return;

      shellActions?.setNavigationDetail(
        nextRow ? (
          <TokenValueDetail
            name={nextRow.name}
            cssVar={nextRow.cssVar}
            meta={nextRow.meta}
          />
        ) : null,
      );
    },
    [rows, shellActions],
  );

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
  }, [flowBase.nodes, selectedRowId, handleSelectRow]);

  const rootNodeId = useMemo(
    () => flowBase.nodes.find((node) => node.type === "root")?.id ?? null,
    [flowBase.nodes],
  );

  const handleInit = useCallback(
    (reactflow: ReactFlowInstance<FlowNode, BuiltInEdge>) => {
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
        onInit={handleInit}
        className="h-full w-full"
        nodes={nodes}
        edges={flowBase.edges}
        nodeTypes={nodeTypes}
        minZoom={0.2}
        maxZoom={2}
        zoomOnScroll={false}
        zoomOnPinch={true}
        zoomOnDoubleClick={false}
        panOnDrag={false}
        panOnScroll={true}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
      />
    </div>
  );
}
