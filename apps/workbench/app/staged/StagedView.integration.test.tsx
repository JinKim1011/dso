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
