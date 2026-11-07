"use client";

import {
  TokenColorForm,
  type TokenColorDraft,
} from "@/features/tokens/components/form/token-color-form";
import {
  TokenSingleValueForm,
  type TokenSingleValueDraft,
} from "@/features/tokens/components/form/token-single-value-form";
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

type DraftState = TokenSingleValueDraft | TokenColorDraft | TokenTypographyDraft;

function getTypographyDraft(valueItem: TokenValue, name: string): TokenTypographyDraft {
  if (valueItem.preview?.kind !== "typography") {
    return { name: "", fontSize: "", fontWeight: "", lineHeight: "" };
  }

  return {
    name: name ?? "",
    fontSize: valueItem.preview.typography.fontSize,
    fontWeight: valueItem.preview.typography.fontWeight,
    lineHeight: valueItem.preview.typography.lineHeight,
  };
}

function isDualValue(
  value: TokenValue["value"],
): value is { light?: string; dark?: string } {
  return Boolean(value && typeof value === "object");
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

  const singleDraft = draft as TokenSingleValueDraft;
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
      return (
        <TokenTypographyForm
          draft={draft as TokenTypographyDraft}
          options={typographyOptions}
          onChange={(next) => setDraft(next)}
        />
      );
    }

    if ("lightValue" in draft && "darkValue" in draft) {
      return (
        <TokenColorForm
          draft={draft as TokenColorDraft}
          onChange={(next) => setDraft(next)}
        />
      );
    }

    return (
      <TokenSingleValueForm
        draft={draft as TokenSingleValueDraft}
        onChange={(next) => setDraft(next)}
      />
    );
  };

  const between = rowId.match(/token-type:(.*?):value/)?.[1] ?? "";
  const parts = between.split("-");
  const tokenTypeText = `${parts[1]?.charAt(0).toUpperCase()}${parts[1]?.slice(1).toLowerCase()}`;

  const rawIndex = rowId.split(":").pop() ?? "0";
  const numericIndex = Number(rawIndex);
  const displayIndex = String(numericIndex + 1).padStart(2, "0");

  const title = `${tokenTypeText}-${displayIndex}`;

  return (
    <div className="px-mini py-miniPlus gap-miniPlus flex w-96 flex-col select-none">
      <div className="flex items-center justify-between">
        <Text
          variant="label-xxs"
          className="text-content-primary grow-2 basis-0 truncate"
        >
          {title ? title : rowId}
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
