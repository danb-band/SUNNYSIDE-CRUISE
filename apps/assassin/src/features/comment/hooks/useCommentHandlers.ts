import { useCallback } from "react";
import { useCreateComment } from "../mutations/useCreateComment";
import { useDeleteComment } from "../mutations/useDeleteComment";
import { useUpdateComment } from "../mutations/useUpdateComment";
import type { CommentUpdatePayload } from "../schema";
import { useCommentForm, CommentFormData } from "./useCommentForm";

type UseCommentHandlersProps =
  | {
      mode: "create";
      initialData: Partial<CommentFormData>;
      onSuccess?: (message: string) => void;
      onError?: (error: string) => void;
    }
  | {
      mode: "update";
      commentId: string;
      initialData: Partial<CommentFormData>;
      onSuccess?: (message: string) => void;
      onError?: (error: string) => void;
    };

export const useCommentHandlers = (props: UseCommentHandlersProps) => {
  const createCommentMutation = useCreateComment();
  const updateCommentMutation = useUpdateComment();
  const deleteCommentMutation = useDeleteComment();

  const formConfig =
    props.mode === "create"
      ? {
          mode: props.mode,
          initialData: props.initialData,
          onSubmit: async (data: CommentFormData) => {
            await createCommentMutation.mutateAsync(data);
            props.onSuccess?.("Comment created successfully");
          },
        }
      : {
          mode: props.mode,
          commentId: props.commentId,
          initialData: props.initialData,
          onSubmit: async (id: string, data: CommentUpdatePayload) => {
            await updateCommentMutation.mutateAsync({ id, data });
            props.onSuccess?.("Comment updated successfully");
          },
        };

  const form = useCommentForm(formConfig);

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
    (field: keyof CommentFormData, value: string) => {
      formActions.updateField(field, value);
    },
    [formActions],
  );

  const handleDeleteComment = useCallback(
    async (id: string, songId: string) => {
      try {
        await deleteCommentMutation.mutateAsync({ id, songId });
        props.onSuccess?.("Comment deleted successfully");
        return { success: true };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to delete comment";
        props.onError?.(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [deleteCommentMutation, props],
  );

  const isCreating = createCommentMutation.isPending;
  const isUpdating = updateCommentMutation.isPending;
  const isDeleting = deleteCommentMutation.isPending;
  const isProcessing = isCreating || isUpdating || isDeleting;

  return {
    formState,

    handleSubmit,
    handleChangeField,
    handleDeleteComment,

    isProcessing,
  };
};
