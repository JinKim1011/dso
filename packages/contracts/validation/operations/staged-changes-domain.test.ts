import {
  baseColorToken,
  modeToken,
  primitiveTokenType,
  semanticTokenType,
} from "@repo/contracts/fixtures/domain-contracts";
import { fixtureIds } from "@repo/contracts/fixtures/ids";
import type { SaveStagedChangesRequest } from "@repo/contracts/operation";
import type { Token, TokenReference, TokenType, TokenValue } from "@repo/contracts/type";
import { validateSaveStagedChanges } from "@repo/contracts/validation/operations/staged-changes-domain";
import { parseSaveStagedChangesRequest } from "@repo/contracts/validation/operations/staged-changes";
import { describe, expect, it } from "vitest";

const otherTarget: Token = {
  ...baseColorToken,
  id: "00000000-0000-4000-8000-00000000000c",
  name: "black",
  value: { kind: "single", value: "#000" },
};
const reference: TokenReference = {
  projectId: fixtureIds.project,
  referencingTokenId: modeToken.id,
  referencedTokenId: baseColorToken.id,
  slot: "light",
};
const tokens: Token[] = [modeToken, baseColorToken, otherTarget];
const tokenTypes: TokenType[] = [semanticTokenType, primitiveTokenType];
const emptyRequest: SaveStagedChangesRequest = {
  projectId: fixtureIds.project,
  changes: [],
};
const replaceRequest: SaveStagedChangesRequest = {
  projectId: fixtureIds.project,
  changes: [
    {
      tokenId: modeToken.id,
      name: { before: "surface", after: "background" },
      references: [
        { slot: "light", beforeTokenId: baseColorToken.id, afterTokenId: otherTarget.id },
      ],
    },
  ],
};

function validate(
  request: SaveStagedChangesRequest,
  projectTokens = tokens,
  projectTypes = tokenTypes,
  projectReferences: TokenReference[] = [reference],
) {
  return validateSaveStagedChanges(
    request,
    projectTokens,
    projectTypes,
    projectReferences,
  );
}

