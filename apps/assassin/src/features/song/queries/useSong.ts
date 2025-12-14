import { useSuspenseQuery } from "@tanstack/react-query";
import { getSongAction } from "../actions";
import { songKeys } from "./keys";

export const useSong = (id: string) => {
  return useSuspenseQuery({
    queryKey: songKeys.detail(id),
    queryFn: () => getSongAction(id),
  });
};
