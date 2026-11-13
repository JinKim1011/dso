import { TokenFieldCombobox } from "@/features/tokens/components/field/token-field-combobox";
import { TokenFieldInput } from "@/features/tokens/components/field/token-field-input";
import type { TokenReferenceOption } from "@/features/tokens/model/token-graph";

export type TokenModesDraft = {
  name: string;
  lightReferencedTokenId: string | undefined;
  darkReferencedTokenId: string | undefined;
};

type TokenModesFormProps = {
  draft: TokenModesDraft;
  options: TokenReferenceOption[];
  onChange: (next: TokenModesDraft) => void;
};

export function TokenModesForm({ draft, options, onChange }: TokenModesFormProps) {
  return (
    <div className="gap-mini flex flex-col">
      <TokenFieldInput
        id="token-name"
        label="Name"
        value={draft.name}
        onChange={(name) => onChange({ ...draft, name })}
      />
      <TokenFieldCombobox
        id="token-light-value"
        label="Light"
        value={draft.lightReferencedTokenId}
        options={options}
        placeholder="Select light color"
        onChange={(lightReferencedTokenId) =>
          onChange({ ...draft, lightReferencedTokenId })
        }
      />
      <TokenFieldCombobox
        id="token-dark-value"
        label="Dark"
        value={draft.darkReferencedTokenId}
        options={options}
        placeholder="Select dark color"
        onChange={(darkReferencedTokenId) =>
          onChange({ ...draft, darkReferencedTokenId })
        }
      />
    </div>
  );
}
