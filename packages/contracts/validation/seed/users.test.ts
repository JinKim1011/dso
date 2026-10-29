import { validSeed } from "@repo/contracts/fixtures/valid-seed";
import { validateSeedFieldLengths } from "@repo/contracts/validation/seed/field-lengths";
import { describe, expect, it } from "vitest";

const cloneSeed = () => structuredClone(validSeed);

describe("users", () => {
  it("rejects an invalid email", () => {
    const seed = cloneSeed();
    seed.users[0]!.email = "invalid-email";

    expect(validateSeedFieldLengths(seed)).toContainEqual(
      expect.objectContaining({
        code: "invalid-field",
        collection: "users",
        id: seed.users[0]!.id,
        field: "email",
        message: "email must be a valid email address.",
      }),
    );
  });
});
