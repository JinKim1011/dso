"use client";

import { Button, Text } from "@repo/ui";
import { useEffect, useMemo, useState } from "react";
import { TokenColorDraft, TokenColorForm } from "../../color/components/TokenColorForm";
import {
  TokenTypographyDraft,
  TokenTypographyForm,
  TokenTypographyOptions,
} from "../../typography/components/TokenTypographyForm";
import { TokenTypeValueItem } from "../lib/manifestAdapter";
import { TokenSingleValueDraft, TokenSingleValueForm } from "./TokenSingleValueForm";
import { TokenValuePreview } from "./TokenValuePreview";

export type TokenValueDetailUpdate = {
  name: string;
  meta?: string;
  value?: TokenTypeValueItem["value"];
  preview?: TokenTypeValueItem["preview"];
};

type TokenValueDetailProps = {
  rowId: string;
  name: string;
  cssVar?: string;
  meta?: string;
  category: string;
  kind: string;
  value: TokenTypeValueItem;
  onClose?: () => void;
  typographyOptions: TokenTypographyOptions;
  onSave: (rowId: string, next: TokenValueDetailUpdate) => void;
};

type DraftState = TokenSingleValueDraft | TokenColorDraft | TokenTypographyDraft;

function getTypographyDraft(
  valueItem: TokenTypeValueItem,
  name: string,
): TokenTypographyDraft {
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
  value: TokenTypeValueItem["value"],
): value is { light?: string; dark?: string } {
  return Boolean(value && typeof value === "object");
}

function toInitialDraft(
  name: string,
  category: string,
  kind: string,
  valueItem: TokenTypeValueItem,
): DraftState {
  if (category === "typography" && kind === "semantic") {
    return getTypographyDraft(valueItem, name);
  }
  if (isDualValue(valueItem.value)) {
    return {
      name: name ?? "",
      lightValue: valueItem.value.light ?? "",
      darkValue: valueItem.value.dark ?? "",
    };
  }
  return {
    name: name ?? "",
    value: typeof valueItem.value === "string" ? valueItem.value : "",
  };
}

function buildUpdate(
  category: string,
  kind: string,
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
        light: draft.lightValue || undefined,
        dark: draft.darkValue || undefined,
      },
      meta: `light:${draft.lightValue || "-"} dark:${draft.darkValue || "-"}`,
      preview: {
        kind: "color",
        light: draft.lightValue || undefined,
        dark: draft.darkValue || undefined,
      },
    };
  }

  const singleDraft = draft as TokenSingleValueDraft;
  return {
    name: singleDraft.name,
    value: singleDraft.value,
    meta: singleDraft.value,
    preview:
      category === "spacing"
        ? {
            kind: "spacing",
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
  onClose,
  onSave,
}: TokenValueDetailProps) {
  const initialDraft = useMemo(
    () => toInitialDraft(name, category, kind, value),
    [name, category, kind, value],
  );

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

  const title = `${displayIndex} - ${tokenTypeText}`;

  return (
    <div className="px-microPlus pb-small gap-mini pt-microPlus flex w-80 flex-col">
      <div className="pl-micro flex items-center justify-between">
        <Text variant="label-xs" className="text-content-primary">
          {title}
        </Text>
        {!isDirty && (
          <Button
            variant="void"
            size="sm"
            label="CLOSE"
            disabled={false}
            onClick={() => onClose?.()}
          />
        )}
        {isDirty && (
          <div className="flex">
            <Button
              variant="void"
              size="sm"
              label="CANCEL"
              overrideTextColorClass="text-content-tertiary hover:text-content-warn active:text-content-warn"
              disabled={!isDirty}
              onClick={handleCancel}
            />
            <Button
              variant="void"
              size="sm"
              label="SAVE"
              overrideTextColorClass="text-content-tertiary hover:text-content-success active:text-content-success"
              disabled={!isDirty}
              onClick={handleSave}
            />
          </div>
        )}
      </div>
      <TokenValuePreview category={category} kind={kind} value={value} />
      {renderEditor()}
    </div>
  );
}
