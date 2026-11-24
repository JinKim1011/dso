import type { TokenReferenceSlot } from "@repo/contracts/type";

export type TokenGraphErrorCode =
  | "duplicate-token-type"
  | "duplicate-token"
  | "wrong-project"
  | "missing-token-type"
  | "missing-referencing-token"
  | "missing-referenced-token"
  | "duplicate-reference-slot"
  | "self-reference"
  | "unsupported-reference-slot"
  | "primitive-reference-source"
  | "incompatible-reference-target";

export type TokenResolutionErrorCode =
  | "unresolved-token"
  | "invalid-token-category"
  | "invalid-token-value"
  | "missing-reference-target"
  | "missing-reference-css-var"
  | "semantic-reference-chain";

export type TokensCssRenderErrorCode =
  "invalid-css-var" | "invalid-class-name" | "unsafe-css-value" | "missing-css-var";

export class TokenGraphValidationError extends Error {
  readonly code: TokenGraphErrorCode;
  readonly tokenId?: string;
  readonly tokenTypeId?: string;
  readonly slot?: TokenReferenceSlot;
  readonly targetTokenId?: string;

  constructor(
    code: TokenGraphErrorCode,
    message: string,
    details: {
      tokenId?: string;
      tokenTypeId?: string;
      slot?: TokenReferenceSlot;
      targetTokenId?: string;
    } = {},
  ) {
    super(message);
    this.name = "TokenGraphValidationError";
    this.code = code;
    this.tokenId = details.tokenId;
    this.tokenTypeId = details.tokenTypeId;
    this.slot = details.slot;
    this.targetTokenId = details.targetTokenId;
  }
}

export class TokenResolutionError extends Error {
  readonly code: TokenResolutionErrorCode;
  readonly tokenId: string;
  readonly slot?: TokenReferenceSlot;
  readonly targetTokenId?: string;

  constructor(
    code: TokenResolutionErrorCode,
    message: string,
    details: {
      tokenId: string;
      slot?: TokenReferenceSlot;
      targetTokenId?: string;
    },
  ) {
    super(message);
    this.name = "TokenResolutionError";
    this.code = code;
    this.tokenId = details.tokenId;
    this.slot = details.slot;
    this.targetTokenId = details.targetTokenId;
  }
}

export class TokensJsonRenderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TokensJsonRenderError";
  }
}

export class TokensCssRenderError extends Error {
  readonly code: TokensCssRenderErrorCode;
  readonly tokenId: string;

  constructor(code: TokensCssRenderErrorCode, message: string, tokenId: string) {
    super(message);
    this.name = "TokensCssRenderError";
    this.code = code;
    this.tokenId = tokenId;
  }
}
