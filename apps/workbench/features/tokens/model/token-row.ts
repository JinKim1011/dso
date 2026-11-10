import type {
  TokenGraphViewModel,
  TokenValueViewModel,
} from "@/features/tokens/model/token-graph";
import { TokenCategory } from "@repo/contracts/validation/enum";

export type TokenRowViewModel = {
  id: string;
  name: string;
  cssVar?: string;
  meta?: string;
  preview?: TokenValueViewModel["preview"];
  category: TokenCategory;
  kind: TokenGraphViewModel["tokenTypes"][number]["kind"];
  value: TokenValueViewModel;
};

export type TokenRowUpdate = Partial<
  Pick<TokenValueViewModel, "name" | "cssVar" | "meta" | "value">
>;
