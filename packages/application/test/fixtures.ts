import { insertProjectMember } from "@repo/db/repositories/memberships";
import { insertProject } from "@repo/db/repositories/projects";
import { insertTokenType } from "@repo/db/repositories/token-types";
import { insertToken } from "@repo/db/repositories/tokens";
import { insertUser } from "@repo/db/repositories/users";
import { validSeed } from "@repo/seed-data/valid-seed";
import type { Pool } from "pg";

export async function seedProject(
  database: Pool,
  role: "editor" | "publisher" | "admin" = "publisher",
) {
  const seed = structuredClone(validSeed);

  const user = {
    ...seed.users[0]!,
    id: crypto.randomUUID(),
    email: `${role}-${crypto.randomUUID()}@example.test`,
  };

  const project = {
    ...seed.projects[0]!,
    id: crypto.randomUUID(),
    slug: `${role}-${crypto.randomUUID()}`,
    name: `${role} project ${crypto.randomUUID()}`,
  };

  await insertUser(database, user);
  await insertProject(database, project);
  await insertProjectMember(database, {
    ...seed.projectMembers[0]!,
    projectId: project.id,
    userId: user.id,
    role,
  });

  const primitiveType = {
    ...seed.tokenTypes[0]!,
    id: crypto.randomUUID(),
    projectId: project.id,
  };

  const semanticType = {
    ...seed.tokenTypes[1]!,
    id: crypto.randomUUID(),
    projectId: project.id,
    parentTypeId: primitiveType.id,
  };

  await insertTokenType(database, primitiveType);
  await insertTokenType(database, semanticType);

  const referencedToken = {
    ...seed.tokens[0]!,
    id: crypto.randomUUID(),
    projectId: project.id,
    tokenTypeId: primitiveType.id,
  };

  const semanticSeedToken = seed.tokens.find(
    (token) => token.tokenTypeId === seed.tokenTypes[1]!.id,
  );
  if (!semanticSeedToken) throw new Error("Missing semantic seed token.");

  const referencingToken = {
    ...semanticSeedToken,
    id: crypto.randomUUID(),
    projectId: project.id,
    tokenTypeId: semanticType.id,
  };

  await insertToken(database, referencedToken);
  await insertToken(database, referencingToken);

  return {
    database,
    user,
    project,
    primitiveType,
    semanticType,
    referencedToken,
    referencingToken,
    context: {
      userId: user.id,
      sessionId: crypto.randomUUID(),
    },
  };
}
