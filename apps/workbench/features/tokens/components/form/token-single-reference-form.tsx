import { TokenFieldCombobox } from "@/features/tokens/components/field/token-field-combobox";
import { TokenFieldInput } from "@/features/tokens/components/field/token-field-input";
import type { TokenReferenceOption } from "@/features/tokens/model/token-graph";

export type TokenSingleReferenceDraft = {
  name: string;
  valueReferencedTokenId: string | undefined;
};

type TokenSingleReferenceFormProps = {
  draft: TokenSingleReferenceDraft;
  options: TokenReferenceOption[];
  onChange: (next: TokenSingleReferenceDraft) => void;
};

export function TokenSingleReferenceForm({
  draft,
  options,
  onChange,
}: TokenSingleReferenceFormProps) {
  return (
    <div className="gap-mini flex flex-col">
      <TokenFieldInput
        id="token-name"
        label="Name"
        placeholder="Enter name"
        value={draft.name}
        onChange={(name) => onChange({ ...draft, name })}
      />
      <TokenFieldCombobox
        id="token-value"
        label="Value"
        placeholder="Select value"
        value={draft.valueReferencedTokenId}
        options={options}
        onChange={(valueReferencedTokenId) =>
          onChange({ ...draft, valueReferencedTokenId })
        }
      />
    </div>
  );
}
