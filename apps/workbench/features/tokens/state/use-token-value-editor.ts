import type { TokenDisplayResolver } from "@/features/tokens/model/token-display";
import type {
  TokenGraphViewModel,
  TokenReferenceOption,
  TokenValueDetailUpdate,
  TokenValueViewModel,
  TypographyReferenceOptions,
} from "@/features/tokens/model/token-graph";
import { validateTokenNameChange } from "@/features/tokens/model/token-name-validation";
import {
  buildTokenEditorUpdate,
  createTokenEditorDraft,
  getTokenEditorState,
  type TokenEditorDraft,
} from "@/features/tokens/model/token-value-editor";
import type { TokenCategory, TokenKind } from "@repo/contracts/validation/enum";
import { Toaster } from "@repo/ui";
import { useEffect, useMemo, useState } from "react";

type UseTokenValueEditorProps = {
  rowId: string;
  name: string;
  value: TokenValueViewModel;
  category: TokenCategory;
  kind: TokenKind;
  tokenTypeId: string;
  draftModel: TokenGraphViewModel;
  modeOptions: TokenReferenceOption[];
  singleReferenceOptions: TokenReferenceOption[];
  typographyOptions: TypographyReferenceOptions;
  resolveDisplay: TokenDisplayResolver;
  onSave: (rowId: string, update: TokenValueDetailUpdate) => void;
};

export function useTokenValueEditor({
  rowId,
  name,
  value,
  category,
  kind,
  tokenTypeId,
  draftModel,
  modeOptions,
  singleReferenceOptions,
  typographyOptions,
  resolveDisplay,
  onSave,
}: UseTokenValueEditorProps) {
  const initialDraft = useMemo(
    () => createTokenEditorDraft(name, value, category, kind),
    [name, value, category, kind],
  );

  const [draft, setDraft] = useState<TokenEditorDraft>(initialDraft);

  useEffect(() => {
    setDraft(initialDraft);
  }, [initialDraft, rowId]);

  const state = getTokenEditorState(
    draft,
    initialDraft,
    value,
    modeOptions,
    typographyOptions,
    resolveDisplay,
    category,
    kind,
    singleReferenceOptions,
  );

  const undo = () => setDraft(initialDraft);

  const save = () => {
    if (
      state.missingReference ||
      (draft.kind === "single-reference" && state.incomplete) ||
      state.invalidPrimitiveValue
    )
      return;
    const update = buildTokenEditorUpdate(category, draft);
    const nameError = validateTokenNameChange({
      draftModel,
      row: value,
      tokenTypeId,
      originalName: name,
      nextName: update.name,
    });

    if (nameError) {
      Toaster.toast.error(nameError, { id: `token-name:${rowId}` });
      return;
    }

    onSave(rowId, update);
  };

  return { draft, setDraft, ...state, undo, save };
}
