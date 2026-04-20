import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import { describe, expect, it, vi } from "vitest";
import happyManifest from "../lib/manifest/fixtures/happy-manifest.json";
import { buildTokenGraphModel } from "../lib/manifestAdapter";
import { TokenTypsNode } from "./TokenTypeNode";

const result = buildTokenGraphModel(happyManifest);

describe("Node-level behavior, TokenTypeNode", () => {
  const group = result.model.tokenTypes.at(0);
  if (!group) throw new Error("Expected background token type in happy fixture");

  it("renders heading and value buttons", () => {
    render(
      createElement(TokenTypsNode, { group, selectedRowId: null, onSelectRow: () => {} }),
    );

    expect(
      screen.getByRole("heading", { name: `${group.type}(${group.kind})` }),
    ).toBeInTheDocument();

    const section = screen.getByTestId(group.id);
    const buttons = within(section).getAllByRole("button");
    expect(buttons).toHaveLength(group.values.length);
  });

  it("marks selected row with aria-pressed=true", () => {
    const selectedId = group.values[0]?.id;
    if (!selectedId) throw new Error("Expected at least one value in token type group");

    render(
      createElement(TokenTypsNode, {
        group,
        selectedRowId: selectedId,
        onSelectRow: () => {},
      }),
    );

    const section = screen.getByTestId(group.id);
    const buttons = within(section).getAllByRole("button");

    buttons.forEach((button, index) => {
      const value = group.values[index];
      if (!value) throw new Error("Expected at least one value in token type group");
      expect(button).toHaveAttribute(
        "aria-pressed",
        value.id === selectedId ? "true" : "false",
      );
    });
  });

  it("calls onSelectRow with clicked id", async () => {
    const onSelectRow = vi.fn();

    render(
      createElement(TokenTypsNode, {
        group,
        selectedRowId: null,
        onSelectRow,
      }),
    );

    const section = screen.getByTestId(group.id);

    for (const value of group.values) {
      const button = within(section).getByRole("button", { name: value.name });
      await userEvent.click(button);
      expect(onSelectRow).toHaveBeenCalledWith(value.id);
    }
  });
});
