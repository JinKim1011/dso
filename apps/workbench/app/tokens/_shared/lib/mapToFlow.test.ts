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

function nodeById(flow: ReturnType<typeof mapTokenGraphToFlow>) {
  return new Map(flow.nodes.map((node) => [node.id, node]));
}

describe("mapTokenGraphToFlow contract", () => {
  it("maps the renderable node and edge counts", () => {
    const model = makeModel();
    const flow = mapTokenGraphToFlow(model);

    const expectedNodeCount = model.categories.length + model.tokenTypes.length;
    const expectedEdgeCount = model.categories.reduce(
      (sum, category) => sum + category.tokenTypeIds.length,
      0,
    );

    expect(flow.nodes).toHaveLength(expectedNodeCount);
    expect(flow.edges).toHaveLength(expectedEdgeCount);
  });

  it("maps category and tokenType nodes with the expected labels", () => {
    const model = makeModel();
    const flow = mapTokenGraphToFlow(model);

    const nodes = nodeById(flow);

    for (const category of model.categories) {
      const node = nodes.get(category.id);

      expect(node).toMatchObject({
        id: category.id,
        type: "category",
        data: { label: category.category },
      });
    }

    for (const tokenType of model.tokenTypes) {
      const node = nodes.get(tokenType.id);

      expect(node).toMatchObject({
        id: tokenType.id,
        type: "tokenType",
        data: {
          label: tokenType.type,
          kind: tokenType.kind,
          values: tokenType.values,
        },
      });
    }
  });

  it("creates category to tokenType edges for every declared relation", () => {
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
