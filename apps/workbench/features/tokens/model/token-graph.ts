import type { Token, TokenReferenceSlot } from "@repo/contracts/type";
import type { TokenCategory, TokenKind } from "@repo/contracts/validation/enum";

export type CategoryViewModel = {
  id: string;
  category: TokenCategory;
  tokenTypeIds: string[];
};

export type TokenValueViewModel = {
  id: string;
  name: string;
  cssVar?: string;
  status?: string;
  value: Token["value"];
  meta?: string;
  preview?: TokenValuePreview;
  references?: TokenValueReferences;
};

export type TokenTypeViewModel = {
  id: string;
  category: TokenCategory;
  type: string;
  kind: TokenKind;
  values: TokenValueViewModel[];
};

export type TokenGraphViewModel = {
  schemaVersion: number;
  root: {
    id: "root";
    label: "Design Tokens";
  };
  categories: CategoryViewModel[];
  tokenTypes: TokenTypeViewModel[];
};

export type TokenReferenceOption = {
  value: string; // referenced token ID
  label: string;
  resolvedValue: string;
  cssVar?: string;
};

type TokenValueReferences = Partial<Record<TokenReferenceSlot, string>>;

type TokenValuePreview =
  | {
      kind: "single";
      value: string;
    }
  | {
      kind: "modes";
      light?: string;
      dark?: string;
    }
  | {
      kind: "typography";
      typography: {
        fontSize: string;
        fontWeight: string;
        lineHeight: string;
      };
    };
