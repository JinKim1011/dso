import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { TokenTypeValueItem } from "../../lib/manifestAdapter";
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

  it("renders typography semantic editor fields", async () => {
    renderDetail({
      category: "typography",
      kind: "semantic",
      value: {
        id: "typography-1",
        name: "body-md",
        preview: {
          kind: "typography",
          typography: {
            fontSize: "regular",
            fontWeight: "regular",
            lineHeight: "normal",
          },
        },
      },
    });

    expect(await screen.findByLabelText("Name")).toBeInTheDocument();
    expect(await screen.findByLabelText("Size")).toBeInTheDocument();
    expect(await screen.findByLabelText("Weight")).toBeInTheDocument();
    expect(await screen.findByLabelText("Line height")).toBeInTheDocument();
  });

  it("saves updated single value payload", async () => {
    const { onSave } = renderDetail({
      category: "spacing",
      kind: "primitive",
      value: {
        id: "spacing-1",
        name: "mini",
        value: "0.25rem",
        preview: { kind: "spacing", value: "0.25rem" },
      },
    });

    const valueInput = await screen.findByLabelText("Value");
    await userEvent.clear(valueInput);
    await userEvent.type(valueInput, "1rem");

    const saveButton = await screen.findByRole("button", { name: "save" });
    await userEvent.click(saveButton);

    expect(onSave).toHaveBeenCalledWith(
      "row-1",
      expect.objectContaining({ name: "token-name", value: "1rem", meta: "1rem" }),
    );
  });

  it("saves updated dual value payload", async () => {
    const { onSave } = renderDetail({
      category: "color",
      kind: "primitive",
      value: {
        id: "color-1",
        name: "primary",
        value: { light: "#ffffff", dark: "#000000" },
        preview: { kind: "color", light: "#ffffff", dark: "#000000" },
      },
    });

    const lightInput = await screen.findByLabelText("Light");
    await userEvent.clear(lightInput);
    await userEvent.type(lightInput, "oklch(1 0 89.9)");

    const darkInput = await screen.findByLabelText("Dark");
    await userEvent.clear(darkInput);
    await userEvent.type(darkInput, "oklch(0.132 0.036 276.6)");

    const saveButton = await screen.findByRole("button", { name: "save" });
    await userEvent.click(saveButton);

    expect(onSave).toHaveBeenCalledWith(
      "row-1",
      expect.objectContaining({
        name: "token-name",
        value: { light: "oklch(1 0 89.9)", dark: "oklch(0.132 0.036 276.6)" },
      }),
    );
  });

  it("saves updated typography semantic value payload", async () => {
    const { onSave } = renderDetail({
      category: "typography",
      kind: "semantic",
      value: {
        id: "typography-1",
        name: "body-md",
        preview: {
          kind: "typography",
          typography: {
            fontSize: "regular",
            fontWeight: "regular",
            lineHeight: "normal",
          },
        },
      },
    });

    const user = userEvent.setup();

    const sizeSelect = await screen.findByLabelText("Size");
    await user.click(sizeSelect);
    const sizeOption = await screen.findByText(/title1/i);
    await user.click(sizeOption);

    const weightSelect = await screen.findByLabelText("Weight");
    await user.click(weightSelect);
    const weightOption = await screen.findByText(/semibold/i);
    await user.click(weightOption);

    const lineHeightSelect = await screen.findByLabelText("Line height");
    await user.click(lineHeightSelect);
    const lineHeightOption = await screen.findByText(/relaxed/i);
    await user.click(lineHeightOption);

    const saveButton = await screen.findByRole("button", { name: "save" });
    await userEvent.click(saveButton);

    expect(onSave).toHaveBeenCalledWith(
      "row-1",
      expect.objectContaining({
        meta: "title1 / semibold / relaxed",
      }),
    );
  });
});
