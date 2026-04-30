import { TokenFieldInput } from "./TokenFieldInput";

export type TokenDualValueDraft = {
  name: string;
  lightValue: string;
  darkValue: string;
};

type TokenDualValueFormProps = {
  draft: TokenDualValueDraft;
  onChange: (next: TokenDualValueDraft) => void;
};

export function TokenDualValueForm({ draft, onChange }: TokenDualValueFormProps) {
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
