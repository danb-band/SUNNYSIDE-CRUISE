import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getCurrentUserOrgRoleAction, getOrgBySlugAction } from "@features/org/actions";
import { OrgProvider } from "@/components/org/OrgProvider";

interface OrgLayoutProps {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}

export default function OrgLayout({ children, params }: OrgLayoutProps) {
  return (
    <Suspense>
      <OrgLayoutContent params={params}>{children}</OrgLayoutContent>
    </Suspense>
  );
}

async function OrgLayoutContent({ params, children }: OrgLayoutProps) {
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
      {children}
    </OrgProvider>
  );
}
