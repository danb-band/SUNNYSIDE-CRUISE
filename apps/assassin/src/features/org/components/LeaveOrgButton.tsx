"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { leaveOrgAction } from "../actions";

export function LeaveOrgButton({ orgId }: { orgId: string }) {
  const router = useRouter();
  const [isLeaving, startLeaveTransition] = useTransition();

  function handleLeave() {
    startLeaveTransition(async () => {
      await leaveOrgAction(orgId);
      router.push("/");
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white shrink-0">
          조직 나가기
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>정말로 조직에서 나가시겠습니까?</AlertDialogTitle>
          <AlertDialogDescription>
            조직에서 나가면 더 이상 접근할 수 없습니다. 재참여하려면 다시 초대를 받아야 합니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <Button
            onClick={handleLeave}
            disabled={isLeaving}
            className="bg-red-500 hover:bg-red-600 text-white disabled:opacity-50"
          >
            {isLeaving ? "처리 중..." : "나가기"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
