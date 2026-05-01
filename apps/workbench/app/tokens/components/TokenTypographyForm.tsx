import { TokenFieldCombobox } from "./TokenFieldCombobox";
import { TokenFieldInput } from "./TokenFieldInput";

export type TokenTypographyDraft = {
  name: string;
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
};

export type TokenTypographyOptions = {
  fontSize: string[];
  fontWeight: string[];
  lineHeight: string[];
};

type TokenTypographyFormProps = {
  draft: TokenTypographyDraft;
  options: TokenTypographyOptions;
  onChange: (next: TokenTypographyDraft) => void;
};

export function TokenTypographyForm({
  draft,
  options,
  onChange,
}: TokenTypographyFormProps) {
  return (
    <div className="gap-mini flex flex-col">
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
        value={draft.fontSize}
        options={options.fontSize}
        placeholder="Select font size"
        onChange={(fontSize) => onChange({ ...draft, fontSize })}
      />
      <TokenFieldCombobox
        id="token-font-weight"
        label="Weight"
        value={draft.fontWeight}
        options={options.fontWeight}
        placeholder="Select font weight"
        onChange={(fontWeight) => onChange({ ...draft, fontWeight })}
      />
      <TokenFieldCombobox
        id="token-line-height"
        label="Line height"
        value={draft.lineHeight}
        options={options.lineHeight}
        placeholder="Select line height"
        onChange={(lineHeight) => onChange({ ...draft, lineHeight })}
      />
    </div>
  );
}
