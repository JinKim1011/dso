import { buildTokenGraphViewModel } from "@/features/tokens/adapters/database/build-token-graph-view-model";
import { validateTokenNameChange } from "@/features/tokens/model/token-name-validation";
import { validSeed } from "@repo/seed-data/valid-seed";
import { describe, expect, it } from "vitest";

const model = buildTokenGraphViewModel(
  validSeed.tokenTypes,
  validSeed.tokens,
  validSeed.tokenReferences,
);

function rowByName(typeName: string, name: string) {
  const type = model.tokenTypes.find(
    (item) => item.category === "radius" && item.type === typeName,
  );
  const row = type?.values.find((item) => item.name === name);
  if (!type || !row) throw new Error(`Missing token ${typeName}/${name}`);
  return { type, row };
}

describe("validateTokenNameChange", () => {
  it("allows an unchanged legacy name", () => {
    const { type, row } = rowByName("modal", "small");

    expect(
      validateTokenNameChange({
        draftModel: model,
        row,
        tokenTypeId: type.id,
        originalName: row.name,
        nextName: row.name,
      }),
    ).toBeNull();
  });

  it("rejects a name that is not a canonical final segment", () => {
    const { type, row } = rowByName("modal", "small");

    expect(
      validateTokenNameChange({
        draftModel: model,
        row,
        tokenTypeId: type.id,
        originalName: row.name,
        nextName: "very Small",
      }),
    ).toBe("Use lowercase letters, numbers, and single hyphens.");
  });

  it("allows a unique final segment under the type path", () => {
    const { type, row } = rowByName("modal", "small");

    expect(
      validateTokenNameChange({
        draftModel: model,
        row,
        tokenTypeId: type.id,
        originalName: row.name,
        nextName: "compact",
      }),
    ).toBeNull();
  });

  it("rejects a generated CSS path used by another token in the same type", () => {
    const { type, row } = rowByName("modal", "small");

    expect(
      validateTokenNameChange({
        draftModel: model,
        row,
        tokenTypeId: type.id,
        originalName: row.name,
        nextName: "large",
      }),
    ).toContain("--radius-component-modal-large");
  });
});
