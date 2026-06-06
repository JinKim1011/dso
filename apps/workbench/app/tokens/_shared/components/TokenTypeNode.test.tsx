import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { TokenTypeNode } from "../_shared/components/TokenTypeNode";
import happyManifest from "../lib/manifest/fixtures/happy-manifest.json";
import { buildTokenGraphModel } from "../lib/manifestAdapter";

const result = buildTokenGraphModel(happyManifest);

describe("Node-level behavior, TokenTypeNode", () => {
  const group = result.model.tokenTypes.at(0);
  if (!group) throw new Error("Expected background token type in happy fixture");

  it("renders heading and value buttons", () => {
    render(
      createElement(TokenTypeNode, { group, selectedRowId: null, onSelectRow: () => {} }),
    );

    expect(screen.getByRole("heading", { name: `${group.type}` })).toBeInTheDocument();

    const section = screen.getByTestId(group.id);
    const valueButtons = group.values.map((value) =>
      within(section).getByRole("button", { name: value.name }),
    );
    expect(valueButtons).toHaveLength(group.values.length);
  });

  it("marks selected row with aria-pressed=true", () => {
    const selectedId = group.values[0]?.id;
    if (!selectedId) throw new Error("Expected at least one value in token type group");

    render(
      createElement(TokenTypeNode, {
        group,
        selectedRowId: selectedId,
        onSelectRow: () => {},
      }),
    );

    const section = screen.getByTestId(group.id);
    const valueButtons = group.values.map((value) =>
      within(section).getByRole("button", { name: value.name }),
    );

    valueButtons.forEach((valueButton, index) => {
      const value = group.values[index];
      if (!value) throw new Error("Expected at least one value in token type group");
      expect(valueButton).toHaveAttribute(
        "aria-pressed",
        value.id === selectedId ? "true" : "false",
      );
    });
  });

  it("calls onSelectRow with clicked id", async () => {
    const onSelectRow = vi.fn();
    const user = userEvent.setup();

    render(
      createElement(TokenTypeNode, {
        group,
        selectedRowId: null,
        onSelectRow,
      }),
    );

    const section = screen.getByTestId(group.id);

    for (const [index, value] of group.values.entries()) {
      const button = within(section).getByRole("button", { name: value.name });
      await user.click(button);

      expect(onSelectRow).toHaveBeenNthCalledWith(index + 1, value.id);
    }
    expect(onSelectRow).toHaveBeenCalledTimes(group.values.length);
  });
});
