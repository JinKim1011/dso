"use client";

import { createContext, ReactNode, useMemo, useState } from "react";
import { TokenGraphModel } from "../../tokens/lib/manifestAdapter";

type StagedContextType = {
  baseModel: TokenGraphModel;
  draftModel: TokenGraphModel;
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

  const value = useMemo(() => ({ baseModel, draftModel }), [baseModel, draftModel]);

  return (
    <StagedManifestContext.Provider value={value}>
      {children}
    </StagedManifestContext.Provider>
  );
}
