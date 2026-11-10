"use client";

import { TokenModesForm } from "@/features/tokens/components/form/token-modes-form";
import { TokenSingleForm } from "@/features/tokens/components/form/token-single-form";
import { TokenTypographyForm } from "@/features/tokens/components/form/token-typography-form";
import { TokenValuePreview } from "@/features/tokens/components/token-value/token-value-preview";
import type {
  TokenReferenceOption,
  TokenValueDetailUpdate,
  TokenValueViewModel,
  TypographyReferenceOptions,
} from "@/features/tokens/model/token-graph";
import { useTokenValueEditor } from "@/features/tokens/state/use-token-value-editor";
import type { TokenCategory, TokenKind } from "@repo/contracts/validation/enum";
import { Button, Text } from "@repo/ui";

type TokenValueDetailProps = {
  rowId: string;
  name: string;
  cssVar?: string;
  meta?: string;
  category: TokenCategory;
  kind: TokenKind;
  value: TokenValueViewModel;
  modeOptions: TokenReferenceOption[];
  typographyOptions: TypographyReferenceOptions;
  onClose?: () => void;
  onSave: (rowId: string, next: TokenValueDetailUpdate) => void;
};

export function TokenValueDetail({
  rowId,
  name,
  category,
  kind,
  value,
  modeOptions,
  typographyOptions,
  onSave,
}: TokenValueDetailProps) {
  const {
    draft,
    setDraft,
    isDirty,
    referencesChanged,
    missingReference,
    previewValue,
    undo,
    save,
  } = useTokenValueEditor({
    rowId,
    name,
    value,
    category,
    kind,
    modeOptions,
    typographyOptions,
    onSave,
  });

  const renderEditor = () => {
    if (category === "typography" && kind === "semantic") {
      if (draft.kind !== "typography") return null;

      return (
        <TokenTypographyForm
          draft={{
            name: draft.name,
            fontSizeReferencedTokenId: draft.fontSizeId,
            fontWeightReferencedTokenId: draft.fontWeightId,
            lineHeightReferencedTokenId: draft.lineHeightId,
          }}
          options={typographyOptions}
          onChange={(next) =>
            setDraft({
              kind: "typography",
              name: next.name,
              fontSizeId: next.fontSizeReferencedTokenId,
              fontWeightId: next.fontWeightReferencedTokenId,
              lineHeightId: next.lineHeightReferencedTokenId,
            })
          }
        />
      );
    }

    if (draft.kind === "modes") {
      return (
        <TokenModesForm
          draft={{
            name: draft.name,
            lightReferencedTokenId: draft.lightId,
            darkReferencedTokenId: draft.darkId,
          }}
          options={modeOptions}
          onChange={(next) =>
            setDraft({
              kind: "modes",
              name: next.name,
              lightId: next.lightReferencedTokenId,
              darkId: next.darkReferencedTokenId,
            })
          }
        />
      );
    }

    if (draft.kind !== "single") return null;

    return (
      <TokenSingleForm
        draft={draft}
        onChange={(next) => setDraft({ ...next, kind: "single" })}
      />
    );
  };

  return (
    <div className="px-mini py-miniPlus gap-miniPlus flex w-96 flex-col select-none">
      <div className="flex items-center justify-between">
        <Text
          variant="label-xxs"
          className="text-content-primary grow-2 basis-0 truncate"
        >
          {name}
        </Text>
      </div>
      <TokenValuePreview category={category} kind={kind} value={previewValue} />
      {renderEditor()}
      {missingReference && (
        <Text variant="meta-xs">A referenced token is unavailable.</Text>
      )}
      {referencesChanged && (
        <Text variant="meta-xs">Saving reference changes is not available yet.</Text>
      )}
      {isDirty && (
        <div className="gap-microPlus flex grow basis-0 justify-end">
          <Button variant="void" label="UNDO" disabled={!isDirty} onClick={undo} />
          <Button
            variant="fill"
            label="SAVE"
            overrideBgClass="bg-surface-accentStrong hover:bg-surface-accentStrong active:bg-surface-accentStrong"
            overrideTextColorClass="text-content-primary hover:text-content-tertiary active:text-content-quaternary"
            disabled={!isDirty || referencesChanged || missingReference}
            onClick={save}
          />
        </div>
      )}
    </div>
  );
}
