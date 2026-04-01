import { redirect } from "next/navigation";
import { getUserOrgsAction } from "@features/org/actions";
import { createServerSupabaseClient } from "@libs/supabase/server";

export default async function Home() {
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

  if (orgs.length === 0) {
    redirect("/onboarding");
  }

  // org 선택은 onboarding에서
  redirect("/onboarding");
}
