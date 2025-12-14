import { useSuspenseQuery } from "@tanstack/react-query";
import { getPlayersAction } from "../actions";
import { playerKeys } from "./keys";

export const usePlayers = () => {
  return useSuspenseQuery({
    queryKey: playerKeys.lists(),
    queryFn: () => getPlayersAction(),
  });
};
