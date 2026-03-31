import { redirect } from "next/navigation";
import { getUserOrgsAction } from "@features/org/actions";
import { createClient } from "@libs/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const orgs = await getUserOrgsAction(user.id).catch(() => []);

  if (orgs.length === 0) {
    redirect("/onboarding");
  }

  if (orgs.length === 1) {
    redirect(`/org/${orgs[0].slug}/season`);
  }

  // 다중 org → org 선택 페이지 (현재는 첫 번째 org로 임시 redirect)
  redirect(`/org/${orgs[0].slug}/season`);
}
