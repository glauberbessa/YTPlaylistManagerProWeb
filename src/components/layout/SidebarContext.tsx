"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface SidebarContextType {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  autoCloseOnNavigate: boolean;
  setAutoCloseOnNavigate: (value: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [autoCloseOnNavigate, setAutoCloseOnNavigate] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);

  const toggleSidebar = () => setIsCollapsed((prev) => !prev);

  useEffect(() => {
    const storedValue = window.localStorage.getItem("ytpm:autoCloseMenu");
    if (storedValue !== null) {
      setAutoCloseOnNavigate(storedValue === "true");
    } else {
      setAutoCloseOnNavigate(window.matchMedia("(max-width: 767px)").matches);
    }
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;
    window.localStorage.setItem(
      "ytpm:autoCloseMenu",
      String(autoCloseOnNavigate)
    );
  }, [autoCloseOnNavigate, hasHydrated]);

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        toggleSidebar,
        autoCloseOnNavigate,
        setAutoCloseOnNavigate,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
