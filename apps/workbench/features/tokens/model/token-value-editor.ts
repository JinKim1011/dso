import type {
  TokenReferenceOption,
  TokenValueDetailUpdate,
  TokenValueViewModel,
  TypographyReferenceOptions,
} from "@/features/tokens/model/token-graph";
import type { TokenDisplayResolver } from "@/features/tokens/model/token-display";
import type { TokenCategory, TokenKind } from "@repo/contracts/validation/enum";

export type TokenEditorDraft =
  | { kind: "single"; name: string; value: string }
  | { kind: "modes"; name: string; lightId?: string; darkId?: string }
  | {
      kind: "typography";
      name: string;
      fontSizeId?: string;
      fontWeightId?: string;
      lineHeightId?: string;
    };

export function createTokenEditorDraft(
  name: string,
  value: TokenValueViewModel,
  category: TokenCategory,
  kind: TokenKind,
): TokenEditorDraft {
  const tokenValue = value.value;

  switch (tokenValue.kind) {
    case "single":
      return { kind: "single", name, value: tokenValue.value };

    case "modes": {
      if (kind !== "semantic" || (category !== "color" && category !== "shadow")) {
        throw new Error(`Unsupported modes token: ${category}/${kind} (${value.id}).`);
      }

      return {
        kind: "modes",
        name,
        lightId: value.references?.light,
        darkId: value.references?.dark,
      };
    }

    case "typography":
      return {
        kind: "typography",
        name,
        fontSizeId: value.references?.fontSize,
        fontWeightId: value.references?.fontWeight,
        lineHeightId: value.references?.lineHeight,
      };

    case "unresolved":
      return { kind: "single", name, value: "" };
  }
}

export function buildTokenEditorUpdate(
  category: string,
  draft: TokenEditorDraft,
): TokenValueDetailUpdate {
  switch (draft.kind) {
    case "single":
      return {
        name: draft.name,
        value: { kind: "single", value: draft.value },
        meta: draft.value,
        preview:
          category === "color" ? { kind: "single", value: draft.value } : undefined,
      };

    case "modes":
      return {
        name: draft.name,
        value: { kind: "modes" },
        references: { light: draft.lightId, dark: draft.darkId },
      };

    case "typography":
      return {
        name: draft.name,
        value: { kind: "typography" },
        references: {
          fontSize: draft.fontSizeId,
          fontWeight: draft.fontWeightId,
          lineHeight: draft.lineHeightId,
        },
      };
  }
}

export function getTokenEditorState(
  draft: TokenEditorDraft,
  initialDraft: TokenEditorDraft,
  value: TokenValueViewModel,
  modeOptions: readonly TokenReferenceOption[],
  typographyOptions: TypographyReferenceOptions,
  resolveDisplay: TokenDisplayResolver,
  category: TokenCategory,
  kind: TokenKind,
) {
  const isDirty = JSON.stringify(draft) !== JSON.stringify(initialDraft);
  const display = resolveDisplay(
    { ...value, ...buildTokenEditorUpdate(category, draft) },
    { category, kind },
    value,
  );

  switch (draft.kind) {
    case "single":
      return {
        isDirty,
        referencesChanged: false,
        missingReference: display.missingReference,
        incomplete: display.incomplete,
        previewValue: display.value,
      };

    case "modes": {
      const referencesChanged =
        initialDraft.kind !== "modes" ||
        draft.lightId !== initialDraft.lightId ||
        draft.darkId !== initialDraft.darkId;

      const light = modeOptions.find((option) => option.value === draft.lightId);
      const dark = modeOptions.find((option) => option.value === draft.darkId);

      const missingReference = (!!draft.lightId && !light) || (!!draft.darkId && !dark);

      return {
        isDirty,
        referencesChanged,
        missingReference: missingReference || display.missingReference,
        incomplete: display.incomplete,
        previewValue: display.value,
      };
    }

    case "typography": {
      const referencesChanged =
        initialDraft.kind !== "typography" ||
        draft.fontSizeId !== initialDraft.fontSizeId ||
        draft.fontWeightId !== initialDraft.fontWeightId ||
        draft.lineHeightId !== initialDraft.lineHeightId;

      const fontSize = typographyOptions.fontSize.find(
        (option) => option.value === draft.fontSizeId,
      );
      const fontWeight = typographyOptions.fontWeight.find(
        (option) => option.value === draft.fontWeightId,
      );
      const lineHeight = typographyOptions.lineHeight.find(
        (option) => option.value === draft.lineHeightId,
      );

      const missingReference =
        (!!draft.fontSizeId && !fontSize) ||
        (!!draft.fontWeightId && !fontWeight) ||
        (!!draft.lineHeightId && !lineHeight);

      return {
        isDirty,
        referencesChanged,
        missingReference: missingReference || display.missingReference,
        incomplete: display.incomplete,
        previewValue: display.value,
      };
    }
  }
}
