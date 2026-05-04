import { describe, it } from "vitest";
import { makeStagedViewFixture } from "./lib/fixtures/StagedViewFixture";

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
  });

  it("appy button calls API and clear changes on success", async () => {
    const base = makeStagedViewFixture();
  });

  it("appy button shows applying... and is disabled while pending", async () => {
    const base = makeStagedViewFixture();
  });
});
