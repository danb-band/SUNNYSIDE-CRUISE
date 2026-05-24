import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@libs/supabase/server";
import { getUserOrgsAction, getPendingInvitationsForUserAction } from "@features/org/actions";
import { OrgSelectPageClient } from "@/components/org/OrgSelectPageClient";

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [orgs, pendingInvitations] = await Promise.all([
    getUserOrgsAction().catch((e) => {
      console.error("[Home] getUserOrgsAction 실패:", e);
      return [];
    }),
    getPendingInvitationsForUserAction().catch((e) => {
      console.error("[Home] getPendingInvitationsForUserAction 실패:", e);
      return [];
    }),
  ]);

  return <OrgSelectPageClient orgs={orgs} pendingInvitations={pendingInvitations} />;
}
