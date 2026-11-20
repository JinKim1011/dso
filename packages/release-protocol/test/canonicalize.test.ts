import type {
  PublishedReleaseResponse,
  SignedPublishedReleaseResponse,
} from "@repo/contracts/operation";
import { canonicalizeRelease } from "@repo/release-protocol/canonicalize";
import { MAX_RELEASE_BYTES } from "@repo/release-protocol/limits";
import { describe, expect, it } from "vitest";

const release: PublishedReleaseResponse = {
  schemaVersion: 1,
  release: {
    id: "release-1",
    projectId: "project-1",
    version: "1",
    status: "published",
    createdAt: "2026-01-01T00:00:00.000Z",
    publishedAt: "2026-01-01T00:00:00.000Z",
  },
  tokenTypes: [],
  tokens: [],
  references: [],
  components: [],
  templates: [],
};

describe("canonicalizeRelease", () => {
  it("sorts top-level and nested object keys", () => {
    const first = canonicalizeRelease(release);
    const reordered = {
      templates: release.templates,
      components: release.components,
      references: release.references,
      tokens: release.tokens,
      tokenTypes: release.tokenTypes,
      release: {
        publishedAt: release.release.publishedAt,
        createdAt: release.release.createdAt,
        status: release.release.status,
        version: release.release.version,
        projectId: release.release.projectId,
        id: release.release.id,
      },
      schemaVersion: release.schemaVersion,
    } as PublishedReleaseResponse;

    expect(canonicalizeRelease(reordered)).toBe(first);
    expect(first.indexOf('"schemaVersion"')).toBeLessThan(first.indexOf('"tokenTypes"'));
  });

  it("preserves array order and changes when that order changes", () => {
    const firstToken = {
      id: "token-1",
      projectId: "project-1",
      tokenTypeId: "type-1",
      name: "first",
      cssVar: "--first",
      value: { kind: "single", value: "#111111" },
    } as const;
    const secondToken = {
      ...firstToken,
      id: "token-2",
      name: "second",
      cssVar: "--second",
    } as const;

    expect(
      canonicalizeRelease({ ...release, tokens: [firstToken, secondToken] }),
    ).not.toBe(canonicalizeRelease({ ...release, tokens: [secondToken, firstToken] }));
  });

  it("serializes Unicode and newlines deterministically without whitespace", () => {
    const value = {
      ...release,
      components: [
        {
          id: "component-1",
          projectId: "project-1",
          name: "표면",
          slug: "surface",
          description: "첫 줄\n둘째 줄 😀",
          documentPath: "docs/surface.md",
        },
      ],
    };

    const canonical = canonicalizeRelease(value);

    expect(canonical).toContain('"name":"표면"');
    expect(canonical).toContain('"description":"첫 줄\\n둘째 줄 😀"');
    expect(canonical).not.toContain("\n");
    expect(canonical).not.toMatch(/:\s/u);
    expect(canonical).not.toMatch(/,\s/u);
  });

  it.each([
    ["undefined", undefined],
    ["function", () => undefined],
    ["bigint", 1n],
    ["NaN", Number.NaN],
    ["Infinity", Number.POSITIVE_INFINITY],
    ["symbol", Symbol("unsupported")],
  ])("rejects unsupported %s values", (_name, unsupported) => {
    const invalid = {
      ...release,
      tokens: [{ value: unsupported }],
    } as unknown as PublishedReleaseResponse;

    expect(() => canonicalizeRelease(invalid)).toThrow(TypeError);
  });

  it("rejects cyclic values", () => {
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    const invalid = {
      ...release,
      tokens: [cyclic],
    } as unknown as PublishedReleaseResponse;

    expect(() => canonicalizeRelease(invalid)).toThrow(TypeError);
  });

  it("excludes the signature when canonicalizing an envelope", () => {
    const envelope: SignedPublishedReleaseResponse = {
      ...release,
      signature: {
        algorithm: "Ed25519",
        keyId: "key-1",
        value: Buffer.alloc(64).toString("base64url"),
      },
    };

    expect(canonicalizeRelease(envelope)).toBe(canonicalizeRelease(release));
    expect(canonicalizeRelease(envelope)).not.toContain('"signature"');
  });

  it("returns the same result for repeated calls", () => {
    const first = canonicalizeRelease(release);

    expect(canonicalizeRelease(release)).toBe(first);
    expect(canonicalizeRelease(release)).toBe(first);
  });

  it("includes the complete release payload", () => {
    expect(JSON.parse(canonicalizeRelease(release))).toEqual(release);
  });

  it("rejects sparse arrays", () => {
    const tokenTypes = new Array(1);
    const invalid = {
      ...release,
      tokenTypes,
    } as unknown as PublishedReleaseResponse;

    expect(() => canonicalizeRelease(invalid)).toThrow(TypeError);
  });

  it("rejects array extra properties and symbol object keys", () => {
    const tokenTypes: object[] = [];
    Object.assign(tokenTypes, { unsupported: true });
    const symbolObject = { [Symbol("unsupported")]: true };

    expect(() =>
      canonicalizeRelease({
        ...release,
        tokenTypes,
      } as unknown as PublishedReleaseResponse),
    ).toThrow(TypeError);
    expect(() =>
      canonicalizeRelease({
        ...release,
        tokens: [symbolObject],
      } as unknown as PublishedReleaseResponse),
    ).toThrow(TypeError);
  });

  it("enforces the release byte limit", () => {
    const invalid = {
      ...release,
      components: [
        {
          id: "component-1",
          projectId: "project-1",
          name: "Large",
          slug: "large",
          description: "x".repeat(MAX_RELEASE_BYTES),
          documentPath: "docs/large.md",
        },
      ],
    };

    expect(() => canonicalizeRelease(invalid)).toThrow(RangeError);
  });
});
