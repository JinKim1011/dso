import type {
  TokenGraphViewModel,
  TokenReferenceOption,
} from "@/features/tokens/model/token-graph";
import { TokenCategory } from "@repo/contracts/validation/enum";
import { useMemo } from "react";

type ModeCategory = Extract<TokenCategory, "color" | "shadow">;

type UseModeOptionsProps = {
  draftModel: TokenGraphViewModel;
  category: ModeCategory;
};

export function useModeOptions({
  draftModel,
  category,
}: UseModeOptionsProps): TokenReferenceOption[] {
  return useMemo(
    () =>
      draftModel.tokenTypes
        .filter((type) => type.category === category && type.kind === "primitive")
        .flatMap((type) =>
          type.values.flatMap((token) =>
            token.value.kind === "single"
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
        .sort((a, b) => a.label.localeCompare(b.label)),
    [draftModel, category],
  );
}
