import { DomainValidationError } from "@repo/application/errors";
import { seedProject } from "@repo/application/fixtures";
import { addTokenReference } from "@repo/application/services/token-references";
import { listTokenReferencesByProjectId } from "@repo/db/repositories/references";
import { getTestDatabase } from "@repo/db/test/setup";
import { describe, expect, it } from "vitest";

describe("Token reference service integration", () => {
  it("inserts a valid token reference", async () => {
    const database = getTestDatabase();

    const fixture = await seedProject(database, "editor");

    const result = await addTokenReference(database, fixture.context, {
      projectId: fixture.project.id,
      referencingTokenId: fixture.referencingToken.id,
      referencedTokenId: fixture.referencedToken.id,
      slot: "light",
    });

    expect(result).toMatchObject({
      projectId: fixture.project.id,
      referencingTokenId: fixture.referencingToken.id,
      referencedTokenId: fixture.referencedToken.id,
      slot: "light",
    });
  });

  it("rejects self-reference before repository write", async () => {
    const database = getTestDatabase();

    const fixture = await seedProject(database, "editor");

    await expect(
      addTokenReference(database, fixture.context, {
        projectId: fixture.project.id,
        referencingTokenId: fixture.referencingToken.id,
        referencedTokenId: fixture.referencingToken.id,
        slot: "light",
      }),
    ).rejects.toBeInstanceOf(DomainValidationError);

    await expect(
      listTokenReferencesByProjectId(database, fixture.project.id),
    ).resolves.toEqual([]);
  });
});
