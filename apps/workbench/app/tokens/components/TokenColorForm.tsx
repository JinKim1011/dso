import { TokenFieldInput } from "./TokenFieldInput";

export type TokenColorDraft = {
  name: string;
  lightValue: string;
  darkValue: string;
};

type TokenColorFormProps = {
  draft: TokenColorDraft;
  onChange: (next: TokenColorDraft) => void;
};

export function TokenColorForm({ draft, onChange }: TokenColorFormProps) {
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
