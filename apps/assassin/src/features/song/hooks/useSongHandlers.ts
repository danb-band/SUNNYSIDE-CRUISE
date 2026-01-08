import { useCallback } from "react";
import { useCreateSong } from "../mutations/useCreateSong";
import { useUpdateSong } from "../mutations/useUpdateSong";
import { useDeleteSong } from "../mutations/useDeleteSong";
import { useSongForm } from "./useSongForm";
import type { SongPayload, SongUpdatePayload } from "../schema";

type UseSongHandlersProps =
  | {
      mode: "create";
      initialData: Partial<SongPayload>;
      onSuccess?: (message: string) => void;
      onError?: (error: string) => void;
    }
  | {
      mode: "update";
      songId: string;
      initialData: Partial<SongPayload>;
      onSuccess?: (message: string) => void;
      onError?: (error: string) => void;
    };

export const useSongHandlers = (props: UseSongHandlersProps) => {
  const createSongMutation = useCreateSong();
  const updateSongMutation = useUpdateSong();
  const deleteSongMutation = useDeleteSong();

  const form = props.mode === "create"
    ? useSongForm({
        mode: "create",
        initialData: props.initialData,
        onSubmit: async (data: SongPayload) => {
          await createSongMutation.mutateAsync(data);
          props.onSuccess?.("Song created successfully");
        },
      })
    : useSongForm({
        mode: "update",
        songId: props.songId,
        initialData: props.initialData,
        onSubmit: async (id: string, data: SongUpdatePayload) => {
          await updateSongMutation.mutateAsync({ id, data });
          props.onSuccess?.("Song updated successfully");
        },
      });

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
    (field: keyof SongPayload, value: string | number) => {
      formActions.updateField(field, value);
    },
    [formActions],
  );

  const handleDeleteSong = useCallback(
    async (id: string) => {
      try {
        await deleteSongMutation.mutateAsync(id);
        props.onSuccess?.("Song deleted successfully");
        return { success: true };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to delete song";
        props.onError?.(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [deleteSongMutation, props],
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
