import { useSuspenseQuery } from "@tanstack/react-query";
import { getPlayerAction } from "../actions";
import { playerKeys } from "./keys";

export const usePlayer = (id: string) => {
  return useSuspenseQuery({
    queryKey: playerKeys.detail(id),
    queryFn: () => getPlayerAction(id),
  });
};
