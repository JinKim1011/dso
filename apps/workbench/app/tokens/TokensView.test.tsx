import { render, screen, within } from "@testing-library/react";
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

  it("renders root heading/container", () => {
    render(createElement(TokensView, { model: result.model }));
    const root = result.model.root;
    const h1 = screen.getByRole("heading", { name: root.label });

    expect(h1).not.toBeNull();
  });

  it("renders categories", () => {
    render(createElement(TokensView, { model: result.model }));
    const categories = result.model.categories.map((category) => ({
      id: category.id,
      category: category.category,
      tokenTypeIds: category.tokenTypeIds,
    }));

    for (const category of categories) {
      const currentCategory = screen.getByTestId(category.id);
      expect(currentCategory).not.toBeNull();
    }
  });

  it("does not duplicate token type groups across categories", () => {
    render(createElement(TokensView, { model: result.model }));
    const categories = result.model.categories;
    const allGroups = result.model.tokenTypes;

    for (const group of allGroups) {
      const matches = screen.getAllByTestId(group.id);

      expect(matches).toHaveLength(1);
    }

    for (const category of categories) {
      const categorySection = screen.getByTestId(category.id);

      for (const group of allGroups) {
        const shouldBeInside = category.tokenTypeIds.includes(group.id);

        if (shouldBeInside) {
          expect(within(categorySection).getByTestId(group.id)).toBeInTheDocument();
        } else {
          expect(within(categorySection).queryByTestId(group.id)).toBeNull();
        }
      }
    }
  });

  it("clicking one row updates detail panel", async () => {
    render(createElement(TokensView, { model: result.model }));

    for (const row of rows) {
      const currentRow = screen.getByRole("button", { name: row.name });

      await userEvent.click(currentRow);

      expect(screen.getByText(`selected: ${row.name}`)).toBeInTheDocument();
      expect(screen.getByText(`cssVar: ${row.cssVar}`)).toBeInTheDocument();
      expect(screen.getByText(`meta: ${row.meta}`)).toBeInTheDocument();
    }
  });
});
