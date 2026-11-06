import type {
  TokenGraphViewModel,
  TokenValue,
} from "@/features/tokens/model/token-graph";

export type TokenRowViewModel = {
  id: string;
  name: string;
  cssVar?: string;
  meta?: string;
  preview?: TokenValue["preview"];
  category: string;
  kind: TokenGraphViewModel["tokenTypes"][number]["kind"];
  value: TokenValue;
};

export type TokenRowUpdate = Partial<
  Pick<TokenValue, "name" | "cssVar" | "status" | "meta" | "value">
>;
