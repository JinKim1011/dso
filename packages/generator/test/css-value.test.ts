import {
  assertCssClassSegment,
  assertCssCustomPropertyName,
  assertCssPrimitiveValue,
  assertCssSemanticAlias,
} from "@repo/generator/css-value";
import { describe, expect, it } from "vitest";

describe("CSS value safety", () => {
  it.each([
    ["oklch(98.5% 0 0)", "color"],
    ["cubic-bezier(0.55, 0.085, 0.68, 0.53)", "motion"],
    ["1.125rem", "size"],
    ["700", "weight"],
    ["0 1px 2px #000", "shadow"],
  ])("allows valid %s primitive values", (value) => {
    expect(() => assertCssPrimitiveValue(value, "token-id")).not.toThrow();
  });

  it.each([
    "#fff;",
    "#fff}",
    "#fff{",
    "#fff\ncolor: red",
    "#fff*/",
    "@import 'evil.css'",
    "url(https://example.test/a)",
    "var(--unsafe)",
    "calc(1px",
    " leading-space",
    "trailing-space ",
    "escaped\\3b value",
  ])("rejects unsafe primitive value %s", (value) => {
    expect(() => assertCssPrimitiveValue(value, "token-id")).toThrowError(
      expect.objectContaining({
        code: "unsafe-css-value",
        tokenId: "token-id",
      }),
    );
  });

  it("accepts only safe custom property and class identifiers", () => {
    expect(() => assertCssCustomPropertyName("--color-surface", "token")).not.toThrow();
    expect(() => assertCssClassSegment("heading-strong", "token")).not.toThrow();

    for (const value of ["color-surface", "-color", "--", "--color;display", "--x\n"]) {
      expect(() => assertCssCustomPropertyName(value, "token")).toThrow();
    }

    for (const value of ["", "heading strong", "heading{}", ".heading"]) {
      expect(() => assertCssClassSegment(value, "token")).toThrow();
    }
  });

  it("allows only exact generated semantic aliases", () => {
    expect(() => assertCssSemanticAlias("var(--base-neutral-0)", "token")).not.toThrow();

    for (const value of [
      "oklch(98.5% 0 0)",
      "var(--base); color: red",
      "var(--base) extra",
    ]) {
      expect(() => assertCssSemanticAlias(value, "token")).toThrow();
    }
  });
});