describe("validateSaveStagedChanges", () => {
  it.each(["var(--missing)", "calc(1px + VAR (--spacing))", "v\\61 r(--missing)"])(
    "rejects primitive CSS variables in the final batch: %s",
    (value) => {
      const request: SaveStagedChangesRequest = {
        projectId: fixtureIds.project,
        changes: [
          {
            tokenId: baseColorToken.id,
            value: { before: baseColorToken.value, after: { kind: "single", value } },
            references: [],
          },
        ],
      };
      expect(validate(request)).toMatchObject({
        success: false,
        issues: expect.arrayContaining([
          expect.objectContaining({ code: "invalid-value", tokenId: baseColorToken.id }),
          expect.objectContaining({
            code: "invalid-referenced-token-value",
            tokenId: modeToken.id,
          }),
        ]),
      });
      expect(validate(request, tokens, tokenTypes, [])).toMatchObject({
        success: false,
        issues: expect.arrayContaining([
          expect.objectContaining({ code: "invalid-value", tokenId: baseColorToken.id }),
        ]),
      });
    },
  );

  it("allows repairing a pre-existing primitive CSS variable", () => {
    const invalid: Token = {
      ...baseColorToken,
      value: { kind: "single", value: "var(--x)" },
    };
    const request: SaveStagedChangesRequest = {
      projectId: fixtureIds.project,
      changes: [
        {
          tokenId: invalid.id,
          value: { before: invalid.value, after: baseColorToken.value },
          references: [],
        },
      ],
    };
    expect(validate(request, [modeToken, invalid, otherTarget]).success).toBe(true);
  });

  it("reports unrelated invalid references but permits a batch that repairs them", () => {
    const invalidReference: TokenReference = {
      ...reference,
      referencedTokenId: fixtureIds.release,
    };
    const untouched = validate(emptyRequest, tokens, tokenTypes, [invalidReference]);
    expect(untouched).toMatchObject({
      success: false,
      issues: expect.arrayContaining([
        expect.objectContaining({
          code: "missing-referenced-token",
          tokenId: modeToken.id,
          referencedTokenId: fixtureIds.release,
          field: "references.light",
        }),
      ]),
    });

    const repair: SaveStagedChangesRequest = {
      projectId: fixtureIds.project,
      changes: [
        {
          tokenId: modeToken.id,
          references: [
            {
              slot: "light",
              beforeTokenId: fixtureIds.release,
              afterTokenId: otherTarget.id,
            },
          ],
        },
      ],
    };
    expect(validate(repair, tokens, tokenTypes, [invalidReference])).toMatchObject({
      success: true,
      references: [{ ...reference, referencedTokenId: otherTarget.id }],
    });
  });

  it("allows clearing an existing unsupported reference to repair the final state", () => {
    const invalidReference: TokenReference = {
      ...reference,
      slot: "fontSize",
    };
    const repair: SaveStagedChangesRequest = {
      projectId: fixtureIds.project,
      changes: [
        {
          tokenId: modeToken.id,
          references: [
            {
              slot: "fontSize",
              beforeTokenId: baseColorToken.id,
              afterTokenId: null,
            },
          ],
        },
      ],
    };
    expect(validate(repair, tokens, tokenTypes, [invalidReference])).toMatchObject({
      success: true,
      references: [],
    });
  });
  it("accepts empty batches and returns an unchanged state", () => {
    expect(validate(emptyRequest)).toEqual({
      success: true,
      tokens,
      references: [reference],
    });
  });

  it("applies a parsed replacement and name change without mutating the snapshot", () => {
    const parsed = parseSaveStagedChangesRequest(replaceRequest);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    const result = validate(parsed.value);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.tokens.find((token) => token.id === modeToken.id)).toEqual({
      ...modeToken,
      name: "background",
    });
    expect(result.references).toEqual([
      { ...reference, referencedTokenId: otherTarget.id },
    ]);
    expect(tokens[0]).toEqual(modeToken);
    expect(reference.referencedTokenId).toBe(baseColorToken.id);
  });

  it("assigns and clears independently while retaining untouched slots", () => {
    const result = validate({
      projectId: fixtureIds.project,
      changes: [
        {
          tokenId: modeToken.id,
          references: [
            { slot: "light", beforeTokenId: baseColorToken.id, afterTokenId: null },
            { slot: "dark", beforeTokenId: null, afterTokenId: otherTarget.id },
          ],
        },
      ],
    });
    expect(result).toMatchObject({
      success: true,
      references: [{ ...reference, slot: "dark", referencedTokenId: otherTarget.id }],
    });
  });

  it("accepts and checks explicit no-ops", () => {
    const request: SaveStagedChangesRequest = {
      projectId: fixtureIds.project,
      changes: [
        {
          tokenId: modeToken.id,
          name: { before: modeToken.name, after: modeToken.name },
          references: [
            {
              slot: "light",
              beforeTokenId: baseColorToken.id,
              afterTokenId: baseColorToken.id,
            },
            { slot: "dark", beforeTokenId: null, afterTokenId: null },
          ],
        },
      ],
    };
    expect(validate(request).success).toBe(true);
    expect(validate(request, tokens, tokenTypes, [])).toMatchObject({
      success: false,
      issues: [{ code: "conflict", field: "references.light" }],
    });
  });

  it("reports all stale before values and does not return a proposed state", () => {
    const result = validate({
      projectId: fixtureIds.project,
      changes: [
        {
          tokenId: modeToken.id,
          name: { before: "stale", after: "new" },
          value: { before: { kind: "single", value: "x" }, after: { kind: "modes" } },
          references: [
            { slot: "light", beforeTokenId: null, afterTokenId: otherTarget.id },
          ],
        },
      ],
    });
    expect(result).toMatchObject({
      success: false,
      issues: [
        { code: "conflict", field: "name" },
        { code: "conflict", field: "value" },
        { code: "conflict", field: "references.light" },
      ],
    });
    expect(result).not.toHaveProperty("tokens");
  });

  it.each([
    {
      value: { kind: "modes", light: "white" },
      before: { kind: "modes", light: "black" },
    },
    {
      value: { kind: "typography", fontSize: "16px" },
      before: { kind: "typography", fontSize: "14px" },
    },
  ] satisfies Array<{ value: TokenValue; before: TokenValue }>)(
    "detects stale optional fields in $value.kind token values",
    ({ value, before }) => {
      const token: Token = { ...modeToken, value };
      const result = validate(
        {
          projectId: fixtureIds.project,
          changes: [
            {
              tokenId: token.id,
              value: { before, after: value },
              references: [],
            },
          ],
        },
        [token, baseColorToken, otherTarget],
      );

      expect(result).toMatchObject({
        success: false,
        issues: [{ code: "conflict", field: "value" }],
      });
    },
  );

  it("compares UUIDs case-insensitively", () => {
    const source = { ...modeToken, id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" };
    const target = { ...baseColorToken, id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" };
    const replacement = { ...otherTarget, id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc" };
    const projectReference = {
      ...reference,
      referencingTokenId: source.id,
      referencedTokenId: target.id,
    };
    const result = validate(
      {
        projectId: fixtureIds.project.toUpperCase(),
        changes: [
          {
            tokenId: source.id.toUpperCase(),
            references: [
              {
                slot: "light",
                beforeTokenId: target.id.toUpperCase(),
                afterTokenId: replacement.id.toUpperCase(),
              },
            ],
          },
        ],
      },
      [source, target, replacement],
      tokenTypes,
      [projectReference],
    );
    expect(result).toMatchObject({
      success: true,
      references: [{ ...projectReference, referencedTokenId: replacement.id }],
    });
  });

  it("rejects missing and cross-project source tokens", () => {
    expect(
      validate({
        ...replaceRequest,
        changes: [{ ...replaceRequest.changes[0]!, tokenId: fixtureIds.release }],
      }),
    ).toMatchObject({
      success: false,
      issues: [{ code: "missing-token" }],
    });
    expect(
      validate(replaceRequest, [
        { ...modeToken, projectId: fixtureIds.release },
        baseColorToken,
        otherTarget,
      ]),
    ).toMatchObject({
      success: false,
      issues: [{ code: "wrong-project" }],
    });
  });

  it("rejects missing, self, cross-project and incompatible targets", () => {
    const withTarget = (afterTokenId: string): SaveStagedChangesRequest => ({
      projectId: fixtureIds.project,
      changes: [
        {
          tokenId: modeToken.id,
          references: [{ slot: "light", beforeTokenId: baseColorToken.id, afterTokenId }],
        },
      ],
    });
    expect(validate(withTarget(fixtureIds.release))).toMatchObject({
      success: false,
      issues: expect.arrayContaining([
        expect.objectContaining({ code: "missing-referenced-token" }),
      ]),
    });
    expect(validate(withTarget(modeToken.id))).toMatchObject({
      success: false,
      issues: expect.arrayContaining([
        expect.objectContaining({ code: "self-reference" }),
      ]),
    });
    expect(
      validate(withTarget(otherTarget.id), [
        modeToken,
        baseColorToken,
        { ...otherTarget, projectId: fixtureIds.release },
      ]),
    ).toMatchObject({
      success: false,
      issues: expect.arrayContaining([
        expect.objectContaining({ code: "wrong-project" }),
      ]),
    });
    const spacingType: TokenType = {
      ...primitiveTokenType,
      id: fixtureIds.component,
      category: "spacing",
    };
    expect(
      validate(
        withTarget(otherTarget.id),
        [modeToken, baseColorToken, { ...otherTarget, tokenTypeId: spacingType.id }],
        [...tokenTypes, spacingType],
      ),
    ).toMatchObject({
      success: false,
      issues: expect.arrayContaining([
        expect.objectContaining({ code: "incompatible-referenced-token-type" }),
      ]),
    });
  });

  it("checks clear operations against the source's supported slots", () => {
    const result = validate({
      projectId: fixtureIds.project,
      changes: [
        {
          tokenId: baseColorToken.id,
          references: [{ slot: "value", beforeTokenId: null, afterTokenId: null }],
        },
      ],
    });
    expect(result).toMatchObject({
      success: false,
      issues: [{ code: "unsupported-slot", field: "references.value" }],
    });
  });

  it("rejects assignments to unsupported slots and primitive sources", () => {
    const request: SaveStagedChangesRequest = {
      projectId: fixtureIds.project,
      changes: [
        {
          tokenId: modeToken.id,
          references: [
            { slot: "fontSize", beforeTokenId: null, afterTokenId: baseColorToken.id },
          ],
        },
        {
          tokenId: baseColorToken.id,
          references: [
            { slot: "value", beforeTokenId: null, afterTokenId: otherTarget.id },
          ],
        },
      ],
    };
    expect(validate(request)).toMatchObject({
      success: false,
      issues: expect.arrayContaining([
        expect.objectContaining({ code: "unsupported-slot", tokenId: modeToken.id }),
        expect.objectContaining({
          code: "invalid-referencing-token-kind",
          tokenId: baseColorToken.id,
        }),
      ]),
    });
  });

  it("checks typography targets against the specific primitive type for each slot", () => {
    const semanticType: TokenType = {
      ...semanticTokenType,
      category: "typography",
    };
    const fontSizeType: TokenType = {
      ...primitiveTokenType,
      category: "typography",
      name: "font-size",
    };
    const fontWeightType: TokenType = {
      ...fontSizeType,
      id: fixtureIds.component,
      name: "font-weight",
    };
    const semantic: Token = { ...modeToken, value: { kind: "typography" } };
    const size: Token = { ...baseColorToken, value: { kind: "single", value: "16px" } };
    const weight: Token = {
      ...otherTarget,
      tokenTypeId: fontWeightType.id,
      value: { kind: "single", value: "400" },
    };
    const request: SaveStagedChangesRequest = {
      projectId: fixtureIds.project,
      changes: [
        {
          tokenId: semantic.id,
          references: [
            { slot: "fontSize", beforeTokenId: null, afterTokenId: size.id },
            { slot: "fontWeight", beforeTokenId: null, afterTokenId: weight.id },
          ],
        },
      ],
    };
    const types = [semanticType, fontSizeType, fontWeightType];
    expect(validate(request, [semantic, size, weight], types, []).success).toBe(true);
    const wrongTarget: SaveStagedChangesRequest = {
      ...request,
      changes: [
        {
          tokenId: semantic.id,
          references: [
            { slot: "fontSize", beforeTokenId: null, afterTokenId: weight.id },
          ],
        },
      ],
    };
    expect(validate(wrongTarget, [semantic, size, weight], types, [])).toMatchObject({
      success: false,
      issues: expect.arrayContaining([
        expect.objectContaining({
          code: "incompatible-referenced-token-type",
          field: "references.fontSize",
        }),
      ]),
    });
  });

  it("validates retained references against changed target values", () => {
    const result = validate({
      projectId: fixtureIds.project,
      changes: [
        {
          tokenId: baseColorToken.id,
          value: { before: baseColorToken.value, after: { kind: "modes" } },
          references: [],
        },
      ],
    });
    expect(result).toMatchObject({
      success: false,
      issues: expect.arrayContaining([
        expect.objectContaining({ code: "invalid-value", tokenId: baseColorToken.id }),
        expect.objectContaining({
          code: "incompatible-referenced-token-type",
          tokenId: modeToken.id,
        }),
      ]),
    });
  });

  it("validates a clear and value change against the proposed source", () => {
    const result = validate({
      projectId: fixtureIds.project,
      changes: [
        {
          tokenId: modeToken.id,
          value: { before: { kind: "modes" }, after: { kind: "single", value: "x" } },
          references: [
            { slot: "light", beforeTokenId: baseColorToken.id, afterTokenId: null },
          ],
        },
      ],
    });
    expect(result).toMatchObject({
      success: false,
      issues: expect.arrayContaining([
        expect.objectContaining({ code: "invalid-value", field: "value.kind" }),
      ]),
    });
  });

  it("validates references against a target fixed elsewhere in the batch", () => {
    const brokenTarget: Token = { ...otherTarget, value: { kind: "modes" } };
    const result = validate(
      {
        projectId: fixtureIds.project,
        changes: [
          {
            tokenId: modeToken.id,
            references: [
              {
                slot: "light",
                beforeTokenId: baseColorToken.id,
                afterTokenId: brokenTarget.id,
              },
            ],
          },
          {
            tokenId: brokenTarget.id,
            value: {
              before: { kind: "modes" },
              after: { kind: "single", value: "#000" },
            },
            references: [],
          },
        ],
      },
      [modeToken, baseColorToken, brokenTarget],
    );
    expect(result).toMatchObject({
      success: true,
      references: [{ ...reference, referencedTokenId: brokenTarget.id }],
    });
  });

  it("rejects duplicate existing references and missing token types", () => {
    expect(
      validate(emptyRequest, tokens, tokenTypes, [reference, reference]),
    ).toMatchObject({
      success: false,
      issues: [{ code: "duplicate-reference" }],
    });
    expect(validate(replaceRequest, tokens, [primitiveTokenType])).toMatchObject({
      success: false,
      issues: expect.arrayContaining([
        expect.objectContaining({ code: "missing-token-type" }),
      ]),
    });
  });
});
