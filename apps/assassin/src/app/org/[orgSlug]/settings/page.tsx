import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { notFound, redirect } from "next/navigation";
import { createServerSupabaseClient } from "@libs/supabase/server";
import { getQueryClient } from "@/libs/react-query/getQueryClient";
import { getOrgBySlugAction, getOrgMembersAction } from "@features/org/actions";
import type { Org, OrgMember } from "@features/org/schema";
import { orgKeys } from "@/features/org/queries/keys";
import { OrgSettingsPageClient } from "@/components/org/OrgSettingsPageClient";

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

  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({
    queryKey: orgKeys.bySlug(orgSlug),
    queryFn: () => getOrgBySlugAction(orgSlug),
  });

  const org = queryClient.getQueryData<Org>(orgKeys.bySlug(orgSlug));
  if (!org) notFound();

  const members = await getOrgMembersAction(org.id).catch(() => []);
  const currentMember = members.find((member: OrgMember) => member.userId === user.id);
  if (!currentMember) {
    redirect(`/org/${orgSlug}`);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <OrgSettingsPageClient orgSlug={orgSlug} />
    </HydrationBoundary>
  );
}
