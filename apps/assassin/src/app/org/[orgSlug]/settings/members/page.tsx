import { redirect } from "next/navigation";
import { cacheLife, cacheTag } from "next/cache";
import { createServerSupabaseClient } from "@libs/supabase/server";
import { getOrgBySlugAction, getCurrentUserOrgRoleAction } from "@features/org/actions";
import OrgService from "@features/org/service";
import { ORG_MEMBERS_CACHE_TAG } from "@libs/cache/orgMembers";
import { MembersPageClient } from "@/components/org/MembersPageClient";
import type { Org } from "@features/org/schema";

interface Props {
  params: Promise<{ orgSlug: string }>;
}

async function MembersPageData({ org, userId }: { org: Org; userId: string }) {
  "use cache";
  cacheTag(`${ORG_MEMBERS_CACHE_TAG}-${org.id}`);
  cacheLife("minutes");

  const [members, pendingInvitations] = await Promise.all([
    OrgService.getOrgMembers(org.id, userId),
    OrgService.getPendingInvitations(org.id, userId),
  ]);

  return (
    <MembersPageClient
      org={org}
      members={members}
      pendingInvitations={pendingInvitations}
      currentUserId={userId}
    />
  );
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

  const role = await getCurrentUserOrgRoleAction(org.id).catch(() => null);
  if (role !== "OWNER") redirect(`/org/${orgSlug}`);

  return <MembersPageData org={org} userId={user.id} />;
}
