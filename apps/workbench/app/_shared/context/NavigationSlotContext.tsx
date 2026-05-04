"use client";

import { createContext, ReactNode, useCallback, useMemo, useState } from "react";

type NavigationSlotActions = {
  setNavigationDetail: (node: ReactNode) => void;
  clearNavigationDetail: () => void;
};

export const NavigationSlotActionsContext = createContext<NavigationSlotActions | null>(
  null,
);

export const NavigationSlotContentContext = createContext<ReactNode>(null);

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
    <NavigationSlotActionsContext.Provider value={actions}>
      <NavigationSlotContentContext.Provider value={navigationDetail}>
        {children}
      </NavigationSlotContentContext.Provider>
    </NavigationSlotActionsContext.Provider>
  );
}
