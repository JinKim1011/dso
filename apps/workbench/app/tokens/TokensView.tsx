"use client";

import { Background, Controls, ReactFlow, type NodeTypes } from "@xyflow/react";
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

  return { rows, groups, categories, groupById, root };
}

function useTokenSelection(rows: TokenRow[]) {
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const selected = rows.find((row) => row.id === selectedRowId) ?? null;

  return { selectedRowId, setSelectedRowId, selected };
}

export function TokensView({ model }: TokensViewProps) {
  const flow = useMemo(() => {
    return mapTokenGraphToFlow(model);
  }, [model]);

  const nodeTypes = useMemo<NodeTypes>(() => {
    return {
      root: RootFlowNode,
      category: CategoryFlowNode,
      tokenType: TokenTypeFlowNode,
    };
  }, []);

  const { categories, groupById, root, rows } = useTokensViewData(model);
  const { selectedRowId, setSelectedRowId, selected } = useTokenSelection(rows);

  return (
    <div className="flex">
      <ReactFlow
        nodes={flow.nodes}
        edges={flow.edges}
        fitView
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
      >
        <Background />
        <Controls />
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
