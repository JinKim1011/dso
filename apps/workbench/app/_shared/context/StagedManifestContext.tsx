"use client";

import { createContext, ReactNode, useMemo, useState } from "react";
import { TokenGraphModel } from "../../tokens/lib/manifestAdapter";

type StagedContextType = {
  baseModel: TokenGraphModel;
  draftModel: TokenGraphModel;
  updateRow: (rowId: string, update: Partial<any>) => void;
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

  const value = useMemo(
    () => ({ baseModel, draftModel, updateRow }),
    [baseModel, draftModel],
  );

  return (
    <StagedManifestContext.Provider value={value}>
      {children}
    </StagedManifestContext.Provider>
  );
}
