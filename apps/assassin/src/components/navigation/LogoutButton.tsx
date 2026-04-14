"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@libs/supabase/client";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleConfirm = async () => {
    setOpen(false);
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 hover:cursor-pointer dark:text-slate-400 dark:hover:text-slate-50 dark:hover:bg-slate-700"
      >
        <LogOut className="mr-2 h-4 w-4" />
        로그아웃
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="로그아웃"
        description="정말 로그아웃 하시겠어요?"
        confirmLabel="로그아웃"
        cancelLabel="취소"
        onConfirm={handleConfirm}
        isConfirming={false}
        tone="default"
        icon={<LogOut className="h-4 w-4" />}
      />
    </>
  );
}
