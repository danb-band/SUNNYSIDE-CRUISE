import { Suspense } from "react";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@libs/supabase/server";
import { getOrgBySlugAction, getOrgMembersAction } from "@features/org/actions";
import { OrgProvider } from "@/components/org/OrgProvider";
import type { OrgRole } from "@/features/org/schema";
import type { OrgMember } from "@features/org/schema";

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

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: OrgRole | null = null;
  if (user) {
    const members = await getOrgMembersAction(org.id).catch(() => [] as OrgMember[]);
    role = (members.find((m: OrgMember) => m.userId === user.id)?.role as OrgRole) ?? null;
  }

  return (
    <OrgProvider orgId={org.id} role={role}>
      {children}
    </OrgProvider>
  );
}
