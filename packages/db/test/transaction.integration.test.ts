import { validSeed } from "@repo/contracts/fixtures/valid-seed";
import { findProjectById, insertProject } from "@repo/db/repositories/projects";
import { withTransaction } from "@repo/db/transaction";
import { describe, expect, it } from "vitest";
import { getTestDatabase } from "./setup";

describe("database transaction rollback", () => {
  it("rolls back all writes when the transaction fails", async () => {
    const database = getTestDatabase();

    const project = {
      ...validSeed.projects[0]!,
      id: crypto.randomUUID(),
      slug: "rolled-back-project",
      name: "Rolled Back Project",
    };

    await expect(
      withTransaction(database, async (client) => {
        await insertProject(client, project);
        throw new Error("forced failure");
      }),
    ).rejects.toThrow("forced failure");

    await expect(findProjectById(database, project.id)).resolves.toBeNull();
  });

  it("commits writes when the transaction succeeds", async () => {
    const database = getTestDatabase();

    const project = {
      ...validSeed.projects[0]!,
      id: crypto.randomUUID(),
      slug: "committed-project",
      name: "Committed Project",
    };

    await withTransaction(database, async (client) => {
      await insertProject(client, project);
    });

    await expect(findProjectById(database, project.id)).resolves.toMatchObject(project);
  });
});
