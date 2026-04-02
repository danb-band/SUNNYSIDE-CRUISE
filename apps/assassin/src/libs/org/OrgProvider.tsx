"use client";

import { createContext, useContext } from "react";

const OrgContext = createContext<{ orgId: string } | null>(null);

export function OrgProvider({ orgId, children }: { orgId: string; children: React.ReactNode }) {
  return <OrgContext.Provider value={{ orgId }}>{children}</OrgContext.Provider>;
}

export function useOrgId(): string {
  const context = useContext(OrgContext);

  if (!context) {
    throw new Error("useOrgId must be used within OrgProvider");
  }

  return context.orgId;
}
