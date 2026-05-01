import { render } from "@testing-library/react";
import { vi } from "vitest";
import type { TokenTypeValueItem } from "../lib/manifestAdapter";
import { TokenValueDetail } from "./TokenValueDetail";

const typographyOptions = {
  fontSize: ["small", "regular", "title1"],
  fontWeight: ["regular", "semibold", "bold"],
  lineHeight: ["tight", "normal", "relaxed"],
};

function renderDetail(props: {
  category: string;
  kind: string;
  value: TokenTypeValueItem;
}) {
  const onSave = vi.fn();

  render(
    <TokenValueDetail
      rowId="row-1"
      name="token-name"
      cssVar="--token-name"
      meta="meta-value"
      category={props.category}
      kind={props.kind}
      value={props.value}
      typographyOptions={typographyOptions}
      onSave={onSave}
    />,
  );

  return { onSave };
}
