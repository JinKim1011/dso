import type { PublishedReleaseResponse } from "@repo/contracts/operation";
import { TokenGraphValidationError, TokenResolutionError } from "@repo/generator/errors";
import { resolveTokenReferences } from "@repo/generator/reference-resolution";
import { describe, expect, it } from "vitest";
import {
  generatorReleaseFixture,
  unresolvedGeneratorReleaseFixture,
} from "../test/fixtures/release";

function copyRelease(): PublishedReleaseResponse {
  return structuredClone(generatorReleaseFixture);
}

function tokenByName(tokens: ReturnType<typeof resolveTokenReferences>, name: string) {
  return tokens.find((token) => token.name === name);
}

describe("resolveTokenReferences", () => {
  it("resolves color modes independently to primitive CSS aliases", () => {
    const tokens = resolveTokenReferences(generatorReleaseFixture);

    expect(tokenByName(tokens, "neutral-0")?.value).toEqual({
      kind: "single",
      value: "oklch(98.5% 0 0)",
    });
    expect(tokenByName(tokens, "surface")?.value).toEqual({
      kind: "modes",
      light: "var(--base-neutral-0)",
      dark: "var(--base-neutral-900)",
    });
    expect(tokenByName(tokens, "surface-light-only")?.value).toEqual({
      kind: "modes",
      light: "var(--base-neutral-0)",
    });
  });

  it("resolves every typography slot to primitive CSS aliases", () => {
    const tokens = resolveTokenReferences(generatorReleaseFixture);

    expect(tokenByName(tokens, "heading-strong")?.value).toEqual({
      kind: "typography",
      fontSize: "var(--text-title)",
      fontWeight: "var(--font-bold)",
      lineHeight: "var(--leading-tight)",
    });
  });

  it("omits typography slots independently", () => {
    const release = copyRelease();
    const heading = release.tokens.find((token) => token.name === "heading-strong")!;
    release.references = release.references.filter(
      (reference) =>
        !(reference.referencingTokenId === heading.id && reference.slot === "fontWeight"),
    );

    const tokens = resolveTokenReferences(release);

    expect(tokenByName(tokens, "heading-strong")?.value).toEqual({
      kind: "typography",
      fontSize: "var(--text-title)",
      lineHeight: "var(--leading-tight)",
    });
  });

  it("resolves shadow modes with the same alias rules as color", () => {
    const release = copyRelease();
    for (const tokenType of release.tokenTypes) {
      if (tokenType.category === "color") tokenType.category = "shadow";
    }

    const tokens = resolveTokenReferences(release);

    expect(tokenByName(tokens, "surface")?.value).toEqual({
      kind: "modes",
      light: "var(--base-neutral-0)",
      dark: "var(--base-neutral-900)",
    });
  });

  it("fails all resolution when any token is unresolved", () => {
    expect(() => resolveTokenReferences(unresolvedGeneratorReleaseFixture)).toThrowError(
      expect.objectContaining({
        code: "unresolved-token",
        tokenId: "00000000-0000-4000-8000-000000000209",
      }),
    );
  });

  it("rejects references originating from primitive tokens", () => {
    const release = copyRelease();
    const source = release.tokens.find((token) => token.name === "neutral-0")!;
    const target = release.tokens.find((token) => token.name === "neutral-900")!;
    release.references.push({
      referencingTokenId: source.id,
      referencedTokenId: target.id,
      projectId: release.release.projectId,
      slot: "value",
    });

    expect(() => resolveTokenReferences(release)).toThrowError(
      expect.objectContaining({
        code: "primitive-reference-source",
        tokenId: source.id,
      }),
    );
  });

  it("safely rejects semantic-to-semantic cycles", () => {
    const release = copyRelease();
    const source = release.tokens.find((token) => token.name === "surface")!;
    const target = release.tokens.find((token) => token.name === "surface-light-only")!;
    const existing = release.references.find(
      (reference) =>
        reference.referencingTokenId === source.id && reference.slot === "light",
    )!;
    existing.referencedTokenId = target.id;
    release.references.push({
      referencingTokenId: target.id,
      referencedTokenId: source.id,
      projectId: release.release.projectId,
      slot: "dark",
    });

    expect(() => resolveTokenReferences(release)).toThrowError(
      expect.objectContaining({
        code: "incompatible-reference-target",
        tokenId: source.id,
        slot: "light",
      }),
    );
  });

  it("does not expose token values in resolution errors", () => {
    try {
      resolveTokenReferences(unresolvedGeneratorReleaseFixture);
      throw new Error("Expected token resolution to fail.");
    } catch (error) {
      expect(error).toBeInstanceOf(TokenResolutionError);
      expect(error).not.toBeInstanceOf(String);
      expect(String(error)).not.toContain("oklch");
    }
  });

  it("rejects duplicate derived CSS variable names", () => {
    const release = copyRelease();
    const neutral0 = release.tokens.find((token) => token.name === "neutral-0")!;
    const neutral900 = release.tokens.find((token) => token.name === "neutral-900")!;
    neutral900.name = "neutral 0";

    expect(() => resolveTokenReferences(release)).toThrowError(
      expect.objectContaining({
        code: "duplicate-css-var",
      }),
    );

    expect(neutral0.cssVar).toBe("--base-neutral-0");
    expect(neutral900.cssVar).toBe("--base-neutral-900");
  });

  it("rejects names that cannot produce a CSS variable", () => {
    const release = copyRelease();
    release.tokens[0]!.name = "///";

    expect(() => resolveTokenReferences(release)).toThrowError(
      expect.objectContaining({
        code: "invalid-css-var",
        tokenId: release.tokens[0]!.id,
      }),
    );
  });
});
