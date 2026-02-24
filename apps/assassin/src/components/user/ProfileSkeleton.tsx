export function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-md bg-slate-100 dark:bg-slate-800 animate-pulse flex-shrink-0" />
                <div className="space-y-1.5">
                  <div className="h-5 w-32 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
                  <div className="h-4 w-48 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
                </div>
              </div>
              <div className="h-9 w-16 rounded-md bg-slate-100 dark:bg-slate-800 animate-pulse flex-shrink-0" />
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <div className="max-w-lg space-y-4">
              <div className="space-y-1.5">
                <div className="h-3 w-10 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
                <div className="h-9 w-full rounded-md bg-slate-100 dark:bg-slate-800 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
