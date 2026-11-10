"use client";

import {
  TokenModesForm,
  type TokenModesDraft,
} from "@/features/tokens/components/form/token-modes-form";
import {
  TokenSingleForm,
  type TokenSingleDraft,
} from "@/features/tokens/components/form/token-single-form";
import {
  TokenTypographyForm,
  type TokenTypographyDraft,
  type TokenTypographyOptions,
} from "@/features/tokens/components/form/token-typography-form";
import { TokenValuePreview } from "@/features/tokens/components/token-value/token-value-preview";
import type { TokenValueViewModel } from "@/features/tokens/model/token-graph";
import type { TokenKind } from "@repo/contracts/validation/enum";
import { Button, Text } from "@repo/ui";
import { useEffect, useMemo, useState } from "react";

export type TokenValueDetailUpdate = {
  name: string;
  meta?: string;
  value?: TokenValueViewModel["value"];
  preview?: TokenValueViewModel["preview"];
};

type TokenValueDetailProps = {
  rowId: string;
  name: string;
  cssVar?: string;
  meta?: string;
  category: string;
  kind: TokenKind;
  value: TokenValueViewModel;
  onClose?: () => void;
  typographyOptions: TokenTypographyOptions;
  onSave: (rowId: string, next: TokenValueDetailUpdate) => void;
};

type DraftState = TokenSingleDraft | TokenModesDraft | TokenTypographyDraft;

function isTypographyDraft(draft: DraftState): draft is TokenTypographyDraft {
  return "fontSize" in draft && "fontWeight" in draft && "lineHeight" in draft;
}

function isColorDraft(draft: DraftState): draft is TokenModesDraft {
  return "lightValue" in draft && "darkValue" in draft;
}

function isSingleValueDraft(draft: DraftState): draft is TokenSingleDraft {
  return "value" in draft;
}

function toInitialDraft(name: string, valueItem: TokenValueViewModel): DraftState {
  switch (valueItem.value.kind) {
    case "modes":
      return {
        name,
        lightValue: valueItem.value.light ?? "",
        darkValue: valueItem.value.dark ?? "",
      };

    case "single":
      return {
        name,
        value: valueItem.value.value,
      };

    case "typography":
      return {
        name,
        fontSize: valueItem.value.fontSize,
        fontWeight: valueItem.value.fontWeight,
        lineHeight: valueItem.value.lineHeight,
      };

    case "unresolved":
      return {
        name,
        value: "",
      };
  }
}

function buildUpdate(
  category: string,
  kind: TokenKind,
  draft: DraftState,
): TokenValueDetailUpdate {
  if (category === "typography" && kind === "semantic") {
    const typographyDraft = draft as TokenTypographyDraft;
    return {
      name: typographyDraft.name,
      meta: `${typographyDraft.fontSize} / ${typographyDraft.fontWeight} / ${typographyDraft.lineHeight}`,
      preview: {
        kind: "typography",
        typography: {
          fontSize: typographyDraft.fontSize,
          fontWeight: typographyDraft.fontWeight,
          lineHeight: typographyDraft.lineHeight,
        },
      },
    };
  }

  if ("lightValue" in draft && "darkValue" in draft) {
    return {
      name: draft.name,
      value: {
        kind: "modes",
        light: draft.lightValue || undefined,
        dark: draft.darkValue || undefined,
      },
      meta: `light:${draft.lightValue || "-"} dark:${draft.darkValue || "-"}`,
      preview: {
        kind: "modes",
        light: draft.lightValue || undefined,
        dark: draft.darkValue || undefined,
      },
    };
  }

  const singleDraft = draft as TokenSingleDraft;
  return {
    name: singleDraft.name,
    value: { kind: "single", value: singleDraft.value },
    meta: singleDraft.value,
    preview:
      category === "color"
        ? {
            kind: "single",
            value: singleDraft.value,
          }
        : undefined,
  };
}

export function TokenValueDetail({
  rowId,
  name,
  category,
  kind,
  value,
  typographyOptions,
  onSave,
}: TokenValueDetailProps) {
  const initialDraft = useMemo(() => toInitialDraft(name, value), [name, value]);

  const [draft, setDraft] = useState<DraftState>(initialDraft);

  useEffect(() => {
    setDraft(initialDraft);
  }, [initialDraft]);

  const isDirty = JSON.stringify(draft) !== JSON.stringify(initialDraft);

  const handleCancel = () => {
    setDraft(initialDraft);
  };

  const handleSave = () => {
    onSave(rowId, buildUpdate(category, kind, draft));
  };

  const renderEditor = () => {
    if (category === "typography" && kind === "semantic") {
      if (!isTypographyDraft(draft)) return null;

      return (
        <TokenTypographyForm
          draft={draft}
          options={typographyOptions}
          onChange={setDraft}
        />
      );
    }

    if (isColorDraft(draft)) {
      return <TokenModesForm draft={draft} onChange={setDraft} />;
    }

    if (!isSingleValueDraft(draft)) return null;

    return <TokenSingleForm draft={draft} onChange={setDraft} />;
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
      <TokenValuePreview category={category} kind={kind} value={value} />
      {renderEditor()}
      {isDirty && (
        <div className="gap-microPlus flex grow basis-0 justify-end">
          <Button
            variant="void"
            label="UNDO"
            disabled={!isDirty}
            onClick={handleCancel}
          />
          <Button
            variant="fill"
            label="SAVE"
            overrideBgClass="bg-surface-accentStrong hover:bg-surface-accentStrong active:bg-surface-accentStrong"
            overrideTextColorClass="text-content-primary hover:text-content-tertiary active:text-content-quaternary"
            disabled={!isDirty}
            onClick={handleSave}
          />
        </div>
      )}
    </div>
  );
}
