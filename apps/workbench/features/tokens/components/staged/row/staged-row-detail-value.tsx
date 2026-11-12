import type {
  TokenGraphViewModel,
  TokenValueViewModel,
} from "@/features/tokens/model/token-graph";
import { findRowById } from "@/features/tokens/state/staged-graph-model";
import type { TokenReferenceSlot } from "@repo/contracts/type";
import { Text } from "@repo/ui";

type valueRow = {
  label: string;
  value: string;
  changed?: boolean;
};

type StagedRowDetailValueProps = {
  type: "beforeValue" | "afterValue" | "beforeName" | "afterName";
  beforeName?: string;
  afterName?: string;
  before?: TokenValueViewModel;
  after?: TokenValueViewModel;
  baseModel?: TokenGraphViewModel;
  draftModel?: TokenGraphViewModel;
};

function renderValueRows(
  item: TokenValueViewModel | undefined,
  compareToItem?: TokenValueViewModel | undefined,
  model?: TokenGraphViewModel,
): valueRow[] {
  if (!item) return [{ label: "Value", value: "-" }];

  const value = item.value;

  if (value.kind === "typography" || value.kind === "modes") {
    const slots: { label: string; slot: TokenReferenceSlot }[] =
      value.kind === "modes"
        ? [
            { label: "Light", slot: "light" },
            { label: "Dark", slot: "dark" },
          ]
        : [
            { label: "fontSize", slot: "fontSize" },
            { label: "fontWeight", slot: "fontWeight" },
            { label: "lineHeight", slot: "lineHeight" },
          ];
    return slots.map(({ label, slot }) => {
      const tokenId = item.references?.[slot];
      return {
        label,
        value: tokenId
          ? (model && findRowById(model, tokenId)?.name) || "Missing token"
          : "-",
        changed: tokenId !== compareToItem?.references?.[slot],
      };
    });
  }

  if (value.kind === "single") {
    const previous =
      compareToItem?.value.kind === "single" ? compareToItem.value.value : undefined;

    return [
      {
        label: "Value",
        value: value.value,
        changed: value.value !== (previous ?? "-"),
      },
    ];
  }

  return [{ label: "Value", value: "unresolved" }];
}

export function StagedRowDetailValue({
  type,
  beforeName,
  afterName,
  before,
  after,
  baseModel,
  draftModel,
}: StagedRowDetailValueProps) {
  const beforeRows = renderValueRows(before, after, baseModel);
  const afterRows = renderValueRows(after, before, draftModel);

  return (
    <div className="gap-micro flex w-full flex-col">
      {type === "beforeName" && (
        <div
          className={[
            "px-miniPlus py-microPlus gap-mini grid grid-cols-3",
            afterName !== beforeName ? "bg-surface-warn" : "bg-transparent",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <Text
            variant="meta-xs"
            className={[
              "col-span-1",
              afterName !== beforeName ? "text-content-warn" : "text-content-primary",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            Name
          </Text>
          <Text
            variant="meta-xs"
            className={[
              "col-span-2",
              afterName !== beforeName ? "text-content-warn" : "text-content-primary",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {beforeName}
          </Text>
        </div>
      )}

      {type === "beforeValue" &&
        beforeRows.map((row) => (
          <div
            key={row.label}
            className={[
              "px-miniPlus py-microPlus gap-mini grid grid-cols-3",
              row.changed ? "bg-surface-warn" : "bg-transparent",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <Text
              variant="meta-xs"
              className={[
                "col-span-1",
                row.changed ? "text-content-warn" : "text-content-primary",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {row.label}
            </Text>
            <Text
              variant="meta-xs"
              className={[
                "col-span-2",
                row.changed ? "text-content-warn" : "text-content-primary",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {row.value}
            </Text>
          </div>
        ))}

      {type === "afterValue" &&
        afterRows.map((row) => (
          <div
            key={row.label}
            className={[
              "px-miniPlus py-microPlus gap-mini grid w-full grid-cols-3",
              row.changed ? "bg-surface-success" : "bg-transparent",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <Text
              variant="meta-xs"
              className={[
                "col-span-1",
                row.changed ? "text-content-success" : "text-content-primary",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {row.label}
            </Text>
            <Text
              variant="meta-xs"
              className={[
                "col-span-2",
                row.changed ? "text-content-success" : "text-content-primary",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {row.value}
            </Text>
          </div>
        ))}

      {type === "afterName" && (
        <div
          className={[
            "px-miniPlus py-microPlus gap-mini grid grid-cols-3",
            afterName !== beforeName ? "bg-surface-success" : "bg-transparent",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <Text
            variant="meta-xs"
            className={[
              "col-span-1",
              afterName !== beforeName ? "text-content-success" : "text-content-primary",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            Name
          </Text>
          <Text
            variant="meta-xs"
            className={[
              "col-span-2",
              afterName !== beforeName ? "text-content-success" : "text-content-primary",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {afterName}
          </Text>
        </div>
      )}
    </div>
  );
}
