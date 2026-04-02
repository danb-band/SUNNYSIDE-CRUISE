"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useDeleteOrg } from "../mutations/useDeleteOrg";

export function DeleteOrgButton({ orgId, orgName }: { orgId: string; orgName: string }) {
  const [input, setInput] = useState("");
  const router = useRouter();
  const deleteOrgMutation = useDeleteOrg();

  const isMatch = input === orgName;

  async function handleDelete() {
    if (!isMatch) return;
    await deleteOrgMutation.mutateAsync(orgId);
    router.push("/");
  }

  return (
    <AlertDialog onOpenChange={() => setInput("")}>
      <AlertDialogTrigger asChild>
        <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white shrink-0">
          조직 삭제
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>정말로 조직을 삭제하시겠습니까?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="flex flex-col gap-3">
              <p>
                이 작업은 되돌릴 수 없습니다.{" "}
                <strong className="text-slate-900 dark:text-slate-100">{orgName}</strong> 조직과
                모든 관련 데이터(시즌, 곡, 캘린더 등)가 영구적으로 삭제됩니다.
              </p>
              <div className="flex flex-col gap-1.5">
                <Label className="text-slate-700 dark:text-slate-300">
                  확인을 위해 조직 이름 <strong>{orgName}</strong>을 입력하세요
                </Label>
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={orgName}
                  className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <Button
            onClick={handleDelete}
            disabled={!isMatch || deleteOrgMutation.isPending}
            className="bg-red-500 hover:bg-red-600 text-white disabled:opacity-50"
          >
            {deleteOrgMutation.isPending ? "삭제 중..." : "삭제"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
