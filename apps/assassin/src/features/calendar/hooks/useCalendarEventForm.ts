import { useCallback, useEffect, useState } from "react";
import {
  CalendarEventUpdatePayload,
  createCalendarEventSchema,
  updateCalendarEventSchema,
} from "../schema";

export type CalendarEventFormData = {
  title: string;
  location: string;
  startDate: Date | null;
  endDate: Date | null;
};

export type UseCalendarEventFormProps =
  | {
      mode: "create";
      initialData?: Partial<CalendarEventFormData>;
      onSubmit: (data: CalendarEventFormData) => Promise<void>;
    }
  | {
      mode: "update";
      eventId: string;
      initialData?: Partial<CalendarEventFormData>;
      onSubmit: (id: string, data: CalendarEventUpdatePayload) => Promise<void>;
    };

interface FormErrors {
  title?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  _root?: string;
}

function toDateTimeLocalValue(date: Date): string {
  const pad2 = (n: number) => String(n).padStart(2, "0");
  const yyyy = date.getFullYear();
  const mm = pad2(date.getMonth() + 1);
  const dd = pad2(date.getDate());
  const hh = pad2(date.getHours());
  const min = pad2(date.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

function fromDateTimeLocalValue(value: string): Date {
  const [datePart, timePart] = value.split("T");
  const [y, m, d] = datePart.split("-").map((v) => Number(v));
  const [hh, mm] = timePart.split(":").map((v) => Number(v));
  return new Date(y, m - 1, d, hh, mm, 0, 0);
}

export const useCalendarEventForm = (props: UseCalendarEventFormProps) => {
  const { mode, initialData = {} } = props;

  const getDefaultStartDate = (): Date => {
    if (initialData.startDate) return new Date(initialData.startDate);
    const now = new Date();
    now.setHours(9, 0, 0, 0);
    return now;
  };

  const getDefaultEndDate = (): Date => {
    if (initialData.endDate) return new Date(initialData.endDate);
    const start = getDefaultStartDate();
    const end = new Date(start);
    end.setHours(start.getHours() + 1, 0, 0, 0);
    return end;
  };

  const [formData, setFormData] = useState<CalendarEventFormData>({
    title: initialData.title || "",
    location: initialData.location || "",
    startDate: initialData.startDate ? new Date(initialData.startDate) : getDefaultStartDate(),
    endDate: initialData.endDate ? new Date(initialData.endDate) : getDefaultEndDate(),
  });

  const [startValue, setStartValue] = useState(() =>
    formData.startDate ? toDateTimeLocalValue(formData.startDate) : "",
  );
  const [endValue, setEndValue] = useState(() =>
    formData.endDate ? toDateTimeLocalValue(formData.endDate) : "",
  );

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Sync startValue/endValue with formData.startDate/endDate
  useEffect(() => {
    if (formData.startDate) {
      setStartValue(toDateTimeLocalValue(formData.startDate));
    }
  }, [formData.startDate]);

  useEffect(() => {
    if (formData.endDate) {
      setEndValue(toDateTimeLocalValue(formData.endDate));
    }
  }, [formData.endDate]);

  // Update formData when initialData changes (for update mode)
  useEffect(() => {
    if (mode !== "update") return;
    if (isDirty || isSubmitting) return;

    if (initialData.title !== undefined || initialData.location !== undefined) {
      setFormData((prev) => ({
        ...prev,
        title: initialData.title ?? prev.title,
        location: initialData.location ?? prev.location,
        startDate: initialData.startDate ? new Date(initialData.startDate) : prev.startDate,
        endDate: initialData.endDate ? new Date(initialData.endDate) : prev.endDate,
      }));
      setErrors({});
    }
  }, [
    initialData.title,
    initialData.location,
    initialData.startDate,
    initialData.endDate,
    isDirty,
    isSubmitting,
    mode,
  ]);

  const validateField = useCallback(
    (field: keyof CalendarEventFormData, value: unknown): string | undefined => {
      const schema = mode === "create" ? createCalendarEventSchema : updateCalendarEventSchema;
      const fieldSchema = schema.shape[field as keyof typeof schema.shape];
      if (!fieldSchema) return undefined;

      const result = fieldSchema.safeParse(value);
      return result.success ? undefined : result.error.issues[0]?.message;
    },
    [mode],
  );

  const validateForm = useCallback((): { isValid: boolean; errors: FormErrors } => {
    const formErrors: FormErrors = {};

    if (!formData.title?.trim()) {
      formErrors.title = "Title is required";
    }

    if (!formData.location?.trim()) {
      formErrors.location = "Location is required";
    }

    if (!formData.startDate) {
      formErrors.startDate = "Start date is required";
    }

    if (!formData.endDate) {
      formErrors.endDate = "End date is required";
    }

    if (formData.startDate && formData.endDate) {
      if (formData.endDate.getTime() < formData.startDate.getTime()) {
        formErrors.endDate = "End date cannot be earlier than start date";
      }
    }

    // Zod validation
    try {
      if (mode === "create") {
        createCalendarEventSchema.parse({
          title: formData.title,
          location: formData.location,
          startDate: formData.startDate,
          endDate: formData.endDate,
        });
      } else {
        updateCalendarEventSchema.parse({
          title: formData.title,
          location: formData.location,
          startDate: formData.startDate,
          endDate: formData.endDate,
        });
      }
    } catch (error) {
      if (error instanceof Error && !formErrors._root) {
        formErrors._root = error.message;
      }
    }

    return {
      isValid: Object.keys(formErrors).length === 0,
      errors: formErrors,
    };
  }, [formData, mode]);

  const updateField = useCallback(
    <K extends keyof CalendarEventFormData>(field: K, value: CalendarEventFormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setIsDirty(true);

      const fieldError = validateField(field, value);
      setErrors((prev) => ({ ...prev, [field]: fieldError }));
    },
    [validateField],
  );

  const updateStartValue = useCallback(
    (value: string) => {
      setStartValue(value);
      setIsDirty(true);
      if (value) {
        try {
          const date = fromDateTimeLocalValue(value);
          updateField("startDate", date);
          setErrors((prev) => ({ ...prev, startDate: undefined }));
        } catch {
          setErrors((prev) => ({ ...prev, startDate: "Invalid date format" }));
        }
      } else {
        updateField("startDate", null);
      }
    },
    [updateField],
  );

  const updateEndValue = useCallback(
    (value: string) => {
      setEndValue(value);
      setIsDirty(true);
      if (value) {
        try {
          const date = fromDateTimeLocalValue(value);
          updateField("endDate", date);
          setErrors((prev) => ({ ...prev, endDate: undefined }));
        } catch {
          setErrors((prev) => ({ ...prev, endDate: "Invalid date format" }));
        }
      } else {
        updateField("endDate", null);
      }
    },
    [updateField],
  );

  const submitForm = useCallback(async () => {
    const { isValid, errors: validationErrors } = validateForm();

    if (!isValid) {
      setErrors(validationErrors);
      return false;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      if (props.mode === "update") {
        const payload: CalendarEventUpdatePayload = {
          title: formData.title.trim(),
          location: formData.location.trim(),
          startDate: formData.startDate!,
          endDate: formData.endDate!,
        };
        await props.onSubmit(props.eventId, payload);
      } else {
        const payload = {
          title: formData.title.trim(),
          location: formData.location.trim(),
          startDate: formData.startDate!,
          endDate: formData.endDate!,
        };
        await props.onSubmit(payload);
      }
      setIsDirty(false);
      return true;
    } catch (error) {
      setErrors({
        _root: error instanceof Error ? error.message : "Submit failed",
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, props]);

  const isValid = validateForm().isValid;

  return {
    state: {
      formData,
      startValue,
      endValue,
      errors,
      isValid,
      isDirty,
      isSubmitting,
      canSubmit: isValid && !isSubmitting,
    },
    actions: {
      updateField,
      updateStartValue,
      updateEndValue,
      submitForm,
    },
  };
};
