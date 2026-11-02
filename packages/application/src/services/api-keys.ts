import { requiredProjectRole } from "@repo/application/authorization";
import {
  generateKeyIdentifier,
  generateOpaqueApiKeySecret,
  hashApiKey,
} from "@repo/application/security/api-keys";
import { AuthorizationContext } from "@repo/application/types";
import type {
  CreateApiKeyRequest,
  CreateApiKeyResponse,
} from "@repo/contracts/operation";
import { insertApiKey } from "@repo/db/repositories/api-keys";
import { requireProjectAccess } from "@repo/db/repositories/memberships";
import { Pool } from "pg";

export async function createApiKey(
  database: Pool,
  context: AuthorizationContext,
  request: CreateApiKeyRequest,
): Promise<CreateApiKeyResponse> {
  const membership = await requireProjectAccess(database, context, request.projectId);

  requiredProjectRole(membership, request.projectId, "admin");

  const secret = generateOpaqueApiKeySecret();
  const keyIdentifier = generateKeyIdentifier();
  const keyHash = hashApiKey(secret);

  const apiKey = await insertApiKey(database, {
    id: crypto.randomUUID(),
    projectId: request.projectId,
    keyIdentifier,
    keyHash,
    scope: request.scope,
    createdAt: new Date().toISOString(),
    expiresAt: request.expiresAt,
    revokedAt: null,
  });

  return {
    apiKey: {
      id: apiKey.id,
      projectId: apiKey.projectId,
      keyIdentifier: apiKey.keyIdentifier,
      scope: apiKey.scope,
      expiresAt: apiKey.expiresAt,
    },
    secret,
  };
}
