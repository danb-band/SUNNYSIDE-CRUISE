import { useState, useCallback } from "react";
import { createSongSchema, updateSongSchema, SongPayload, SongUpdatePayload } from "../schema";
import type { ZodError } from "zod";

type FormMode = "create" | "update";

interface UseSongFormProps {
  mode: FormMode;
  initialData: Partial<SongPayload>;
  onSubmit: (data: SongPayload | SongUpdatePayload) => Promise<void>;
}

interface FormErrors {
  seasonId?: string;
  name?: string;
  artist?: string;
  description?: string;
  youtubeUrl?: string;
  sortOrder?: string;
  writer?: string;
  deletePw?: string;
  _root?: string;
}

export const useSongForm = (props: UseSongFormProps) => {
  const { mode, initialData, onSubmit } = props;

  const [formData, setFormData] = useState<Partial<SongPayload>>({
    seasonId: initialData.seasonId || "",
    name: initialData.name || "",
    artist: initialData.artist || "",
    description: initialData.description || "",
    youtubeUrl: initialData.youtubeUrl || "",
    sortOrder: initialData.sortOrder || 0,
    writer: initialData.writer || "",
    deletePw: initialData.deletePw || "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const validateField = useCallback(
    (field: keyof SongPayload, value: unknown): string | undefined => {
      try {
        const schema = mode === "create" ? createSongSchema : updateSongSchema;
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
      const schema = mode === "create" ? createSongSchema : updateSongSchema;
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
    <K extends keyof SongPayload>(field: K, value: SongPayload[K]) => {
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
      seasonId: initialData.seasonId || "",
      name: initialData.name || "",
      artist: initialData.artist || "",
      description: initialData.description || "",
      youtubeUrl: initialData.youtubeUrl || "",
      sortOrder: initialData.sortOrder || 0,
      writer: initialData.writer || "",
      deletePw: initialData.deletePw || "",
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
      await onSubmit(formData as SongPayload | SongUpdatePayload);
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
  }, [formData, validateForm, onSubmit]);

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
