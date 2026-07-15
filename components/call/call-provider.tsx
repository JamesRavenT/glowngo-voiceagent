"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

export type CallSource = "contact" | "floating";

type CallContextValue = {
  isOpen: boolean;
  source: CallSource | null;
  open: (source: CallSource) => void;
  close: () => void;
};

const CallContext = createContext<CallContextValue | null>(null);

export function CallProvider({ children }: { children: React.ReactNode }) {
  const [source, setSource] = useState<CallSource | null>(null);
  const open = useCallback((nextSource: CallSource) => setSource(nextSource), []);
  const close = useCallback(() => setSource(null), []);
  const value = useMemo(
    () => ({ isOpen: source !== null, source, open, close }),
    [close, open, source],
  );

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
}

export function useCall() {
  const context = useContext(CallContext);

  if (!context) {
    throw new Error("useCall must be used within a CallProvider");
  }

  return context;
}
