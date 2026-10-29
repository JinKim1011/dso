import {
  parseDownloadReleaseRequest,
  parsePublishReleaseRequest,
} from "@repo/contracts/validation/operations/releases";
import { describe, expect, it } from "vitest";

describe("PublishReleaseRequest and DownloadReleaseRequest operation parsers", () => {
  it("parses release requests", () => {
    expect(
      parsePublishReleaseRequest({ projectId: "project-1", releaseId: "release-1" }),
    ).toMatchObject({ success: true });

    expect(parseDownloadReleaseRequest({ releaseId: "release-1" })).toMatchObject({
      success: true,
    });
  });

  it("rejects unknown fields on every request", () => {
    expect(
      parsePublishReleaseRequest({
        projectId: "project-1",
        releaseId: "release-1",
        role: "admin",
      }),
    ).toMatchObject({
      success: false,
      issues: [{ field: "role", code: "unknown-field" }],
    });
  });
});
