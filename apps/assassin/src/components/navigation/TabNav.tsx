"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useOrgRole } from "@/components/org/OrgProvider";

export function TabNav() {
  const pathname = usePathname();
  const currentOrg = pathname.split("/")[2]; // Assuming URL structure is /org/[orgSlug]/...
  const role = useOrgRole();

  return (
    <div className="flex min-w-0">
      <Link
        href={`/org/${currentOrg}/season`}
        className={`px-3 sm:px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
          pathname.startsWith(`/org/${currentOrg}/season`)
            ? "border-blue-500 text-blue-600 dark:text-blue-400"
            : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        }`}
      >
        Season
      </Link>
      <Link
        href={`/org/${currentOrg}/calendar`}
        className={`px-3 sm:px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
          pathname.startsWith(`/org/${currentOrg}/calendar`)
            ? "border-blue-500 text-blue-600 dark:text-blue-400"
            : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        }`}
      >
        Calendar
      </Link>
      {role !== null && (
        <Link
          href={`/org/${currentOrg}/settings`}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            pathname.startsWith(`/org/${currentOrg}/settings`)
              ? "border-blue-500 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          Settings
        </Link>
      )}
    </div>
  );
}
