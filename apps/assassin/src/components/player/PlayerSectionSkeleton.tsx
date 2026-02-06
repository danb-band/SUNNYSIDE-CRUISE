"use client";

export function PlayerSectionSkeleton() {
  return (
    <div className="px-4 sm:px-5 py-4 animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-4 w-4 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-4 w-16 rounded bg-slate-200 dark:bg-slate-700" />
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-5 w-14 rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-5 w-14 rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="h-4 w-20 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>
    </div>
  );
}
