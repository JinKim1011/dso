import {
  requiredProjectRole,
  requireProjectAccess,
} from "@repo/application/authorization";
import { DomainValidationError } from "@repo/application/errors";
import { withProjectTransaction } from "@repo/application/services/project-transaction";
import type { AuthorizationContext } from "@repo/application/types";
import type { AddTokenReferenceRequest } from "@repo/contracts/operation";
import type { TokenReference } from "@repo/contracts/type";
import { validateTokenReference } from "@repo/contracts/validation/token-reference";
import { insertTokenReference } from "@repo/db/repositories/references";
import { listTokenTypesByProjectId } from "@repo/db/repositories/token-types";
import { listTokensByProjectId } from "@repo/db/repositories/tokens";

import type { Pool } from "pg";

export async function addTokenReference(
  database: Pool,
  context: AuthorizationContext,
  request: AddTokenReferenceRequest,
): Promise<TokenReference> {
  const projectId = request.projectId.toLowerCase();
  const membership = await requireProjectAccess(database, context.userId, projectId);
  requiredProjectRole(membership, projectId, "editor");

  return withProjectTransaction(database, projectId, async (client) => {
    const tokens = await listTokensByProjectId(client, projectId);
    const tokenTypes = await listTokenTypesByProjectId(client, projectId);

    const reference: TokenReference = {
      projectId,
      referencingTokenId: request.referencingTokenId.toLowerCase(),
      referencedTokenId: request.referencedTokenId.toLowerCase(),
      slot: request.slot,
    };

    const issues = validateTokenReference(reference, tokens, tokenTypes, projectId);

    if (issues.length > 0) {
      throw new DomainValidationError(issues);
    }

    return insertTokenReference(client, reference);
  });
}
