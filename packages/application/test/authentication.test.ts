import { InvalidCredentialsError } from "@repo/application/errors";
import { login } from "@repo/application/services/authentication";
import * as passwords from "@repo/application/services/passwords";
import { findUserByEmail } from "@repo/db/repositories/users";
import argon2 from "argon2";
import type { Pool } from "pg";
import { describe, expect, it, vi } from "vitest";

vi.mock("@repo/db/repositories/users", async (importOriginal) => ({
  ...await importOriginal<typeof import("@repo/db/repositories/users")>(),
  findUserByEmail: vi.fn(),
}));
vi.mock("@repo/application/services/passwords", async (importOriginal) => ({
  ...await importOriginal<typeof import("@repo/application/services/passwords")>(),
  verifyPassword: vi.fn().mockResolvedValue(false),
}));

describe("unknown account password verification", () => {
  it("uses a valid Argon2id hash with the configured work factor", async () => {
    vi.mocked(findUserByEmail).mockResolvedValue(null);
    const database = {} as Pool;
    await expect(login(database, {
      email: "missing@example.test",
      password: "password",
    })).rejects.toBeInstanceOf(InvalidCredentialsError);
    const hash = vi.mocked(passwords.verifyPassword).mock.calls[0]?.[0];
    expect(hash).toMatch(/^\$argon2id\$v=19\$m=19456,t=2,p=1\$/);
    expect(hash).toBeDefined();
    await expect(argon2.verify(hash!, "password")).resolves.toBe(false);
  });
});
