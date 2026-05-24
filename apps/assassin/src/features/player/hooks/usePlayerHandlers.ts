import { useCallback } from "react";
import { useCreatePlayer } from "../mutations/useCreatePlayer";
import { useUpdatePlayer } from "../mutations/useUpdatePlayer";
import { useSoftDeletePlayer } from "../mutations/useDeletePlayer";
import { usePlayerForm } from "./usePlayerForm";
import type { PlayerPayload, PlayerUpdatePayload } from "../schema";

type UsePlayerHandlersProps =
  | {
      mode: "create";
      initialData?: Partial<PlayerPayload>;
      onSuccess?: (message: string) => void;
      onError?: (error: string) => void;
    }
  | {
      mode: "update";
      playerId: string;
      initialData: Partial<PlayerPayload>;
      onSuccess?: (message: string) => void;
      onError?: (error: string) => void;
    };

export const usePlayerHandlers = (props: UsePlayerHandlersProps) => {
  const { mode, initialData = {}, onSuccess, onError } = props;

  const createPlayerMutation = useCreatePlayer();
  const updatePlayerMutation = useUpdatePlayer();
  const deletePlayerMutation = useSoftDeletePlayer();

  const formConfig =
    mode === "create"
      ? {
          mode,
          initialData,
          onSubmit: async (data: PlayerPayload) => {
            await createPlayerMutation.mutateAsync(data);
            props.onSuccess?.("Player added successfully");
          },
        }
      : {
          mode,
          playerId: props.playerId,
          initialData,
          onSubmit: async (id: string, data: PlayerUpdatePayload) => {
            if (!id) {
              throw new Error("Player ID is required for update");
            }
            await updatePlayerMutation.mutateAsync({ id, data });
            props.onSuccess?.("Player updated successfully");
          },
        };

  const form = usePlayerForm(formConfig);

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
    async (id: string, songId: string) => {
      try {
        await deletePlayerMutation.mutateAsync({ id, songId });
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
    async (ids: string[], songId: string) => {
      try {
        await Promise.all(ids.map((id) => deletePlayerMutation.mutateAsync({ id, songId })));
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
