"use client";

import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import { TokenGraphModel } from "../../tokens/lib/manifestAdapter";

type StagedContextType = {
  baseModel: TokenGraphModel;
  draftModel: TokenGraphModel;
  changedRows: ChangedRow[];
  updateRow: (rowId: string, update: Partial<any>) => void;
  resetDraft: () => void;
  applyDraft: () => Promise<Response>;
};

const StagedManifestContext = createContext<StagedContextType | undefined>(undefined);

export function StagedManifestProvider({
  baseManifest,
  children,
}: {
  baseManifest: TokenGraphModel;
  children: ReactNode;
}) {
  const [baseModel, setBaseModel] = useState<TokenGraphModel>(baseManifest);
  const [draftModel, setDraftModel] = useState<TokenGraphModel>(baseManifest);

  const updateRow = (rowId: string, update: Partial<any>) => {
    setDraftModel((current) => ({
      ...current,
      tokenTypes: current.tokenTypes.map((tokenType) => ({
        ...tokenType,
        values: tokenType.values.map((value) =>
          value.id === rowId ? { ...value, ...update } : value,
        ),
      })),
    }));
  };

  const resetDraft = () => {
    setDraftModel(baseModel);
  };

  const applyDraft = async (): Promise<Response> => {
    const response = await fetch("/api/manifest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ manifest: draftModel }),
    });

    if (response.ok) {
      setBaseModel(draftModel);
    }

    return response;
  };

  const value = useMemo(
    () => ({ baseModel, draftModel, updateRow, resetDraft, applyDraft }),
    [baseModel, draftModel],
  );

  return (
    <StagedManifestContext.Provider value={value}>
      {children}
    </StagedManifestContext.Provider>
  );
}

export function useStagedManifest() {
  const context = useContext(StagedManifestContext);
  if (!context)
    throw new Error("useStagedManifest must be used inside StagedManifestProvider");
  return context;
}
