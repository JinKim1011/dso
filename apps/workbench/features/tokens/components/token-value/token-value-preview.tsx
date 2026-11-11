import type { TokenValueViewModel } from "@/features/tokens/model/token-graph";
import { TokenCategory, TokenKind } from "@repo/contracts/validation/enum";
import { Text } from "@repo/ui";

type TokenValuePreviewProps = {
  category: TokenCategory;
  kind: TokenKind;
  value: TokenValueViewModel;
};

export function TokenValuePreview({ category, kind, value }: TokenValuePreviewProps) {
  if (!value?.preview) return null;

  const wrapperStyle = `py-regular px-small w-full flex items-center justify-center bg-dot-pattern overflow-hidden`;

  if (
    category === "typography" &&
    kind === "semantic" &&
    value.preview.kind === "typography" &&
    value.preview.typography.fontSize &&
    value.preview.typography.fontWeight &&
    value.preview.typography.lineHeight
  ) {
    const { fontSize, fontWeight, lineHeight } = value.preview.typography;

    return (
      <div className={wrapperStyle}>
        <div className="gap-micro flex flex-col">
          <div
            className="text-content-primary text-center"
            style={{ fontSize, fontWeight, lineHeight }}
          >
            Abc123
          </div>
          <Text variant="meta-xs" className="text-content-accent text-center">
            {value.name}
          </Text>
        </div>
      </div>
    );
  }

  if (
    (category === "color" || category === "shadow") &&
    kind === "semantic" &&
    value.preview.kind === "modes"
  ) {
    const swatches = [
      value.preview.light ? { label: "Light", value: value.preview.light } : null,
      value.preview.dark ? { label: "Dark", value: value.preview.dark } : null,
    ].filter(Boolean);

    return (
      <div className={wrapperStyle}>
        {swatches.map((swatch) => (
          <div
            className="gap-microPlus flex flex-1 flex-col items-center"
            key={swatch?.label}
          >
            <div
              className="rounded-round h-7 w-7"
              style={
                category === "shadow"
                  ? { boxShadow: swatch?.value }
                  : { background: swatch?.value }
              }
            />
            <Text variant="meta-xs" className="text-content-accent">
              {swatch?.label}
            </Text>
          </div>
        ))}
      </div>
    );
  }

  if (category === "color" && kind === "primitive" && value.preview.kind === "single") {
    const color = value.preview.value;
    return (
      <div className={wrapperStyle}>
        <div className="gap-micro flex flex-col">
          <div
            className="rounded-round m-auto h-7 w-7"
            style={{ backgroundColor: color }}
          />
          <Text variant="meta-xs" className="text-content-accent text-center">
            {value.name}
          </Text>
        </div>
      </div>
    );
  }

  return null;
}
