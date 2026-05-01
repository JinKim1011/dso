"use client";

import { CheckIcon, Cross2Icon, ResetIcon } from "@radix-ui/react-icons";
import { Button, Text } from "@repo/ui";
import { useEffect, useMemo, useState } from "react";
import { TokenTypeValueItem } from "../lib/manifestAdapter";
import { TokenColorDraft, TokenColorForm } from "./TokenColorForm";
import { TokenSingleValueDraft, TokenSingleValueForm } from "./TokenSingleValueForm";
import {
  TokenTypographyDraft,
  TokenTypographyForm,
  TokenTypographyOptions,
} from "./TokenTypographyForm";
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

  // const between = rowId.match(/token-type:(.*?):value/)?.[1] ?? "";
  // const parts = between.split("-");
  // const categoryText = `${parts[0]?.charAt(0).toUpperCase()}${parts[0]?.slice(1).toLowerCase()}`;
  // const tokenTypeText = `${parts[1]?.charAt(0).toUpperCase()}${parts[1]?.slice(1).toLowerCase()}`;

  const toTitleCase = (text: string) =>
    text ? `${text.charAt(0).toUpperCase()}${text.slice(1).toLowerCase()}` : "";
  const categoryText = toTitleCase(category);
  const tokenTypeText = toTitleCase(kind);
  const title = `${categoryText}, ${tokenTypeText}`;

  return (
    <div className="px-mini pt-mini pb-miniPlus gap-small flex w-90 flex-col">
      <div className="flex items-center justify-between">
        <Text variant="label-sm" className="text-content-primary">
          {title}
        </Text>
        {!isDirty && (
          <Button
            variant="void"
            size="md"
            aria-label="close"
            iconOnly={true}
            leftIcon={Cross2Icon}
            disabled={false}
          />
        )}
        {isDirty && (
          <div className="flex">
            <Button
              variant="void"
              size="md"
              aria-label="undo"
              iconOnly={true}
              leftIcon={ResetIcon}
              disabled={!isDirty}
              onClick={handleCancel}
            />
            <Button
              variant="void"
              size="md"
              aria-label="save"
              iconOnly={true}
              leftIcon={CheckIcon}
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
