import type {
  TokenReferenceOption,
  TokenValueViewModel,
  TypographyReferenceOptions,
} from "@/features/tokens/model/token-graph";
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

export type TokenValueDetailUpdate = {
  name: string;
  meta?: string;
  value?: TokenValueViewModel["value"];
  preview?: TokenValueViewModel["preview"];
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
  kind: TokenKind,
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
      return { name: draft.name };

    case "typography":
      return { name: draft.name };
  }
}

export function getTokenEditorState(
  draft: TokenEditorDraft,
  initialDraft: TokenEditorDraft,
  value: TokenValueViewModel,
  modeOptions: readonly TokenReferenceOption[],
  typographyOptions: TypographyReferenceOptions,
) {
  const isDirty = JSON.stringify(draft) !== JSON.stringify(initialDraft);

  switch (draft.kind) {
    case "single":
      return {
        isDirty,
        referencesChanged: false,
        missingReference: false,
        previewValue: value,
      };

    case "modes": {
      const referencesChanged =
        initialDraft.kind !== "modes" ||
        draft.lightId !== initialDraft.lightId ||
        draft.darkId !== initialDraft.darkId;

      const light = modeOptions.find((option) => option.value === draft.lightId);
      const dark = modeOptions.find((option) => option.value === draft.darkId);

      const missingReference = (!!draft.lightId && !light) || (!!draft.darkId && !dark);

      const previous = value.preview?.kind === "modes" ? value.preview : undefined;

      return {
        isDirty,
        referencesChanged,
        missingReference,
        previewValue: {
          ...value,
          preview: {
            kind: "modes" as const,
            light: draft.lightId ? light?.resolvedValue : previous?.light,
            dark: draft.darkId ? dark?.resolvedValue : previous?.dark,
          },
        },
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

      const previous =
        value.preview?.kind === "typography" ? value.preview.typography : undefined;

      const resolved = {
        fontSize: draft.fontSizeId ? fontSize?.resolvedValue : previous?.fontSize,
        fontWeight: draft.fontWeightId ? fontWeight?.resolvedValue : previous?.fontWeight,
        lineHeight: draft.lineHeightId ? lineHeight?.resolvedValue : previous?.lineHeight,
      };

      const preview =
        resolved.fontSize !== undefined &&
        resolved.fontWeight !== undefined &&
        resolved.lineHeight !== undefined
          ? {
              kind: "typography" as const,
              typography: {
                fontSize: resolved.fontSize,
                fontWeight: resolved.fontWeight,
                lineHeight: resolved.lineHeight,
              },
            }
          : undefined;

      return {
        isDirty,
        referencesChanged,
        missingReference,
        previewValue: { ...value, preview },
      };
    }
  }
}
