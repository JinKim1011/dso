import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import happyManifest from "./lib/manifest/fixtures/happy-manifest.json";
import { buildTokenGraphModel } from "./lib/manifestAdapter";
import { TokensView } from "./TokensView";

const result = buildTokenGraphModel(happyManifest);

describe("Container-level behavior, TokensView", () => {
  const rows = result.model.tokenTypes.flatMap((tokenType) =>
    tokenType.values.map((value) => ({
      id: value.id,
      name: value.name,
      cssVar: value.cssVar,
      meta: value.meta,
    })),
  );

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
    render(createElement(TokensView, { model: result.model }));

    for (const row of rows) {
      const currentRow = screen.getByRole("button", { name: row.name });

      await userEvent.click(currentRow);

      expect(screen.findByText(`selected: ${row.name}`)).toBeInTheDocument();
      expect(screen.findByText(`cssVar: ${row.cssVar}`)).toBeInTheDocument();
      expect(screen.findByText(`meta: ${row.meta}`)).toBeInTheDocument();
    }
  });
});
