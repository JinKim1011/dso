type Project = {
  id: string;
  name: string;
};

type Release = {
  id: string;
  projectId: string;
  version: string;
  status: "draft" | "published";
};

type TokenType = {
  id: string;
  projectId: string;
  category: string;
  name: string;
  kind: "primitive" | "semantic";
  parentTypeId: string | null;
};

type Token = {
  id: string;
  projectId: string;
  tokenTypeId: string;
  name: string;
  cssVar: string | null;
  value: TokenValue;
};

type TokenValue =
  | { kind: "scalar"; value: string }
  | { kind: "modes"; light?: string; dark?: string }
  | { kind: "typography"; fontSize: string; fontWeight: string; lineHeight: string };

type TokenReference = {
  referencingTokenId: string;
  referencedTokenId: string;
};
