import {
  downloadReleaseRequest,
  publishRequest,
} from "@repo/contracts/fixtures/operation-contracts";
import {
  parseDownloadReleaseRequest,
  parsePublishReleaseRequest,
} from "@repo/contracts/validation/operations/releases";
import { describe, expect, it } from "vitest";

describe("PublishReleaseRequest and DownloadReleaseRequest operation parsers", () => {
  it("parses release requests", () => {
    expect(parsePublishReleaseRequest(publishRequest)).toMatchObject({ success: true });

    expect(parseDownloadReleaseRequest(downloadReleaseRequest)).toMatchObject({
      success: true,
    });
  });

  it("rejects unknown fields on every request", () => {
    expect(
      parsePublishReleaseRequest({
        ...publishRequest,
        role: "admin",
      }),
    ).toMatchObject({
      success: false,
      issues: [{ field: "role", code: "unknown-field" }],
    });
  });
});
