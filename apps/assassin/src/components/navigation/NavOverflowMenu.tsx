"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Menu, UserPen, Youtube } from "lucide-react";
import { createBrowserSupabaseClient } from "@/libs/supabase/client";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function NavOverflowMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const handleConfirmLogout = async () => {
    setLogoutOpen(false);
    setOpen(false);

    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-50 dark:hover:bg-slate-700"
            aria-label="메뉴 열기"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align="end"
          className="w-52 p-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg"
        >
          <div className="flex flex-col gap-1">
            {/* <a
              href="https://youtube.com/@dnab-dnab?si=iX2ulzqGQYl_4Xm9"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center rounded-md px-2 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50"
              onClick={() => setOpen(false)}
            >
              <Youtube className="mr-2 h-4 w-4" />
              YouTube
            </a> */}

            <Link
              href="/profile"
              className="flex items-center rounded-md px-2 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50"
              onClick={() => setOpen(false)}
            >
              <UserPen className="mr-2 h-4 w-4" />
              프로필 편집
            </Link>

            <button
              type="button"
              className="flex items-center rounded-md px-2 py-2 text-left text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50"
              onClick={() => {
                setOpen(false);
                setLogoutOpen(true);
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              로그아웃
            </button>
          </div>
        </PopoverContent>
      </Popover>

      <ConfirmDialog
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        title="로그아웃"
        description="정말 로그아웃 하시겠어요?"
        confirmLabel="로그아웃"
        cancelLabel="취소"
        onConfirm={handleConfirmLogout}
        isConfirming={false}
        tone="default"
        icon={<LogOut className="h-4 w-4" />}
      />
    </>
  );
}
