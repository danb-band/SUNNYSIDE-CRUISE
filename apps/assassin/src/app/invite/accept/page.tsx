import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@libs/supabase/server";
import OrgService from "@features/org/service";

// 에러 코드 → 유저에게 보여줄 메시지 매핑
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
        description: "초대 링크가 만료되었습니다. 조직 관리자에게 재초대를 요청해주세요.",
      };
    case "REVOKED":
      return {
        title: "취소된 초대",
        description: "초대가 취소되었습니다. 조직 관리자에게 문의해주세요.",
      };
    case "ALREADY_ACCEPTED":
      return {
        title: "이미 수락된 초대",
        description: "이미 조직의 멤버입니다.",
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
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return <InviteErrorCard code="INVALID_TOKEN" />;
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 미인증 → 로그인 후 이 페이지로 돌아오도록 next 파라미터 전달
  if (!user || !user.email) {
    redirect(`/login?next=${encodeURIComponent(`/invite/accept?token=${token}`)}`);
  }

  try {
    const org = await OrgService.acceptInvitation(token, user.id, user.email);
    redirect(`/org/${org.slug}`);
  } catch (error) {
    const code = error instanceof Error ? error.message : "ERROR";
    return <InviteErrorCard code={code} />;
  }
}
