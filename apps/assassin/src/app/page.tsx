import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Music } from "lucide-react";
import { createServerSupabaseClient } from "@libs/supabase/server";
import { getUserOrgsAction } from "@features/org/actions";
import type { Org } from "@features/org/schema";

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}

async function HomeContent() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const orgs = await getUserOrgsAction(user.id).catch((e) => {
    console.error("[Home] getUserOrgsAction 실패:", e);
    return [];
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
      <div className="w-full max-w-sm flex flex-col items-center gap-6">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500 mb-4">
            <Music className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">시작하기</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {orgs.length > 0
              ? "소속된 조직을 선택하세요."
              : "소속된 조직이 없습니다. 새 조직을 만들거나 초대를 확인하세요."}
          </p>
        </div>

        {orgs.length > 0 && (
          <div className="w-full flex flex-col gap-2">
            {orgs.map((org: Org) => (
              <Link
                key={org.id}
                href={`/org/${org.slug}/season`}
                className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-blue-500 hover:shadow-sm transition-all"
              >
                <span className="font-medium text-slate-900 dark:text-slate-50">{org.name}</span>
                <span className="text-xs text-slate-400">{org.slug}</span>
              </Link>
            ))}
          </div>
        )}

        <Link
          href="/org/create"
          className="w-full text-center px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-md font-medium text-sm transition-colors"
        >
          새 조직 만들기
        </Link>
      </div>
    </div>
  );
}
