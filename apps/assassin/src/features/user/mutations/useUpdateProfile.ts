import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProfileAction } from "../actions";
import { userKeys } from "../queries/keys";
import type { UpdateProfilePayload } from "../schema";

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => updateProfileAction(payload),
    onSuccess: (updatedProfile) => {
      if (!updatedProfile) return;
      queryClient.setQueryData(userKeys.profile(), updatedProfile);
    },
  });
};
