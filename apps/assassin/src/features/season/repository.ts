import { prisma } from "@libs/prisma/client";
import type { Season } from "@generated/prisma/client";
import { SeasonPayload, SeasonUpdatePayload } from "./schema";

async function getAllSeasons(): Promise<Season[]> {
  const seasons = await prisma.season.findMany({
    orderBy: { created_at: "desc" },
  });
  return seasons;
}

async function getSeasonById(id: string): Promise<Season | null> {
  const season = await prisma.season.findUnique({
    where: { id },
  });
  return season;
}

async function createSeason(input: SeasonPayload): Promise<Season> {
  const season = await prisma.season.create({
    data: {
      name: input.name,
      sort_order: input.sortOrder,
      is_archived: input.isArchived,
    },
  });
  return season;
}

async function updateSeason(id: string, input: SeasonUpdatePayload): Promise<Season> {
  const season = await prisma.season.update({
    where: { id },
    data: {
      name: input.name,
      sort_order: input.sortOrder,
      is_archived: input.isArchived,
    },
  });
  return season;
}

async function deleteSeason(id: string): Promise<void> {
  await prisma.season.delete({
    where: { id },
  });
}

const SeasonRepository = {
  getAllSeasons,
  getSeasonById,
  createSeason,
  updateSeason,
  deleteSeason,
};

export default SeasonRepository;
