import { useSuspenseQuery } from "@tanstack/react-query";
import { getCurrentUserProfileAction } from "../actions";
import { userKeys } from "./keys";

export const useCurrentUserProfile = () => {
  return useSuspenseQuery({
    queryKey: userKeys.profile(),
    queryFn: getCurrentUserProfileAction,
  });
};
