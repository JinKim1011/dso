import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import happyManifest from "./lib/manifest/fixtures/happy-manifest.json";
import { buildTokenGraphModel } from "./lib/manifestAdapter";
import { TokensView } from "./TokensView";

const result = buildTokenGraphModel(happyManifest);

describe("TokensView smoke render tests", () => {
  it("renders a section element", () => {
    const { container } = render(createElement(TokensView, { model: result.model }));
    const section = container.querySelector("section");
    expect(section).not.toBeNull();
  });
});

describe("TokensView integration tests", () => {
  const rows = result.model.tokenTypes.flatMap((tokenType) =>
    tokenType.values.map((value) => ({
      id: value.id,
      name: value.name,
      cssVar: value.cssVar,
      meta: value.meta,
    })),
  );

  it("renders a root element", () => {
    render(createElement(TokensView, { model: result.model }));
    const root = result.model.root;
    const h1 = screen.getByRole("heading", { name: root.label });

    expect(h1).not.toBeNull();
  });

  it("selects row when clicked", async () => {
    render(createElement(TokensView, { model: result.model }));

    for (const row of rows) {
      const currentRow = screen.getByRole("button", { name: row.name });
      expect(currentRow).toHaveAttribute("aria-pressed", "false");

      await userEvent.click(currentRow);

      expect(currentRow).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByText(`selected: ${row.name}`)).toBeInTheDocument();
    }
  });

  it("expands detail panel when row clicked", async () => {
    render(createElement(TokensView, { model: result.model }));

    for (const row of rows) {
      const currentRow = screen.getByRole("button", { name: row.name });

      await userEvent.click(currentRow);

      expect(screen.getByText(`selected: ${row.name}`)).toBeInTheDocument();
      expect(screen.getByText(`cssVar: ${row.cssVar}`)).toBeInTheDocument();
      expect(screen.getByText(`meta: ${row.meta}`)).toBeInTheDocument();
    }
  });

  it("renders token type groups", () => {
    render(createElement(TokensView, { model: result.model }));
    const groups = result.model.tokenTypes.map((tokenType) => ({
      id: tokenType.id,
      category: tokenType.category,
      type: tokenType.type,
      kind: tokenType.kind,
      values: tokenType.values,
    }));

    for (const group of groups) {
      const currentGroup = screen.getByTestId(group.id);
      expect(currentGroup).not.toBeNull();
    }
  });

  it("renders token type category", () => {
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

  it("renders token type groups under correct category", () => {
    render(createElement(TokensView, { model: result.model }));
    const categories = result.model.categories;

    for (const category of categories) {
      const categorySection = screen.getByTestId(category.id);

      for (const groupId of category.tokenTypeIds) {
        const currentGroup = within(categorySection).getByTestId(groupId);
        expect(currentGroup).toBeInTheDocument();
      }
    }
  });

  it("renders token valueItem under correct token type group", () => {
    render(createElement(TokensView, { model: result.model }));
    const groups = result.model.tokenTypes;

    for (const group of groups) {
      const groupSection = screen.getByTestId(group.id);
      const list = within(groupSection).getByRole("list");

      for (const valueItem of group.values) {
        const currentValueItem = within(list).getByRole("button", {
          name: valueItem.name,
        });

        expect(currentValueItem).toBeInTheDocument();
        expect(currentValueItem.closest("li")).not.toBeNull();
      }
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

  it("does not duplicate token value items across all token type groups", () => {
    render(createElement(TokensView, { model: result.model }));
    const allGroups = result.model.tokenTypes;

    for (const group of allGroups) {
      const groupSection = screen.getByTestId(group.id);
      const list = within(groupSection).getByRole("list");

      for (const value of group.values) {
        const valueItem = within(list).getAllByRole("button", { name: value.name });
        expect(valueItem).toHaveLength(1);
      }
    }
  });
});
