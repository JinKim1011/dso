import { requiredProjectRole } from "@repo/application/authorization";
import { ResourceNotFoundError } from "@repo/application/errors";
import {
  generateKeyIdentifier,
  generateOpaqueApiKeySecret,
  hashApiKey,
} from "@repo/application/security/api-keys";
import { AuthorizationContext } from "@repo/application/types";
import type {
  CreateApiKeyRequest,
  CreateApiKeyResponse,
  RevokeApiKeyRequest,
} from "@repo/contracts/operation";
import { ApiKey } from "@repo/contracts/type";
import {
  insertApiKey,
  revokeApiKey as revokeStoredApiKey,
} from "@repo/db/repositories/api-keys";
import { insertAuditEvent } from "@repo/db/repositories/audit-events";
import { requireProjectAccess } from "@repo/db/repositories/memberships";
import { withTransaction } from "@repo/db/transaction";
import { Pool } from "pg";

export async function createApiKey(
  database: Pool,
  context: AuthorizationContext,
  request: CreateApiKeyRequest,
): Promise<CreateApiKeyResponse> {
  const membership = await requireProjectAccess(
    database,
    context.userId,
    request.projectId,
  );

  requiredProjectRole(membership, request.projectId, "admin");

  return withTransaction(database, async (client) => {
    const secret = generateOpaqueApiKeySecret();
    const keyIdentifier = generateKeyIdentifier();
    const keyHash = hashApiKey(secret);

    const apiKey = await insertApiKey(client, {
      id: crypto.randomUUID(),
      projectId: request.projectId,
      keyIdentifier,
      keyHash,
      scope: request.scope,
      createdAt: new Date().toISOString(),
      expiresAt: request.expiresAt,
      revokedAt: null,
    });

    await insertAuditEvent(client, {
      id: crypto.randomUUID(),
      userId: context.userId,
      projectId: request.projectId,
      action: "api_key.created",
      resourceType: "api_key",
      resourceId: apiKey.id,
      createdAt: new Date().toISOString(),
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
  });
}

export async function revokeApiKey(
  database: Pool,
  context: AuthorizationContext,
  request: RevokeApiKeyRequest,
): Promise<ApiKey> {
  const membership = await requireProjectAccess(
    database,
    context.userId,
    request.projectId,
  );

  requiredProjectRole(membership, request.projectId, "admin");

  return withTransaction(database, async (client) => {
    const revoked = await revokeStoredApiKey(
      client,
      request.apiKeyId,
      request.projectId,
      new Date().toISOString(),
    );

    if (!revoked) {
      throw new ResourceNotFoundError();
    }

    await insertAuditEvent(client, {
      id: crypto.randomUUID(),
      userId: context.userId,
      projectId: request.projectId,
      action: "api_key.revoked",
      resourceType: "api_key",
      resourceId: revoked.id,
      createdAt: new Date().toISOString(),
    });

    return revoked;
  });
}
