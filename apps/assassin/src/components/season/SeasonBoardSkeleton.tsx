export function SeasonBoardSkeleton() {
  const columns = Array.from({ length: 4 });
  const cards = Array.from({ length: 4 });
  const shimmer =
    "bg-gradient-to-r from-sky-100 via-white to-fuchsia-100 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 animate-shimmer";

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <div className="w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6 h-full">
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-800 h-full flex flex-col min-h-0">
          <div className="mb-4 sm:mb-6 flex items-center justify-between flex-shrink-0">
            <div className={`h-9 w-32 rounded-md ${shimmer}`} />
            <div className={`h-9 w-24 rounded-md ${shimmer}`} />
          </div>
          <div className="flex-1 min-h-0">
            <div className="h-full min-h-0">
              <div className="flex h-full overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth sm:hidden">
                {columns.map((_, index) => (
                  <div
                    key={`mobile-col-${index}`}
                    className="min-w-0 flex-shrink-0 w-full snap-center h-full"
                  >
                    <div className="h-full rounded-lg border border-slate-200/70 dark:border-slate-700/70 bg-gradient-to-b from-sky-50 via-white to-fuchsia-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 p-4 flex flex-col">
                      <div className={`h-5 w-24 rounded ${shimmer}`} />
                      <div className="mt-4 space-y-3 flex-1">
                        {cards.map((__, cardIndex) => (
                          <div
                            key={`mobile-card-${index}-${cardIndex}`}
                            className={`h-16 rounded-md border border-slate-200/60 dark:border-slate-700/60 ${shimmer}`}
                          />
                        ))}
                      </div>
                      <div className={`mt-4 h-9 rounded-md ${shimmer}`} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="hidden h-full min-h-0 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 auto-rows-fr sm:grid">
                {columns.map((_, index) => (
                  <div
                    key={`col-${index}`}
                    className="rounded-lg border border-slate-200/70 dark:border-slate-700/70 bg-gradient-to-b from-sky-50 via-white to-fuchsia-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 p-4 flex flex-col"
                  >
                    <div className={`h-5 w-28 rounded ${shimmer}`} />
                    <div className="mt-4 space-y-3 flex-1">
                      {cards.map((__, cardIndex) => (
                        <div
                          key={`card-${index}-${cardIndex}`}
                          className={`h-16 rounded-md border border-slate-200/60 dark:border-slate-700/60 ${shimmer}`}
                        />
                      ))}
                    </div>
                    <div className={`mt-4 h-9 rounded-md ${shimmer}`} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
