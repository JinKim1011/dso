import type { BuiltInEdge, Node } from "@xyflow/react";
import type { TokenGraphModel } from "./manifestAdapter";

export type CategoryNodeData = {
  label: string;
};

export type TokenTypeNodeData = {
  label: string;
  kind: TokenGraphModel["tokenTypes"][number]["kind"];
  values: TokenGraphModel["tokenTypes"][number]["values"];
};

export type FlowNodeData = CategoryNodeData | TokenTypeNodeData;

export type FlowNode =
  | Node<CategoryNodeData, "category">
  | Node<TokenTypeNodeData, "tokenType">;

export type FlowGraph = {
  nodes: FlowNode[];
  edges: BuiltInEdge[];
};

export function mapTokenGraphToFlow(model: TokenGraphModel): FlowGraph {
  const nodes: FlowNode[] = [];
  const edges: BuiltInEdge[] = [];

  const tokenTypeById = new Map(
    model.tokenTypes.map((tokenType) => [tokenType.id, tokenType]),
  );

  const categoryXGap = 302;
  const categoryY = 160;
  const tokenYStart = 320;
  const tokenYGap = 120;

  for (const [categoryIndex, category] of model.categories.entries()) {
    const x = categoryIndex * categoryXGap;

    nodes.push({
      id: category.id,
      type: "category",
      position: { x: x, y: categoryY },
      data: { label: category.category },
    });

    edges.push({
      id: `edge:${model.root.id}->${category.id}`,
      source: model.root.id,
      target: category.id,
      type: "smoothstep",
      pathOptions: {
        offset: 0,
        borderRadius: 20,
        stepPosition: 0.7,
      },
    });

    category.tokenTypeIds.forEach((tokenTypeId, tokenIndex) => {
      const tokenType = tokenTypeById.get(tokenTypeId);
      if (!tokenType) return;

      nodes.push({
        id: tokenType.id,
        type: "tokenType",
        position: { x: x, y: tokenYStart + tokenIndex * tokenYGap },
        data: {
          label: tokenType.type,
          kind: tokenType.kind,
          values: tokenType.values,
        },
      });

      edges.push({
        id: `edge:${category.id}->${tokenType.id}`,
        source: category.id,
        target: tokenType.id,
        type: "smoothstep",
        pathOptions: {
          offset: 0,
          borderRadius: 20,
          stepPosition: 0.7,
        },
      });
    });
  }

  return { nodes, edges };
}
