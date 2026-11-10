import { TokenFieldCombobox } from "@/features/tokens/components/field/token-field-combobox";
import { TokenFieldInput } from "@/features/tokens/components/field/token-field-input";
import type { TypographyReferenceOptions } from "@/features/tokens/model/token-graph";

export type TokenTypographyDraft = {
  name: string;
  fontSizeReferencedTokenId: string | undefined;
  fontWeightReferencedTokenId: string | undefined;
  lineHeightReferencedTokenId: string | undefined;
};

type TokenTypographyFormProps = {
  draft: TokenTypographyDraft;
  options: TypographyReferenceOptions;
  onChange: (next: TokenTypographyDraft) => void;
};

export function TokenTypographyForm({
  draft,
  options,
  onChange,
}: TokenTypographyFormProps) {
  return (
    <div className="gap-microPlus flex flex-col">
      <TokenFieldInput
        id="token-name"
        label="Name"
        value={draft.name}
        placeholder="Enter name"
        onChange={(name) => onChange({ ...draft, name })}
      />
      <TokenFieldCombobox
        id="token-font-size"
        label="Size"
        value={draft.fontSizeReferencedTokenId}
        options={options.fontSize}
        placeholder="Select font size"
        onChange={(name) => onChange({ ...draft, name })}
      />
      <TokenFieldCombobox
        id="token-font-weight"
        label="Weight"
        value={draft.fontWeightReferencedTokenId}
        options={options.fontWeight}
        placeholder="Select font weight"
        onChange={(name) => onChange({ ...draft, name })}
      />
      <TokenFieldCombobox
        id="token-line-height"
        label="Line height"
        value={draft.lineHeightReferencedTokenId}
        options={options.lineHeight}
        placeholder="Select line height"
        onChange={(name) => onChange({ ...draft, name })}
      />
    </div>
  );
}
