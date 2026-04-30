"use client";

import { TokenTypeValueItem } from "../lib/manifestAdapter";
import { TokenValuePreview } from "./TokenValuePreview";

type TokenValueDetailProps = {
  name: string;
  cssVar?: string;
  meta?: string;
  category: string;
  kind: string;
  value: TokenTypeValueItem;
};

export function TokenValueDetail({
  name,
  cssVar,
  meta,
  category,
  kind,
  value,
}: TokenValueDetailProps) {
  return (
    <div>
      <TokenValuePreview category={category} kind={kind} value={value} />

      <p>selected: {name}</p>
      {cssVar && <p>cssVar: {cssVar}</p>}
      {meta && <p>meta: {meta}</p>}
    </div>
  );
}
