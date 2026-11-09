import { validateMemberships } from "@repo/contracts/validation/seed/memberships";
import {
  createSeedData,
  seedProjectFixture,
  seedProjectMemberFixture,
  seedUserFixture,
} from "@repo/contracts/fixtures/seed-contracts";
import { describe, expect, it } from "vitest";

describe("validateMemberships", () => {
  it("accepts valid memberships", () => {
    const seed = createSeedData({
      projects: [seedProjectFixture],
      users: [seedUserFixture],
      projectMembers: [seedProjectMemberFixture],
    });

    expect(validateMemberships(seed)).toEqual([]);
  });

  it("rejects a duplicate membership", () => {
    const seed = createSeedData({
      projectMembers: [seedProjectMemberFixture, { ...seedProjectMemberFixture }],
    });

    expect(validateMemberships(seed)).toContainEqual(
      expect.objectContaining({
        code: "duplicate-id",
        collection: "projectMembers",
        id: `${seedProjectMemberFixture.projectId}:${seedProjectMemberFixture.userId}`,
      }),
    );
  });

  it("rejects a membership for a missing project", () => {
    const seed = createSeedData({
      users: [seedUserFixture],
      projectMembers: [{ ...seedProjectMemberFixture, projectId: "missing-project" }],
    });

    expect(validateMemberships(seed)).toContainEqual(
      expect.objectContaining({
        code: "missing-record",
        collection: "projectMembers",
        field: "projectId",
      }),
    );
  });

  it("rejects a membership for a missing user", () => {
    const seed = createSeedData({
      projects: [seedProjectFixture],
      projectMembers: [{ ...seedProjectMemberFixture, userId: "missing-user" }],
    });

    expect(validateMemberships(seed)).toContainEqual(
      expect.objectContaining({
        code: "missing-record",
        collection: "projectMembers",
        field: "userId",
      }),
    );
  });

  it("rejects an unsupported membership role", () => {
    const seed = createSeedData({
      projectMembers: [{ ...seedProjectMemberFixture, role: "owner" as never }],
    });

    expect(validateMemberships(seed)).toContainEqual(
      expect.objectContaining({
        code: "invalid-enum",
        collection: "projectMembers",
        field: "role",
      }),
    );
  });
});
