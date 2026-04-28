import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { TokenTypeNode } from "./components/TokenTypeNode";
import happyManifest from "./lib/manifest/fixtures/happy-manifest.json";
import { buildTokenGraphModel } from "./lib/manifestAdapter";
import { TokensView } from "./TokensView";

const result = buildTokenGraphModel(happyManifest);

describe("Container-level behavior, TokensView", () => {
  const group = result.model.tokenTypes.at(0);
  if (!group) throw new Error("Expected background token type in happy fixture");

  it("renders root heading/container", async () => {
    render(createElement(TokensView, { model: result.model }));
    const root = result.model.root;

    // query by text not by role, since root label is rendered inside a custom node
    const rootLable = await screen.findByText(root.label);
    expect(rootLable).toBeInTheDocument();
  });

  it("renders categories", async () => {
    render(createElement(TokensView, { model: result.model }));
    const categories = result.model.categories;

    for (const category of categories) {
      const categoryLabel = await screen.findByText(category.category);
      expect(categoryLabel).toBeInTheDocument();
    }
  });

  it("does not duplicate token type groups across categories", async () => {
    render(createElement(TokensView, { model: result.model }));
    const allTokenTypes = result.model.tokenTypes;

    for (const tokenType of allTokenTypes) {
      const tokenTypeLabel = await screen.findAllByText(tokenType.type);
      expect(tokenTypeLabel).toHaveLength(1);
    }
  });

  it("clicking one row updates detail panel", async () => {
    const selectedId = group.values[0]?.id;
    if (!selectedId) throw new Error("Expected at least one value in token type group");

    render(
      createElement(TokenTypeNode, {
        group,
        selectedRowId: selectedId,
        onSelectRow: () => {},
      }),
    );

    const tokenType = screen.getByTestId(group.id);
    const valueButtons = group.values.map((value) =>
      within(tokenType).getByRole("button", { name: value.name }),
    );

    valueButtons.forEach(async (valueButton, index) => {
      const value = group.values[index];

      if (!value) throw new Error("Expected at least one value in token type group");

      await userEvent.click(valueButton);
      expect(screen.findByText(`selected: ${value.name}`)).toBeInTheDocument();
      expect(screen.findByText(`cssVar: ${value.cssVar}`)).toBeInTheDocument();
      expect(screen.findByText(`meta: ${value.meta}`)).toBeInTheDocument();
    });
  });
});
