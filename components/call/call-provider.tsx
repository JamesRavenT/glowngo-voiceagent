"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

export type CallSource = "contact" | "floating" | "hero";

type CallContextValue = {
  isOpen: boolean;
  isMinimized: boolean;
  hasSession: boolean;
  source: CallSource | null;
  open: (source: CallSource) => void;
  close: () => void;
  minimize: () => void;
  restore: () => void;
};

const CallContext = createContext<CallContextValue | null>(null);

export function CallProvider({ children }: { children: React.ReactNode }) {
  const [source, setSource] = useState<CallSource | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const open = useCallback((nextSource: CallSource) => {
    setSource(nextSource);
    setIsMinimized(false);
  }, []);
  const close = useCallback(() => {
    setSource(null);
    setIsMinimized(false);
  }, []);
  const minimize = useCallback(() => setIsMinimized(true), []);
  const restore = useCallback(() => setIsMinimized(false), []);
  const hasSession = source !== null;
  const value = useMemo(
    () => ({ isOpen: hasSession && !isMinimized, isMinimized, hasSession, source, open, close, minimize, restore }),
    [close, hasSession, isMinimized, minimize, open, restore, source],
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
