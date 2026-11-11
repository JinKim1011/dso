import type { ReferenceChange } from "@/features/tokens/model/staged/staged-change";
import type { TokenGraphViewModel } from "@/features/tokens/model/token-graph";
import { findRowById } from "@/features/tokens/state/staged-graph-model";
import { Text } from "@repo/ui";

type StagedRowDetailReferencesProps = {
  side: "before" | "after";
  references: ReferenceChange[];
  model: TokenGraphViewModel;
};

function formatReference(tokenId: string | null, model: TokenGraphViewModel): string {
  if (tokenId === null) {
    return "No reference";
  }

  const target = findRowById(model, tokenId);

  if (!target) {
    return "Missing token";
  }

  return `${target.name}`;
}

export function StagedRowDetailReferences({
  side,
  references,
  model,
}: StagedRowDetailReferencesProps) {
  if (references.length === 0) {
    return null;
  }

  const isBefore = side === "before";

  return (
    <div className="gap-micro flex w-full flex-col">
      {references.map((reference) => {
        const tokenId = isBefore ? reference.beforeTokenId : reference.afterTokenId;

        return (
          <div
            key={reference.slot}
            className={[
              "px-miniPlus py-microPlus gap-mini grid grid-cols-3",
              isBefore ? "bg-surface-warn" : "bg-surface-success",
            ].join(" ")}
          >
            <Text
              variant="meta-xs"
              className={[
                "col-span-1",
                isBefore ? "text-content-warn" : "text-content-success",
              ].join(" ")}
            >
              {reference.slot} reference
            </Text>

            <Text
              variant="meta-xs"
              className={[
                "col-span-2 wrap-break-word",
                isBefore ? "text-content-warn" : "text-content-success",
              ].join(" ")}
            >
              {formatReference(tokenId, model)}
            </Text>
          </div>
        );
      })}
    </div>
  );
}
