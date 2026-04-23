import { describe, it } from "vitest";
import type { TokenGraphModel } from "./manifestAdapter";

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

describe("mapTokenGraphToFlow contract", () => {
  it("maps expected node and edge counts", () => {});

  it("creates root to category edges for every category", () => {});

  it("is deteterministic for ids and positions with identical input", () => {});

  it("skips missing tokenType references instead of emmitting broken nodes and edges", () => {});
});
