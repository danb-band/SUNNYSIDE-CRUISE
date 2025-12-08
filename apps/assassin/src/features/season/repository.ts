import { prisma } from "@libs/prisma/client";
import { CreateSeasonInput, UpdateSeasonInput } from "./schema";

async function getAllSeasons() {
  const seasons = await prisma.season.findMany({
    orderBy: { created_at: "desc" },
  });
  return seasons;
}

async function getSeasonById(id: string) {
  const season = await prisma.season.findUnique({
    where: { id },
  });
  return season;
}

async function createSeason(input: CreateSeasonInput) {
  const season = await prisma.season.create({
    data: {
      name: input.name,
      order: input.order,
      is_archived: input.isArchived,
    },
  });
  return season;
}

async function updateSeason(id: string, input: UpdateSeasonInput) {
  const season = await prisma.season.update({
    where: { id },
    data: {
      name: input.name,
      order: input.order,
      is_archived: input.isArchived,
    },
  });
  return season;
}

async function deleteSeason(id: string) {
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
