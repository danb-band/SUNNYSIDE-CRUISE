import { SeasonPageClient } from "@/components/season/SeasonPageClient";
import SeasonService from "@features/season/service";

export default async function Home() {
  const seasons = await SeasonService.getAllSeasons();

  return <SeasonPageClient seasons={seasons} />;
}
