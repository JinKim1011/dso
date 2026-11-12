import type { TokenValueViewModel } from "@/features/tokens/model/token-graph";
import type { StagedTokenChange } from "@repo/contracts/operation";

export type ChangedRow = {
  rowId: string;
  nameBefore: string;
  nameAfter: string;
  category: string;
  kind: string;
  tokenType: string;
  before: TokenValueViewModel;
  after: TokenValueViewModel;
  change: StagedTokenChange;
};
