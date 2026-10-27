import {
  isSupportedApiKeyScope,
  isSupportedProjectMemberRole,
  isSupportedReleaseStatus,
} from "@repo/contracts/validation/enum";
import { describe, expect, it } from "vitest";

describe("project member roles", () => {
  it("accepts supported roles", () => {
    expect(isSupportedProjectMemberRole("editor")).toBe(true);
    expect(isSupportedProjectMemberRole("publisher")).toBe(true);
    expect(isSupportedProjectMemberRole("admin")).toBe(true);
  });

  it("rejects unsupported roles", () => {
    expect(isSupportedProjectMemberRole("owner")).toBe(false);
  });
});

describe("API-key scopes", () => {
  it("accepts the release read scope", () => {
    expect(isSupportedApiKeyScope("release:read")).toBe(true);
  });

  it("rejects unsupported scopes", () => {
    expect(isSupportedApiKeyScope("write")).toBe(false);
  });
});

describe("release statuses", () => {
  it("accepts supported statuses", () => {
    expect(isSupportedReleaseStatus("draft")).toBe(true);
    expect(isSupportedReleaseStatus("published")).toBe(true);
  });

  it("rejects unsupported statuses", () => {
    expect(isSupportedReleaseStatus("archived")).toBe(false);
  });
});
