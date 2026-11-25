import type {
  TokenGraphViewModel,
  TokenReferenceOption,
} from "@/features/tokens/model/token-graph";
import type { SingleReferenceCategory } from "@/features/tokens/model/single-reference";
import { containsCssVariable } from "@repo/contracts/validation/token-value";
import { useMemo } from "react";

export function buildSingleReferenceOptions(
  draftModel: TokenGraphViewModel,
  category: SingleReferenceCategory,
): TokenReferenceOption[] {
  return draftModel.tokenTypes
    .filter((type) => type.category === category && type.kind === "primitive")
    .flatMap((type) =>
      type.values.flatMap((token) =>
        token.value.kind === "single" && !containsCssVariable(token.value.value)
          ? [
              {
                value: token.id,
                label: token.name,
                resolvedValue: token.value.value,
                cssVar: token.cssVar,
              },
            ]
          : [],
      ),
    )
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function useSingleReferenceOptions(
  draftModel: TokenGraphViewModel,
  category: SingleReferenceCategory,
): TokenReferenceOption[] {
  return useMemo(
    () => buildSingleReferenceOptions(draftModel, category),
    [draftModel, category],
  );
}
