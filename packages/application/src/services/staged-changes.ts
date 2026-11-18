import {
  ResourceNotFoundError,
  StagedChangesConflictError,
  StagedChangesValidationError,
} from "@repo/application/errors";
import type { AuthorizationContext } from "@repo/application/types";
import type { SaveStagedChangesRequest } from "@repo/contracts/operation";
import type { Token, TokenReference } from "@repo/contracts/type";
import { validateSaveStagedChanges } from "@repo/contracts/validation/operations/staged-changes-domain";
import { insertAuditEvent } from "@repo/db/repositories/audit-events";
import {
  deleteTokenReference,
  listTokenReferencesByProjectId,
  setTokenReference,
} from "@repo/db/repositories/references";
import { listTokenTypesByProjectId } from "@repo/db/repositories/token-types";
import { listTokensByProjectId, updateToken } from "@repo/db/repositories/tokens";
import { isDeepStrictEqual } from "node:util";
import type { PoolClient } from "pg";

export type SaveStagedChangesResult = {
  tokens: Token[];
  references: TokenReference[];
};

export async function saveStagedChanges(
  client: PoolClient,
  context: AuthorizationContext,
  request: SaveStagedChangesRequest,
): Promise<SaveStagedChangesResult & { changedTokenIds: string[] }> {
  const projectId = request.projectId.toLowerCase();
  const tokens = await listTokensByProjectId(client, projectId);
  const tokenTypes = await listTokenTypesByProjectId(client, projectId);
  const references = await listTokenReferencesByProjectId(client, projectId);

  const validation = validateSaveStagedChanges(request, tokens, tokenTypes, references);

  if (!validation.success) {
    if (validation.issues.some((issue) => issue.code === "conflict")) {
      throw new StagedChangesConflictError(validation.issues);
    }
    throw new StagedChangesValidationError(validation.issues);
  }

  for (const change of request.changes) {
    const update = change.name
      ? {
          name: change.name.after,
          ...(change.value && { value: change.value.after }),
        }
      : change.value
        ? { value: change.value.after }
        : null;

    if (update) {
      const updated = await updateToken(client, projectId, change.tokenId, update);

      if (!updated) throw new ResourceNotFoundError();
    }

    for (const reference of change.references) {
      if (
        reference.beforeTokenId?.toLowerCase() === reference.afterTokenId?.toLowerCase()
      ) {
        continue;
      }

      if (reference.afterTokenId === null) {
        const deleted = await deleteTokenReference(
          client,
          projectId,
          change.tokenId,
          reference.slot,
        );

        if (!deleted) throw new Error("Validated token reference disappeared.");
      } else {
        const saved = await setTokenReference(client, {
          projectId,
          referencingTokenId: change.tokenId,
          referencedTokenId: reference.afterTokenId,
          slot: reference.slot,
        });

        if (!saved) throw new Error("Validated referencing token disappeared.");
      }
    }
  }

  const requestedIds = new Set(
    request.changes.map((change) => change.tokenId.toLowerCase()),
  );

  const savedTokens = await listTokensByProjectId(client, projectId);

  const savedReferences = await listTokenReferencesByProjectId(client, projectId);

  const originalTokens = new Map(tokens.map((token) => [token.id.toLowerCase(), token]));

  const changedIds = new Set<string>();

  for (const token of savedTokens) {
    const tokenId = token.id.toLowerCase();

    if (
      requestedIds.has(tokenId) &&
      !isDeepStrictEqual(originalTokens.get(tokenId), token)
    ) {
      changedIds.add(tokenId);
    }
  }

  const referenceKey = (reference: TokenReference) =>
    JSON.stringify([
      reference.referencingTokenId.toLowerCase(),
      reference.slot,
      reference.referencedTokenId.toLowerCase(),
    ]);

  const originalReferenceKeys = new Set(references.map(referenceKey));

  const savedReferenceKeys = new Set(savedReferences.map(referenceKey));

  for (const [source, otherKeys] of [
    [references, savedReferenceKeys],
    [savedReferences, originalReferenceKeys],
  ] as const) {
    for (const reference of source) {
      const tokenId = reference.referencingTokenId.toLowerCase();

      if (requestedIds.has(tokenId) && !otherKeys.has(referenceKey(reference))) {
        changedIds.add(tokenId);
      }
    }
  }

  if (changedIds.size > 0) {
    await insertAuditEvent(client, {
      id: crypto.randomUUID(),
      userId: context.userId,
      projectId,
      action: "token.batch_saved",
      resourceType: "token_batch",
      resourceId: null,
      metadata: { tokenIds: [...changedIds] },
      createdAt: new Date().toISOString(),
    });
  }

  return {
    tokens: savedTokens.filter((token) => requestedIds.has(token.id.toLowerCase())),
    references: savedReferences.filter((reference) =>
      requestedIds.has(reference.referencingTokenId.toLowerCase()),
    ),
    changedTokenIds: [...changedIds],
  };
}
