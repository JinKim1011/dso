import { TokenFieldInput } from "@/features/tokens/components/field/token-field-input";

export type TokenModesDraft = {
  name: string;
  lightValue: string;
  darkValue: string;
};

type TokenModesFormProps = {
  draft: TokenModesDraft;
  onChange: (next: TokenModesDraft) => void;
};

export function TokenModesForm({ draft, onChange }: TokenModesFormProps) {
  return (
    <div className="gap-mini flex flex-col">
      <TokenFieldInput
        id="token-name"
        label="Name"
        value={draft.name}
        onChange={(name) => onChange({ ...draft, name })}
      />
      <TokenFieldInput
        id="token-light-value"
        label="Light"
        value={draft.lightValue}
        onChange={(lightValue) => onChange({ ...draft, lightValue })}
      />
      <TokenFieldInput
        id="token-dark-value"
        label="Dark"
        value={draft.darkValue}
        onChange={(darkValue) => onChange({ ...draft, darkValue })}
      />
    </div>
  );
}
