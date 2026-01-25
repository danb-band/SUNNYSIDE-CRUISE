import { useState, useCallback } from "react";
import {
  createPlayerSchema,
  updatePlayerSchema,
  PlayerPayload,
  PlayerUpdatePayload,
} from "../schema";
import type { ZodError } from "zod";

export type UsePlayerFormProps =
  | {
      mode: "create";
      initialData: Partial<PlayerPayload>;
      onSubmit: (data: PlayerPayload) => Promise<void>;
    }
  | {
      mode: "update";
      playerId: string;
      initialData: Partial<PlayerPayload>;
      onSubmit: (id: string, data: PlayerUpdatePayload) => Promise<void>;
    };
interface FormErrors {
  songId?: string;
  name?: string;
  instrument?: string;
  _root?: string;
}

export const usePlayerForm = (props: UsePlayerFormProps) => {
  const { mode, initialData, onSubmit } = props;

  const [formData, setFormData] = useState<Partial<PlayerPayload>>({
    songId: initialData.songId || "",
    name: initialData.name || "",
    instrument: initialData.instrument || undefined,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const validateField = useCallback(
    (field: keyof PlayerPayload, value: unknown): string | undefined => {
      try {
        const schema = mode === "create" ? createPlayerSchema : updatePlayerSchema;
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
      const schema = mode === "create" ? createPlayerSchema : updatePlayerSchema;
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
    <K extends keyof PlayerPayload>(field: K, value: PlayerPayload[K]) => {
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
      songId: initialData.songId || "",
      name: initialData.name || "",
      instrument: initialData.instrument || undefined,
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

    if (!onSubmit) {
      return true;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      if (mode === "update") {
        await onSubmit(props.playerId, formData as PlayerUpdatePayload);
      } else {
        await onSubmit(formData as PlayerPayload);
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
  }, [formData, validateForm, onSubmit, mode]);

  const isValid = validateForm().isValid;

  return {
    state: {
      formData,
      errors,
      isValid,
      isDirty,
      isSubmitting,
      canSubmit: isValid && !isSubmitting,
    },

    actions: {
      updateField,
      resetForm,
      submitForm,
    },
  };
};
