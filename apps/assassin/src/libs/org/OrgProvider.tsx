"use client";

import { createContext, useContext } from "react";

const OrgContext = createContext<{ orgId: string }>({ orgId: "" });

export function OrgProvider({ orgId, children }: { orgId: string; children: React.ReactNode }) {
  return <OrgContext.Provider value={{ orgId }}>{children}</OrgContext.Provider>;
}

export function useOrgId(): string {
  return useContext(OrgContext).orgId;
}
