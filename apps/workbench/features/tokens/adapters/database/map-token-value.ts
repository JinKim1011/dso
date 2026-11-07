import type { TokenValueViewModel } from "@/features/tokens/model/token-graph";
import type { Token } from "@repo/contracts/type";

type MappedTokenValue = Pick<TokenValueViewModel, "value" | "meta" | "preview">;

export function mapTokenValue(token: Token, category: string): MappedTokenValue {
  switch (token.value.kind) {
    case "single":
      return {
        value: token.value,
        meta: token.value.value,
        preview:
          category === "color"
            ? {
                kind: "single",
                value: token.value.value,
              }
            : undefined,
      };

    case "modes":
      return {
        value: token.value,
        meta: `light:${token.value.light ?? "-"} dark:${token.value.dark ?? "-"}`,
        preview: {
          kind: "modes",
          light: token.value.light,
          dark: token.value.dark,
        },
      };

    case "typography":
      return {
        value: token.value,
        meta: [token.value.fontSize, token.value.fontWeight, token.value.lineHeight].join(
          " / ",
        ),
        preview: {
          kind: "typography",
          typography: {
            fontSize: token.value.fontSize,
            fontWeight: token.value.fontWeight,
            lineHeight: token.value.lineHeight,
          },
        },
      };

    case "unresolved":
      return {
        value: token.value,
        meta: "unresolved",
      };
  }
}
