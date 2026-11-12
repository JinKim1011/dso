import type { TokenValueViewModel } from "@/features/tokens/model/token-graph";
import type { ReferenceChange, StagedTokenChange } from "@repo/contracts/operation";
import type { TokenValue } from "@repo/contracts/type";
import { tokenReferenceSlots } from "@repo/contracts/validation/token-reference-slots";

function areTokenValuesEqual(before: TokenValue, after: TokenValue): boolean {
  if (before.kind !== after.kind) {
    return false;
  }

  switch (before.kind) {
    case "single":
      return after.kind === "single" && before.value === after.value;

    case "modes":
    case "typography":
    case "unresolved":
      return true;
  }
}

export function diffReferences(
  before: TokenValueViewModel,
  after: TokenValueViewModel,
): ReferenceChange[] {
  const changes: ReferenceChange[] = [];

  for (const slot of tokenReferenceSlots) {
    const beforeTokenId = before.references?.[slot] ?? null;
    const afterTokenId = after.references?.[slot] ?? null;

    if (beforeTokenId === afterTokenId) continue;

    changes.push({ slot, beforeTokenId, afterTokenId });
  }

  return changes;
}

export function buildStagedTokenChange(
  before: TokenValueViewModel,
  after: TokenValueViewModel,
): StagedTokenChange | null {
  if (before.id !== after.id) {
    throw new Error(`Cannot compare different tokens: "${before.id}" and "${after.id}".`);
  }

  const references = diffReferences(before, after);

  const nameChanged = before.name !== after.name;

  const valueChanged = !areTokenValuesEqual(before.value, after.value);

  if (!nameChanged && !valueChanged && references.length === 0) {
    return null;
  }

  const change: StagedTokenChange = {
    tokenId: before.id,
    references,
  };

  if (nameChanged) {
    change.name = { before: before.name, after: after.name };
  }

  if (valueChanged) {
    change.value = { before: before.value, after: after.value };
  }

  return change;
}
