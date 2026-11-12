import { buildTokenGraphViewModel } from "@/features/tokens/adapters/database/build-token-graph-view-model";
import {
  buildTokenDisplayModel,
  createTokenDisplayResolver,
} from "@/features/tokens/model/token-display";
import {
  buildTokenEditorUpdate,
  createTokenEditorDraft,
  getTokenEditorState,
  type TokenEditorDraft,
} from "@/features/tokens/model/token-value-editor";
import type {
  TokenGraphViewModel,
  TokenValueViewModel,
} from "@/features/tokens/model/token-graph";
import type { Token, TokenReferenceSlot } from "@repo/contracts/type";
import { validSeed } from "@repo/seed-data/valid-seed";
import { describe, expect, it } from "vitest";

const baseModel = buildTokenGraphViewModel(
  validSeed.tokenTypes,
  validSeed.tokens,
  validSeed.tokenReferences,
);

function rowIn(model: TokenGraphViewModel, id: string): TokenValueViewModel {
  const row = model.tokenTypes
    .flatMap((type) => type.values)
    .find((value) => value.id === id);
  if (!row) throw new Error(`Missing test row ${id}`);
  return row;
}

function withRow(
  model: TokenGraphViewModel,
  row: TokenValueViewModel,
): TokenGraphViewModel {
  return {
    ...model,
    tokenTypes: model.tokenTypes.map((type) => ({
      ...type,
      values: type.values.map((value) => (value.id === row.id ? row : value)),
    })),
  };
}

const options = baseModel.tokenTypes.flatMap((type) =>
  type.values.flatMap((row) =>
    row.value.kind === "single"
      ? [{ value: row.id, label: row.name, resolvedValue: row.value.value }]
      : [],
  ),
);
const typographyOptions = { fontSize: options, fontWeight: options, lineHeight: options };
const cases = [
  { name: "surface", kind: "modes" as const, slots: ["light", "dark"] as const },
  {
    name: "body",
    kind: "typography" as const,
    slots: ["fontSize", "fontWeight", "lineHeight"] as const,
  },
];

describe("token previews across database, editor and staged models", () => {
  afterEach(() => clearPersistedDraftModel());

  for (const testCase of cases) {
    it.each(Array.from({ length: 1 << testCase.slots.length }, (_, mask) => mask))(
      `${testCase.kind} slots, mask %i`,
      (mask) => {
        const token = validSeed.tokens.find(
          (item) => item.name === testCase.name && item.value.kind === testCase.kind,
        )!;
        const initialRow = rowIn(baseModel, token.id);
        const type = baseModel.tokenTypes.find((item) => item.id === token.tokenTypeId)!;
        const selectedSlots = new Set<TokenReferenceSlot>(
          testCase.slots.filter((_, index) => mask & (1 << index)),
        );
        const references = Object.fromEntries(
          testCase.slots.map((slot) => [
            slot,
            selectedSlots.has(slot) ? initialRow.references?.[slot] : undefined,
          ]),
        );
        const initialDraft = createTokenEditorDraft(
          initialRow.name,
          initialRow,
          type.category,
          type.kind,
        );
        const draft: TokenEditorDraft =
          initialDraft.kind === "modes"
            ? {
                ...initialDraft,
                lightId: references.light,
                darkId: references.dark,
              }
            : initialDraft.kind === "typography"
              ? {
                  ...initialDraft,
                  fontSizeId: references.fontSize,
                  fontWeightId: references.fontWeight,
                  lineHeightId: references.lineHeight,
                }
              : initialDraft;
        const resolve = createTokenDisplayResolver(baseModel, baseModel);
        const editor = getTokenEditorState(
          draft,
          initialDraft,
          initialRow,
          options,
          typographyOptions,
          resolve,
          type.category,
          type.kind,
        );
        const stagedRow = {
          ...initialRow,
          ...buildTokenEditorUpdate(type.category, draft),
        };
        const stagedModel = withRow(baseModel, stagedRow);
        const stagedDisplay = buildTokenDisplayModel(
          stagedModel,
          createTokenDisplayResolver(baseModel, stagedModel),
        );

        const databaseValue =
          token.value.kind === "modes"
            ? {
                kind: "modes" as const,
                light: selectedSlots.has("light") ? token.value.light : undefined,
                dark: selectedSlots.has("dark") ? token.value.dark : undefined,
              }
            : token.value.kind === "typography"
              ? {
                  kind: "typography" as const,
                  fontSize: selectedSlots.has("fontSize")
                    ? token.value.fontSize
                    : undefined,
                  fontWeight: selectedSlots.has("fontWeight")
                    ? token.value.fontWeight
                    : undefined,
                  lineHeight: selectedSlots.has("lineHeight")
                    ? token.value.lineHeight
                    : undefined,
                }
              : token.value;
        const reloadedToken: Token = { ...token, value: databaseValue };
        const reloadedModel = buildTokenGraphViewModel(
          validSeed.tokenTypes,
          validSeed.tokens.map((item) => (item.id === token.id ? reloadedToken : item)),
          validSeed.tokenReferences.filter(
            (reference) =>
              reference.referencingTokenId !== token.id ||
              selectedSlots.has(reference.slot),
          ),
        );
        const databasePreview = rowIn(reloadedModel, token.id).preview;
        const reloadedDisplay = buildTokenDisplayModel(
          reloadedModel,
          createTokenDisplayResolver(reloadedModel, reloadedModel),
        );
        expect(editor.previewValue.preview).toEqual(databasePreview);
        expect(editor.missingReference).toBe(false);
        expect(rowIn(stagedDisplay, token.id).preview).toEqual(databasePreview);
        expect(rowIn(reloadedDisplay, token.id).preview).toEqual(databasePreview);
        const persistedDraft: TokenGraphViewModel = JSON.parse(
          JSON.stringify(stagedModel),
        );
        const restoredDisplay = buildTokenDisplayModel(
          persistedDraft,
          createTokenDisplayResolver(baseModel, persistedDraft),
        );
        expect(rowIn(restoredDisplay, token.id).preview).toEqual(databasePreview);
        expect(databasePreview !== undefined).toBe(
          testCase.kind === "modes" ? mask !== 0 : mask === 7,
        );
      },
    );
  }

  it("shows a valid mode while flagging an unavailable reference", () => {
    const token = validSeed.tokens.find((item) => item.name === "surface")!;
    const row = rowIn(baseModel, token.id);
    const type = baseModel.tokenTypes.find((item) => item.id === token.tokenTypeId)!;
    const broken = { ...row, references: { ...row.references, dark: "missing" } };
    const result = createTokenDisplayResolver(baseModel, baseModel)(broken, type);
    expect(result.missingReference).toBe(true);
    expect(result.value.preview).toMatchObject({
      kind: "modes",
      light: "oklch(98.5% 0 0)",
    });
    expect(result.value.preview).not.toHaveProperty("dark", expect.any(String));
  });

  it("hides typography when a reference is unavailable", () => {
    const token = validSeed.tokens.find(
      (item) => item.name === "body" && item.value.kind === "typography",
    )!;
    const row = rowIn(baseModel, token.id);
    const type = baseModel.tokenTypes.find((item) => item.id === token.tokenTypeId)!;
    const broken = { ...row, references: { ...row.references, fontSize: "missing" } };
    const result = createTokenDisplayResolver(baseModel, baseModel)(broken, type);
    expect(result.missingReference).toBe(true);
    expect(result.value.preview).toBeUndefined();
  });
});
