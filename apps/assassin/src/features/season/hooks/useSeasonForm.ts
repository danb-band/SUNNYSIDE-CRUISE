import { useState, useCallback } from "react";
import {
  createSeasonSchema,
  updateSeasonSchema,
  SeasonPayload,
  SeasonUpdatePayload,
} from "../schema";
import type { ZodError } from "zod";

type UseSeasonFormProps =
  | {
      mode: "create";
      initialData: Partial<SeasonPayload>;
      onSubmit: (data: SeasonPayload) => Promise<void>;
    }
  | {
      mode: "update";
      seasonId: string;
      initialData: SeasonUpdatePayload;
      onSubmit: (id: string, data: SeasonUpdatePayload) => Promise<void>;
    };

interface FormErrors {
  name?: string;
  description?: string;
  sortOrder?: string;
  isArchived?: string;
  _root?: string;
}

export const useSeasonForm = (props: UseSeasonFormProps) => {
  const { mode, initialData } = props;

  const [formData, setFormData] = useState<Partial<SeasonPayload>>({
    name: initialData?.name || "",
    sortOrder: initialData?.sortOrder || 0,
    isArchived: initialData?.isArchived || false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const validateField = useCallback(
    (field: keyof SeasonPayload, value: unknown): string | undefined => {
      try {
        const schema = mode === "create" ? createSeasonSchema : updateSeasonSchema;
        const fieldSchema = schema.shape[field as keyof typeof schema.shape];

        if (fieldSchema) {
          fieldSchema.parse(value);
        }
        return undefined;
      } catch (error) {
        if (error instanceof Error) {
          return error.message;
        }
        return "Validation error";
      }
    },
    [mode],
  );

  const validateForm = useCallback((): { isValid: boolean; errors: FormErrors } => {
    try {
      const schema = mode === "create" ? createSeasonSchema : updateSeasonSchema;
      schema.parse(formData);
      return { isValid: true, errors: {} };
    } catch (error) {
      const zodError = error as ZodError;
      const formErrors: FormErrors = {};

      zodError.issues.forEach((err) => {
        const field = err.path[0] as keyof FormErrors;
        if (field && typeof field === "string") {
          formErrors[field] = err.message;
        }
      });

      return { isValid: false, errors: formErrors };
    }
  }, [formData, mode]);

  const updateField = useCallback(
    <K extends keyof SeasonPayload>(field: K, value: SeasonPayload[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setIsDirty(true);

      // Real-time validation
      const fieldError = validateField(field, value);
      setErrors((prev) => ({ ...prev, [field]: fieldError }));
    },
    [validateField],
  );

  const resetForm = useCallback(() => {
    setFormData({
      name: initialData?.name || "",
      sortOrder: initialData?.sortOrder || 0,
      isArchived: initialData?.isArchived || false,
    });
    setErrors({});
    setIsDirty(false);
  }, [initialData]);

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
        await props.onSubmit(props.seasonId, formData as SeasonUpdatePayload);
      } else {
        await props.onSubmit(formData as SeasonPayload);
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
    // Form state
    state: {
      formData,
      errors,
      isValid,
      isDirty,
      isSubmitting,
      canSubmit: isValid && !isSubmitting,
    },

    // Actions
    actions: {
      updateField,
      resetForm,
      submitForm,
    },
  };
};
