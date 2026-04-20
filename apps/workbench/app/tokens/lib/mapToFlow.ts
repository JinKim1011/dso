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

  nodes.push({
    id: model.root.id,
    type: "default",
    position: { x: 0, y: 0 },
    data: { label: model.root.label },
  });

  for (const [categoryIndex, category] of model.categories.entries()) {
    nodes.push({
      id: category.id,
      type: "default",
      position: { x: 0, y: 0 },
      data: { label: category.category },
    });

    edges.push({
      id: `edge:${model.root.id}->${category.id}`,
      source: model.root.id,
      target: category.id,
    });

    category.tokenTypeIds.forEach((tokenTypeId, tokenTypeIndex) => {
      const tokenType = model.tokenTypes.find((item) => item.id === tokenTypeId);
      if (!tokenType) return;

      nodes.push({
        id: tokenType.id,
        type: "default",
        position: { x: 0, y: 0 },
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
