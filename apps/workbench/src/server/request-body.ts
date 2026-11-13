import { CONTRACT_LIMITS } from "@repo/contracts/validation/limit";

export class RequestBodyError extends Error {
  constructor(
    readonly code: "invalid-body" | "body-too-large",
    message: string,
  ) {
    super(message);
  }
}

export async function readJsonBody(request: Request): Promise<unknown> {
  const contentLength = request.headers.get("content-length");
  if (contentLength !== null) {
    if (!/^\d+$/.test(contentLength)) {
      throw new RequestBodyError("invalid-body", "Invalid Content-Length.");
    }
    if (Number(contentLength) > CONTRACT_LIMITS.requestBodyBytes) {
      throw new RequestBodyError("body-too-large", "Request body is too large.");
    }
  }

  if (!request.body) {
    throw new RequestBodyError("invalid-body", "A JSON request body is required.");
  }

  const reader = request.body.getReader();
  const bytes = new Uint8Array(CONTRACT_LIMITS.requestBodyBytes);
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value.byteLength > CONTRACT_LIMITS.requestBodyBytes - size) {
        await reader.cancel();
        throw new RequestBodyError("body-too-large", "Request body is too large.");
      }
      bytes.set(value, size);
      size += value.byteLength;
    }
  } finally {
    reader.releaseLock();
  }

  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes.subarray(0, size));
  } catch (error) {
    if (!(error instanceof TypeError)) throw error;
    throw new RequestBodyError("invalid-body", "Request body must be valid UTF-8.");
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    throw new RequestBodyError("invalid-body", "Request body must be valid JSON.");
  }
}
