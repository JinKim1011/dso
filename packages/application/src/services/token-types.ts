import {
  requiredProjectRole,
  requireProjectAccess,
} from "@repo/application/authorization";
import {
  DomainValidationError,
  ProjectAccessDeniedError,
  ResourceNotFoundError,
} from "@repo/application/errors";
import { withProjectTransaction } from "@repo/application/services/project-transaction";
import type { AuthorizationContext } from "@repo/application/types";
import type { ChangeTokenTypeParentRequest } from "@repo/contracts/operation";
import type { TokenType } from "@repo/contracts/type";
import { validateChangeParentOperation } from "@repo/contracts/validation/operations/relationship-domain";
import {
  listTokenTypesByProjectId,
  updateTokenTypeParent,
} from "@repo/db/repositories/token-types";
import type { Pool } from "pg";

export async function changeTokenTypeParent(
  database: Pool,
  context: AuthorizationContext,
  request: ChangeTokenTypeParentRequest,
): Promise<TokenType> {
  const membership = await requireProjectAccess(
    database,
    context.userId,
    request.projectId,
  );

  if (!membership) {
    throw new ProjectAccessDeniedError();
  }

  requiredProjectRole(membership, request.projectId, "editor");

  return withProjectTransaction(database, request.projectId, async (client) => {
    const tokenTypes = await listTokenTypesByProjectId(client, request.projectId);

    const errors = validateChangeParentOperation(request, tokenTypes);

    if (errors.length > 0) {
      throw new DomainValidationError(errors);
    }

    const updated = await updateTokenTypeParent(
      client,
      request.tokenTypeId,
      request.projectId,
      request.parentTypeId,
    );

    if (!updated) {
      throw new ResourceNotFoundError();
    }

    return updated;
  });
}
