import { useSuspenseQuery } from "@tanstack/react-query";
import { getProfilesBySongAction } from "../actions";
import { userKeys } from "./keys";

export const useAllProfiles = (songId: string) => {
  return useSuspenseQuery({
    queryKey: userKeys.profilesBySong(songId),
    queryFn: () => getProfilesBySongAction(songId),
  });
};
