"use client";

import Link from "next/link";
import { UserPen } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProfileButton() {
  return (
    <Button
      variant="ghost"
      size="sm"
      asChild
      className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-50 dark:hover:bg-slate-700"
    >
      <Link href="/profile">
        <UserPen className="h-4 w-4" />
        <span className="hidden sm:inline ml-2">프로필 편집</span>
      </Link>
    </Button>
  );
}
