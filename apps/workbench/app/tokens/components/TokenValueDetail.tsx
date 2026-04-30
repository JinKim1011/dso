"use client";

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
    return { name, fontSize: "", fontWeight: "", lineHeight: "" };
  }

  return {
    name,
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
      name,
      lightValue: valueItem.value.light ?? "",
      darkValue: valueItem.value.dark ?? "",
    };
  }
  return {
    name,
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
      meta: `${typographyDraft.fontSize}/${typographyDraft.fontWeight}/${typographyDraft.lineHeight}`,
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

  return (
    <div className="px-mini pt-mini pb-miniPlus">
      <TokenValuePreview category={category} kind={kind} value={value} />
    </div>
  );
}
