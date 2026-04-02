import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@libs/supabase/server";
import { getOrgBySlugAction, getOrgMembersAction, updateOrgAction, deleteOrgAction } from "@features/org/actions";
import type { OrgMember } from "@features/org/schema";

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
    <div className="max-w-lg mx-auto p-6 flex flex-col gap-8">
      <h1 className="text-2xl font-bold">설정</h1>

      {/* 조직 이름 수정 */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">일반</h2>
        <form action={updateName} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="name" className="text-sm font-medium">
              조직 이름
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              maxLength={100}
              defaultValue={org.name}
              className="border rounded-md px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="self-start px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
          >
            저장
          </button>
        </form>
      </section>

      {/* Danger Zone (OWNER 전용) */}
      {isOwner && (
        <section className="flex flex-col gap-4 border border-destructive rounded-md p-4">
          <h2 className="text-lg font-semibold text-destructive">위험 구역</h2>
          <p className="text-sm text-muted-foreground">
            조직을 삭제하면 모든 데이터가 영구적으로 제거됩니다. 이 작업은 되돌릴 수 없습니다.
          </p>
          <form action={deleteOrg}>
            <button
              type="submit"
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md text-sm font-medium"
            >
              조직 삭제
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
