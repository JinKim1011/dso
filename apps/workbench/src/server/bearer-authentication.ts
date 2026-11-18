import { InvalidApiKeyCredentialError } from "@repo/application/errors";
import { parseApiKeyCredential } from "@repo/application/security/api-key-credentials";

const BEARER_PATTERN = /^Bearer[ \t]+([^ \t]+)$/i;

export function getBearerApiKeyCredential(request: {
  headers: Pick<Headers, "get">;
}): string {
  const authorization = request.headers.get("authorization");

  if (!authorization) {
    throw new InvalidApiKeyCredentialError();
  }

  const match = BEARER_PATTERN.exec(authorization);

  if (!match || !parseApiKeyCredential(match[1]).success) {
    throw new InvalidApiKeyCredentialError();
  }

  return match[1]!;
}
