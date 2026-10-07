import { toId } from "@/tokens/lib/manifest/guards";
import type {
  ManifestSemanticRecord,
  ManifestTokenRecord,
  NormalizedManifestEntry,
} from "@/tokens/lib/manifest/types";
import type { Token, TokenReference, TokenType } from "@contracts/type";

export type ManifestDomainData = {
  projectId: string;
  releaseId: string;
  tokenTypes: TokenType[];
  tokens: Token[];
  references: TokenReference[];
};

export function manifestToDomain(
  entries: NormalizedManifestEntry[],
  context: { projectId: string; releaseId: string },
): ManifestDomainData {
  const tokenTypes: TokenType[] = [];
  const tokens: Token[] = [];
  const tokenTypeIds = new Set<string>();

  for (const entry of entries) {
    if (entry.kind !== "primitive" && entry.kind !== "semantic") {
      throw new Error(`Unsupported token kind: ${entry.kind}`);
    }

    const tokenTypeId = toId(
      "token-type",
      `${context.projectId}-${entry.category}-${entry.type}-${entry.kind}`,
    );

    if (tokenTypeIds.has(tokenTypeId)) {
      throw new Error(
        `Duplicate token type: ${entry.category}/${entry.type}/${entry.kind}`,
      );
    }

    tokenTypeIds.add(tokenTypeId);
    tokenTypes.push({
      id: tokenTypeId,
      projectId: context.projectId,
      category: entry.category,
      name: entry.type,
      kind: entry.kind,
      parentTypeId: null,
    });

    const tokenNames = new Set<string>();
    for (const token of getTokenRecords(entry)) {
      if (tokenNames.has(token.name)) {
        throw new Error(`Duplicate token: ${entry.category}/${entry.type}/${token.name}`);
      }

      tokenNames.add(token.name);
      tokens.push({
        id: toId("token", `${tokenTypeId}-${token.name}`),
        projectId: context.projectId,
        tokenTypeId,
        name: token.name,
        cssVar: token.cssVar ?? null,
        value: token.value,
      });
    }
  }

  return {
    projectId: context.projectId,
    releaseId: context.releaseId,
    tokenTypes,
    tokens,
    references: [],
  };
}

type DomainTokenRecord = {
  name: string;
  cssVar?: string;
  value: Token["value"];
};

function getTokenRecords(entry: NormalizedManifestEntry): DomainTokenRecord[] {
  if (entry.tokens?.length) {
    return entry.tokens.map((token) => ({
      name: token.name,
      cssVar: token.cssVar,
      value: toTokenValue(token),
    }));
  }

  if (entry.semanticMap?.length) {
    return entry.semanticMap.map((semantic) => ({
      name: semantic.name,
      value: toTypographyValue(semantic),
    }));
  }

  return entry.value.map((name) => ({
    name,
    value: { kind: "unresolved" },
  }));
}

function toTokenValue(token: ManifestTokenRecord): Token["value"] {
  if (token.values) {
    return {
      kind: "modes",
      light: token.values.light,
      dark: token.values.dark,
    };
  }

  if (token.value) {
    return {
      kind: "scalar",
      value: token.value,
    };
  }

  return { kind: "unresolved" };
}

function toTypographyValue(semantic: ManifestSemanticRecord): Token["value"] {
  return {
    kind: "typography",
    fontSize: semantic.fontSize,
    fontWeight: semantic.fontWeight,
    lineHeight: semantic.lineHeight,
  };
}
