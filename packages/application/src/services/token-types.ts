import { requiredProjectRole } from "@repo/application/authorization";
import { DomainValidationError, ResourceNotFoundError } from "@repo/application/errors";
import type { AuthorizationContext } from "@repo/application/types";
import type { ChangeTokenTypeParentRequest } from "@repo/contracts/operation";
import type { TokenType } from "@repo/contracts/type";
import { validateChangeParentOperation } from "@repo/contracts/validation/operations/relationship-domain";
import { requireProjectAccess } from "@repo/db/repositories/memberships";
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
  const membership = await requireProjectAccess(database, context, request.projectId);

  requiredProjectRole(membership, request.projectId, "editor");

  const tokenTypes = await listTokenTypesByProjectId(database, request.projectId);

  const errors = validateChangeParentOperation(request, tokenTypes);

  if (errors.length > 0) {
    throw new DomainValidationError(errors);
  }

  const updated = await updateTokenTypeParent(
    database,
    request.tokenTypeId,
    request.projectId,
    request.parentTypeId,
  );

  if (!updated) {
    throw new ResourceNotFoundError();
  }

  return updated;
}
