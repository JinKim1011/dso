import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  StagedManifestProvider,
  useStagedManifest,
} from "../_shared/context/StagedManifestContext";
import { makeStagedViewFixture } from "./lib/fixtures/StagedViewFixture";
import { StagedView } from "./StagedView";

function Draft({ rowId, update }: { rowId: string; update: Partial<any> }) {
  const { updateRow } = useStagedManifest();
  useEffect(() => {
    updateRow(rowId, update);
  }, [rowId, update]);
  return null;
}

describe("StagedView", () => {
  it("shows changed rows after an edit", async () => {
    const base = makeStagedViewFixture();
    const value = base.tokenTypes[0]?.values[0];

    if (!value) throw new Error("Expected color token value in fixture");

    const beforeName = value.name;

    render(
      <StagedManifestProvider baseManifest={base}>
        <Draft rowId={value.id} update={{ name: "brand" }}></Draft>
        <StagedView></StagedView>
      </StagedManifestProvider>,
    );

    const list = await screen.findByTestId(value.id);
    const button = await within(list).findByText(`brand(prev. ${beforeName})`);
    expect(button).toBeInTheDocument();
  });

  it("selecting a row shows before/after detail", async () => {
    const base = makeStagedViewFixture();
    const value = base.tokenTypes[0]?.values[0];

    if (!value) throw new Error("Expected color token value in fixture");

    render(
      <StagedManifestProvider baseManifest={base}>
        <Draft
          rowId={value.id}
          update={{
            value: {
              light: "oklch(0.985 0.002 247.8)",
              dark: "oklch(0.172 0.038 274.6)",
            },
          }}
        ></Draft>
        <StagedView></StagedView>
      </StagedManifestProvider>,
    );

    const list = await screen.findByTestId(value.id);
    const button = await within(list).findByText(value.name);

    await userEvent.click(button);

    const detail = await screen.findByTestId(`detail: ${value.id}`);

    const beforeDetail = await within(detail).findByTestId(`before: ${value.id}`);
    expect(beforeDetail).toHaveTextContent(`show before ${value.preview?.kind} preview`);

    const afterDetail = await within(detail).findByTestId(`after: ${value.id}`);
    expect(afterDetail).toHaveTextContent(`show after ${value.preview?.kind} preview`);
  });

  it("discard all button resets draft", async () => {
    const base = makeStagedViewFixture();
    const value = base.tokenTypes[1]?.values[0];

    if (!value) throw new Error("Expected spacing token value in fixture");

    render(
      <StagedManifestProvider baseManifest={base}>
        <Draft
          rowId={value.id}
          update={{
            value: "0.25rem",
          }}
        ></Draft>
        <StagedView></StagedView>
      </StagedManifestProvider>,
    );

    const resetButton = await screen.findByRole("button", { name: "Discard all" });

    await userEvent.click(resetButton);

    await waitFor(() => {
      expect(screen.queryByTestId(value.id)).not.toBeInTheDocument();
    });
  });

  it("apply button calls API and clear changes on success", async () => {
    const base = makeStagedViewFixture();
    const value = base.tokenTypes[1]?.values[0];

    if (!value) throw new Error("Expected spacing token value in fixture");

    const updatedDraft = {
      ...base,
      tokenTypes: base.tokenTypes.map((tokenType) => ({
        ...tokenType,
        values: tokenType.values.map((row) =>
          row.id === value.id ? { ...row, value: "0.25rem" } : row,
        ),
      })),
    };

    const fakeFetch = vi.fn(
      async () =>
        new Response(JSON.stringify({ draftModel: updatedDraft }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    );

    global.fetch = fakeFetch as any;

    render(
      <StagedManifestProvider baseManifest={base}>
        <Draft
          rowId={value.id}
          update={{
            value: "0.25rem",
          }}
        />
        <StagedView></StagedView>
      </StagedManifestProvider>,
    );

    await screen.findByTestId(value.id);

    const applyButton = await screen.findByRole("button", { name: "Apply" });
    await userEvent.click(applyButton);

    await waitFor(() => {
      expect(fakeFetch).toHaveBeenCalled();
      expect(screen.queryByTestId(value.id)).not.toBeInTheDocument();
    });
  });

  it("apply button shows applying... and is disabled while pending", async () => {
    const base = makeStagedViewFixture();
    const value = base.tokenTypes[1]?.values[0];
    if (!value) throw new Error("Expected spacing token value in fixture");

    let resolveFetch: (value: Response) => void;
    const pedningFetch = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });
    global.fetch = vi.fn(() => pedningFetch) as any;

    render(
      <StagedManifestProvider baseManifest={base}>
        <Draft
          rowId={value.id}
          update={{
            value: "0.25rem",
          }}
        />
        <StagedView></StagedView>
      </StagedManifestProvider>,
    );

    const applyButton = await screen.findByRole("button", { name: "Apply" });

    await userEvent.click(applyButton);

    await expect(applyButton).toBeDisabled();
    await expect(applyButton).toHaveTextContent(/^Applying...$/);

    const updatedDraft = {
      ...base,
      tokenTypes: base.tokenTypes.map((tokenType) => ({
        ...tokenType,
        values: tokenType.values.map((row) =>
          row.id === value.id ? { ...row, value: "0.25rem" } : row,
        ),
      })),
    };

    resolveFetch!(
      new Response(JSON.stringify({ draftModel: updatedDraft }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await waitFor(() => {
      expect(applyButton).toHaveTextContent(/^Apply$/);
      expect(applyButton).not.toBeDisabled();
    });
  });
});
