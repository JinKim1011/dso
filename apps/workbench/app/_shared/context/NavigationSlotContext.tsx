"use client";

import { createContext, ReactNode, useCallback, useMemo, useState } from "react";

type NavigationSlotActions = {
  setNavigationDetail: (node: ReactNode) => void;
  clearNavigationDetail: () => void;
};

export const NavigationSlotActionsContext = createContext<NavigationSlotActions | null>(
  null,
);

export const NavigationSlotDetailContext = createContext<ReactNode>(null);

type NavigationSlotProviderProps = {
  children: ReactNode;
};

export default function NavigationSlotProvider({
  children,
}: NavigationSlotProviderProps) {
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
      <NavigationSlotDetailContext.Provider value={navigationDetail}>
        {children}
      </NavigationSlotDetailContext.Provider>
    </NavigationSlotActionsContext.Provider>
  );
}
