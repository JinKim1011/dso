import { buildTokenGraphViewModel } from "@/features/tokens/adapters/database/build-token-graph-view-model";
import { buildStagedTokenChange } from "@/features/tokens/model/staged/staged-change-diff";
import {
  buildTokenDisplayModel,
  createTokenDisplayResolver,
} from "@/features/tokens/model/token-display";
import type {
  TokenGraphViewModel,
  TokenValueViewModel,
} from "@/features/tokens/model/token-graph";
import {
  buildTokenEditorUpdate,
  createTokenEditorDraft,
  getTokenEditorState,
  type TokenEditorDraft,
} from "@/features/tokens/model/token-value-editor";
import {
  clearPersistedDraftModel,
  discardLegacyDraft,
  loadPersistedDraftModel,
  persistDraftModel,
} from "@/features/tokens/state/staged-draft-storage";
import type { TokenReferenceSlot } from "@repo/contracts/type";
import { validSeed } from "@repo/seed-data/valid-seed";
import { afterEach, describe, expect, it } from "vitest";

const baseModel = buildTokenGraphViewModel(
  validSeed.tokenTypes,
  validSeed.tokens,
  validSeed.tokenReferences,
);
const projectId = validSeed.projects[0]!.id;

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
  afterEach(() => clearPersistedDraftModel(projectId));

  it("flags primitive CSS variables in the editor and referenced preview", () => {
    const surface = validSeed.tokens.find((item) => item.name === "surface")!;
    const row = rowIn(baseModel, surface.id);
    const targetId = row.references!.light!;
    const primitive = rowIn(baseModel, targetId);
    const primitiveType = baseModel.tokenTypes.find((type) =>
      type.values.some((item) => item.id === targetId),
    )!;
    const invalid = {
      ...primitive,
      value: { kind: "single" as const, value: "var(--x)" },
    };
    const draftModel = withRow(baseModel, invalid);
    const resolve = createTokenDisplayResolver(draftModel);
    const surfaceType = baseModel.tokenTypes.find(
      (type) => type.id === surface.tokenTypeId,
    )!;
    expect(resolve(row, surfaceType)).toMatchObject({
      missingReference: true,
      value: { meta: expect.stringContaining("unavailable") },
    });
    const initial = createTokenEditorDraft(
      primitive.name,
      primitive,
      primitiveType.category,
      primitiveType.kind,
    );
    const draft = createTokenEditorDraft(
      invalid.name,
      invalid,
      primitiveType.category,
      primitiveType.kind,
    );
    expect(
      getTokenEditorState(
        draft,
        initial,
        invalid,
        options,
        typographyOptions,
        resolve,
        primitiveType.category,
        primitiveType.kind,
      ),
    ).toMatchObject({ invalidPrimitiveValue: true });
    expect(resolve(invalid, primitiveType).value.preview).toBeUndefined();
  });

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
        const resolve = createTokenDisplayResolver(baseModel);
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
          createTokenDisplayResolver(stagedModel),
        );

        const reloadedModel = buildTokenGraphViewModel(
          validSeed.tokenTypes,
          validSeed.tokens,
          validSeed.tokenReferences.filter(
            (reference) =>
              reference.referencingTokenId !== token.id ||
              selectedSlots.has(reference.slot),
          ),
        );
        const databasePreview = rowIn(reloadedModel, token.id).preview;
        const reloadedDisplay = buildTokenDisplayModel(
          reloadedModel,
          createTokenDisplayResolver(reloadedModel),
        );

        expect(editor.previewValue.preview).toEqual(databasePreview);
        expect(editor.missingReference).toBe(false);
        expect(rowIn(stagedDisplay, token.id).preview).toEqual(databasePreview);
        expect(rowIn(reloadedDisplay, token.id).preview).toEqual(databasePreview);

        persistDraftModel(projectId, baseModel, stagedModel);

        const persistedDraft = loadPersistedDraftModel(projectId)?.draftModel;

        expect(persistedDraft).not.toBeNull();

        const restoredDisplay = buildTokenDisplayModel(
          persistedDraft!,
          createTokenDisplayResolver(persistedDraft!),
        );

        expect(rowIn(restoredDisplay, token.id).preview).toEqual(databasePreview);
        expect(databasePreview !== undefined).toBe(
          testCase.kind === "modes" ? mask !== 0 : mask === 7,
        );
      },
    );
  }

  for (const testCase of cases) {
    for (const slot of testCase.slots) {
      it(`persists ${testCase.kind} ${slot} assignment, replacement and clearing`, () => {
        const token = validSeed.tokens.find(
          (item) => item.name === testCase.name && item.value.kind === testCase.kind,
        )!;
        const original = rowIn(baseModel, token.id);
        const type = baseModel.tokenTypes.find((item) => item.id === token.tokenTypeId)!;
        const firstId = original.references?.[slot];
        expect(firstId).toBeDefined();
        const primitiveType = baseModel.tokenTypes.find((item) =>
          item.values.some((row) => row.id === firstId),
        )!;
        const replacement = primitiveType.values.find((row) => row.id !== firstId)!;
        expect(replacement.value.kind).toBe("single");

        const initial = {
          ...original,
          references: { ...original.references, [slot]: undefined },
        };
        const evaluate = (targetId: string | undefined) => {
          const draft = createTokenEditorDraft(
            initial.name,
            initial,
            type.category,
            type.kind,
          );
          const field = `${slot}Id`;
          const update = buildTokenEditorUpdate(type.category, {
            ...draft,
            [field]: targetId,
          });
          const stagedRow = { ...initial, ...update };
          const model = withRow(baseModel, stagedRow);
          persistDraftModel(projectId, baseModel, model);
          const restored = loadPersistedDraftModel(projectId)!.draftModel;
          const restoredRow = rowIn(restored, token.id);
          expect(restoredRow.references?.[slot]).toBe(targetId);
          expect(restoredRow.value).toEqual({ kind: testCase.kind });
          return {
            row: restoredRow,
            display: createTokenDisplayResolver(restored)(restoredRow, type),
          };
        };

        const assigned = evaluate(firstId);
        expect(assigned.display.value.meta).toContain(rowIn(baseModel, firstId!).name);
        expect(assigned.display.value.preview).toBeDefined();

        const replaced = evaluate(replacement.id);
        expect(replaced.display.value.meta).toContain(replacement.name);
        if (replacement.value.kind !== "single") throw new Error("Expected primitive");
        if (testCase.kind === "modes") {
          expect(replaced.display.value.preview).toMatchObject({
            kind: "modes",
            [slot]: replacement.value.value,
          });
        } else {
          expect(replaced.display.value.preview).toMatchObject({
            kind: "typography",
            typography: { [slot]: replacement.value.value },
          });
        }

        const cleared = evaluate(undefined);
        expect(cleared.display.value.meta).toContain("unset");
        expect(cleared.display.missingReference).toBe(false);
        if (testCase.kind === "typography") {
          expect(cleared.display.value.preview).toBeUndefined();
        } else {
          expect(cleared.display.value.preview).not.toHaveProperty(
            slot,
            expect.any(String),
          );
        }
        expect(buildStagedTokenChange(original, cleared.row)?.references).toContainEqual({
          slot,
          beforeTokenId: firstId,
          afterTokenId: null,
        });
      });
    }
  }

  it("discards legacy drafts without a project or baseline", () => {
    const token = validSeed.tokens.find((item) => item.name === "surface")!;
    const row = rowIn(baseModel, token.id);
    const body = validSeed.tokens.find(
      (item) => item.name === "body" && item.value.kind === "typography",
    )!;
    const bodyRow = rowIn(baseModel, body.id);
    const legacySurface = withRow(baseModel, {
      ...row,
      value: { kind: "modes" },
      references: { ...row.references, light: undefined },
    });
    const legacy = withRow(legacySurface, {
      ...bodyRow,
      value: { kind: "typography" },
      references: { ...bodyRow.references, fontSize: undefined },
    });
    localStorage.setItem(
      "dso-workbench-staged-draft",
      JSON.stringify({ version: 1, draftModel: legacy }),
    );
    discardLegacyDraft();
    expect(loadPersistedDraftModel(projectId)).toBeNull();
    expect(localStorage.getItem("dso-workbench-staged-draft")).toBeNull();
  });

  it("shows a valid mode while flagging an unavailable reference", () => {
    const token = validSeed.tokens.find((item) => item.name === "surface")!;
    const row = rowIn(baseModel, token.id);
    const type = baseModel.tokenTypes.find((item) => item.id === token.tokenTypeId)!;
    const broken = { ...row, references: { ...row.references, dark: "missing" } };
    const result = createTokenDisplayResolver(baseModel)(broken, type);
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
    const result = createTokenDisplayResolver(baseModel)(broken, type);
    expect(result.missingReference).toBe(true);
    expect(result.value.preview).toBeUndefined();
  });
});
