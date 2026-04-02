import { notFound, redirect } from "next/navigation";
import { createServerSupabaseClient } from "@libs/supabase/server";
import { getOrgBySlugAction, getOrgMembersAction } from "@features/org/actions";
import type { OrgMember } from "@features/org/schema";
import { OrgSettingsPageClient } from "@/features/org/components/OrgSettingsPageClient";

interface Props {
  params: Promise<{ orgSlug: string }>;
}

export default async function SettingsPage({ params }: Props) {
  const { orgSlug } = await params;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const org = await getOrgBySlugAction(orgSlug).catch(() => null);
  if (!org) notFound();

  const members = await getOrgMembersAction(org.id).catch(() => []);
  const currentMember = members.find((member: OrgMember) => member.userId === user.id);
  if (currentMember?.role !== "OWNER") {
    redirect(`/org/${orgSlug}`);
  }

  return <OrgSettingsPageClient orgId={org.id} orgName={org.name} />;
}
