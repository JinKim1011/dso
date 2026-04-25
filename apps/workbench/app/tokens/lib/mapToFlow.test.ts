import { describe, expect, it } from "vitest";
import type { TokenGraphModel } from "./manifestAdapter";
import { mapTokenGraphToFlow } from "./mapToFlow";

function makeModel(): TokenGraphModel {
  return {
    schemaVersion: 1,
    root: {
      id: "root",
      label: "Design Tokens",
    },
    categories: [
      {
        id: "category:color",
        category: "color",
        tokenTypeIds: [
          "token-type:color-background-primitive",
          "token-type:color-text-primitive",
        ],
      },
      {
        id: "category:spacing",
        category: "spacing",
        tokenTypeIds: ["token-type:spacing-step-primitive"],
      },
    ],
    tokenTypes: [
      {
        id: "token-type:color-background-primitive",
        category: "color",
        type: "background",
        kind: "primitive",
        values: [
          { id: "value:bg-primary", name: "primary" },
          { id: "value:bg-secondary", name: "secondary" },
        ],
      },
      {
        id: "token-type:color-text-primitive",
        category: "color",
        type: "text",
        kind: "primitive",
        values: [{ id: "value:text-primary", name: "primary" }],
      },
      {
        id: "token-type:spacing-step-primitive",
        category: "spacing",
        type: "step",
        kind: "primitive",
        values: [{ id: "value:space-mini", name: "mini" }],
      },
    ],
  };
}

function edgeKey(source: string, target: string): string {
  return source + "->" + target;
}

describe("mapTokenGraphToFlow contract", () => {
  it("maps expected node and edge counts", () => {
    const model = makeModel();
    const flow = mapTokenGraphToFlow(model);

    const expectedNodeCount = 1 + model.categories.length + model.tokenTypes.length;
    const expectedEdgeCount =
      model.categories.length +
      model.categories.reduce((sum, category) => sum + category.tokenTypeIds.length, 0);

    expect(flow.nodes).toHaveLength(expectedNodeCount);
    expect(flow.edges).toHaveLength(expectedEdgeCount);
  });

  it("maps expected node type", () => {
    const model = makeModel();
    const flow = mapTokenGraphToFlow(model);

    const nodeByType = new Map(flow.nodes.map((node) => [node.id, node]));

    const rootNode = nodeByType.get("root");
    expect(rootNode?.id).toEqual(model.root.id);

    for (const category of model.categories) {
      const node = nodeByType.get(category.id);

      expect(node?.type).toEqual("category");
    }
    for (const tokenType of model.tokenTypes) {
      const node = nodeByType.get(tokenType.id);

      expect(node?.type).toEqual("tokenType");
    }
  });

  it("tokenType node carry the data structure", () => {});

  it("creates root to category edges for every category", () => {
    const model = makeModel();
    const flow = mapTokenGraphToFlow(model);

    const actual = new Set(flow.edges.map((edge) => edgeKey(edge.source, edge.target)));
    const expected = new Set(
      model.categories.map((category) => edgeKey(model.root.id, category.id)),
    );

    expect([...actual]).toEqual(expect.arrayContaining([...expected]));
  });

  it("creates category to token type edges for every category tokenTypeIds", () => {
    const model = makeModel();
    const flow = mapTokenGraphToFlow(model);

    const actual = new Set(flow.edges.map((edge) => edgeKey(edge.source, edge.target)));
    const expectedPairs = model.categories.flatMap((category) =>
      category.tokenTypeIds.map((tokenTypeId) => edgeKey(category.id, tokenTypeId)),
    );

    for (const pair of expectedPairs) {
      expect(actual.has(pair)).toBe(true);
    }
  });

  it("is deterministic for ids and positions with identical input", () => {
    const model = makeModel();

    const first = mapTokenGraphToFlow(model);
    const second = mapTokenGraphToFlow(model);

    const firstNodeIds = first.nodes.map((node) => node.id);
    const secondNodeIds = second.nodes.map((node) => node.id);
    expect(firstNodeIds).toEqual(secondNodeIds);

    const firstEdgeIds = first.edges.map((edge) => edge.id);
    const secondEdgeIds = second.edges.map((edge) => edge.id);
    expect(firstEdgeIds).toEqual(secondEdgeIds);

    for (const node of first.nodes) {
      expect(Number.isFinite(node.position.x)).toBe(true);
      expect(Number.isFinite(node.position.y)).toBe(true);
    }
  });

  it("skips missing tokenType references instead of creating invalid nodes and edges", () => {
    const model = makeModel();
    model.categories[0]?.tokenTypeIds.push("token-type:does-not-exist");

    const flow = mapTokenGraphToFlow(model);

    const missingNode = flow.nodes.find(
      (node) => node.id === "token-type:does-not-exist",
    );
    const missingEdge = flow.edges.find(
      (edge) => edge.target === "token-type:does-not-exist",
    );

    expect(missingEdge).toBeUndefined();
    expect(missingNode).toBeUndefined();
  });
});

// add later second describe block for auto-layout invariants (not exact coordinates)
