import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement, useContext } from "react";
import { describe, expect, it } from "vitest";
import WorkbenchShellProvider, {
  WorkbenchShellDetailContext,
} from "../_shared/context/WorkbenchShellContext";
import happyManifest from "./lib/manifest/fixtures/happy-manifest.json";
import { buildTokenGraphModel } from "./lib/manifestAdapter";
import { TokensView } from "./TokensView";

const result = buildTokenGraphModel(happyManifest);

describe("Container-level behavior, TokensView", () => {
  it("renders root heading/container", async () => {
    render(createElement(TokensView, { model: result.model }));
    const root = result.model.root;

    // query by text not by role, since root label is rendered inside a custom node
    const rootLabel = await screen.findByText(root.label);
    expect(rootLabel).toBeInTheDocument();
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
    const group = result.model.tokenTypes.at(0);
    if (!group) throw new Error("Expected background token type in happy fixture");

    function ShellDetailSlot() {
      const slot = useContext(WorkbenchShellDetailContext);
      return <div data-testid="shell-detail">{slot}</div>;
    }

    render(
      <WorkbenchShellProvider>
        <ShellDetailSlot />
        <TokensView model={result.model} />
      </WorkbenchShellProvider>,
    );

    for (const value of group.values) {
      const valueButton = screen.getByTestId(value.id);
      await userEvent.click(valueButton);

      const shell = await screen.findByTestId("shell-detail");

      const nameInput = await within(shell).findByLabelText("Name");
      expect(nameInput).toHaveValue(value.name);

      const cssVarText = await within(shell).findByText(`cssVar: ${value.cssVar}`);
      expect(cssVarText).toBeInTheDocument();

      const valueText = await within(shell).findByText(`meta: ${value.meta}`);
      expect(valueText).toBeInTheDocument();
    }
  });
});
