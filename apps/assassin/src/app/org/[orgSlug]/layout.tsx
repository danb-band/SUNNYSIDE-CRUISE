import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getCurrentUserOrgRoleAction, getOrgBySlugAction } from "@features/org/actions";
import { OrgProvider } from "@/components/org/OrgProvider";
import { OrgRealtimeSync } from "@/components/realtime/OrgRealtimeSync";

interface OrgLayoutProps {
  children: React.ReactNode;
  modal: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}

export default function OrgLayout({ children, modal, params }: OrgLayoutProps) {
  return (
    <Suspense>
      <OrgLayoutContent params={params} modal={modal}>
        {children}
      </OrgLayoutContent>
    </Suspense>
  );
}

async function OrgLayoutContent({ params, children, modal }: OrgLayoutProps) {
  const { orgSlug } = await params;
  const org = await getOrgBySlugAction(orgSlug).catch(() => null);

  if (!org) {
    notFound();
  }

  const role = await getCurrentUserOrgRoleAction(org.id).catch(() => null);
  if (!role) {
    notFound();
  }

  return (
    <OrgProvider orgId={org.id} role={role}>
      <OrgRealtimeSync />
      {children}
      {modal}
    </OrgProvider>
  );
}
