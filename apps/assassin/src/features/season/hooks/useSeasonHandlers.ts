import { useCallback } from "react";
import { useCreateSeason } from "../mutations/useCreateSeason";
import { useDeleteSeason } from "../mutations/useDeleteSeason";
import { useUpdateSeason } from "../mutations/useUpdateSeason";
import { useSeasonForm } from "./useSeasonForm";
import type { SeasonPayload, SeasonUpdatePayload } from "../schema";

type UseSeasonHandlersProps =
  | {
      mode: "create";
      initialData: Partial<SeasonPayload>;
      onSuccess?: (message: string) => void;
      onError?: (error: string) => void;
    }
  | {
      mode: "update";
      seasonId: string;
      initialData: SeasonUpdatePayload;
      onSuccess?: (message: string) => void;
      onError?: (error: string) => void;
    };

export const useSeasonHandlers = (props: UseSeasonHandlersProps) => {
  const createSeasonMutation = useCreateSeason();
  const updateSeasonMutation = useUpdateSeason();
  const deleteSeasonMutation = useDeleteSeason();

  const formConfig =
    props.mode === "create"
      ? {
          mode: "create" as const,
          initialData: props.initialData ?? {},
          onSubmit: async (data: SeasonPayload) => {
            await createSeasonMutation.mutateAsync(data);
            props.onSuccess?.("Season created successfully");
          },
        }
      : {
          mode: "update" as const,
          seasonId: props.seasonId,
          initialData: props.initialData,
          onSubmit: async (id: string, data: SeasonUpdatePayload) => {
            await updateSeasonMutation.mutateAsync({ id, data });
            props.onSuccess?.("Season updated successfully");
          },
        };

  const form = useSeasonForm(formConfig);

  const { state: formState } = form;
  const { actions: formActions } = form;

  const handleSubmit = useCallback(async () => {
    try {
      const success = await formActions.submitForm();
      return { success };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to submit form";
      props.onError?.(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [formActions, props]);

  const handleChangeField = useCallback(
    (field: keyof SeasonPayload, value: string | number | boolean) => {
      formActions.updateField(field, value);
    },
    [formActions],
  );

  const handleArchiveSeason = useCallback(
    async (id: string) => {
      try {
        await updateSeasonMutation.mutateAsync({
          id,
          data: { isArchived: true },
        });
        props.onSuccess?.("Season archived successfully");
        return { success: true };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to archive season";
        props.onError?.(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [updateSeasonMutation, props],
  );

  // unarchive
  const handleRestoreSeason = useCallback(
    async (id: string) => {
      try {
        await updateSeasonMutation.mutateAsync({
          id,
          data: { isArchived: false },
        });
        props.onSuccess?.("Season restored successfully");
        return { success: true };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to restore season";
        props.onError?.(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [updateSeasonMutation, props],
  );

  const handleDeleteSeason = useCallback(
    async (id: string) => {
      try {
        await deleteSeasonMutation.mutateAsync({ id });
        props.onSuccess?.("Season deleted successfully");
        return { success: true };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to delete season";
        props.onError?.(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [deleteSeasonMutation, props],
  );

  // Loading states
  const isCreating = createSeasonMutation.isPending;
  const isUpdating = updateSeasonMutation.isPending;
  const isDeleting = deleteSeasonMutation.isPending;
  const isProcessing = isCreating || isUpdating || isDeleting;

  return {
    // Form state
    formState,

    // Handlers
    handleSubmit,
    handleChangeField,
    handleArchiveSeason,
    handleRestoreSeason,
    handleDeleteSeason,

    // States
    isProcessing,
  };
};
