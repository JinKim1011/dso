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

    render(
      <StagedManifestProvider baseManifest={base}>
        <Draft rowId={value.id} update={{ name: "brand" }}></Draft>
        <StagedView></StagedView>
      </StagedManifestProvider>,
    );

    const row = await screen.findByTestId(value.id);
    expect(row).toBeInTheDocument();
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

    const row = await screen.findByTestId(value.id);

    await userEvent.click(row);

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

    const originalFetch = global.fetch;
    global.fetch = fakeFetch as any;

    try {
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
    } finally {
      global.fetch = originalFetch;
    }
  });

  it("apply button shows applying... and is disabled while pending", async () => {
    const base = makeStagedViewFixture();
    const value = base.tokenTypes[1]?.values[0];
    if (!value) throw new Error("Expected spacing token value in fixture");

    let resolveFetch: (value: Response) => void;
    const pendingFetch = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });

    const originalFetch = global.fetch;
    global.fetch = vi.fn(() => pendingFetch) as any;

    try {
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
    } finally {
      global.fetch = originalFetch;
    }
  });

  it("discard per-row button resets the row while other rows remain", async () => {
    const base = makeStagedViewFixture();
    const rowA = base.tokenTypes[1]?.values[0];
    const rowB = base.tokenTypes[1]?.values[1];
    const rowC = base.tokenTypes[1]?.values[2];

    if (!rowA) throw new Error("Expected spacing micro token value in fixture");
    if (!rowB) throw new Error("Expected spacing mini token value in fixture");
    if (!rowC) throw new Error("Expected spacing small token value in fixture");

    const drafts = [
      { rowId: rowA.id, update: { value: "0.25rem" } },
      { rowId: rowB.id, update: { value: "0.5rem" } },
      { rowId: rowC.id, update: { value: "0.75rem" } },
    ];

    render(
      <StagedManifestProvider baseManifest={base}>
        {drafts.map((draft) => (
          <Draft key={draft.rowId} rowId={draft.rowId} update={draft.update} />
        ))}
        <StagedView></StagedView>
      </StagedManifestProvider>,
    );

    const tableRowA = await screen.findByTestId(rowA.id);

    const discardRowA = await within(tableRowA).findByRole("button", {
      name: "discard-row",
    });

    await userEvent.click(discardRowA);

    await waitFor(() => {
      expect(screen.queryByTestId(rowA.id)).not.toBeInTheDocument();
      expect(screen.queryByTestId(rowB.id)).toBeInTheDocument();
      expect(screen.queryByTestId(rowC.id)).toBeInTheDocument();
    });
  });

  it("apply the API call for a single row and leaves other draft rows unchanged on success", async () => {
    const base = makeStagedViewFixture();
    const rowA = base.tokenTypes[1]?.values[0];
    const rowB = base.tokenTypes[1]?.values[1];
    const rowC = base.tokenTypes[1]?.values[2];

    if (!rowA) throw new Error("Expected spacing micro token value in fixture");
    if (!rowB) throw new Error("Expected spacing mini token value in fixture");
    if (!rowC) throw new Error("Expected spacing small token value in fixture");

    const drafts = [
      { rowId: rowA.id, update: { value: "0.25rem" } },
      { rowId: rowB.id, update: { value: "0.5rem" } },
      { rowId: rowC.id, update: { value: "0.75rem" } },
    ];

    const draftByRowId = drafts.reduce<Record<string, { value: string }>>(
      (accumulator, { rowId, update }) => {
        accumulator[rowId] = update;
        return accumulator;
      },
      {},
    );

    const updatedDraft = {
      ...base,
      tokenTypes: base.tokenTypes.map((tokenType) => ({
        ...tokenType,
        values: tokenType.values.map((row) =>
          draftByRowId[row.id] ? { ...row, ...draftByRowId[row.id] } : row,
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

    const originalFetch = global.fetch;
    global.fetch = fakeFetch as any;

    try {
      render(
        <StagedManifestProvider baseManifest={base}>
          {drafts.map((draft) => (
            <Draft key={draft.rowId} rowId={draft.rowId} update={draft.update} />
          ))}
          <StagedView></StagedView>
        </StagedManifestProvider>,
      );

      await screen.findByTestId(rowA.id);
      await screen.findByTestId(rowB.id);
      await screen.findByTestId(rowC.id);

      const tableRowA = await screen.findByTestId(rowA.id);
      const applyRowA = await within(tableRowA).findByRole("button", {
        name: "apply-row",
      });

      await userEvent.click(applyRowA);

      await waitFor(() => {
        expect(fakeFetch).toHaveBeenCalled();

        expect(screen.queryByTestId(rowA.id)).not.toBeInTheDocument();
        expect(screen.queryByTestId(rowB.id)).toBeInTheDocument();
        expect(screen.queryByTestId(rowC.id)).toBeInTheDocument();
      });
    } finally {
      global.fetch = originalFetch;
    }
  });
});
