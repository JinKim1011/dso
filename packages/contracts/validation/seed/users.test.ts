import { validateUsers } from "@repo/contracts/validation/seed/users";
import {
  createSeedData,
  seedUserFixture,
} from "@repo/contracts/fixtures/seed-contracts";
import { describe, expect, it } from "vitest";

describe("users", () => {
  it("rejects an invalid email", () => {
    const seed = createSeedData({
      users: [{ ...seedUserFixture, email: "invalid-email" }],
    });

    expect(validateUsers(seed)).toContainEqual(
      expect.objectContaining({
        code: "invalid-field",
        collection: "users",
        id: seedUserFixture.id,
        field: "email",
        message: "email must be a valid email address.",
      }),
    );
  });
});
