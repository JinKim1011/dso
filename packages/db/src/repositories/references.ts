import type { TokenReference, TokenReferenceSlot } from "@repo/contracts/type";

type TokenReferenceRow = {
  referencing_token_id: string;
  referenced_token_id: string;
  project_id: string;
  slot: TokenReferenceSlot;
};

export function mapTokenReferenceRow(row: TokenReferenceRow): TokenReference {
  return {
    referencingTokenId: row.referencing_token_id,
    referencedTokenId: row.referenced_token_id,
    projectId: row.project_id,
    slot: row.slot,
  };
}
