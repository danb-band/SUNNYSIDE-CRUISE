import { useCallback } from "react";
import { useCreateSong } from "../mutations/useCreateSong";
import { useUpdateSong } from "../mutations/useUpdateSong";
import { useDeleteSong } from "../mutations/useDeleteSong";
import { useSongForm } from "./useSongForm";
import type { SongPayload, SongUpdatePayload } from "../schema";

interface UseSongHandlersProps {
  mode: "create" | "update";
  initialData?: Partial<SongPayload>;
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
}

export const useSongHandlers = (props: UseSongHandlersProps) => {
  const { mode, initialData = {}, onSuccess, onError } = props;

  const createSongMutation = useCreateSong();
  const updateSongMutation = useUpdateSong();
  const deleteSongMutation = useDeleteSong();

  const submit = useCallback(
    async (data: SongPayload | SongUpdatePayload) => {
      if (mode === "create") {
        await createSongMutation.mutateAsync(data as SongPayload);
        onSuccess?.("Song created successfully");
        return;
      }

      const updateData = data as SongUpdatePayload;
      if (!updateData.id) {
        throw new Error("Song ID is required for update");
      }
      await updateSongMutation.mutateAsync({ id: updateData.id, data: updateData });
      onSuccess?.("Song updated successfully");
    },
    [mode, createSongMutation, updateSongMutation, onSuccess],
  );

  const form = useSongForm({
    mode,
    initialData,
    onSubmit: submit,
  });

  const { state: formState } = form;
  const { actions: formActions } = form;

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
    (field: keyof SongPayload, value: string | number) => {
      formActions.updateField(field, value);
    },
    [formActions],
  );

  const handleDeleteSong = useCallback(
    async (id: string) => {
      try {
        await deleteSongMutation.mutateAsync(id);
        onSuccess?.("Song deleted successfully");
        return { success: true };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to delete song";
        onError?.(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [deleteSongMutation, onSuccess, onError],
  );

  // Loading states
  const isCreating = createSongMutation.isPending;
  const isUpdating = updateSongMutation.isPending;
  const isDeleting = deleteSongMutation.isPending;
  const isProcessing = isCreating || isUpdating || isDeleting;

  return {
    // Form state
    formState,

    // Handlers
    handleSubmit,
    handleChangeField,
    handleDeleteSong,

    // States
    isProcessing,
  };
};
