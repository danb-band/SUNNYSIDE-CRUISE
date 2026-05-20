"use client";

import { useState, useTransition, useOptimistic } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Shield, ShieldOff, UserMinus } from "lucide-react";
import { AppNav } from "@/components/navigation/AppNav";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  inviteMemberAction,
  cancelInvitationAction,
  removeMemberAction,
  updateMemberRoleAction,
} from "@/features/org/actions";

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
  emailSentAt: Date | null;
};

type Org = {
  id: string;
  name: string;
  slug: string;
};

type PendingAction =
  | { type: "promote"; member: MemberWithProfile }
  | { type: "demote"; member: MemberWithProfile }
  | { type: "remove"; member: MemberWithProfile };

interface Props {
  org: Org;
  members: MemberWithProfile[];
  pendingInvitations: PendingInvitation[];
  currentUserId: string;
}

type MemberOptimisticAction =
  | { type: "promote" | "demote"; userId: string; role: "OWNER" | "MEMBER" }
  | { type: "remove"; userId: string };

export function MembersPageClient({ org, members, pendingInvitations, currentUserId }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteWarning, setInviteWarning] = useState<string | null>(null);
  const [memberActionError, setMemberActionError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [isPending, startTransition] = useTransition();
  const [optimisticMembers, updateOptimisticMembers] = useOptimistic(
    members,
    (state, action: MemberOptimisticAction) => {
      if (action.type === "remove") return state.filter((m) => m.userId !== action.userId);
      return state.map((m) => (m.userId === action.userId ? { ...m, role: action.role } : m));
    },
  );
  const [optimisticInvitations, addOptimisticInvitation] = useOptimistic(
    pendingInvitations,
    (
      state,
      action: { type: "add"; invitation: PendingInvitation } | { type: "remove"; id: string },
    ) => {
      if (action.type === "add") return [...state, action.invitation];
      if (action.type === "remove") return state.filter((inv) => inv.id !== action.id);
      return state;
    },
  );

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
      addOptimisticInvitation({
        type: "add",
        invitation: {
          id: result.data.id,
          email: result.data.email,
          expiresAt: result.data.expiresAt,
          emailSentAt: result.emailSent ? new Date() : null,
        },
      });
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
      addOptimisticInvitation({ type: "remove", id: invitationId });
      await cancelInvitationAction(invitationId, org.id);
      router.refresh();
    });
  };

  const handleReInvite = (invitationId: string, inviteeEmail: string) => {
    setInviteError(null);
    setInviteWarning(null);

    startTransition(async () => {
      addOptimisticInvitation({ type: "remove", id: invitationId });
      const result = await inviteMemberAction(org.id, { email: inviteeEmail, role: "MEMBER" });
      if (!result.success) {
        setInviteError(result.error);
        return;
      }
      addOptimisticInvitation({
        type: "add",
        invitation: {
          id: result.data.id,
          email: result.data.email,
          expiresAt: result.data.expiresAt,
          emailSentAt: result.emailSent ? new Date() : null,
        },
      });
      if (!result.emailSent) {
        setInviteWarning(
          `초대가 재발급되었지만 이메일 발송에 실패했습니다. (${result.emailError ?? "알 수 없는 오류"})`,
        );
      }
      router.refresh();
    });
  };

  const handleConfirmAction = () => {
    if (!pendingAction) return;
    const { type, member } = pendingAction;
    setPendingAction(null);
    setMemberActionError(null);

    startTransition(async () => {
      if (type === "promote") {
        updateOptimisticMembers({ type: "promote", userId: member.userId, role: "OWNER" });
        const result = await updateMemberRoleAction(org.id, member.userId, "OWNER");
        if (!result.success) {
          setMemberActionError(result.error);
          router.refresh();
          return;
        }
      } else if (type === "demote") {
        updateOptimisticMembers({ type: "demote", userId: member.userId, role: "MEMBER" });
        const result = await updateMemberRoleAction(org.id, member.userId, "MEMBER");
        if (!result.success) {
          setMemberActionError(result.error);
          router.refresh();
          return;
        }
      } else {
        updateOptimisticMembers({ type: "remove", userId: member.userId });
        await removeMemberAction(org.id, member.userId);
      }
      router.refresh();
    });
  };

  const memberName = pendingAction?.member.profile?.name ?? "알 수 없음";

  const dialogConfig = pendingAction
    ? pendingAction.type === "promote"
      ? {
          title: "오너로 변경",
          description: `${memberName}님에게 오너 권한을 부여합니다. 오너는 멤버 관리, 설정 변경 등 모든 권한을 가집니다.`,
          confirmLabel: "오너로 변경",
          tone: "default" as const,
          icon: <Shield className="h-4 w-4" />,
        }
      : pendingAction.type === "demote"
        ? {
            title: "멤버로 변경",
            description: `${memberName}님의 권한을 멤버로 낮춥니다.`,
            confirmLabel: "멤버로 변경",
            tone: "default" as const,
            icon: <ShieldOff className="h-4 w-4" />,
          }
        : {
            title: "멤버 제거",
            description: `${memberName}님을 조직에서 제거합니다. 이 작업은 되돌릴 수 없습니다.`,
            confirmLabel: "제거",
            tone: "destructive" as const,
            icon: <UserMinus className="h-4 w-4" />,
          }
    : null;

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
            {optimisticInvitations.length > 0 && (
              <>
                <section className="flex flex-col gap-4">
                  <h2 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    초대 대기 중 ({optimisticInvitations.length})
                  </h2>
                  <ul className="flex flex-col gap-2">
                    {optimisticInvitations.map((inv) => {
                      const isExpired = new Date(inv.expiresAt) <= new Date();
                      return (
                        <li
                          key={inv.id}
                          className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 px-4 py-3"
                        >
                          <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                              {inv.email}
                            </p>
                            {isExpired ? (
                              <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">
                                만료됨 ({new Date(inv.expiresAt).toLocaleDateString("ko-KR")})
                              </p>
                            ) : (
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                만료: {new Date(inv.expiresAt).toLocaleDateString("ko-KR")}
                              </p>
                            )}
                            {!inv.emailSentAt && (
                              <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-0.5">
                                이메일 미발송
                              </p>
                            )}
                          </div>
                          {isExpired ? (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isPending}
                              onClick={() => handleReInvite(inv.id, inv.email)}
                              className="text-slate-700 border-slate-300 hover:bg-slate-100 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-800"
                            >
                              재초대
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={isPending}
                              onClick={() => handleCancelInvitation(inv.id)}
                              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                            >
                              취소
                            </Button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </section>
                <Separator />
              </>
            )}

            {/* 멤버 목록 */}
            <section className="flex flex-col gap-4">
              <h2 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                멤버 ({optimisticMembers.length})
              </h2>
              {memberActionError && <p className="text-sm text-red-500">{memberActionError}</p>}
              <ul className="flex flex-col gap-2">
                {optimisticMembers.map((member) => {
                  const isCurrentUser = member.userId === currentUserId;
                  return (
                    <li
                      key={member.id}
                      className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                          {member.profile?.name ?? "알 수 없음"}
                          {isCurrentUser && (
                            <span className="ml-2 text-xs text-slate-400 dark:text-slate-500">
                              (나)
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {member.role === "OWNER" ? "오너" : "멤버"}
                        </p>
                      </div>
                      {!isCurrentUser && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={isPending}
                              className="h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:text-slate-500 dark:hover:text-slate-300 dark:hover:bg-slate-800"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-md"
                          >
                            {member.role === "MEMBER" ? (
                              <DropdownMenuItem
                                onClick={() => setPendingAction({ type: "promote", member })}
                                className="text-slate-700 dark:text-slate-300 focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer"
                              >
                                <Shield className="h-4 w-4 mr-2 text-slate-400" />
                                오너로 변경
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => setPendingAction({ type: "demote", member })}
                                className="text-slate-700 dark:text-slate-300 focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer"
                              >
                                <ShieldOff className="h-4 w-4 mr-2 text-slate-400" />
                                멤버로 변경
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800" />
                            <DropdownMenuItem
                              onClick={() => setPendingAction({ type: "remove", member })}
                              className="text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950/40 cursor-pointer"
                            >
                              <UserMinus className="h-4 w-4 mr-2" />
                              멤버 제거
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>
        </div>
      </div>

      {dialogConfig && (
        <ConfirmDialog
          open={pendingAction !== null}
          onOpenChange={(open) => {
            if (!open) setPendingAction(null);
          }}
          title={dialogConfig.title}
          description={dialogConfig.description}
          confirmLabel={dialogConfig.confirmLabel}
          tone={dialogConfig.tone}
          icon={dialogConfig.icon}
          onConfirm={handleConfirmAction}
          isConfirming={isPending}
        />
      )}
    </div>
  );
}
