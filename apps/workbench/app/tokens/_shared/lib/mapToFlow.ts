import type { BuiltInEdge, Node } from "@xyflow/react";
import type { TokenGraphModel } from "./manifestAdapter";

type CategoryNodeData = {
  label: string;
};

type FlowGraph = {
  nodes: FlowNode[];
  edges: BuiltInEdge[];
};

export type TokenTypeNodeData = {
  label: string;
  kind: TokenGraphModel["tokenTypes"][number]["kind"];
  values: TokenGraphModel["tokenTypes"][number]["values"];
};

export type FlowNode =
  | Node<CategoryNodeData, "category">
  | Node<TokenTypeNodeData, "tokenType">;

export function mapTokenGraphToFlow(model: TokenGraphModel): FlowGraph {
  const nodes: FlowNode[] = [];
  const edges: BuiltInEdge[] = [];

  const tokenTypeById = new Map(
    model.tokenTypes.map((tokenType) => [tokenType.id, tokenType]),
  );

  const categoryYGap = 480;
  const categoryX = 0;
  const categoryY = 0;
  const tokenYGap = 180;
  const tokenNodeWidth = 320;
  const tokenXGap = 20;

  for (const [categoryIndex, category] of model.categories.entries()) {
    const categoryPositionY = categoryIndex * categoryYGap;
    const visibleTokenTypes = category.tokenTypeIds.flatMap((tokenTypeId) => {
      const tokenType = tokenTypeById.get(tokenTypeId);

      return tokenType ? [tokenType] : [];
    });
    const tokenRowWidth = visibleTokenTypes.length
      ? visibleTokenTypes.length * tokenNodeWidth +
        (visibleTokenTypes.length - 1) * tokenXGap
      : 0;
    const tokenXStart = -tokenRowWidth / 2;
    const categoryWidth = estimateCategoryWidth(category.category);
    const categoryXStart = categoryX - categoryWidth / 2;

    nodes.push({
      id: category.id,
      type: "category",
      origin: [0.5, 0.5],
      position: { x: categoryX, y: categoryPositionY + categoryY },
      data: { label: category.category },
    });

    visibleTokenTypes.forEach((tokenType, tokenIndex) => {
      const tokenY = categoryPositionY + tokenYGap;

      nodes.push({
        id: tokenType.id,
        type: "tokenType",
        position: {
          x: tokenXStart + tokenIndex * (tokenNodeWidth + tokenXGap),
          y: tokenY,
        },
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
        type: "default",
      });
    });
  }

  return { nodes, edges };
}
