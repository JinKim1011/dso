"use client";

import { TokenTypeValueItem } from "../lib/manifestAdapter";
import { TokenColorDraft } from "./TokenColorForm";
import { TokenSingleValueDraft } from "./TokenSingleValueForm";
import { TokenTypographyDraft, TokenTypographyOptions } from "./TokenTypographyForm";
import { TokenValuePreview } from "./TokenValuePreview";

export type TokenValueDetailUpdate = {
  name: string;
  meta?: string;
  value?: TokenTypeValueItem["value"];
  preview?: TokenTypeValueItem["preview"];
};

type TokenValueDetailProps = {
  rowId: string;
  name: string;
  cssVar?: string;
  meta?: string;
  category: string;
  kind: string;
  value: TokenTypeValueItem;
  typographyOptions: TokenTypographyOptions;
  onSave: (rowId: string, next: TokenValueDetailUpdate) => void;
};

type DraftState = TokenSingleValueDraft | TokenColorDraft | TokenTypographyDraft;

function getTypographyDraft(
  valueItem: TokenTypeValueItem,
  name: string,
): TokenTypographyDraft {
  if (valueItem.preview?.kind !== "typography") {
    return { name, fontSize: "", fontWeight: "", lineHeight: "" };
  }

  return {
    name,
    fontSize: valueItem.preview.typography.fontSize,
    fontWeight: valueItem.preview.typography.fontWeight,
    lineHeight: valueItem.preview.typography.lineHeight,
  };
}

function isDualValue(
  value: TokenTypeValueItem["value"],
): value is { light?: string; dark?: string } {
  return Boolean(value && typeof value === "object");
}

function buildUpdate(
  category: string,
  kind: string,
  draft: DraftState,
): TokenValueDetailUpdate {
  if (category === "typography" && kind === "semantic") {
    const typographyDraft = draft as TokenTypographyDraft;
    return {
      name: typographyDraft.name,
      meta: `${typographyDraft.fontSize}/${typographyDraft.fontWeight}/${typographyDraft.lineHeight}`,
      preview: {
        kind: "typography",
        typography: {
          fontSize: typographyDraft.fontSize,
          fontWeight: typographyDraft.fontWeight,
          lineHeight: typographyDraft.lineHeight,
        },
      },
    };
  }

  if ("lightValue" in draft && "darkValue" in draft) {
    return {
      name: draft.name,
      value: {
        light: draft.lightValue || undefined,
        dark: draft.darkValue || undefined,
      },
      meta: `light:${draft.lightValue || "-"} dark:${draft.darkValue || "-"}`,
      preview: {
        kind: "color",
        light: draft.lightValue || undefined,
        dark: draft.darkValue || undefined,
      },
    };
  }

  const singleDraft = draft as TokenSingleValueDraft;
  return {
    name: singleDraft.name,
    value: singleDraft.value,
    meta: singleDraft.value,
    preview:
      category === "spacing"
        ? {
            kind: "spacing",
            value: singleDraft.value,
          }
        : undefined,
  };
}

export function TokenValueDetail({
  rowId,
  name,
  category,
  kind,
  value,
  typographyOptions,
  onSave,
}: TokenValueDetailProps) {
  return (
    <div className="px-mini pt-mini pb-miniPlus">
      <TokenValuePreview category={category} kind={kind} value={value} />
    </div>
  );
}
