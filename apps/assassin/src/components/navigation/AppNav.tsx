"use client";

import Link from "next/link";
import { House, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "./LogoutButton";
import ProfileButton from "./ProfileButton";
import { TabNav } from "./TabNav";

export function AppNav() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 mb-4 flex-shrink-0 pb-2 sm:pb-0">
      <div className="flex items-center min-w-0 gap-1">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-50 dark:hover:bg-slate-700"
        >
          <Link href="/onboarding" aria-label="조직 선택 화면으로 이동">
            <House className="h-4 w-4" />
            <span className="hidden sm:inline ml-2">Home</span>
          </Link>
        </Button>
        <TabNav />
      </div>

      <div className="flex items-center gap-1 pb-1 sm:pb-0">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-50 dark:hover:bg-slate-700"
        >
          <a
            href="https://youtube.com/@dnab-dnab?si=iX2ulzqGQYl_4Xm9"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Youtube className="h-4 w-4" />
            <span className="hidden sm:inline ml-2">YouTube</span>
          </a>
        </Button>
        <ProfileButton />
        <LogoutButton />
      </div>
    </div>
  );
}
