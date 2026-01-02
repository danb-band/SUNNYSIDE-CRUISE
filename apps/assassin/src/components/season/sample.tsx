"use client";
import { useSeasonLogic } from "@features/season/hooks/useSeasonLogic";

export default function SampleSeasonComponent() {
  const { activeSeasons } = useSeasonLogic();

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      {activeSeasons.map((season) => (
        <div
          key={season.id}
          className="m-4 rounded-lg border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
        >
          <h2 className="mb-4 text-2xl font-bold text-zinc-800 dark:text-zinc-200">
            {season.name}
          </h2>
        </div>
      ))}
    </div>
  );
}
