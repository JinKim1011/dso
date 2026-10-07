import type { SupportedViewKind } from "@/_shared/models/tokenKinds";

export type CategoryViewModel = {
  id: string;
  category: string;
  tokenTypeIds: string[];
};

export type TokenTypeViewModel = {
  id: string;
  category: string;
  type: string;
  kind: SupportedViewKind;
  values: TokenTypeValueItem[];
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

export type TokenTypeValueItem = {
  id: string;
  name: string;
  cssVar?: string;
  status?: string;
  meta?: string;
  preview?: TokenValuePreviewData;
  category?: string;
  kind?: SupportedViewKind;
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
