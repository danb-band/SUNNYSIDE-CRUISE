const shimmer =
  "bg-gradient-to-r from-sky-100 via-white to-fuchsia-100 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 animate-shimmer";

export function CalendarPageSkeleton() {
  const rows = Array.from({ length: 5 });

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <div className="w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6 h-full">
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-800 h-full flex flex-col min-h-0">
          <div className={`h-8 w-48 rounded mb-4 ${shimmer}`} />
          <div className="mb-4 flex justify-end">
            <div className={`h-9 w-24 rounded-md ${shimmer}`} />
          </div>
          <div className="space-y-2 flex-1">
            {rows.map((_, i) => (
              <div
                key={i}
                className={`h-16 rounded-md border border-slate-200/60 dark:border-slate-700/60 ${shimmer}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
