import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@libs/supabase/server";
import {
  getOrgBySlugAction,
  getOrgMembersAction,
  updateOrgAction,
  deleteOrgAction,
} from "@features/org/actions";
import type { OrgMember } from "@features/org/schema";
import { AppNav } from "@/components/navigation/AppNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface Props {
  params: Promise<{ orgSlug: string }>;
}

export default function SettingsPage({ params }: Props) {
  return (
    <Suspense>
      <SettingsContent params={params} />
    </Suspense>
  );
}

async function SettingsContent({ params }: Props) {
  const { orgSlug } = await params;

  const org = await getOrgBySlugAction(orgSlug).catch(() => null);
  if (!org) notFound();

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const members = await getOrgMembersAction(org.id).catch(() => []);
  const currentRole = members.find((m: OrgMember) => m.userId === user.id)?.role ?? "MEMBER";
  const isOwner = currentRole === "OWNER";

  async function updateName(formData: FormData) {
    "use server";
    const name = formData.get("name") as string;
    await updateOrgAction(org!.id, { name });
    revalidatePath(`/org/${orgSlug}/settings`);
  }

  async function deleteOrg() {
    "use server";
    await deleteOrgAction(org!.id);
    redirect("/");
  }

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <div className="w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6 h-full">
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-800 h-full flex flex-col min-h-0 overflow-y-auto">
          <AppNav />

          <div className="max-w-lg flex flex-col gap-8 pt-4">
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">설정</h1>

            {/* 일반 */}
            <section className="flex flex-col gap-4">
              <h2 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                일반
              </h2>
              <form action={updateName} className="flex flex-col gap-1.5">
                <Label htmlFor="name">조직 이름</Label>
                <div className="flex gap-2">
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    required
                    maxLength={100}
                    defaultValue={org.name}
                  />
                  <Button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white">
                    저장
                  </Button>
                </div>
              </form>
            </section>

            {/* Danger Zone — OWNER 전용 */}
            {isOwner && (
              <>
                <Separator />
                <section className="flex flex-col gap-4">
                  <h2 className="text-xs font-medium text-red-500 uppercase tracking-wider">
                    위험 구역
                  </h2>
                  <div className="rounded-lg border border-red-200 dark:border-red-900/60 p-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                        조직 삭제
                      </p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        삭제하면 모든 데이터가 영구적으로 제거됩니다.
                      </p>
                    </div>
                    <form action={deleteOrg}>
                      <Button type="submit" variant="destructive" size="sm">
                        삭제
                      </Button>
                    </form>
                  </div>
                </section>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
