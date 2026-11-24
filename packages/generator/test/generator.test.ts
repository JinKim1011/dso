import type { PublishedReleaseResponse } from "@repo/contracts/operation";
import {
  TokenGenerationError,
  TokenResolutionError,
  TokensCssRenderError,
  TokensJsonRenderError,
} from "@repo/generator/errors";
import { generateTokenArtifacts } from "@repo/generator/generator";
import { resolveTokenReferences } from "@repo/generator/reference-resolution";
import { renderTokensCss } from "@repo/generator/tokens-css";
import { renderTokensJson } from "@repo/generator/tokens-json";
import { describe, expect, it } from "vitest";
import {
  generatorReleaseFixture,
  unresolvedGeneratorReleaseFixture,
} from "../test/fixtures/release";

describe("generateTokenArtifacts", () => {
  it("returns both deterministic token artifacts", () => {
    const tokens = resolveTokenReferences(generatorReleaseFixture);
    const result = generateTokenArtifacts(generatorReleaseFixture);

    expect(result).toEqual({
      tokensJson: renderTokensJson(generatorReleaseFixture, tokens),
      tokensCss: renderTokensCss(tokens),
    });
    expect(generateTokenArtifacts(generatorReleaseFixture)).toEqual(result);
  });

  it("returns neither artifact when JSON rendering fails", () => {
    const release: PublishedReleaseResponse = structuredClone(generatorReleaseFixture);
    release.release.publishedAt = null;

    expect(() => generateTokenArtifacts(release)).toThrow(TokensJsonRenderError);
  });

  it("returns neither artifact when CSS rendering fails", () => {
    const release: PublishedReleaseResponse = structuredClone(generatorReleaseFixture);
    const primitive = release.tokens.find((token) => token.value.kind === "single")!;
    primitive.value = { kind: "single", value: "oklch(50% 0 0); color: red" };

    expect(() => generateTokenArtifacts(release)).toThrow(TokensCssRenderError);
  });

  it("preserves generator-specific domain errors", () => {
    expect(() => generateTokenArtifacts(unresolvedGeneratorReleaseFixture)).toThrow(
      TokenResolutionError,
    );
  });

  it("ignores component and template contents", () => {
    const release = {
      ...structuredClone(generatorReleaseFixture),
      components: [
        {
          id: null,
          documentPath: "../../../../private.md",
          content: "@import 'secret';",
        },
      ],
      templates: [
        {
          componentId: "missing",
          content: "{{unknown.secret}}",
        },
      ],
    } as unknown as PublishedReleaseResponse;

    expect(generateTokenArtifacts(release)).toEqual(
      generateTokenArtifacts(generatorReleaseFixture),
    );
  });

  it("ignores legacy release cssVar values in both artifacts", () => {
    const release: PublishedReleaseResponse = structuredClone(generatorReleaseFixture);
    for (const token of release.tokens) {
      token.cssVar = "--unsafe-release-value;";
    }

    expect(generateTokenArtifacts(release)).toEqual(
      generateTokenArtifacts(generatorReleaseFixture),
    );
  });

  it("maps unexpected errors with a preserved cause", () => {
    const release = {
      ...generatorReleaseFixture,
      tokens: null,
    } as unknown as PublishedReleaseResponse;

    try {
      generateTokenArtifacts(release);
      throw new Error("Expected generation to fail.");
    } catch (error) {
      expect(error).toBeInstanceOf(TokenGenerationError);
      expect((error as Error).cause).toBeInstanceOf(TypeError);
      expect(String(error)).not.toContain("cssVar");
    }
  });
});
