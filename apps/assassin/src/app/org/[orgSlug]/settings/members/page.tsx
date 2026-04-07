import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@libs/supabase/server";
import {
  getOrgBySlugAction,
  getOrgMembersAction,
  getPendingInvitationsAction,
} from "@features/org/actions";
import { MembersPageClient } from "@features/org/components/MembersPageClient";

interface Props {
  params: Promise<{ orgSlug: string }>;
}

export default async function SettingsMembersPage({ params }: Props) {
  const { orgSlug } = await params;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const org = await getOrgBySlugAction(orgSlug).catch(() => null);
  if (!org) redirect(`/org/${orgSlug}`);

  const [members, pendingInvitations] = await Promise.all([
    getOrgMembersAction(org.id).catch(() => []),
    getPendingInvitationsAction(org.id).catch(() => []),
  ]);

  // OWNER만 접근 가능
  const currentMember = members.find((m) => m.userId === user.id);
  if (currentMember?.role !== "OWNER") redirect(`/org/${orgSlug}`);

  return (
    <MembersPageClient
      org={org}
      members={members}
      pendingInvitations={pendingInvitations}
      currentUserId={user.id}
    />
  );
}
