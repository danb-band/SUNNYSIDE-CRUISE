import { useQuery } from "@tanstack/react-query";
import { getSeasonsAction } from "../actions";
import { seasonKeys } from "./keys";

export const useSeasons = () => {
  return useQuery({
    queryKey: seasonKeys.lists(),
    queryFn: () => getSeasonsAction(),
  });
};
