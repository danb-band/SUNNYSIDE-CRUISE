"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { acceptInvitationByIdAction, cancelInvitationByInviteeAction } from "../actions";

interface Props {
  invitationId: string;
  orgName: string;
}

export function InviteAcceptClient({ invitationId, orgName }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [cancelled, setCancelled] = useState(false);

  const handleAccept = () => {
    startTransition(async () => {
      try {
        const org = await acceptInvitationByIdAction(invitationId);
        router.push(`/org/${org.slug}/season`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
      }
    });
  };

  const handleCancel = () => {
    startTransition(async () => {
      try {
        await cancelInvitationByInviteeAction(invitationId);
        setCancelled(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
      }
    });
  };

  if (cancelled) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
        <div className="w-full max-w-sm text-center space-y-4">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">초대를 거절했습니다</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {orgName} 조직의 초대를 거절했습니다.
          </p>
          <Link href="/" className="block text-sm text-blue-500 hover:text-blue-600">
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">{orgName}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">조직에 참가하시겠습니까?</p>
        </div>
        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            disabled={isPending}
            onClick={handleCancel}
          >
            거절
          </Button>
          <Button
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
            disabled={isPending}
            onClick={handleAccept}
          >
            {isPending ? "처리 중..." : "수락"}
          </Button>
        </div>
      </div>
    </div>
  );
}
