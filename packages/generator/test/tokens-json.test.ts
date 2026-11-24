import type { PublishedReleaseResponse } from "@repo/contracts/operation";
import { resolveTokenReferences } from "@repo/generator/reference-resolution";
import { renderTokensJson } from "@repo/generator/tokens-json";
import { describe, expect, it } from "vitest";
import { generatorReleaseFixture } from "../test/fixtures/release";

function reverseObjectProperties(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(reverseObjectProperties);
  }

  if (typeof value !== "object" || value === null) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value)
      .reverse()
      .map(([key, entry]) => [key, reverseObjectProperties(entry)]),
  );
}

describe("renderTokensJson", () => {
  it("renders the contract fixture deterministically", () => {
    const output = renderTokensJson(
      generatorReleaseFixture,
      resolveTokenReferences(generatorReleaseFixture),
    );

    expect(output).toMatchInlineSnapshot(`
      "{
        "schemaVersion": 1,
        "release": {
          "id": "00000000-0000-4000-8000-000000000020",
          "version": "1",
          "publishedAt": "2026-11-20T10:05:00.000Z"
        },
        "tokens": [
          {
            "id": "00000000-0000-4000-8000-000000000201",
            "name": "neutral-0",
            "cssVar": "--base-neutral-0",
            "category": "color",
            "type": "Base",
            "kind": "primitive",
            "value": {
              "kind": "single",
              "value": "oklch(98.5% 0 0)"
            }
          },
          {
            "id": "00000000-0000-4000-8000-000000000202",
            "name": "neutral-900",
            "cssVar": "--base-neutral-900",
            "category": "color",
            "type": "Base",
            "kind": "primitive",
            "value": {
              "kind": "single",
              "value": "oklch(14.5% 0 0)"
            }
          },
          {
            "id": "00000000-0000-4000-8000-000000000203",
            "name": "title",
            "cssVar": "--text-title",
            "category": "typography",
            "type": "font-size",
            "kind": "primitive",
            "value": {
              "kind": "single",
              "value": "1.125rem"
            }
          },
          {
            "id": "00000000-0000-4000-8000-000000000204",
            "name": "bold",
            "cssVar": "--font-bold",
            "category": "typography",
            "type": "font-weight",
            "kind": "primitive",
            "value": {
              "kind": "single",
              "value": "700"
            }
          },
          {
            "id": "00000000-0000-4000-8000-000000000205",
            "name": "tight",
            "cssVar": "--leading-tight",
            "category": "typography",
            "type": "line-height",
            "kind": "primitive",
            "value": {
              "kind": "single",
              "value": "1.3"
            }
          },
          {
            "id": "00000000-0000-4000-8000-000000000206",
            "name": "surface",
            "cssVar": "--color-surface",
            "category": "color",
            "type": "surface",
            "kind": "semantic",
            "value": {
              "kind": "modes",
              "light": "var(--base-neutral-0)",
              "dark": "var(--base-neutral-900)"
            }
          },
          {
            "id": "00000000-0000-4000-8000-000000000207",
            "name": "surface-light-only",
            "cssVar": "--color-surface-light-only",
            "category": "color",
            "type": "surface",
            "kind": "semantic",
            "value": {
              "kind": "modes",
              "light": "var(--base-neutral-0)"
            }
          },
          {
            "id": "00000000-0000-4000-8000-000000000208",
            "name": "heading-strong",
            "cssVar": null,
            "category": "typography",
            "type": "typography",
            "kind": "semantic",
            "value": {
              "kind": "typography",
              "fontSize": "var(--text-title)",
              "fontWeight": "var(--font-bold)",
              "lineHeight": "var(--leading-tight)"
            }
          }
        ]
      }
      "
    `);
  });

  it("is independent of release, object, and token array ordering", () => {
    const reorderedRelease = reverseObjectProperties(
      generatorReleaseFixture,
    ) as PublishedReleaseResponse;
    reorderedRelease.tokenTypes.reverse();
    reorderedRelease.tokens.reverse();
    reorderedRelease.references.reverse();

    const expected = renderTokensJson(
      generatorReleaseFixture,
      resolveTokenReferences(generatorReleaseFixture),
    );
    const actual = renderTokensJson(
      reorderedRelease,
      resolveTokenReferences(reorderedRelease),
    );

    expect(actual).toBe(expected);
  });

  it("emits exactly one trailing newline", () => {
    const output = renderTokensJson(
      generatorReleaseFixture,
      resolveTokenReferences(generatorReleaseFixture),
    );

    expect(output.endsWith("\n")).toBe(true);
    expect(output.endsWith("\n\n")).toBe(false);
  });

  it("excludes non-token release data and machine-specific values", () => {
    const releaseWithExtras = {
      ...generatorReleaseFixture,
      signature: {
        algorithm: "Ed25519",
        keyId: "release-secret-key",
        value: "signing-secret",
      },
      apiKey: "dso_private_secret",
      trustPath: "/Users/private/.config/dso/trust.json",
      cachePath: "/Users/private/.cache/dso/release.json",
      outputPath: "/Users/private/project/tokens",
    };
    const resolved = resolveTokenReferences(releaseWithExtras);
    const output = renderTokensJson(releaseWithExtras, resolved);

    for (const forbidden of [
      "projectId",
      "components",
      "templates",
      "signature",
      "apiKey",
      "release-secret-key",
      "signing-secret",
      "trustPath",
      "cachePath",
      "outputPath",
      "/Users/private",
    ]) {
      expect(output).not.toContain(forbidden);
    }
  });
});
