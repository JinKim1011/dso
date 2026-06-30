"use client";

import {
  ReactFlow,
  type Node as FlowNode,
  type NodeTypes,
  type ReactFlowInstance,
} from "@xyflow/react";
import { useCallback, useMemo, useState } from "react";
import { useStagedManifest } from "../_shared/context/StagedManifestContext";
import { useRowSelection } from "../_shared/lib/useRowSelection";
import { CategoryFlowNode } from "./components/CategoryFlowNode";
import { FlowControls } from "./components/FlowControls";
import { TokenTypeFlowNode } from "./components/TokenTypeFlowNode";
import {
  TokenValueDetail,
  type TokenValueDetailUpdate,
} from "./components/TokenValueDetail";
import { mapTokenGraphToFlow, type TokenTypeNodeData } from "./lib/mapToFlow";
import { TokenRow } from "./lib/types";
import { useRowNavigation } from "./lib/useRowNavigation";
import { useTypographyOptions } from "./lib/useTypographyOptions";

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
  const rows = useMemo<TokenRow[]>(() => {
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
  const typographyOptions = useTypographyOptions({ draftModel });
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

  const handleSaveRow = useCallback(
    (rowId: string, update: TokenValueDetailUpdate) => {
      updateRow(rowId, update);
      clearSelection();
    },
    [updateRow, clearSelection],
  );
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
    <div className="bg-dot-pattern relative flex h-full w-full overflow-hidden">
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
      <aside className="p-mini absolute right-0">
        <div className="bg-surface-primary rounded-mini border-stroke-primary border-[0.5px]">
          <FlowControls
            instance={flowInstance}
            hasPreviousRow={hasPreviousRow}
            hasNextRow={hasNextRow}
            onPreviousRow={selectPreviousRow}
            onNextRow={selectNextRow}
            showRowNavigation={selectedRow !== null}
          />
          {selectedRow ? (
            <TokenValueDetail
              rowId={selectedRow.id}
              name={selectedRow.name ?? ""}
              cssVar={selectedRow.cssVar}
              meta={selectedRow.meta}
              category={selectedRow.category}
              kind={selectedRow.kind}
              value={selectedRow.value}
              typographyOptions={typographyOptions}
              onSave={handleSaveRow}
              onClose={clearSelection}
            />
          ) : null}
        </div>
      </aside>
    </div>
  );
}
