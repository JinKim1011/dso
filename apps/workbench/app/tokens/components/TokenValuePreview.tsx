import { Text } from "@repo/ui";
import { TokenTypeValueItem } from "../lib/manifestAdapter";

type TokenValuePreviewProps = {
  category: string;
  kind: string;
  value: TokenTypeValueItem;
};

export function TokenValuePreview({ category, kind, value }: TokenValuePreviewProps) {
  if (!value?.preview) return null;

  const wrapperStyle = `py-regular px-small flex w-[21.25rem] items-center justify-center bg-dot-pattern overflow-hidden`;

  if (
    category === "typography" &&
    kind === "semantic" &&
    value.preview.kind === "typography"
  ) {
    const { fontSize, fontWeight, lineHeight } = value.preview.typography;

    return (
      <div className={wrapperStyle}>
        <div className="gap-micro flex flex-col">
          <div
            className={`text-${fontSize} font-${fontWeight} leading-${lineHeight} text-content-primary`}
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

  if (category === "color" && kind === "primitive" && value.preview.kind === "color") {
    const swatches = [
      value.preview.light ? { label: "Light", value: value.preview.light } : null,
      value.preview.dark ? { label: "Dark", value: value.preview.dark } : null,
    ].filter(Boolean);

    return (
      <div className={wrapperStyle}>
        {swatches.map((swatch) => (
          <div className="flex flex-1 flex-col items-center" key={swatch?.label}>
            <div
              className="rounded-round h-7 w-7"
              style={{ background: swatch?.value }}
            />
            <Text variant="meta-xs" className="text-content-accent">
              {swatch?.label}
            </Text>
          </div>
        ))}
      </div>
    );
  }

  if (
    category === "spacing" &&
    kind === "primitive" &&
    value.preview.kind === "spacing"
  ) {
    const size = value.preview.value;
    return (
      <div className={wrapperStyle}>
        <div className="gap-micro flex flex-col">
          <div
            className="bg-surface-accentStrong m-auto"
            style={{ width: size, height: size }}
          />
          <Text variant="meta-xs" className="text-content-accentStrong text-center">
            {value.name}
          </Text>
        </div>
      </div>
    );
  }
}
