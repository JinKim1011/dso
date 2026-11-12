import type { TokenValueViewModel } from "@/features/tokens/model/token-graph";
import type { TokenReferenceSlot, TokenValue } from "@repo/contracts/type";

export type ReferenceChange = {
  slot: TokenReferenceSlot;
  beforeTokenId: string | null;
  afterTokenId: string | null;
};

export type StagedTokenChange = {
  tokenId: string;

  name?: {
    before: string;
    after: string;
  };

  value?: {
    before: TokenValue;
    after: TokenValue;
  };

  references: ReferenceChange[];
};

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
