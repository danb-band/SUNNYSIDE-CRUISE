"use client";

import { Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "./LogoutButton";
import ProfileButton from "./ProfileButton";
import { TabNav } from "./TabNav";

export function AppNav() {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 mb-4 flex-shrink-0">
      <TabNav />
      <div className="flex items-center gap-1 pb-1">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-50 dark:hover:bg-slate-700"
        >
          <a href="https://youtube.com/@dnab-dnab?si=iX2ulzqGQYl_4Xm9" target="_blank" rel="noopener noreferrer">
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
