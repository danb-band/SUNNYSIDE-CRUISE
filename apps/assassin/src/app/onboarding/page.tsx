import { getUserOrgsAction } from "@/features/org/actions";
import { createServerSupabaseClient } from "@/libs/supabase/server";
import { Link } from "lucide-react";
import { redirect } from "next/navigation";
import { Suspense } from "react";

type OnboardingOrg = {
  id: string;
  slug: string;
  name: string;
};

export default function OnboardingPage() {
  redirect("/");
  return (
    <Suspense>
      <OnboardingContent />
    </Suspense>
  );
}

async function OnboardingContent() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const orgs: OnboardingOrg[] = user
    ? await getUserOrgsAction().catch((e) => {
        console.error("[Onboarding] getUserOrgsAction 실패:", e);
        return [];
      })
    : [];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">시작하기</h1>
        <p className="text-muted-foreground">
          {orgs.length > 0
            ? "소속된 밴드를 선택하세요."
            : "소속된 밴드가 없습니다. 새 밴드를 만들거나 초대를 확인하세요."}
        </p>
      </div>

      {orgs.length > 0 && (
        <div className="w-full max-w-sm flex flex-col gap-2">
          {orgs.map((org) => (
            <Link
              key={org.id}
              href={`/org/${org.slug}/season`}
              className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-blue-500 hover:shadow-sm transition-all"
            >
              <span className="font-medium text-slate-900 dark:text-slate-50">{org.name}</span>
              <span className="text-xs text-slate-400">{org.slug}</span>
            </Link>
          ))}
        </div>
      )}

      <Link
        href="/org/new"
        className="px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium"
      >
        새 밴드 만들기
      </Link>
    </div>
  );
}
