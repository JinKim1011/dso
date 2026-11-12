import type {
  SaveStagedChangesRequest,
  StagedTokenChange,
} from "@repo/contracts/operation";
import { CONTRACT_LIMITS } from "@repo/contracts/validation/limit";
import { parseSaveStagedChangesRequest } from "@repo/contracts/validation/operations/staged-changes";
import { tokenReferenceSlots } from "@repo/contracts/validation/token-reference-slots";
import { describe, expect, it } from "vitest";

const projectId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const tokenId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const targetId = "cccccccc-cccc-cccc-cccc-cccccccccccc";

const request = {
  projectId,
  changes: [
    {
      tokenId,
      name: { before: "old", after: "new" },
      value: {
        before: { kind: "single", value: "1px" },
        after: { kind: "single", value: "2px" },
      },
      references: [
        { slot: "light", beforeTokenId: null, afterTokenId: targetId },
        { slot: "dark", beforeTokenId: targetId, afterTokenId: null },
      ],
    },
  ],
} satisfies SaveStagedChangesRequest;

describe("parseSaveStagedChangesRequest", () => {
  it("accepts changed fields and assignment and clear references", () => {
    expect(parseSaveStagedChangesRequest(JSON.parse(JSON.stringify(request)))).toEqual({
      success: true,
      value: request,
    });
  });

  it("accepts replacement, omitted optional fields, and empty arrays", () => {
    expect(
      parseSaveStagedChangesRequest({
        projectId,
        changes: [
          {
            tokenId,
            references: [
              { slot: "value", beforeTokenId: tokenId, afterTokenId: targetId },
            ],
          },
          { tokenId: targetId, references: [] },
        ],
      }).success,
    ).toBe(true);
    expect(parseSaveStagedChangesRequest({ projectId, changes: [] }).success).toBe(true);
  });

  it("accepts values and collections at their limits", () => {
    const changes: StagedTokenChange[] = Array.from(
      { length: CONTRACT_LIMITS.collectionItems },
      (_, index) => ({
        tokenId: `00000000-0000-0000-0000-${index.toString(16).padStart(12, "0")}`,
        name: { before: "a", after: "x".repeat(CONTRACT_LIMITS.tokenName) },
        references: [],
      }),
    );
    changes[0]!.references = tokenReferenceSlots.map((slot) => ({
      slot,
      beforeTokenId: null,
      afterTokenId: targetId,
    }));
    expect(parseSaveStagedChangesRequest({ projectId, changes }).success).toBe(true);
    expect(
      parseSaveStagedChangesRequest({
        projectId,
        changes: [
          {
            tokenId,
            value: {
              before: { kind: "single", value: "x".repeat(CONTRACT_LIMITS.tokenValue) },
              after: { kind: "typography" },
            },
            references: [],
          },
        ],
      }).success,
    ).toBe(true);
  });

  it("rejects sparse arrays rather than silently skipping entries", () => {
    expect(
      parseSaveStagedChangesRequest({ projectId, changes: new Array(1) }),
    ).toMatchObject({
      success: false,
      issues: [{ field: "changes[0]", code: "invalid-type" }],
    });
    expect(
      parseSaveStagedChangesRequest({
        projectId,
        changes: [{ tokenId, references: new Array(1) }],
      }),
    ).toMatchObject({
      success: false,
      issues: [{ field: "changes[0].references[0]", code: "invalid-type" }],
    });
  });

  it.each([null, [], "request", 1])("rejects a non-object body: %o", (body) => {
    expect(parseSaveStagedChangesRequest(body)).toMatchObject({
      success: false,
      issues: [{ field: "", code: "invalid-type" }],
    });
  });

  it.each([
    [{ ...request, projectId: "not-a-uuid" }, "projectId", "invalid-format"],
    [{ ...request, changes: null }, "changes", "invalid-type"],
    [{ ...request, extra: true }, "extra", "unknown-field"],
    [{ ...request, changes: [null] }, "changes[0]", "invalid-type"],
    [
      { ...request, changes: [{ ...request.changes[0], cssVar: "x" }] },
      "changes[0].cssVar",
      "unknown-field",
    ],
    [
      { ...request, changes: [{ ...request.changes[0], tokenId: "" }] },
      "changes[0].tokenId",
      "empty",
    ],
    [
      { ...request, changes: [{ ...request.changes[0], references: null }] },
      "changes[0].references",
      "invalid-type",
    ],
    [
      {
        ...request,
        changes: [
          {
            tokenId,
            references: [
              { slot: "unknown", beforeTokenId: null, afterTokenId: targetId },
            ],
          },
        ],
      },
      "changes[0].references[0].slot",
      "unsupported-value",
    ],
    [
      {
        ...request,
        changes: [{ tokenId, references: [{ slot: "light", afterTokenId: targetId }] }],
      },
      "changes[0].references[0].beforeTokenId",
      "invalid-type",
    ],
    [
      {
        ...request,
        changes: [
          {
            tokenId,
            references: [{ slot: "light", beforeTokenId: null, afterTokenId: "bad" }],
          },
        ],
      },
      "changes[0].references[0].afterTokenId",
      "invalid-format",
    ],
    [
      {
        ...request,
        changes: [
          {
            tokenId,
            references: [
              { slot: "light", beforeTokenId: null, afterTokenId: null, extra: 1 },
            ],
          },
        ],
      },
      "changes[0].references[0].extra",
      "unknown-field",
    ],
    [
      {
        ...request,
        changes: [
          { tokenId, name: { before: "old", after: "new", extra: 1 }, references: [] },
        ],
      },
      "changes[0].name.extra",
      "unknown-field",
    ],
    [
      { ...request, changes: [{ tokenId, name: { before: "old" }, references: [] }] },
      "changes[0].name.after",
      "invalid-type",
    ],
    [
      { ...request, changes: [{ tokenId, name: null, references: [] }] },
      "changes[0].name",
      "invalid-type",
    ],
    [
      {
        ...request,
        changes: [
          {
            tokenId,
            value: {
              before: { kind: "modes", light: "legacy" },
              after: { kind: "modes" },
            },
            references: [],
          },
        ],
      },
      "changes[0].value.before",
      "unknown-field",
    ],
    [
      {
        ...request,
        changes: [
          {
            tokenId,
            value: { before: { kind: "single", value: 42 }, after: { kind: "modes" } },
            references: [],
          },
        ],
      },
      "changes[0].value.before.value",
      "invalid-type",
    ],
    [
      {
        ...request,
        changes: [
          {
            tokenId,
            value: { before: { kind: "unresolved" }, after: { kind: "bad" } },
            references: [],
          },
        ],
      },
      "changes[0].value.after.kind",
      "unsupported-value",
    ],
  ])("rejects invalid input at %s", (input, field, code) => {
    const result = parseSaveStagedChangesRequest(input);
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.issues).toContainEqual(expect.objectContaining({ field, code }));
  });

  it("rejects duplicate token IDs regardless of UUID casing", () => {
    const result = parseSaveStagedChangesRequest({
      projectId,
      changes: [
        { tokenId, references: [] },
        { tokenId: tokenId.toUpperCase(), references: [] },
      ],
    });
    expect(result).toMatchObject({
      success: false,
      issues: [{ field: "changes[1].tokenId", code: "invalid-format" }],
    });
  });

  it("rejects duplicate slots for a token", () => {
    const result = parseSaveStagedChangesRequest({
      projectId,
      changes: [
        {
          tokenId,
          references: [
            { slot: "light", beforeTokenId: null, afterTokenId: targetId },
            { slot: "light", beforeTokenId: targetId, afterTokenId: null },
          ],
        },
      ],
    });
    expect(result).toMatchObject({
      success: false,
      issues: [{ field: "changes[0].references[1].slot", code: "invalid-format" }],
    });
  });

  it("enforces collection and field limits", () => {
    const tooManyChanges = Array.from({ length: CONTRACT_LIMITS.collectionItems + 1 });
    expect(
      parseSaveStagedChangesRequest({ projectId, changes: tooManyChanges }),
    ).toMatchObject({
      success: false,
      issues: [{ field: "changes", code: "too-many-items" }],
    });
    const tooManyReferences = Array.from({ length: tokenReferenceSlots.length + 1 });
    expect(
      parseSaveStagedChangesRequest({
        projectId,
        changes: [{ tokenId, references: tooManyReferences }],
      }),
    ).toMatchObject({
      success: false,
      issues: [{ field: "changes[0].references", code: "too-many-items" }],
    });
    const result = parseSaveStagedChangesRequest({
      projectId,
      changes: [
        {
          tokenId,
          name: { before: "old", after: "x".repeat(CONTRACT_LIMITS.tokenName + 1) },
          value: {
            before: { kind: "single", value: "x" },
            after: { kind: "single", value: "x".repeat(CONTRACT_LIMITS.tokenValue + 1) },
          },
          references: [],
        },
      ],
    });
    expect(result).toMatchObject({
      success: false,
      issues: [
        { field: "changes[0].name.after", code: "too-long" },
        { field: "changes[0].value.after.value", code: "too-long" },
      ],
    });
  });
});
