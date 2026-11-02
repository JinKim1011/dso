import type { SeedData } from "@repo/contracts/seed";
import { validateSeedData } from "@repo/contracts/validation/seed";
import { insertComponent } from "@repo/db/repositories/components";
import { insertProjectMember } from "@repo/db/repositories/memberships";
import { insertProject } from "@repo/db/repositories/projects";
import { insertTokenReference } from "@repo/db/repositories/references";
import { insertRelease } from "@repo/db/repositories/releases";
import { insertDocumentTemplate } from "@repo/db/repositories/templates";
import { insertTokenType } from "@repo/db/repositories/token-types";
import { insertToken } from "@repo/db/repositories/tokens";
import { insertUser } from "@repo/db/repositories/users";
import { withTransaction } from "@repo/db/transaction";
import type { Pool } from "pg";

export async function seedDatabase(pool: Pool, seed: SeedData): Promise<void> {
  const validationErrors = validateSeedData(seed);

  if (validationErrors.length > 0) {
    throw new Error(`Seed validation failed: ${JSON.stringify(validationErrors)}`);
  }

  await withTransaction(pool, async (client) => {
    for (const user of seed.users) {
      await insertUser(client, user);
    }

    for (const project of seed.projects) {
      await insertProject(client, project);
    }

    for (const projectMember of seed.projectMembers) {
      await insertProjectMember(client, projectMember);
    }

    for (const tokenType of seed.tokenTypes) {
      await insertTokenType(client, tokenType);
    }

    for (const token of seed.tokens) {
      await insertToken(client, token);
    }

    for (const tokenReference of seed.tokenReferences) {
      await insertTokenReference(client, tokenReference);
    }

    for (const component of seed.components) {
      await insertComponent(client, component);
    }

    for (const documentTemplate of seed.documentTemplates) {
      await insertDocumentTemplate(client, documentTemplate);
    }

    for (const release of seed.releases) {
      await insertRelease(client, release);
    }
  });
}
