import { TokenFieldInput } from "./TokenFieldInput";

export type TokenSingleValueDraft = {
  name: string;
  value: string;
};

type TokenSingleValueFormProps = {
  draft: TokenSingleValueDraft;
  onChange: (next: TokenSingleValueDraft) => void;
};

export function TokenSingleValueForm({ draft, onChange }: TokenSingleValueFormProps) {
  return (
    <div className="gap-mini flex flex-col">
      <TokenFieldInput
        id="token-name"
        label="Name"
        value={draft.name}
        onChange={(name) => onChange({ ...draft, name })}
      />
      <TokenFieldInput
        id="token-value"
        label="Value"
        value={draft.value}
        onChange={(value) => onChange({ ...draft, value })}
      />
    </div>
  );
}
