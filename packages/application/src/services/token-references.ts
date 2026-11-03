import {
  DomainValidationError,
  ProjectAccessDeniedError,
} from "@repo/application/errors";
import type { AuthorizationContext } from "@repo/application/types";
import type { AddTokenReferenceRequest } from "@repo/contracts/operation";
import type { TokenReference } from "@repo/contracts/type";
import { validateTokenReference } from "@repo/contracts/validation/token-reference";
import { requireProjectAccess } from "@repo/db/repositories/memberships";
import { insertTokenReference } from "@repo/db/repositories/references";
import { listTokenTypesByProjectId } from "@repo/db/repositories/token-types";
import { listTokensByProjectId } from "@repo/db/repositories/tokens";

import type { Pool } from "pg";

export async function addTokenReference(
  database: Pool,
  context: AuthorizationContext,
  request: AddTokenReferenceRequest,
): Promise<TokenReference> {
  const membership = await requireProjectAccess(
    database,
    context.userId,
    request.projectId,
  );

  if (!membership) {
    throw new ProjectAccessDeniedError();
  }

  if (!["editor", "publisher", "admin"].includes(membership.role)) {
    throw new Error("Unreachable role configuration.");
  }

  const [tokens, tokenTypes] = await Promise.all([
    listTokensByProjectId(database, request.projectId),
    listTokenTypesByProjectId(database, request.projectId),
  ]);

  const reference: TokenReference = {
    projectId: request.projectId,
    referencingTokenId: request.referencingTokenId,
    referencedTokenId: request.referencedTokenId,
    slot: request.slot,
  };

  const issues = validateTokenReference(reference, tokens, tokenTypes, request.projectId);

  if (issues.length > 0) {
    throw new DomainValidationError(issues);
  }

  return insertTokenReference(database, reference);
}
