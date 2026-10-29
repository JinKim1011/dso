import {
  addReferenceRequest,
  changeParentRequest,
} from "@repo/contracts/fixtures/operation-contracts";
import {
  parseAddTokenReferenceRequest,
  parseChangeTokenTypeParentRequest,
} from "@repo/contracts/validation/operations/relationships";
import { describe, expect, it } from "vitest";

describe("AddTokenReferenceRequest and ChangeTokenTypeParentRequest operation parsers", () => {
  describe("parseAddTokenReferenceRequest", () => {
    it("parses the prepared fixture", () => {
      expect(parseAddTokenReferenceRequest(addReferenceRequest)).toEqual({
        success: true,
        value: addReferenceRequest,
      });
    });

    it("rejects unsupported slots", () => {
      expect(
        parseAddTokenReferenceRequest({
          ...addReferenceRequest,
          slot: "invalid-slot",
        }),
      ).toMatchObject({
        success: false,
        issues: [{ field: "slot", code: "unsupported-value" }],
      });
    });

    it("rejects unknown fields", () => {
      expect(
        parseAddTokenReferenceRequest({
          ...addReferenceRequest,
          extra: true,
        }),
      ).toMatchObject({
        success: false,
        issues: [{ field: "extra", code: "unknown-field" }],
      });
    });
  });

  describe("parseChangeTokenTypeParentRequest", () => {
    it("parses the prepared fixture", () => {
      expect(parseChangeTokenTypeParentRequest(changeParentRequest)).toEqual({
        success: true,
        value: changeParentRequest,
      });
    });

    it("accepts a null parent type", () => {
      expect(
        parseChangeTokenTypeParentRequest({
          ...changeParentRequest,
          parentTypeId: null,
        }),
      ).toEqual({
        success: true,
        value: {
          ...changeParentRequest,
          parentTypeId: null,
        },
      });
    });

    it("rejects an invalid parent type identifier", () => {
      expect(
        parseChangeTokenTypeParentRequest({
          ...changeParentRequest,
          parentTypeId: "parent/type",
        }),
      ).toMatchObject({
        success: false,
        issues: [{ field: "parentTypeId", code: "invalid-format" }],
      });
    });
  });
});
