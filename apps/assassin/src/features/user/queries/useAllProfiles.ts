import { useSuspenseQuery } from "@tanstack/react-query";
import { getAllProfilesAction } from "../actions";
import { userKeys } from "./keys";

export const useAllProfiles = () => {
  return useSuspenseQuery({
    queryKey: userKeys.allProfiles(),
    queryFn: getAllProfilesAction,
  });
};
