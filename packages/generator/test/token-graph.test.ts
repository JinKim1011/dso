import type { PublishedReleaseResponse } from "@repo/contracts/operation";
import { TokenGraphValidationError } from "@repo/generator/errors";
import { buildTokenGraphIndex } from "@repo/generator/token-graph";
import { describe, expect, it } from "vitest";
import { generatorReleaseFixture } from "../test/fixtures/release";

function copyRelease(): PublishedReleaseResponse {
  return structuredClone(generatorReleaseFixture);
}

function expectGraphError(
  update: (release: PublishedReleaseResponse) => void,
  code: TokenGraphValidationError["code"],
  details: {
    tokenId?: string;
    slot?: string;
  } = {},
): void {
  const release = copyRelease();
  update(release);

  try {
    buildTokenGraphIndex(release);
    throw new Error("Expected token graph validation to fail.");
  } catch (error) {
    expect(error).toBeInstanceOf(TokenGraphValidationError);
    expect(error).toMatchObject({ code, ...details });

    if (error instanceof TokenGraphValidationError) {
      expect(error.message).not.toContain("oklch(98.5% 0 0)");
      expect(error.message).not.toContain("oklch(14.5% 0 0)");
    }
  }
}

describe("buildTokenGraphIndex", () => {
  it("indexes tokens, types, and references for direct lookup", () => {
    const index = buildTokenGraphIndex(generatorReleaseFixture);

    expect(index.tokenTypeById.size).toBe(generatorReleaseFixture.tokenTypes.length);
    expect(index.tokenById.size).toBe(generatorReleaseFixture.tokens.length);
    expect(
      index.tokensByTypeId.get(generatorReleaseFixture.tokens[0]!.tokenTypeId),
    ).toHaveLength(2);
    expect(
      index.referencesByTokenAndSlot
        .get(generatorReleaseFixture.references[2]!.referencingTokenId)
        ?.get("dark")?.referencedTokenId,
    ).toBe(generatorReleaseFixture.references[2]!.referencedTokenId);
  });

  it("rejects token references to missing token types", () => {
    expectGraphError(
      (release) => {
        release.tokens[0]!.tokenTypeId = "missing-token-type";
      },
      "missing-token-type",
      { tokenId: generatorReleaseFixture.tokens[0]!.id },
    );
  });

  it("rejects duplicate token types and tokens", () => {
    expectGraphError((release) => {
      release.tokenTypes.push(structuredClone(release.tokenTypes[0]!));
    }, "duplicate-token-type");

    expectGraphError(
      (release) => {
        release.tokens.push(structuredClone(release.tokens[0]!));
      },
      "duplicate-token",
      { tokenId: generatorReleaseFixture.tokens[0]!.id },
    );
  });

  it("rejects entities from another project", () => {
    expectGraphError(
      (release) => {
        release.tokens[0]!.projectId = "another-project";
      },
      "wrong-project",
      { tokenId: generatorReleaseFixture.tokens[0]!.id },
    );
  });

  it("rejects references from another project", () => {
    const reference = generatorReleaseFixture.references[0]!;

    expectGraphError(
      (release) => {
        release.references[0]!.projectId = "another-project";
      },
      "wrong-project",
      { tokenId: reference.referencingTokenId, slot: reference.slot },
    );
  });

  it("rejects missing source and target tokens", () => {
    expectGraphError(
      (release) => {
        release.references[0]!.referencingTokenId = "missing-source";
      },
      "missing-referencing-token",
      { tokenId: "missing-source", slot: "light" },
    );

    expectGraphError(
      (release) => {
        release.references[0]!.referencedTokenId = "missing-target";
      },
      "missing-referenced-token",
      {
        tokenId: generatorReleaseFixture.references[0]!.referencingTokenId,
        slot: "light",
      },
    );
  });

  it("rejects duplicate references for one source and slot", () => {
    const duplicate = generatorReleaseFixture.references[2]!;

    expectGraphError(
      (release) => {
        release.references.push({ ...duplicate });
      },
      "duplicate-reference-slot",
      { tokenId: duplicate.referencingTokenId, slot: "dark" },
    );
  });

  it("rejects self references", () => {
    const reference = generatorReleaseFixture.references[0]!;

    expectGraphError(
      (release) => {
        release.references[0]!.referencedTokenId = reference.referencingTokenId;
      },
      "self-reference",
      { tokenId: reference.referencingTokenId, slot: "light" },
    );
  });

  it("rejects references from primitive tokens", () => {
    const source = generatorReleaseFixture.tokens.find(
      (token) => token.name === "neutral-0",
    )!;

    expectGraphError(
      (release) => {
        release.references.push({
          referencingTokenId: source.id,
          referencedTokenId: source.id,
          projectId: release.release.projectId,
          slot: "value",
        });
      },
      "self-reference",
      { tokenId: source.id, slot: "value" },
    );

    expectGraphError(
      (release) => {
        const target = release.tokens.find((token) => token.name === "neutral-900")!;
        release.references.push({
          referencingTokenId: source.id,
          referencedTokenId: target.id,
          projectId: release.release.projectId,
          slot: "value",
        });
      },
      "primitive-reference-source",
      { tokenId: source.id, slot: "value" },
    );
  });

  it("rejects unsupported source slots", () => {
    expectGraphError(
      (release) => {
        release.references[0]!.slot = "dark";
        release.references.push({
          ...release.references[0]!,
          slot: "value",
        });
      },
      "unsupported-reference-slot",
      {
        tokenId: generatorReleaseFixture.references[0]!.referencingTokenId,
        slot: "value",
      },
    );
  });

  it("rejects targets with incompatible type or non-single value", () => {
    const surfaceReference = generatorReleaseFixture.references[2]!;
    const typographyTarget = generatorReleaseFixture.tokens.find(
      (token) => token.name === "title",
    )!;

    expectGraphError(
      (release) => {
        release.references[2]!.referencedTokenId = typographyTarget.id;
      },
      "incompatible-reference-target",
      { tokenId: surfaceReference.referencingTokenId, slot: "dark" },
    );

    expectGraphError(
      (release) => {
        const target = release.tokens.find(
          (token) => token.id === surfaceReference.referencedTokenId,
        )!;
        target.value = { kind: "unresolved" };
      },
      "incompatible-reference-target",
      { tokenId: surfaceReference.referencingTokenId, slot: "dark" },
    );
  });

  it("rejects typography primitives with the wrong type for their slot", () => {
    const typographyReference = generatorReleaseFixture.references[1]!;
    const wrongTarget = generatorReleaseFixture.tokens.find(
      (token) => token.name === "title",
    )!;

    expectGraphError(
      (release) => {
        release.references[1]!.referencedTokenId = wrongTarget.id;
      },
      "incompatible-reference-target",
      { tokenId: typographyReference.referencingTokenId, slot: "fontWeight" },
    );
  });

  it("rejects reference targets without a cssVar", () => {
    const reference = generatorReleaseFixture.references[2]!;

    expectGraphError(
      (release) => {
        release.tokens.find((token) => token.id === reference.referencedTokenId)!.cssVar =
          null;
      },
      "missing-reference-css-var",
      { tokenId: reference.referencingTokenId, slot: "dark" },
    );
  });
});
