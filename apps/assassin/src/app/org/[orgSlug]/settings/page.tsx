import { Suspense } from "react";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getOrgBySlugAction, updateOrgAction } from "@features/org/actions";
import { AppNav } from "@/components/navigation/AppNav";
import { DeleteOrgButton } from "./DeleteOrgButton";
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

  async function updateName(formData: FormData) {
    "use server";
    const name = formData.get("name") as string;
    await updateOrgAction(org!.id, { name });
    revalidatePath(`/org/${orgSlug}/settings`);
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
              <form key={org.name} action={updateName} className="flex flex-col gap-1.5">
                <Label htmlFor="name" className="text-slate-700 dark:text-slate-300">
                  조직 이름
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    required
                    maxLength={100}
                    defaultValue={org.name}
                    className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                  />
                  <Button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white">
                    저장
                  </Button>
                </div>
              </form>
            </section>

            <Separator />

            {/* 위험 구역 */}
            <section className="flex flex-col gap-4">
              <h2 className="text-xs font-medium text-red-500 uppercase tracking-wider">
                위험 구역
              </h2>
              <div className="rounded-lg border border-red-200 dark:border-red-900/60 p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-50">조직 삭제</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    삭제하면 모든 데이터가 영구적으로 제거됩니다.
                  </p>
                </div>
                <DeleteOrgButton orgId={org.id} orgName={org.name} />
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
