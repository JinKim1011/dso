import type { PublishedReleaseResponse } from "@repo/contracts/operation";
import { generateTokenArtifacts } from "@repo/generator/generator";
import { describe, expect, it } from "vitest";
import { generatorReleaseFixture } from "../test/fixtures/release";

describe("full release token generation", () => {
  it("generates stable JSON and CSS from a realistic normalized release", () => {
    const result = generateTokenArtifacts(generatorReleaseFixture);

    expect(result.tokensJson).toContain('"light": "var(--base-neutral-0)"');
    expect(result.tokensJson).toContain('"fontWeight": "var(--font-bold)"');
    expect(result.tokensCss).toContain("--color-surface: var(--base-neutral-0);");
    expect(result.tokensCss).toContain(
      ".text-heading-strong {\n    font-size: var(--text-title);",
    );
    expect(result.tokensJson.endsWith("\n")).toBe(true);
    expect(result.tokensCss.endsWith("\n")).toBe(true);

    expect(generateTokenArtifacts(structuredClone(generatorReleaseFixture))).toEqual(
      result,
    );
  });

  it("ignores components, templates, and legacy release cssVar values", () => {
    const release: PublishedReleaseResponse = structuredClone(generatorReleaseFixture);
    release.components = [
      {
        id: "component-1",
        projectId: release.release.projectId,
        name: "Ignored",
        slug: "ignored",
        description: "not generated",
        documentPath: "../../../../README.md",
      },
    ];
    release.templates = [
      {
        id: "template-1",
        projectId: release.release.projectId,
        componentId: "component-1",
        name: "Ignored template",
        content: "{{secret}}",
      },
    ];
    for (const token of release.tokens) {
      token.cssVar = "--legacy-value;unsafe";
    }

    expect(generateTokenArtifacts(release)).toEqual(
      generateTokenArtifacts(generatorReleaseFixture),
    );
  });
});
