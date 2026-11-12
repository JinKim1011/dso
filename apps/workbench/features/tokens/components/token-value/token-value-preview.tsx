import type { TokenValueViewModel } from "@/features/tokens/model/token-graph";
import { TokenCategory, TokenKind } from "@repo/contracts/validation/enum";
import { Text } from "@repo/ui";

type TokenValuePreviewProps = {
  category: TokenCategory;
  kind: TokenKind;
  value: TokenValueViewModel;
};

export function TokenValuePreview({ category, kind, value }: TokenValuePreviewProps) {
  const wrapperStyle = "py-regular px-small bg-dot-pattern flex w-full";
  const semanticWrapperStyle = `${wrapperStyle} h-32 items-center-safe justify-center-safe overflow-auto`;

  if (
    category === "typography" &&
    kind === "semantic" &&
    value.value.kind === "typography" &&
    (!value.preview || value.preview.kind === "typography")
  ) {
    if (
      !value.preview ||
      !value.preview.typography.fontSize ||
      !value.preview.typography.fontWeight ||
      !value.preview.typography.lineHeight
    ) {
      return (
        <div className={semanticWrapperStyle}>
          <Text variant="meta-xxs" className="text-content-accentStrong text-center">
            Enter all properties to preview
          </Text>
        </div>
      );
    }

    const { fontSize, fontWeight, lineHeight } = value.preview.typography;

    return (
      <div className={semanticWrapperStyle}>
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
    value.value.kind === "modes" &&
    (!value.preview || value.preview.kind === "modes")
  ) {
    if (!value.preview || (!value.preview.light && !value.preview.dark)) {
      return (
        <div className={semanticWrapperStyle}>
          <Text variant="meta-xxs" className="text-content-accentStrong text-center">
            Enter light or dark to preview
          </Text>
        </div>
      );
    }

    const swatches = [
      value.preview.light ? { label: "Light", value: value.preview.light } : null,
      value.preview.dark ? { label: "Dark", value: value.preview.dark } : null,
    ].filter((swatch) => swatch !== null);

    return (
      <div className={semanticWrapperStyle}>
        {swatches.map((swatch) => (
          <div
            className="gap-microPlus flex flex-1 flex-col items-center"
            key={swatch.label}
          >
            <div
              className="rounded-round h-7 w-7"
              style={
                category === "shadow"
                  ? { boxShadow: swatch.value }
                  : { background: swatch.value }
              }
            />
            <Text variant="meta-xs" className="text-content-accent">
              {swatch.label}
            </Text>
          </div>
        ))}
      </div>
    );
  }

  if (category === "color" && kind === "primitive" && value.preview?.kind === "single") {
    const color = value.preview.value;
    return (
      <div className={`${wrapperStyle} items-center justify-center overflow-hidden`}>
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
