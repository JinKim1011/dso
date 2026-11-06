import type { TokenTypeValueItem } from "@/features/tokens/model/token-graph";

export type TokenRowViewModel = {
  id: string;
  name: string;
  cssVar?: string;
  meta?: string;
  preview?: TokenTypeValueItem["preview"];
  category: string;
  kind: TokenTypeValueItem["kind"];
  value: TokenTypeValueItem;
};

export type TokenRowUpdate = Partial<
  Pick<TokenTypeValueItem, "name" | "cssVar" | "status" | "meta" | "value">
>;
