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
