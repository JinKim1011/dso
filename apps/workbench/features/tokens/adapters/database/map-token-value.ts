import type { TokenReferenceLookup } from "@/features/tokens/adapters/database/create-token-reference-lookup";
import {
  resolveModeToken,
  resolveTypographyToken,
} from "@/features/tokens/adapters/database/resolve-token-reference";
import type { TokenValueViewModel } from "@/features/tokens/model/token-graph";
import type { Token, TokenType } from "@repo/contracts/type";

type MappedTokenValue = Pick<
  TokenValueViewModel,
  "value" | "meta" | "preview" | "references"
>;

export function mapTokenValue(
  token: Token,
  tokenType: TokenType,
  referenceLookup: TokenReferenceLookup,
): MappedTokenValue {
  const category = tokenType.category;

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

    case "modes": {
      const { light, dark } = token.value;

      const previewValues =
        category === "color"
          ? resolveModeToken(token, tokenType, referenceLookup)
          : { light, dark };

      const lightReference = referenceLookup.find(token.id, "light");
      const darkReference = referenceLookup.find(token.id, "dark");
      const references = {
        ...(lightReference.kind === "found" ? { light: lightReference.token.id } : {}),
        ...(darkReference.kind === "found" ? { dark: darkReference.token.id } : {}),
      };

      return {
        value: token.value,
        ...(Object.keys(references).length ? { references } : {}),
        meta: `light:${light ?? "-"} dark:${dark ?? "-"}`,
        preview: {
          kind: "modes",
          ...previewValues,
        },
      };
    }

    case "typography": {
      const { fontSize, fontWeight, lineHeight } = token.value;

      const previewValues =
        category === "typography"
          ? resolveTypographyToken(token, tokenType, referenceLookup)
          : { fontSize, fontWeight, lineHeight };

      return {
        value: token.value,
        meta: [fontSize, fontWeight, lineHeight].join(" / "),
        preview: {
          kind: "typography",
          typography: previewValues,
        },
      };
    }

    case "unresolved":
      return {
        value: token.value,
        meta: "unresolved",
      };
  }
}
