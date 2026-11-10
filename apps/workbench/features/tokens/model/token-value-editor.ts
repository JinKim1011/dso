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
      fontSize: string;
      fontWeight: string;
      lineHeight: string;
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
        fontSize: tokenValue.fontSize,
        fontWeight: tokenValue.fontWeight,
        lineHeight: tokenValue.lineHeight,
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
      if (category !== "typography" || kind !== "semantic") {
        throw new Error("Unsupported typography draft for this category and kind.");
      }

      return {
        name: draft.name,
        meta: `${draft.fontSize} / ${draft.fontWeight} / ${draft.lineHeight}`,
        preview: {
          kind: "typography",
          typography: {
            fontSize: draft.fontSize,
            fontWeight: draft.fontWeight,
            lineHeight: draft.lineHeight,
          },
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
) {
  const isDirty = JSON.stringify(draft) !== JSON.stringify(initialDraft);

  if (draft.kind !== "modes") {
    return {
      isDirty,
      referencesChanged: false,
      missingReference: false,
      previewValue: value,
    };
  }

  const referencesChanged =
    initialDraft.kind === "modes" &&
    (draft.lightId !== initialDraft.lightId || draft.darkId !== initialDraft.darkId);

  const lightOption = colorOptions.find((option) => option.value === draft.lightId);
  const darkOption = colorOptions.find((option) => option.value === draft.darkId);

  const missingReference =
    (!!draft.lightId && !lightOption) || (!!draft.darkId && !darkOption);

  const previousPreview = value.preview?.kind === "modes" ? value.preview : undefined;

  return {
    isDirty,
    referencesChanged,
    missingReference,
    previewValue: {
      ...value,
      preview: {
        kind: "modes" as const,
        light: draft.lightId ? lightOption?.resolvedValue : previousPreview?.light,
        dark: draft.darkId ? darkOption?.resolvedValue : previousPreview?.dark,
      },
    },
  };
}
