import type { PublishedReleaseResponse } from "@repo/contracts/operation";
import { resolveTokenReferences } from "@repo/generator/reference-resolution";
import { renderTokensCss } from "@repo/generator/tokens-css";
import type { GeneratedToken } from "@repo/generator/types";
import { describe, expect, it } from "vitest";
import { generatorReleaseFixture } from "../test/fixtures/release";

function renderedFixture(): string {
  return renderTokensCss(resolveTokenReferences(generatorReleaseFixture));
}

describe("renderTokensCss", () => {
  it("renders primitive, mode, and typography token groups", () => {
    expect(renderedFixture()).toMatchInlineSnapshot(`
      ":root {
        --base-neutral-0: oklch(98.5% 0 0);
        --base-neutral-900: oklch(14.5% 0 0);
        --text-title: 1.125rem;
        --font-bold: 700;
        --leading-tight: 1.3;
        --color-surface: var(--base-neutral-0);
        --color-surface-light-only: var(--base-neutral-0);
      }

      [data-theme="dark"] {
        --color-surface: var(--base-neutral-900);
      }

      @layer components {
        .text-heading-strong {
          font-size: var(--text-title);
          font-weight: var(--font-bold);
          line-height: var(--leading-tight);
        }
      }
      "
    `);
  });

  it("sorts declarations and classes by token ID", () => {
    const tokens = resolveTokenReferences(generatorReleaseFixture);
    const expected = renderTokensCss(tokens);
    const actual = renderTokensCss([...tokens].reverse());

    expect(actual).toBe(expected);
  });

  it("is independent of legacy cssVar fields in the release", () => {
    const release: PublishedReleaseResponse = structuredClone(generatorReleaseFixture);
    for (const token of release.tokens) {
      token.cssVar = "--release-value-must-be-ignored;unsafe";
    }

    expect(renderTokensCss(resolveTokenReferences(release))).toBe(renderedFixture());
  });

  it("omits missing mode and typography slots independently", () => {
    const release: PublishedReleaseResponse = structuredClone(generatorReleaseFixture);
    const heading = release.tokens.find((token) => token.name === "heading-strong")!;
    release.references = release.references.filter(
      (reference) =>
        !(reference.referencingTokenId === heading.id && reference.slot === "fontWeight"),
    );

    const output = renderTokensCss(resolveTokenReferences(release));
    const darkBlock = output.slice(output.indexOf('[data-theme="dark"]'));

    expect(output).not.toContain("font-weight: var(--font-bold);");
    expect(darkBlock).not.toContain("--color-surface-light-only");
  });

  it("keeps dark declarations when light and dark aliases match", () => {
    const release: PublishedReleaseResponse = structuredClone(generatorReleaseFixture);
    const surface = release.tokens.find((token) => token.name === "surface")!;
    const light = release.references.find(
      (reference) =>
        reference.referencingTokenId === surface.id && reference.slot === "light",
    )!;
    const dark = release.references.find(
      (reference) =>
        reference.referencingTokenId === surface.id && reference.slot === "dark",
    )!;
    dark.referencedTokenId = light.referencedTokenId;

    const output = renderTokensCss(resolveTokenReferences(release));

    expect(output).toContain(":root {\n  --base-neutral-0: oklch(98.5% 0 0);");
    expect(output).toContain(
      '[data-theme="dark"] {\n  --color-surface: var(--base-neutral-0);\n}',
    );
  });

  it("rejects unsafe identifiers and primitive values without leaking values", () => {
    const tokens = [
      ...resolveTokenReferences(generatorReleaseFixture),
    ] as GeneratedToken[];
    tokens[3]!.cssVar = "--unsafe\ncolor";

    expect(() => renderTokensCss(tokens)).toThrowError(
      expect.objectContaining({
        code: "invalid-css-var",
        tokenId: tokens[3]!.id,
      }),
    );

    tokens[3]!.cssVar = "--base-neutral-0";
    tokens[3]!.value = { kind: "single", value: "#fff; color: red" };

    expect(() => renderTokensCss(tokens)).toThrowError(
      expect.objectContaining({
        code: "unsafe-css-value",
        tokenId: tokens[3]!.id,
      }),
    );
  });

  it("requires a cssVar for custom property declarations", () => {
    const tokens = [
      ...resolveTokenReferences(generatorReleaseFixture),
    ] as GeneratedToken[];
    tokens.find((token) => token.name === "surface")!.cssVar = null;

    expect(() => renderTokensCss(tokens)).toThrowError(
      expect.objectContaining({
        code: "missing-css-var",
      }),
    );
  });

  it("rejects primitive tokens without a single value", () => {
    const tokens = [
      ...resolveTokenReferences(generatorReleaseFixture),
    ] as GeneratedToken[];
    const primitive = tokens.find((token) => token.kind === "primitive")!;
    primitive.value = { kind: "modes", light: "var(--base-other)" };

    expect(() => renderTokensCss(tokens)).toThrowError(
      expect.objectContaining({
        code: "unsafe-css-value",
        tokenId: primitive.id,
      }),
    );
  });

  it("does not include machine-specific paths or secrets", () => {
    const output = renderedFixture();

    for (const forbidden of [
      "apiKey",
      "signature",
      "cachePath",
      "trustPath",
      "outputPath",
      "/Users/",
    ]) {
      expect(output).not.toContain(forbidden);
    }
  });

  it("ends with exactly one newline", () => {
    const output = renderedFixture();

    expect(output.endsWith("\n")).toBe(true);
    expect(output.endsWith("\n\n")).toBe(false);
  });
});
