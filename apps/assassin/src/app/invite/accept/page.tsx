import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@libs/supabase/server";
import OrgService from "@features/org/service";
import { InviteAcceptClient } from "@/components/org/InviteAcceptClient";

function getErrorContent(code: string): { title: string; description: string } {
  switch (code) {
    case "INVALID_TOKEN":
      return {
        title: "유효하지 않은 초대",
        description: "초대 링크가 올바르지 않습니다. 이메일에서 링크를 다시 확인해주세요.",
      };
    case "EXPIRED":
      return {
        title: "만료된 초대",
        description: "초대 링크가 만료되었습니다. 밴드 관리자에게 재초대를 요청해주세요.",
      };
    case "REVOKED":
      return {
        title: "취소된 초대",
        description: "초대가 취소되었습니다. 밴드 관리자에게 문의해주세요.",
      };
    case "ALREADY_ACCEPTED":
      return {
        title: "이미 수락된 초대",
        description: "이미 밴드의 멤버입니다.",
      };
    case "EMAIL_MISMATCH":
      return {
        title: "이메일 불일치",
        description:
          "이 초대는 다른 이메일 주소로 발송되었습니다. 초대받은 이메일 계정으로 로그인 후 다시 시도해주세요.",
      };
    default:
      return {
        title: "오류 발생",
        description: "초대 수락 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      };
  }
}

function InviteErrorCard({ code }: { code: string }) {
  const { title, description } = getErrorContent(code);
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
      <div className="w-full max-w-sm text-center space-y-4">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">{title}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
        <Link href="/" className="block text-sm text-blue-500 hover:text-blue-600">
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}

export default async function InviteAcceptPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; id?: string }>;
}) {
  const { token, id } = await searchParams;

  if (!token && !id) {
    return <InviteErrorCard code="INVALID_TOKEN" />;
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    if (token) {
      // 미인증 + 이메일 링크: 로그인 후 orga 선택 페이지로 이동
      // (선택 페이지에서 pending 초대 목록을 이메일로 조회해 표시)
      redirect("/signup");
    } else {
      redirect(`/signup?next=${encodeURIComponent(`/invite/accept?id=${id}`)}`);
    }
  }

  let info: { invitationId: string; orgName: string };
  try {
    info = await OrgService.getInvitationInfo({ token, id }, user.email);
  } catch (error) {
    const code = error instanceof Error ? error.message : "ERROR";
    return <InviteErrorCard code={code} />;
  }

  return <InviteAcceptClient invitationId={info.invitationId} orgName={info.orgName} />;
}
