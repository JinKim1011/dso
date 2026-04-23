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
    const expectedEdgeCout =
      model.categories.length +
      model.categories.reduce((sum, category) => sum + category.tokenTypeIds.length, 0);

    expect(flow.nodes).toHaveLength(expectedNodeCount);
    expect(flow.edges).toHaveLength(expectedEdgeCout);
  });

  it("creates root to category edges for every category", () => {
    const model = makeModel();
    const flow = mapTokenGraphToFlow(model);

    const actual = new Set(flow.edges.map((edge) => edgeKey(edge.source, edge.target)));
    const expected = new Set(
      model.categories.map((category) => edgeKey(model.root.id, category.id)),
    );

    expect([...actual]).toEqual(expect.arrayContaining([...expected]));
  });

  it("is deteterministic for ids and positions with identical input", () => {});

  it("skips missing tokenType references instead of emmitting broken nodes and edges", () => {});
});
