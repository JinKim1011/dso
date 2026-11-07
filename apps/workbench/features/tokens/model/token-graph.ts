import type { Token } from "@repo/contracts/type";
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

export type TokenValue = {
  id: string;
  name: string;
  cssVar?: string;
  status?: string;
  meta?: string;
  preview?: TokenValuePreviewData;
  category?: string;
  kind?: TokenKind;
  value?: string | { light?: string; dark?: string };
};

type TokenValuePreviewData =
  | {
      kind: "typography";
      typography: {
        fontSize: string;
        fontWeight: string;
        lineHeight: string;
      };
    }
  | {
      kind: "color";
      light?: string;
      dark?: string;
    }
  | {
      kind: "spacing";
      value: string;
    };
