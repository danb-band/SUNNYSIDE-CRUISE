"use client";

import { LogoutButton } from "./LogoutButton";
import ProfileButton from "./ProfileButton";
import { TabNav } from "./TabNav";

export function AppNav() {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 mb-4 flex-shrink-0">
      <TabNav />
      <div className="flex items-center gap-1 pb-1">
        <ProfileButton />
        <LogoutButton />
      </div>
    </div>
  );
}
