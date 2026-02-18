import { useCallback } from "react";
import { useCreateCalendarEvent } from "../mutations/useCreateCalendarEvent";
import { useUpdateCalendarEvent } from "../mutations/useUpdateCalendarEvent";
import { useDeleteCalendarEvent } from "../mutations/useDeleteCalendarEvent";
import { useCalendarEventForm, CalendarEventFormData } from "./useCalendarEventForm";
import type { CalendarEventUpdatePayload } from "../schema";

type UseCalendarEventHandlersProps =
  | {
      mode: "create";
      initialData: Partial<CalendarEventFormData>;
      onSuccess?: (message: string) => void;
      onError?: (error: string) => void;
    }
  | {
      mode: "update";
      eventId: string;
      initialData: Partial<CalendarEventFormData>;
      onSuccess?: (message: string) => void;
      onError?: (error: string) => void;
    };

export const useCalendarEventHandlers = (props: UseCalendarEventHandlersProps) => {
  const createCalendarEventMutation = useCreateCalendarEvent();
  const updateCalendarEventMutation = useUpdateCalendarEvent();
  const deleteCalendarEventMutation = useDeleteCalendarEvent();

  const formConfig =
    props.mode === "create"
      ? {
          mode: props.mode,
          initialData: props.initialData,
          onSubmit: async (data: CalendarEventFormData) => {
            await createCalendarEventMutation.mutateAsync({
              title: data.title,
              location: data.location,
              startDate: data.startDate!,
              endDate: data.endDate!,
            });
            props.onSuccess?.("Calendar event created successfully");
          },
        }
      : {
          mode: props.mode,
          eventId: props.eventId,
          initialData: props.initialData,
          onSubmit: async (id: string, data: CalendarEventUpdatePayload) => {
            await updateCalendarEventMutation.mutateAsync({ id, data });
            props.onSuccess?.("Calendar event updated successfully");
          },
        };

  const form = useCalendarEventForm(formConfig);

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
    (field: keyof CalendarEventFormData, value: string | Date | null) => {
      formActions.updateField(field, value);
    },
    [formActions],
  );

  const handleChangeStartValue = useCallback(
    (value: string) => {
      formActions.updateStartValue(value);
    },
    [formActions],
  );

  const handleChangeEndValue = useCallback(
    (value: string) => {
      formActions.updateEndValue(value);
    },
    [formActions],
  );

  const handleDeleteCalendarEvent = useCallback(
    async (id: string) => {
      try {
        await deleteCalendarEventMutation.mutateAsync(id);
        props.onSuccess?.("Calendar event deleted successfully");
        return { success: true };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to delete calendar event";
        props.onError?.(message);
        return { success: false, error: message };
      }
    },
    [deleteCalendarEventMutation, props],
  );

  const isCreating = createCalendarEventMutation.isPending;
  const isUpdating = updateCalendarEventMutation.isPending;
  const isDeleting = deleteCalendarEventMutation.isPending;
  const isProcessing = isCreating || isUpdating || isDeleting;

  return {
    formState,
    handleSubmit,
    handleChangeField,
    handleChangeStartValue,
    handleChangeEndValue,
    handleDeleteCalendarEvent,
    isProcessing,
  };
};
