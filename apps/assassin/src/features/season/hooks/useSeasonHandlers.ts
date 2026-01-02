import { useCallback } from "react";
import { useCreateSeason } from "../mutations/useCreateSeason";
import { useUpdateSeason } from "../mutations/useUpdateSeason";
import { useSeasonForm } from "./useSeasonForm";
import type { SeasonPayload, SeasonUpdatePayload } from "../schema";

interface UseSeasonHandlersProps {
  mode: "create" | "update";
  initialData?: Partial<SeasonPayload>;
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
}

export const useSeasonHandlers = ({
  mode,
  initialData = {},
  onSuccess,
  onError,
}: UseSeasonHandlersProps) => {
  const createSeasonMutation = useCreateSeason();
  const updateSeasonMutation = useUpdateSeason();

  const submit = useCallback(
    async (data: SeasonPayload | SeasonUpdatePayload) => {
      if (mode === "create") {
        await createSeasonMutation.mutateAsync(data as SeasonPayload);
        onSuccess?.("Season created successfully");
      } else {
        const updateData = data as SeasonUpdatePayload;
        if (!updateData.id) {
          throw new Error("Season ID is required for update");
        }
        await updateSeasonMutation.mutateAsync({ id: updateData.id, data: updateData });
        onSuccess?.("Season updated successfully");
      }
    },
    [mode, createSeasonMutation, updateSeasonMutation, onSuccess],
  );

  const form = useSeasonForm({
    mode,
    initialData,
    onSubmit: submit,
  });

  const { state: formState } = form;
  const { actions: formActions } = form;

  // Simplified submit handler with validation
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
    (field: keyof SeasonPayload, value: string | number | boolean) => {
      formActions.updateField(field, value);
    },
    [formActions],
  );

  const handleArchiveSeason = useCallback(
    async (data: SeasonUpdatePayload) => {
      try {
        await updateSeasonMutation.mutateAsync({
          id: data.id,
          data: { ...data, isArchived: true },
        });
        onSuccess?.("Season archived successfully");
        return { success: true };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to archive season";
        onError?.(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [updateSeasonMutation, onSuccess, onError],
  );

  // unarchive
  const handleRestoreSeason = useCallback(
    async (data: SeasonUpdatePayload) => {
      try {
        await updateSeasonMutation.mutateAsync({
          id: data.id,
          data: { ...data, isArchived: false },
        });
        onSuccess?.("Season restored successfully");
        return { success: true };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to restore season";
        onError?.(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [updateSeasonMutation, onSuccess, onError],
  );

  // Loading states
  const isCreating = createSeasonMutation.isPending;
  const isUpdating = updateSeasonMutation.isPending;
  const isProcessing = isCreating || isUpdating;

  return {
    // Form state
    formState,

    // Handlers
    handleSubmit,
    handleChangeField,
    handleArchiveSeason,
    handleRestoreSeason,

    // States
    isCreating,
    isUpdating,
    isProcessing,
  };
};
