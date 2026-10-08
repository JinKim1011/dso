export type Project = {
  id: string;
  name: string;
};

export type Release = {
  id: string;
  projectId: string;
  version: string;
  status: "draft" | "published";
};

export type TokenType = {
  id: string;
  projectId: string;
  category: string;
  name: string;
  kind: "primitive" | "semantic";
  parentTypeId: string | null;
};

export type Token = {
  id: string;
  projectId: string;
  tokenTypeId: string;
  name: string;
  cssVar: string | null;
  value: TokenValue;
};

export type TokenValue =
  | { kind: "scalar"; value: string }
  | { kind: "modes"; light?: string; dark?: string }
  | { kind: "typography"; fontSize: string; fontWeight: string; lineHeight: string }
  | { kind: "unresolved" };

export type TokenReference = {
  referencingTokenId: string;
  referencedTokenId: string;
};
