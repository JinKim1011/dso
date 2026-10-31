import { validSeed } from "@repo/contracts/fixtures/valid-seed";
import { insertProject } from "@repo/db/repositories/projects";
import { insertTokenReference } from "@repo/db/repositories/references";
import { insertRelease } from "@repo/db/repositories/releases";
import { insertTokenType } from "@repo/db/repositories/token-types";
import { insertToken } from "@repo/db/repositories/tokens";
import { describe, expect, it } from "vitest";
import { getTestDatabase } from "./setup";

function postgresErrorCode(error: unknown): string | undefined {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return error.code;
  }

  return undefined;
}

describe("database constraints", () => {
  it("rejects a release for a missing project", async () => {
    const release = {
      ...validSeed.releases[0]!,
      projectId: crypto.randomUUID(),
    };

    await expect(insertRelease(getTestDatabase(), release)).rejects.toSatisfy(
      (error: unknown) => postgresErrorCode(error) === "23503",
    );
  });

  it("rejects duplicate project slugs", async () => {
    const database = getTestDatabase();
    const project = validSeed.projects[0]!;

    await insertProject(database, project);

    await expect(
      insertProject(database, {
        ...project,
        id: crypto.randomUUID(),
        name: "Another Project",
      }),
    ).rejects.toSatisfy((error: unknown) => postgresErrorCode(error) === "23505");
  });

  it("rejects duplicate release versions in the same project", async () => {
    const database = getTestDatabase();
    const project = validSeed.projects[0]!;
    const release = validSeed.releases[0]!;

    await insertProject(database, project);
    await insertRelease(database, release);

    await expect(
      insertRelease(database, {
        ...release,
        id: crypto.randomUUID(),
      }),
    ).rejects.toSatisfy((error: unknown) => postgresErrorCode(error) === "23505");
  });

  it("rejects invalid release status", async () => {
    const database = getTestDatabase();

    await insertProject(database, validSeed.projects[0]!);

    await expect(
      insertRelease(database, {
        ...validSeed.releases[0]!,
        status: "archived" as never,
      }),
    ).rejects.toSatisfy((error: unknown) => postgresErrorCode(error) === "23514");
  });

  it("rejects a token whose token type belongs to another project", async () => {
    const database = getTestDatabase();
    const seed = structuredClone(validSeed);

    await insertProject(database, seed.projects[0]!);
    await insertProject(database, {
      id: crypto.randomUUID(),
      name: "Other Project",
      slug: "other-project",
      createdAt: "2026-10-27T10:00:00.000Z",
    });

    await insertTokenType(database, seed.tokenTypes[0]!);

    await expect(
      insertToken(database, {
        ...seed.tokens[0]!,
        projectId: crypto.randomUUID(),
      }),
    ).rejects.toSatisfy((error: unknown) => postgresErrorCode(error) === "23503");
  });

  it("rejects a self-reference", async () => {
    const database = getTestDatabase();
    const seed = structuredClone(validSeed);

    await insertProject(database, seed.projects[0]!);
    await insertTokenType(database, seed.tokenTypes[0]!);
    await insertToken(database, seed.tokens[0]!);

    await expect(
      insertTokenReference(database, {
        projectId: seed.projects[0]!.id,
        referencingTokenId: seed.tokens[0]!.id,
        referencedTokenId: seed.tokens[0]!.id,
        slot: "light",
      }),
    ).rejects.toSatisfy((error: unknown) => postgresErrorCode(error) === "23514");
  });

  it("rejects a cross-project reference", async () => {
    const database = getTestDatabase();
    const seed = structuredClone(validSeed);

    const otherProject = {
      id: crypto.randomUUID(),
      name: "Other Project",
      slug: "other-project",
      createdAt: "2026-10-27T10:00:00.000Z",
    };

    await insertProject(database, seed.projects[0]!);
    await insertProject(database, otherProject);

    await insertTokenType(database, seed.tokenTypes[0]!);

    const otherTokenType = await insertTokenType(database, {
      ...seed.tokenTypes[0]!,
      id: crypto.randomUUID(),
      projectId: otherProject.id,
    });

    await insertToken(database, seed.tokens[0]!);

    const otherToken = await insertToken(database, {
      ...seed.tokens[0]!,
      id: crypto.randomUUID(),
      projectId: otherProject.id,
      tokenTypeId: otherTokenType.id,
    });

    await expect(
      insertTokenReference(database, {
        projectId: seed.projects[0]!.id,
        referencingTokenId: seed.tokens[0]!.id,
        referencedTokenId: otherToken.id,
        slot: "dark",
      }),
    ).rejects.toSatisfy((error: unknown) => postgresErrorCode(error) === "23503");
  });
});
