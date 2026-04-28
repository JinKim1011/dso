"use client";

import { createContext, ReactNode, useCallback, useMemo, useState } from "react";

type WorkbenchShellActions = {
  setNavigationDetail: (node: ReactNode) => void;
  clearNavigationDetail: () => void;
};

export const WorkbenchShellActionsContext = createContext<WorkbenchShellActions | null>(
  null,
);

export const WorkbenchShellDetailContext = createContext<ReactNode>(null);

type WorkbenchShellProviderProps = {
  children: ReactNode;
};

export default function WorkbenchShellProvider({
  children,
}: WorkbenchShellProviderProps) {
  const [navigationDetail, setNavigationDetail] = useState<ReactNode>(null);

  const clearNavigationDetail = useCallback(() => {
    setNavigationDetail(null);
  }, []);

  const actions = useMemo(
    () => ({
      setNavigationDetail,
      clearNavigationDetail,
    }),
    [clearNavigationDetail],
  );

  return (
    <WorkbenchShellActionsContext.Provider value={actions}>
      <WorkbenchShellDetailContext.Provider value={navigationDetail}>
        {children}
      </WorkbenchShellDetailContext.Provider>
    </WorkbenchShellActionsContext.Provider>
  );
}
