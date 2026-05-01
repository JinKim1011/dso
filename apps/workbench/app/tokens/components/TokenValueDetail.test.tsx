import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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

describe("TokenValueDetail", () => {
  it("renders single value editor fields", async () => {
    renderDetail({
      category: "spacing",
      kind: "primitive",
      value: {
        id: "spacing-1",
        name: "mini",
        value: "0.25rem",
        preview: { kind: "spacing", value: "0.25rem" },
      },
    });

    expect(await screen.findByLabelText("Name")).toBeInTheDocument();
    expect(await screen.findByLabelText("Value")).toBeInTheDocument();
  });

  it("renders light/dark editor fields", async () => {
    renderDetail({
      category: "color",
      kind: "primitive",
      value: {
        id: "color-1",
        name: "primary",
        value: { light: "#ffffff", dark: "#000000" },
        preview: { kind: "color", light: "#ffffff", dark: "#000000" },
      },
    });

    expect(await screen.findByLabelText("Name")).toBeInTheDocument();
    expect(await screen.findByLabelText("Light")).toBeInTheDocument();
    expect(await screen.findByLabelText("Dark")).toBeInTheDocument();
  });
});
