import { useSuspenseQuery } from "@tanstack/react-query";
import { getSongAction } from "../actions";
import { songKeys } from "./keys";
import { Song } from "../schema";

export const useSong = (id: string, initialData?: Song) => {
  return useSuspenseQuery({
    queryKey: songKeys.detail(id),
    queryFn: () => getSongAction(id),
    initialData,
  });
};
