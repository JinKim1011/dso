"use client";

import { CategoryFlowNode } from "@/features/tokens/components/category/category-flow-node";
import { TokenPanel } from "@/features/tokens/components/token-panel";
import { TokenTypeFlowNode } from "@/features/tokens/components/token-type/token-type-flow-node";
import {
  mapTokenGraphToFlow,
  type TokenTypeNodeData,
} from "@/features/tokens/graph/map-to-flow";
import { TokenRowViewModel } from "@/features/tokens/model/token-row";
import { useRowNavigation } from "@/features/tokens/navigation/use-row-navigation";
import { useRowSelection } from "@/features/tokens/navigation/use-row-selection";
import { useColorOptions } from "@/features/tokens/options/use-color-options";
import { useTypographyOptions } from "@/features/tokens/options/use-typography-options";
import { useStagedManifest } from "@/features/tokens/state/staged-manifest-context";
import {
  ReactFlow,
  type Node as FlowNode,
  type NodeTypes,
  type ReactFlowInstance,
} from "@xyflow/react";
import { useMemo, useState } from "react";

type InteractiveTokenTypeData = TokenTypeNodeData & {
  selectedRowId: string | null;
  onSelectRow: (rowId: string) => void;
};

type TokensViewProps = {
  category?: "typography" | "spacing" | "color" | "motion" | "radius" | "shadow";
};

export function TokensView({ category }: TokensViewProps) {
  const { draftModel, updateRow } = useStagedManifest();

  const filteredModel = useMemo(() => {
    if (!category) return draftModel;

    return {
      ...draftModel,
      categories: draftModel.categories.filter((c) => c.category === category),
      tokenTypes: draftModel.tokenTypes.filter((t) => t.category === category),
    };
  }, [draftModel, category]);

  const flowBase = useMemo(() => {
    return mapTokenGraphToFlow(filteredModel);
  }, [filteredModel]);

  const rows = useMemo<TokenRowViewModel[]>(() => {
    return filteredModel.tokenTypes.flatMap((tokenType) =>
      tokenType.values.map((valueItem) => ({
        id: valueItem.id,
        name: valueItem.name,
        cssVar: valueItem.cssVar,
        meta: valueItem.meta,
        preview: valueItem.preview,
        category: tokenType.category,
        kind: tokenType.kind,
        value: valueItem,
      })),
    );
  }, [filteredModel]);

  const colorOptions = useColorOptions(draftModel);

  const typographyOptions = useTypographyOptions(draftModel);

  const rowById = useMemo(() => new Map(rows.map((row) => [row.id, row])), [rows]);

  const { selectedRowId, toggleRowSelection, clearSelection } = useRowSelection({
    resetTrigger: category,
  });
  const { hasPreviousRow, hasNextRow, selectPreviousRow, selectNextRow } =
    useRowNavigation({
      rows,
      selectedRowId,
      onSelectRow: toggleRowSelection,
    });

  const [flowInstance, setFlowInstance] = useState<ReactFlowInstance | null>(null);

  const selectedRow = useMemo(
    () => (selectedRowId === null ? null : (rowById.get(selectedRowId) ?? null)),
    [rowById, selectedRowId],
  );

  const nodeTypes = useMemo<NodeTypes>(
    () => ({
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
          onSelectRow: toggleRowSelection,
        } satisfies InteractiveTokenTypeData,
      };
    });
  }, [flowBase.nodes, selectedRowId, toggleRowSelection]);

  return (
    <div className="bg-dot-pattern rounded-mini border-stroke-secondary relative flex h-full w-full overflow-hidden border">
      <ReactFlow
        className="h-full w-full"
        nodes={nodes}
        edges={flowBase.edges}
        nodeTypes={nodeTypes}
        minZoom={0.5}
        maxZoom={1}
        zoomOnScroll={false}
        zoomOnPinch={true}
        zoomOnDoubleClick={false}
        panOnDrag={false}
        panOnScroll={true}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
        onInit={setFlowInstance}
        onPaneClick={clearSelection}
        fitView
      />
      <TokenPanel
        selectedRow={selectedRow}
        hasNextRow={hasNextRow}
        hasPreviousRow={hasPreviousRow}
        flowInstance={flowInstance}
        typographyOptions={typographyOptions}
        colorOptions={colorOptions}
        selectPreviousRow={selectPreviousRow}
        selectNextRow={selectNextRow}
        handleSaveRow={(rowId, update) => {
          updateRow(rowId, update);
          clearSelection();
        }}
        clearSelection={clearSelection}
      />
    </div>
  );
}
