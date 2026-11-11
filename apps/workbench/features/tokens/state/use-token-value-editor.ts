import type {
  TokenReferenceOption,
  TokenValueDetailUpdate,
  TokenValueViewModel,
  TypographyReferenceOptions,
} from "@/features/tokens/model/token-graph";
import {
  buildTokenEditorUpdate,
  createTokenEditorDraft,
  getTokenEditorState,
  type TokenEditorDraft,
} from "@/features/tokens/model/token-value-editor";
import type { TokenCategory, TokenKind } from "@repo/contracts/validation/enum";
import { useEffect, useMemo, useState } from "react";

type UseTokenValueEditorProps = {
  rowId: string;
  name: string;
  value: TokenValueViewModel;
  category: TokenCategory;
  kind: TokenKind;
  modeOptions: TokenReferenceOption[];
  typographyOptions: TypographyReferenceOptions;
  onSave: (rowId: string, update: TokenValueDetailUpdate) => void;
};

export function useTokenValueEditor({
  rowId,
  name,
  value,
  category,
  kind,
  modeOptions,
  typographyOptions,
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
  );

  const undo = () => setDraft(initialDraft);

  const save = () => {
    if (state.missingReference) return;
    onSave(rowId, buildTokenEditorUpdate(category, draft));
  };

  return { draft, setDraft, ...state, undo, save };
}
