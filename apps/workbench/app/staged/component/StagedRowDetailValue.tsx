import { Text } from "@repo/ui";
import { TokenTypeValueItem } from "../../tokens/lib/manifestAdapter";

type valueRow = {
  label: string;
  value: string;
  changed?: boolean;
};

type StagedRowDetailValueProps = {
  type: "beforeValue" | "afterValue" | "beforeName" | "afterName";
  beforeName?: string;
  afterName?: string;
  before?: TokenTypeValueItem;
  after?: TokenTypeValueItem;
};

function renderValueRows(
  item: TokenTypeValueItem | undefined,
  compareToItem?: TokenTypeValueItem | undefined,
): valueRow[] {
  if (!item) return [{ label: "Value", value: "-" }];

  const value = item.value;
  const isObjectValue = value && typeof value === "object";

  if (item.preview?.kind === "typography") {
    const compareTypography =
      compareToItem?.preview?.kind === "typography"
        ? compareToItem.preview.typography
        : undefined;

    return [
      {
        label: "fontSize",
        value: item.preview.typography.fontSize,
        changed: item.preview.typography.fontSize !== compareTypography?.fontSize,
      },
      {
        label: "fontWeight",
        value: item.preview.typography.fontWeight,
        changed: item.preview.typography.fontWeight !== compareTypography?.fontWeight,
      },
      {
        label: "lineHeight",
        value: item.preview.typography.lineHeight,
        changed: item.preview.typography.lineHeight !== compareTypography?.lineHeight,
      },
    ];
  }

  if (isObjectValue) {
    const currentLight = value.light ?? "-";
    const currentDark = value.dark ?? "-";
    const previousObject =
      compareToItem?.value && typeof compareToItem.value === "object"
        ? compareToItem.value
        : undefined;

    return [
      {
        label: "Light",
        value: currentLight,
        changed: currentLight !== (previousObject?.light ?? "-"),
      },
      {
        label: "Dark",
        value: currentDark,
        changed: currentDark !== (previousObject?.dark ?? "-"),
      },
    ];
  }

  const current = typeof value === "string" ? value : "-";
  const previous =
    typeof compareToItem?.value === "string" ? compareToItem.value : undefined;

  return [
    {
      label: "Value",
      value: current,
      changed: current !== (previous ?? "-"),
    },
  ];
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
