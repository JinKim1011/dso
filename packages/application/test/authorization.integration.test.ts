import {
  AuthenticationRequiredError,
  ProjectAccessDeniedError,
} from "@repo/application/errors";
import { seedProject } from "@repo/application/fixtures";
import { addTokenReference } from "@repo/application/services/token-references";
import { getTestDatabase } from "@repo/db/test/setup";
import { describe, expect, it } from "vitest";

describe("Authorization service integration", () => {
  it("rejects an unauthenticated context", async () => {
    const database = getTestDatabase();

    const fixture = await seedProject(database);

    await expect(
      addTokenReference(
        database,
        { userId: "", sessionId: "" },
        {
          projectId: fixture.project.id,
          referencingTokenId: fixture.referencingToken.id,
          referencedTokenId: fixture.referencedToken.id,
          slot: "light",
        },
      ),
    ).rejects.toBeInstanceOf(AuthenticationRequiredError);
  });

  it("rejects a member from another project", async () => {
    const database = getTestDatabase();

    const target = await seedProject(database);
    const other = await seedProject(database);

    await expect(
      addTokenReference(database, other.context, {
        projectId: target.project.id,
        referencingTokenId: target.referencingToken.id,
        referencedTokenId: target.referencedToken.id,
        slot: "light",
      }),
    ).rejects.toBeInstanceOf(ProjectAccessDeniedError);
  });
});
