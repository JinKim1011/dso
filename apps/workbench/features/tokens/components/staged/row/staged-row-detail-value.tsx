import type { TokenValueViewModel } from "@/features/tokens/model/token-graph";
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
};

function renderValueRows(
  item: TokenValueViewModel | undefined,
  compareToItem?: TokenValueViewModel | undefined,
): valueRow[] {
  if (!item) return [{ label: "Value", value: "-" }];

  const value = item.value;

  if (value.kind === "typography") {
    const previousTypography =
      compareToItem?.value.kind === "typography" ? compareToItem.value : undefined;

    return [
      {
        label: "fontSize",
        value: value.fontSize ?? "-",
        changed: value.fontSize !== previousTypography?.fontSize,
      },
      {
        label: "fontWeight",
        value: value.fontWeight ?? "-",
        changed: value.fontWeight !== previousTypography?.fontWeight,
      },
      {
        label: "lineHeight",
        value: value.lineHeight ?? "-",
        changed: value.lineHeight !== previousTypography?.lineHeight,
      },
    ];
  }

  if (value.kind === "modes") {
    const previousModes =
      compareToItem?.value.kind === "modes" ? compareToItem.value : undefined;

    const currentLight = value.light ?? "-";
    const currentDark = value.dark ?? "-";

    return [
      {
        label: "Light",
        value: currentLight,
        changed: currentLight !== (previousModes?.light ?? "-"),
      },
      {
        label: "Dark",
        value: currentDark,
        changed: currentDark !== (previousModes?.dark ?? "-"),
      },
    ];
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
}: StagedRowDetailValueProps) {
  const beforeRows = renderValueRows(before, after);
  const afterRows = renderValueRows(after, before);

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
