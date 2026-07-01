import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { StagedManifestProvider } from "../_shared/context/StagedManifestContext";
import happyManifest from "./lib/manifest/fixtures/happy-manifest.json";
import { buildTokenGraphModel } from "./lib/manifestAdapter";
import { TokensView } from "./TokensView";

const result = buildTokenGraphModel(happyManifest);

describe("Container-level behavior, TokensView", () => {
  it("renders root heading/container", async () => {
    render(
      <StagedManifestProvider baseManifest={result.model}>
        <TokensView />
      </StagedManifestProvider>,
    );
    const root = result.model.root;

    // query by text not by role, since root label is rendered inside a custom node
    const rootLabel = await screen.findByText(root.label);
    expect(rootLabel).toBeInTheDocument();
  });

  it("renders categories", async () => {
    render(
      <StagedManifestProvider baseManifest={result.model}>
        <TokensView />
      </StagedManifestProvider>,
    );
    const categories = result.model.categories;

    for (const category of categories) {
      const categoryLabel = await screen.findByText(category.category);
      expect(categoryLabel).toBeInTheDocument();
    }
  });

  it("does not duplicate token type groups across categories", async () => {
    render(
      <StagedManifestProvider baseManifest={result.model}>
        <TokensView />
      </StagedManifestProvider>,
    );
    const allTokenTypes = result.model.tokenTypes;

    for (const tokenType of allTokenTypes) {
      const tokenTypeLabel = await screen.findAllByText(tokenType.type);
      expect(tokenTypeLabel).toHaveLength(1);
    }
  });

  it("clicking one row updates detail panel", async () => {
    const group = result.model.tokenTypes.at(0);
    if (!group) throw new Error("Expected background token type in happy fixture");

    render(
      <StagedManifestProvider baseManifest={result.model}>
        <TokensView />
      </StagedManifestProvider>,
    );

    for (const value of group.values) {
      const valueButton = screen.getByTestId(value.id);
      await userEvent.click(valueButton);

      const nameInput = await screen.findByLabelText("Name");
      expect(nameInput).toHaveValue(value.name);
    }
  });

  it("saving edited name updates row label", async () => {
    const group = result.model.tokenTypes.at(0);
    if (!group) throw new Error("Expected at least one token type in fixture");

    render(
      <StagedManifestProvider baseManifest={result.model}>
        <TokensView />
      </StagedManifestProvider>,
    );

    const row = group.values[0];
    if (!row) throw new Error("Expected token value in fixture");

    const valueButton = screen.getByTestId(row.id);
    await userEvent.click(valueButton);

    const nameInput = await screen.findByLabelText("Name");
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "primary-updated");

    const saveButton = screen.getByRole("button", { name: /save/i });
    await userEvent.click(saveButton);

    expect(await screen.findByText("primary-updated")).toBeInTheDocument();
  });
});
