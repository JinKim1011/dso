import { hashPassword, verifyPassword } from "@repo/application/services/passwords";
import { describe, expect, it } from "vitest";

describe("Password hashing", () => {
  it("does not store the password as plaintext", async () => {
    const password = "test-password";
    const hash = await hashPassword(password);

    expect(hash).not.toBe(password);
  });

  it("verifies the correct password", async () => {
    const hash = await hashPassword("test-password");

    await expect(verifyPassword(hash, "test-password")).resolves.toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("test-password");

    await expect(verifyPassword(hash, "wrong-password")).resolves.toBe(false);
  });

  it("returns false for a malformed hash", async () => {
    await expect(
      verifyPassword("not-a-valid-argon2-hash", "test-password"),
    ).resolves.toBe(false);
  });
});
