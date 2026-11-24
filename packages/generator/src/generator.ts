import type { PublishedReleaseResponse } from "@repo/contracts/operation";
import {
  TokenGenerationError,
  TokenGraphValidationError,
  TokenResolutionError,
  TokensCssRenderError,
  TokensJsonRenderError,
} from "@repo/generator/errors";
import { resolveTokenReferencesFromIndex } from "@repo/generator/reference-resolution";
import { buildTokenGraphIndex } from "@repo/generator/token-graph";
import { renderTokensCss } from "@repo/generator/tokens-css";
import { renderTokensJson } from "@repo/generator/tokens-json";

export type GeneratedTokenArtifacts = Readonly<{
  tokensJson: string;
  tokensCss: string;
}>;

function isGeneratorError(error: unknown): boolean {
  return (
    error instanceof TokenGenerationError ||
    error instanceof TokenGraphValidationError ||
    error instanceof TokenResolutionError ||
    error instanceof TokensJsonRenderError ||
    error instanceof TokensCssRenderError
  );
}

export function generateTokenArtifacts(
  release: PublishedReleaseResponse,
): GeneratedTokenArtifacts {
  try {
    const index = buildTokenGraphIndex(release);
    const tokens = resolveTokenReferencesFromIndex(index);
    const tokensJson = renderTokensJson(release, tokens);
    const tokensCss = renderTokensCss(tokens);

    return { tokensJson, tokensCss };
  } catch (error) {
    if (isGeneratorError(error)) throw error;

    throw new TokenGenerationError("Token artifacts could not be generated.", error);
  }
}
