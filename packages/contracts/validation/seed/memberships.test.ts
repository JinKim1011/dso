import { validSeed } from "@repo/contracts/fixtures/valid-seed";
import { validateMemberships } from "@repo/contracts/validation/seed/memberships";
import { describe, expect, it } from "vitest";

const cloneSeed = () => structuredClone(validSeed);

describe("validateMemberships", () => {
  it("accepts valid memberships", () => {
    expect(validateMemberships(validSeed)).toEqual([]);
  });

  it("rejects a duplicate membership", () => {
    const seed = cloneSeed();
    seed.projectMembers.push({ ...seed.projectMembers[0]! });

    expect(validateMemberships(seed)).toContainEqual(
      expect.objectContaining({
        code: "duplicate-id",
        collection: "projectMembers",
      }),
    );
  });

  it("rejects a membership for a missing project", () => {
    const seed = cloneSeed();
    seed.projectMembers[0]!.projectId = "missing-project";

    expect(validateMemberships(seed)).toContainEqual(
      expect.objectContaining({
        code: "missing-record",
        collection: "projectMembers",
        field: "projectId",
      }),
    );
  });

  it("rejects a membership for a missing user", () => {
    const seed = cloneSeed();
    seed.projectMembers[0]!.userId = "missing-user";

    expect(validateMemberships(seed)).toContainEqual(
      expect.objectContaining({
        code: "missing-record",
        collection: "projectMembers",
        field: "userId",
      }),
    );
  });

  it("rejects an unsupported membership role", () => {
    const seed = cloneSeed();
    seed.projectMembers[0]!.role = "owner" as never;

    expect(validateMemberships(seed)).toContainEqual(
      expect.objectContaining({
        code: "invalid-enum",
        collection: "projectMembers",
        field: "role",
      }),
    );
  });
});
