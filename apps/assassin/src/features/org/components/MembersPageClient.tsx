"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AppNav } from "@/components/navigation/AppNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { inviteMemberAction, cancelInvitationAction, removeMemberAction } from "../actions";

type MemberWithProfile = {
  id: string;
  userId: string;
  role: string;
  profile: { name: string; realName: string } | null;
};

type PendingInvitation = {
  id: string;
  email: string;
  expiresAt: Date;
};

type Org = {
  id: string;
  name: string;
  slug: string;
};

interface Props {
  org: Org;
  members: MemberWithProfile[];
  pendingInvitations: PendingInvitation[];
  currentUserId: string;
}

export function MembersPageClient({ org, members, pendingInvitations, currentUserId }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteWarning, setInviteWarning] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);
    setInviteWarning(null);

    startTransition(async () => {
      const result = await inviteMemberAction(org.id, { email, role: "MEMBER" });
      if (!result.success) {
        setInviteError(result.error);
        return;
      }
      setEmail("");
      if (!result.emailSent) {
        setInviteWarning(
          `초대가 생성되었지만 이메일 발송에 실패했습니다. (${result.emailError ?? "알 수 없는 오류"})`,
        );
      }
      router.refresh();
    });
  };

  const handleCancelInvitation = (invitationId: string) => {
    startTransition(async () => {
      await cancelInvitationAction(invitationId, org.id);
      router.refresh();
    });
  };

  const handleResendInvitation = (targetEmail: string) => {
    setInviteError(null);
    setInviteWarning(null);

    startTransition(async () => {
      const result = await inviteMemberAction(org.id, { email: targetEmail, role: "MEMBER" });
      if (!result.success) {
        setInviteError(result.error);
        return;
      }

      if (!result.emailSent) {
        setInviteWarning(
          `재발송 초대가 생성되었지만 이메일 발송에 실패했습니다. (${result.emailError ?? "알 수 없는 오류"})`,
        );
      }
      router.refresh();
    });
  };

  const handleRemoveMember = (targetUserId: string) => {
    startTransition(async () => {
      await removeMemberAction(org.id, targetUserId);
      router.refresh();
    });
  };

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <div className="w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6 h-full">
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-800 h-full flex flex-col min-h-0 overflow-y-auto">
          <AppNav />

          <div className="max-w-lg flex flex-col gap-8 pt-4">
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">멤버 관리</h1>

            {/* 초대 폼 */}
            <section className="flex flex-col gap-4">
              <h2 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                멤버 초대
              </h2>
              <form onSubmit={handleInvite} className="flex flex-col gap-1.5">
                <Label htmlFor="invite-email" className="text-slate-700 dark:text-slate-300">
                  이메일
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isPending}
                    className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                  />
                  <Button
                    type="submit"
                    disabled={isPending || !email}
                    className="bg-blue-500 hover:bg-blue-600 text-white shrink-0"
                  >
                    {isPending ? "전송 중..." : "초대"}
                  </Button>
                </div>
                {inviteError && <p className="text-sm text-red-500">{inviteError}</p>}
                {inviteWarning && <p className="text-sm text-yellow-600">{inviteWarning}</p>}
              </form>
            </section>

            <Separator />

            {/* 대기 중인 초대 */}
            {pendingInvitations.length > 0 && (
              <>
                <section className="flex flex-col gap-4">
                  <h2 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    초대 대기 중 ({pendingInvitations.length})
                  </h2>
                  <ul className="flex flex-col gap-2">
                    {pendingInvitations.map((inv) => (
                      <li
                        key={inv.id}
                        className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                            {inv.email}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            만료: {new Date(inv.expiresAt).toLocaleDateString("ko-KR")}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isPending}
                            onClick={() => handleResendInvitation(inv.email)}
                            className="text-slate-700 border-slate-300 hover:bg-slate-100 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-800"
                          >
                            이메일 재발송
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isPending}
                            onClick={() => handleCancelInvitation(inv.id)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                          >
                            취소
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
                <Separator />
              </>
            )}

            {/* 멤버 목록 */}
            <section className="flex flex-col gap-4">
              <h2 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                멤버 ({members.length})
              </h2>
              <ul className="flex flex-col gap-2">
                {members.map((member) => (
                  <li
                    key={member.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                        {member.profile?.name ?? "알 수 없음"}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {member.role === "OWNER" ? "오너" : "멤버"}
                      </p>
                    </div>
                    {member.role !== "OWNER" && member.userId !== currentUserId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleRemoveMember(member.userId)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                      >
                        제거
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
