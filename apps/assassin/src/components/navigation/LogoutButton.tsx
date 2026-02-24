"use client";

import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@libs/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.refresh();
    router.push("/login");
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLogout}
      className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 hover:cursor-pointer dark:text-slate-400 dark:hover:text-slate-50 dark:hover:bg-slate-700"
    >
      <LogOut className="mr-2 h-4 w-4" />
      로그아웃
    </Button>
  );
}
