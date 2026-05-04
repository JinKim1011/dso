import { describe, it } from "vitest";
import { makeStagedViewFixture } from "./lib/fixtures/StagedViewFixture";

describe("StagedView", () => {
  it("shows changed rows after an edit", async () => {
    const base = makeStagedViewFixture();
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
