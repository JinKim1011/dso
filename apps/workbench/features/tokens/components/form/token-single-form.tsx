import { TokenFieldInput } from "@/features/tokens/components/field/token-field-input";

export type TokenSingleDraft = {
  name: string;
  value: string;
};

type TokenSingleFormProps = {
  draft: TokenSingleDraft;
  onChange: (next: TokenSingleDraft) => void;
};

export function TokenSingleForm({ draft, onChange }: TokenSingleFormProps) {
  return (
    <div className="gap-mini flex flex-col">
      <TokenFieldInput
        id="token-name"
        label="Name"
        placeholder="Enter name"
        value={draft.name}
        onChange={(name) => onChange({ ...draft, name })}
      />
      <TokenFieldInput
        id="token-value"
        label="Value"
        placeholder="Enter value"
        value={draft.value}
        onChange={(value) => onChange({ ...draft, value })}
      />
    </div>
  );
}
