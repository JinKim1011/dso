import type {
  Component,
  DocumentTemplate,
  Token,
  TokenReference,
  TokenType,
} from "@repo/contracts/type";
import type { PublishedReleaseResponse } from "@repo/contracts/operation";
import {
  createSignedReleaseEnvelope,
  parseSignedReleaseEnvelope,
} from "@repo/release-protocol/envelope";
import { MAX_RELEASE_RESPONSE_BYTES } from "@repo/release-protocol/limits";
import { generateKeyPairSync } from "node:crypto";
import { describe, expect, it } from "vitest";

const tokenType: TokenType = {
  id: "type-1",
  projectId: "project-1",
  parentTypeId: null,
  category: "color",
  name: "Color",
  kind: "primitive",
};
const token: Token = {
  id: "token-1",
  projectId: "project-1",
  tokenTypeId: tokenType.id,
  name: "surface",
  cssVar: "--surface",
  value: { kind: "single", value: "#fff" },
};
const secondToken: Token = {
  ...token,
  id: "token-2",
  name: "border",
  cssVar: "--border",
};
const reference: TokenReference = {
  referencingTokenId: secondToken.id,
  referencedTokenId: token.id,
  projectId: "project-1",
  slot: "value",
};
const component: Component = {
  id: "component-1",
  projectId: "project-1",
  name: "Card",
  slug: "card",
  description: "Card component",
  documentPath: "docs/card.md",
};
const template: DocumentTemplate = {
  id: "template-1",
  projectId: "project-1",
  componentId: component.id,
  name: "Card",
  content: "# Card",
};

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
  tokenTypes: [tokenType],
  tokens: [token, secondToken],
  references: [reference],
  components: [component],
  templates: [template],
};

const privateKey = generateKeyPairSync("ed25519").privateKey;

function envelope() {
  return createSignedReleaseEnvelope(release, {
    privateKey,
    keyId: "key-1",
  });
}

describe("signed release envelopes", () => {
  it("creates and parses a valid signed snapshot", () => {
    const signed = envelope();

    expect(parseSignedReleaseEnvelope(JSON.parse(JSON.stringify(signed)))).toEqual(
      signed,
    );
  });

  it.each([
    { schemaVersion: 2 },
    { signature: undefined },
    { tokenTypes: undefined },
    { tokens: {} },
    { references: null },
    { components: "invalid" },
    { templates: {} },
    { unexpected: true },
  ])("rejects an invalid envelope shape: %o", (change) => {
    expect(() => parseSignedReleaseEnvelope({ ...envelope(), ...change })).toThrow(
      TypeError,
    );
  });

  it("requires complete published release metadata", () => {
    for (const change of [
      { status: "draft" },
      { id: undefined },
      { projectId: "" },
      { version: undefined },
      { createdAt: undefined },
      { publishedAt: null },
      { unexpected: true },
    ]) {
      const signed = envelope();
      expect(() =>
        parseSignedReleaseEnvelope({
          ...signed,
          release: { ...signed.release, ...change },
        }),
      ).toThrow(TypeError);
    }
  });

  it("rejects inconsistent projects and unsupported token type enums", () => {
    const signed = envelope();
    expect(() =>
      parseSignedReleaseEnvelope({
        ...signed,
        tokens: [{ ...token, projectId: "other-project" }, secondToken],
      }),
    ).toThrow(TypeError);
    expect(() =>
      parseSignedReleaseEnvelope({
        ...signed,
        tokenTypes: [{ ...tokenType, kind: "unknown" }],
      }),
    ).toThrow(TypeError);
  });

  it.each([
    [{ ...tokenType, id: tokenType.id }, tokenType],
    [{ ...token, id: token.id }, token],
    [{ ...component, id: component.id }, component],
    [{ ...template, id: template.id }, template],
  ])("rejects duplicate entity IDs", (duplicate, original) => {
    const signed = envelope();
    const field =
      "tokenTypeId" in duplicate
        ? "tokens"
        : "parentTypeId" in duplicate
          ? "tokenTypes"
          : "documentPath" in duplicate
            ? "components"
            : "templates";

    expect(() =>
      parseSignedReleaseEnvelope({
        ...signed,
        [field]: [original, duplicate],
      }),
    ).toThrow(TypeError);
  });

  it("rejects unknown graph relationships", () => {
    const signed = envelope();
    const invalidSnapshots = [
      {
        ...signed,
        tokens: [{ ...token, tokenTypeId: "missing-type" }, secondToken],
      },
      {
        ...signed,
        references: [{ ...reference, referencingTokenId: "missing-source" }],
      },
      {
        ...signed,
        references: [{ ...reference, referencedTokenId: "missing-target" }],
      },
      {
        ...signed,
        templates: [{ ...template, componentId: "missing-component" }],
      },
    ];

    for (const invalid of invalidSnapshots) {
      expect(() => parseSignedReleaseEnvelope(invalid)).toThrow(TypeError);
    }
  });

  it.each([
    { algorithm: "RSA-SHA256" },
    { keyId: "" },
    { value: "not-base64url" },
    { unexpected: true },
  ])("rejects invalid signature metadata: %o", (change) => {
    const signed = envelope();
    expect(() =>
      parseSignedReleaseEnvelope({
        ...signed,
        signature: { ...signed.signature, ...change },
      }),
    ).toThrow(TypeError);
  });

  it("rejects an oversized serialized response", () => {
    const signed = envelope();
    const oversized = {
      ...signed,
      components: [
        {
          ...component,
          description: "x".repeat(MAX_RELEASE_RESPONSE_BYTES),
        },
      ],
    };

    expect(() => parseSignedReleaseEnvelope(oversized)).toThrow(RangeError);
  });

  it("rejects malformed token values", () => {
    const signed = envelope();
    expect(() =>
      parseSignedReleaseEnvelope({
        ...signed,
        tokens: [{ ...token, value: { kind: "single" } }],
      }),
    ).toThrow(TypeError);
  });
});
