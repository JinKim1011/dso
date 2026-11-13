import type { Token, TokenReference } from "@repo/contracts/type";
import { insertProject } from "@repo/db/repositories/projects";
import {
  deleteTokenReference,
  listTokenReferencesByProjectId,
  setTokenReference,
} from "@repo/db/repositories/references";
import { insertTokenType } from "@repo/db/repositories/token-types";
import {
  insertToken,
  listTokensByProjectId,
  updateToken,
} from "@repo/db/repositories/tokens";
import { getTestDatabase } from "@repo/db/test/setup";
import { withTransaction } from "@repo/db/transaction";
import { validSeed } from "@repo/seed-data/valid-seed";
import { describe, expect, it } from "vitest";

async function createProjectTokens() {
  const database = getTestDatabase();
  const project = validSeed.projects[0]!;
  const otherProject = {
    ...project,
    id: crypto.randomUUID(),
    name: "Other project",
    slug: "other-project",
  };
  await insertProject(database, project);
  await insertProject(database, otherProject);

  const type = { ...validSeed.tokenTypes[0]!, parentTypeId: null };
  const otherType = { ...type, id: crypto.randomUUID(), projectId: otherProject.id };
  await insertTokenType(database, type);
  await insertTokenType(database, otherType);

  const token: Token = {
    id: crypto.randomUUID(),
    projectId: project.id,
    tokenTypeId: type.id,
    name: "source",
    cssVar: "--preserved",
    value: { kind: "single", value: "original" },
  };
  const target: Token = { ...token, id: crypto.randomUUID(), name: "target" };
  const replacement: Token = { ...token, id: crypto.randomUUID(), name: "replacement" };
  const otherToken: Token = {
    ...token,
    id: crypto.randomUUID(),
    projectId: otherProject.id,
    tokenTypeId: otherType.id,
  };
  for (const item of [token, target, replacement, otherToken]) {
    await insertToken(database, item);
  }

  return { database, project, otherProject, token, target, replacement, otherToken };
}

describe("staged token write repositories", () => {
  it("updates only supplied fields and preserves cssVar and ownership", async () => {
    const { database, project, token } = await createProjectTokens();
    const renamed = await updateToken(database, project.id, token.id, {
      name: "renamed",
    });
    expect(renamed).toEqual({ ...token, name: "renamed" });

    const value = { kind: "single", value: "changed" } as const;
    expect(await updateToken(database, project.id, token.id, { value })).toEqual({
      ...token,
      name: "renamed",
      value,
    });
    expect(
      await updateToken(database, project.id, token.id, {
        name: "final",
        value: { kind: "single", value: "final value" },
      }),
    ).toEqual({
      ...token,
      name: "final",
      value: { kind: "single", value: "final value" },
    });
  });

  it("does not update a missing token or a token in another project", async () => {
    const { database, project, otherProject, token } = await createProjectTokens();
    expect(
      await updateToken(database, otherProject.id, token.id, { name: "wrong" }),
    ).toBeNull();
    expect(
      await updateToken(database, project.id, crypto.randomUUID(), { name: "missing" }),
    ).toBeNull();
    expect(await listTokensByProjectId(database, project.id)).toContainEqual(token);
  });

  it("assigns, replaces, and clears one slot without affecting others", async () => {
    const { database, project, token, target, replacement } = await createProjectTokens();
    const light: TokenReference = {
      projectId: project.id,
      referencingTokenId: token.id,
      referencedTokenId: target.id,
      slot: "light",
    };
    const dark: TokenReference = { ...light, slot: "dark" };
    expect(await setTokenReference(database, light)).toEqual(light);
    expect(await setTokenReference(database, dark)).toEqual(dark);

    const updated = { ...light, referencedTokenId: replacement.id };
    expect(await setTokenReference(database, updated)).toEqual(updated);
    expect(await setTokenReference(database, updated)).toEqual(updated);
    expect(await listTokenReferencesByProjectId(database, project.id)).toEqual(
      expect.arrayContaining([updated, dark]),
    );
    expect(await deleteTokenReference(database, project.id, token.id, "light")).toBe(
      true,
    );
    expect(await deleteTokenReference(database, project.id, token.id, "light")).toBe(
      false,
    );
    expect(await listTokenReferencesByProjectId(database, project.id)).toEqual([dark]);
  });

  it("does not write or delete references through a different project", async () => {
    const { database, project, otherProject, token, target, otherToken } =
      await createProjectTokens();
    const reference: TokenReference = {
      projectId: project.id,
      referencingTokenId: token.id,
      referencedTokenId: target.id,
      slot: "light",
    };
    await setTokenReference(database, reference);

    expect(
      await setTokenReference(database, {
        ...reference,
        projectId: otherProject.id,
        referencedTokenId: otherToken.id,
      }),
    ).toBeNull();
    expect(
      await setTokenReference(database, {
        ...reference,
        referencingTokenId: crypto.randomUUID(),
      }),
    ).toBeNull();
    expect(await deleteTokenReference(database, otherProject.id, token.id, "light")).toBe(
      false,
    );
    await expect(
      setTokenReference(database, { ...reference, referencedTokenId: otherToken.id }),
    ).rejects.toMatchObject({ code: "23503" });
    await expect(
      setTokenReference(database, {
        ...reference,
        referencedTokenId: crypto.randomUUID(),
      }),
    ).rejects.toMatchObject({ code: "23503" });
    await expect(
      setTokenReference(database, { ...reference, referencedTokenId: token.id }),
    ).rejects.toMatchObject({ code: "23514" });
    expect(await listTokenReferencesByProjectId(database, project.id)).toEqual([
      reference,
    ]);
    expect(await listTokenReferencesByProjectId(database, otherProject.id)).toEqual([]);
  });

  it("rolls back token and reference writes together when a later write fails", async () => {
    const { database, project, token, target, replacement, otherToken } =
      await createProjectTokens();
    const reference: TokenReference = {
      projectId: project.id,
      referencingTokenId: token.id,
      referencedTokenId: target.id,
      slot: "light",
    };
    await setTokenReference(database, reference);

    await expect(
      withTransaction(database, async (client) => {
        await updateToken(client, project.id, token.id, { name: "not committed" });
        await deleteTokenReference(client, project.id, token.id, "light");
        await setTokenReference(client, {
          ...reference,
          referencedTokenId: replacement.id,
        });
        await setTokenReference(client, {
          ...reference,
          referencedTokenId: otherToken.id,
        });
      }),
    ).rejects.toMatchObject({ code: "23503" });

    expect(await listTokensByProjectId(database, project.id)).toContainEqual(token);
    expect(await listTokenReferencesByProjectId(database, project.id)).toEqual([
      reference,
    ]);
  });
});
