import type {
  CategoryViewModel,
  SupportedKind,
  TokenTypeViewModel,
} from "@/tokens/lib/manifest/types";

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
  kind?: SupportedKind;
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
