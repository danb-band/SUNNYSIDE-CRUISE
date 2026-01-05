import { useCallback } from "react";
import { useCreatePlayer } from "../mutations/useCreatePlayer";
import { useUpdatePlayer } from "../mutations/useUpdatePlayer";
import { useDeletePlayer } from "../mutations/useDeletePlayer";
import { usePlayerForm } from "./usePlayerForm";
import type { PlayerPayload, PlayerUpdatePayload } from "../schema";

interface UsePlayerHandlersProps {
  mode: "create" | "update";
  initialData?: Partial<PlayerPayload>;
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
}

export const usePlayerHandlers = (props: UsePlayerHandlersProps) => {
  const { mode, initialData = {}, onSuccess, onError } = props;

  const createPlayerMutation = useCreatePlayer();
  const updatePlayerMutation = useUpdatePlayer();
  const deletePlayerMutation = useDeletePlayer();

  const submit = useCallback(
    async (data: PlayerPayload | PlayerUpdatePayload) => {
      if (mode === "create") {
        await createPlayerMutation.mutateAsync(data as PlayerPayload);
        onSuccess?.("Player added successfully");
        return;
      }

      const updateData = data as PlayerUpdatePayload;
      if (!updateData.id) {
        throw new Error("Player ID is required for update");
      }
      await updatePlayerMutation.mutateAsync({ id: updateData.id, data: updateData });
      onSuccess?.("Player updated successfully");
    },
    [mode, createPlayerMutation, updatePlayerMutation, onSuccess],
  );

  const form = usePlayerForm({
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
    (field: keyof PlayerPayload, value: string) => {
      formActions.updateField(field, value);
    },
    [formActions],
  );

  const handleDeletePlayer = useCallback(
    async (id: string) => {
      try {
        await deletePlayerMutation.mutateAsync(id);
        onSuccess?.("Player removed successfully");
        return { success: true };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to delete player";
        onError?.(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [deletePlayerMutation, onSuccess, onError],
  );

  const handleBatchDeletePlayers = useCallback(
    async (ids: string[]) => {
      try {
        await Promise.all(ids.map((id) => deletePlayerMutation.mutateAsync(id)));
        onSuccess?.(`${ids.length} players removed successfully`);
        return { success: true };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to delete players";
        onError?.(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [deletePlayerMutation, onSuccess, onError],
  );

  const isCreating = createPlayerMutation.isPending;
  const isUpdating = updatePlayerMutation.isPending;
  const isDeleting = deletePlayerMutation.isPending;
  const isProcessing = isCreating || isUpdating || isDeleting;

  return {
    // Form state
    formState,

    // Handlers
    handleSubmit,
    handleChangeField,
    handleDeletePlayer,
    handleBatchDeletePlayers,

    // States
    isProcessing,
  };
};
