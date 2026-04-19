import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { TokensView } from "./TokensView";
import { tokensViewModelFixture } from "./tokensView.model.fixtures";

describe("TokensView smoke render tests", () => {
  it("renders a section element", () => {
    const { container } = render(createElement(TokensView));
    const section = container.querySelector("section");
    expect(section).not.toBeNull();
  });
});

describe("TokensView integration tests", () => {
  const rows = tokensViewModelFixture.tokenTypes.flatMap((tokenType) =>
    tokenType.values.map((value) => ({
      id: value.id,
      name: value.name,
      cssVar: value.cssVar,
      meta: value.meta,
    })),
  );

  it("selects row when clicked", async () => {
    render(createElement(TokensView));

    for (const row of rows) {
      const currentRow = screen.getByRole("button", { name: row.name });
      expect(currentRow).toHaveAttribute("aria-pressed", "false");

      await userEvent.click(currentRow);

      expect(currentRow).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByText(`selected: ${row.name}`)).toBeInTheDocument();
    }
  });

  it("expands detail panel when row clicked", async () => {
    render(createElement(TokensView));

    for (const row of rows) {
      const currentRow = screen.getByRole("button", { name: row.name });

      await userEvent.click(currentRow);

      expect(screen.getByText(`selected: ${row.name}`)).toBeInTheDocument();
      expect(screen.getByText(`cssVar: ${row.cssVar}`)).toBeInTheDocument();
      expect(screen.getByText(`meta: ${row.meta}`)).toBeInTheDocument();
    }
  });

  it("renders token type groups with their own value buttons", () => {
    render(createElement(TokensView));
    const groups = tokensViewModelFixture.tokenTypes.map((tokenType) => ({
      id: tokenType.id,
      category: tokenType.category,
      type: tokenType.type,
      kind: tokenType.kind,
      values: tokenType.values,
    }));

    for (const group of groups) {
      const currentGroup = screen.getByTestId(group.id);
      expect(currentGroup).not.toBeNull();

      for (const values of group.values) {
        const vauleItem = within(currentGroup).getByRole("button", { name: values.name });
        expect(vauleItem).not.toBeNull();
      }
    }
  });
});
