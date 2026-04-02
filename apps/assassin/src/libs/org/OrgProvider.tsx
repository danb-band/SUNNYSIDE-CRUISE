"use client";

import { createContext, useContext } from "react";

export type OrgRole = "OWNER" | "ADMIN" | "MEMBER";

const OrgContext = createContext<{ orgId: string; role: OrgRole | null }>({
  orgId: "",
  role: null,
});

export function OrgProvider({
  orgId,
  role,
  children,
}: {
  orgId: string;
  role: OrgRole | null;
  children: React.ReactNode;
}) {
  return <OrgContext.Provider value={{ orgId, role }}>{children}</OrgContext.Provider>;
}

export function useOrgId(): string {
  const context = useContext(OrgContext);

  if (!context) {
    throw new Error("useOrgId must be used within OrgProvider");
  }

  return context.orgId;
}

export function useOrgRole(): OrgRole | null {
  return useContext(OrgContext).role;
}
