import { SeasonBoard } from "@/components/season/SeasonBoard";
import { ArchiveToggleLink } from "@/components/season/ArchiveToggleLink";
import SeasonService from "@features/season/service";

interface HomeProps {
  searchParams: Promise<{ view?: string }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const { view } = await searchParams;
  const showArchived = view === "archived";

  const seasons = await SeasonService.getAllSeasons();
  const filteredSeasons = seasons.filter((season) =>
    showArchived ? season.isArchived : !season.isArchived,
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-[calc(100vw-4rem)] p-8">
        <div className="bg-white dark:bg-slate-900 rounded-lg p-6 shadow-sm border border-slate-200 dark:border-slate-800 min-h-[800px]">
          <div className="mb-6 flex items-center justify-start">
            <ArchiveToggleLink showArchived={showArchived} />
          </div>
          <SeasonBoard seasons={filteredSeasons} />
        </div>
      </div>
    </div>
  );
}
