import { seedProject } from "@repo/application/fixtures";
import { ProjectAccessDeniedError } from "@repo/application/errors";
import { insertProjectMember } from "@repo/db/repositories/memberships";
import { closeDatabase, resetDatabase, setupDatabase } from "@repo/db/test/database";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { loadWorkbenchProject } from "./load-workbench-project";
import { listAccessibleProjects } from "./list-accessible-projects";

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

  it("lists only projects the authenticated user belongs to", async () => {
    const member = await seedProject(database, "editor");
    const shared = await seedProject(database, "publisher");
    const privateProject = await seedProject(database, "admin");
    await insertProjectMember(database, {
      projectId: shared.project.id,
      userId: member.user.id,
      role: "editor",
      createdAt: new Date().toISOString(),
    });

    const projects = await listAccessibleProjects(database, member.context);
    expect(projects).toHaveLength(2);
    expect(projects).toEqual(expect.arrayContaining([member.project, shared.project]));
    expect(projects.map((project) => project.id)).not.toContain(privateProject.project.id);
    expect(await listAccessibleProjects(database, {
      userId: crypto.randomUUID(),
      sessionId: crypto.randomUUID(),
    })).toEqual([]);
  });
});
