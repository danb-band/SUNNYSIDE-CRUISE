import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@libs/supabase/server";
import { getOrgBySlugAction, getOrgMembersAction } from "@features/org/actions";
import type { OrgMember } from "@features/org/schema";

interface Props {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}

export default async function SettingsLayout({ children, params }: Props) {
  const { orgSlug } = await params;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const org = await getOrgBySlugAction(orgSlug).catch(() => null);
  if (!org) redirect("/");

  const members = await getOrgMembersAction(org.id).catch(() => []);
  const currentMember = members.find((m: OrgMember) => m.userId === user.id);
  const hasAccess = currentMember?.role === "OWNER";

  if (!hasAccess) redirect(`/org/${orgSlug}`);

  return <>{children}</>;
}
