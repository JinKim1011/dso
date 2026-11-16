import { seedProject } from "@repo/application/fixtures";
import { ProjectAccessDeniedError } from "@repo/application/errors";
import { closeDatabase, resetDatabase, setupDatabase } from "@repo/db/test/database";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { loadWorkbenchProject } from "./load-workbench-project";

let database: Awaited<ReturnType<typeof setupDatabase>>;

describe.skipIf(!process.env.TEST_DATABASE_URL)("workbench project authorization", () => {
  beforeAll(async () => { database = await setupDatabase(); });
  beforeEach(async () => { await resetDatabase(database); });
  afterAll(async () => { await closeDatabase(); });

  it("allows a member to read their project and denies a different project's member", async () => {
    const member = await seedProject(database, "editor");
    const other = await seedProject(database, "publisher");
    const result = await loadWorkbenchProject(database, member.context, member.project.id);
    expect(result.project.id).toBe(member.project.id);
    expect(result.tokens).toContainEqual(member.referencedToken);
    await expect(
      loadWorkbenchProject(database, other.context, member.project.id),
    ).rejects.toBeInstanceOf(ProjectAccessDeniedError);
  });
});
