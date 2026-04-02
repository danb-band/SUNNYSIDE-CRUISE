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
  return useContext(OrgContext).orgId;
}

export function useOrgRole(): OrgRole | null {
  return useContext(OrgContext).role;
}
