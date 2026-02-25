import { useCallback } from "react";
import { useUpdateProfile } from "../mutations/useUpdateProfile";
import { useProfileForm, ProfileFormData } from "./useProfileForm";

interface UseProfileHandlersProps {
  initialData: Partial<ProfileFormData>;
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
}

export const useProfileHandlers = ({
  initialData,
  onSuccess,
  onError,
}: UseProfileHandlersProps) => {
  const updateProfileMutation = useUpdateProfile();

  const form = useProfileForm({
    initialData,
    onSubmit: async (data) => {
      await updateProfileMutation.mutateAsync(data);
      onSuccess?.("프로필이 업데이트되었습니다");
    },
  });

  const { state: formState, actions: formActions } = form;

  const handleSubmit = useCallback(async () => {
    try {
      const success = await formActions.submitForm();
      return { success };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to submit form";
      onError?.(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [formActions, onError]);

  const handleChangeField = useCallback(
    (field: keyof ProfileFormData, value: string) => {
      formActions.updateField(field, value);
    },
    [formActions],
  );

  return {
    formState,
    handleSubmit,
    handleChangeField,
    isProcessing: updateProfileMutation.isPending,
  };
};
