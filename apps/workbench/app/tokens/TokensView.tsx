"use client";

import {
  ReactFlow,
  ReactFlowInstance,
  type BuiltInEdge,
  type Node as FlowNode,
  type NodeTypes,
} from "@xyflow/react";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { NavigationSlotActionsContext } from "../_shared/context/NavigationSlotContext";
import { useStagedManifest } from "../_shared/context/StagedManifestContext";
import {
  TokenValueDetail,
  type TokenValueDetailUpdate,
} from "./_shared/components/TokenValueDetail";
import { CategoryFlowNode } from "./components/CategoryFlowNode";
import { RootFlowNode } from "./components/RootFlowNode";
import { TokenTypeFlowNode } from "./components/TokenTypeFlowNode";
import type { TokenTypographyOptions } from "./components/TokenTypographyForm";
import type { TokenGraphModel } from "./lib/manifestAdapter";
import { mapTokenGraphToFlow, type TokenTypeNodeData } from "./lib/mapToFlow";

type TokenRow = {
  id: string;
  name: string;
  cssVar?: string;
  meta?: string;
  preview?: TokenGraphModel["tokenTypes"][number]["values"][number]["preview"];
  category: string;
  kind: string;
  value: TokenGraphModel["tokenTypes"][number]["values"][number];
};

type InteractiveTokenTypeData = TokenTypeNodeData & {
  selectedRowId: string | null;
  onSelectRow: (rowId: string) => void;
};

type TokensViewProps = {
  category?:
    | "typography"
    | "spacing"
    | "color"
    | "motion"
    | "radius"
    | "shadow"
    | "elevation";
};

export function TokensView({ category }: TokensViewProps) {
  const shellActions = useContext(NavigationSlotActionsContext);
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

  const typographyOptions = useMemo<TokenTypographyOptions>(() => {
    const fontSize = new Set<string>();
    const fontWeight = new Set<string>();
    const lineHeight = new Set<string>();

    draftModel.tokenTypes
      .filter(
        (tokenType) =>
          tokenType.category === "typography" && tokenType.kind === "primitive",
      )
      .forEach((tokenType) => {
        const typeName = tokenType.type.toLowerCase();

        for (const valueItem of tokenType.values) {
          if (!valueItem.name) continue;

          if (typeName.includes("fontsize")) {
            fontSize.add(valueItem.name);
            continue;
          }

          if (typeName.includes("fontweight")) {
            fontWeight.add(valueItem.name);
            continue;
          }

          if (typeName.includes("lineheight")) {
            lineHeight.add(valueItem.name);
          }
        }
      });

    return {
      fontSize: [...fontSize].sort(),
      fontWeight: [...fontWeight].sort(),
      lineHeight: [...lineHeight].sort(),
    };
  }, [draftModel]);

  const rowById = useMemo(() => new Map(rows.map((row) => [row.id, row])), [rows]);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  const handleSaveRow = useCallback(
    (rowId: string, update: TokenValueDetailUpdate) => {
      updateRow(rowId, update);

      setSelectedRowId(null);
      shellActions?.clearNavigationDetail();
    },
    [updateRow, shellActions],
  );

  const selectedRow = useMemo(
    () => (selectedRowId === null ? null : (rowById.get(selectedRowId) ?? null)),
    [rowById, selectedRowId],
  );

  const nodeTypes = useMemo<NodeTypes>(
    () => ({
      root: RootFlowNode,
      category: CategoryFlowNode,
      tokenType: TokenTypeFlowNode,
    }),
    [],
  );

  useEffect(() => {
    if (!shellActions) return;

    shellActions.setNavigationDetail(
      selectedRow ? (
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
          onClose={() => {
            shellActions?.clearNavigationDetail();
            setSelectedRowId(null);
          }}
        />
      ) : null,
    );
  }, [handleSaveRow, selectedRow, shellActions, typographyOptions]);

  useEffect(() => {
    return () => {
      shellActions?.clearNavigationDetail();
    };
  }, [shellActions]);

  const handleSelectRow = useCallback((rowId: string) => {
    setSelectedRowId((current) => (current === rowId ? null : rowId));
  }, []);

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

  const rootNodeId = useMemo(() => {
    if (category) {
      return flowBase.nodes.find((node) => node.type === "category")?.id ?? null;
    }

    return (
      flowBase.nodes.find((node) => node.type === "root")?.id ??
      flowBase.nodes.find((node) => node.type === "category")?.id ??
      null
    );
  }, [flowBase.nodes, category]);

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
    [rootNodeId],
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
        onPaneClick={() => setSelectedRowId(null)}
      />
    </div>
  );
}
