import {
  requiredProjectRole,
  requireProjectAccess,
} from "@repo/application/authorization";
import {
  ResourceNotFoundError,
  StagedChangesConflictError,
  StagedChangesValidationError,
} from "@repo/application/errors";
import { withProjectTransaction } from "@repo/application/services/project-transaction";
import type { AuthorizationContext } from "@repo/application/types";
import type { SaveStagedChangesRequest } from "@repo/contracts/operation";
import type { Token, TokenReference } from "@repo/contracts/type";
import { validateSaveStagedChanges } from "@repo/contracts/validation/operations/staged-changes-domain";
import {
  deleteTokenReference,
  listTokenReferencesByProjectId,
  setTokenReference,
} from "@repo/db/repositories/references";
import { listTokenTypesByProjectId } from "@repo/db/repositories/token-types";
import { listTokensByProjectId, updateToken } from "@repo/db/repositories/tokens";
import type { Pool } from "pg";

export type SaveStagedChangesResult = {
  tokens: Token[];
  references: TokenReference[];
};

export async function saveStagedChanges(
  database: Pool,
  context: AuthorizationContext,
  request: SaveStagedChangesRequest,
): Promise<SaveStagedChangesResult> {
  const projectId = request.projectId.toLowerCase();
  const membership = await requireProjectAccess(database, context.userId, projectId);
  requiredProjectRole(membership, projectId, "editor");

  return withProjectTransaction(database, projectId, async (client) => {
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

    const changedIds = new Set(
      request.changes.map((change) => change.tokenId.toLowerCase()),
    );
    const savedTokens = await listTokensByProjectId(client, projectId);
    const savedReferences = await listTokenReferencesByProjectId(client, projectId);
    return {
      tokens: savedTokens.filter((token) => changedIds.has(token.id.toLowerCase())),
      references: savedReferences.filter((reference) =>
        changedIds.has(reference.referencingTokenId.toLowerCase()),
      ),
    };
  });
}
