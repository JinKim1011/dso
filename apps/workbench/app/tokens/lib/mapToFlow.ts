import type { Edge, Node } from "@xyflow/react";
import type { TokenGraphModel } from "./manifestAdapter";

export type FlowNodeData = {
  label: string;
  kind?: string;
  valueCount?: number;
};

export type FlowGraph = {
  nodes: Node<FlowNodeData>[];
  edges: Edge[];
};

export function mapTokenGraphToFlow(model: TokenGraphModel): FlowGraph {
  const nodes: Node<FlowNodeData>[] = [];
  const edges: Edge[] = [];

  const categoryXGap = 302;
  const categoryY = 160;
  const tokenYStart = 320;
  const tokenYGap = 32;

  nodes.push({
    id: model.root.id,
    type: "default",
    position: { x: 0, y: 0 },
    data: { label: model.root.label },
  });

  for (const [categoryIndex, category] of model.categories.entries()) {
    const x = categoryIndex * categoryXGap;

    nodes.push({
      id: category.id,
      type: "default",
      position: { x: x, y: categoryY },
      data: { label: category.category },
    });

    edges.push({
      id: `edge:${model.root.id}->${category.id}`,
      source: model.root.id,
      target: category.id,
    });

    category.tokenTypeIds.forEach((tokenTypeId, tokenIndex) => {
      const tokenType = model.tokenTypes.find((item) => item.id === tokenTypeId);
      if (!tokenType) return;

      nodes.push({
        id: tokenType.id,
        type: "default",
        position: { x: x, y: tokenYStart + tokenIndex * tokenYGap },
        data: {
          label: tokenType.type,
          kind: tokenType.kind,
          valueCount: tokenType.values.length,
        },
      });

      edges.push({
        id: `edge:${category.id}->${tokenType.id}`,
        source: category.id,
        target: tokenType.id,
      });
    });
  }

  return { nodes, edges };
}
