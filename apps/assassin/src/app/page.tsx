import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@libs/supabase/server";
import { getUserOrgsAction } from "@features/org/actions";
import { OrgSelectPageClient } from "@/features/org/components/OrgSelectPageClient";

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const orgs = await getUserOrgsAction(user.id).catch((e) => {
    console.error("[Home] getUserOrgsAction 실패:", e);
    return [];
  });

  return <OrgSelectPageClient orgs={orgs} />;
}
