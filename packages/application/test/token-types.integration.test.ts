import {
  DomainValidationError,
  ProjectAccessDeniedError,
} from "@repo/application/errors";
import { seedProject } from "@repo/application/fixtures";
import { addTokenReference } from "@repo/application/services/token-references";
import { changeTokenTypeParent } from "@repo/application/services/token-types";
import { getTestDatabase } from "@repo/db/test/setup";
import { describe, expect, it } from "vitest";

describe("Token-type parent service integration", () => {
  it("rejects a parent cycle", async () => {
    const database = getTestDatabase();
    const fixture = await seedProject(database, "editor");

    await expect(
      changeTokenTypeParent(database, fixture.context, {
        projectId: fixture.project.id,
        tokenTypeId: fixture.primitiveType.id,
        parentTypeId: fixture.semanticType.id,
      }),
    ).rejects.toMatchObject({
      code: "domain-validation",
      issues: expect.arrayContaining([expect.objectContaining({ code: "cycle" })]),
    });
  });

  it("rejects a parent from another project", async () => {
    const database = getTestDatabase();

    const fixture = await seedProject(database, "editor");
    const other = await seedProject(database, "editor");

    await expect(
      changeTokenTypeParent(database, fixture.context, {
        projectId: fixture.project.id,
        tokenTypeId: fixture.primitiveType.id,
        parentTypeId: other.primitiveType.id,
      }),
    ).rejects.toBeInstanceOf(DomainValidationError);
  });

  it("rejects a user without project access", async () => {
    const database = getTestDatabase();
    const fixture = await seedProject(database);

    await expect(
      addTokenReference(
        database,
        {
          userId: crypto.randomUUID(),
          sessionId: crypto.randomUUID(),
        },
        {
          projectId: fixture.project.id,
          referencingTokenId: fixture.referencingToken.id,
          referencedTokenId: fixture.referencedToken.id,
          slot: "light",
        },
      ),
    ).rejects.toBeInstanceOf(ProjectAccessDeniedError);
  });

  it("rejects a user from another project", async () => {
    const database = getTestDatabase();

    const fixture = await seedProject(database, "editor");
    const other = await seedProject(database, "editor");

    await expect(
      changeTokenTypeParent(database, other.context, {
        projectId: fixture.project.id,
        tokenTypeId: fixture.primitiveType.id,
        parentTypeId: fixture.semanticType.id,
      }),
    ).rejects.toBeInstanceOf(ProjectAccessDeniedError);
  });

  it("serializes concurrent hierarchy changes", async () => {
    const database = getTestDatabase();
    const fixture = await seedProject(database, "editor");

    const first = changeTokenTypeParent(database, fixture.context, {
      projectId: fixture.project.id,
      tokenTypeId: fixture.primitiveType.id,
      parentTypeId: null,
    });

    const second = changeTokenTypeParent(database, fixture.context, {
      projectId: fixture.project.id,
      tokenTypeId: fixture.semanticType.id,
      parentTypeId: fixture.primitiveType.id,
    });

    await Promise.all([first, second]);
  });
});
