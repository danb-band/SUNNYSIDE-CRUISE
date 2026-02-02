import { useState, useCallback } from "react";
import { createSongSchema, updateSongSchema, SongUpdatePayload } from "../schema";
import type { ZodError } from "zod";

export type SongFormData = {
  seasonId: string;
  name: string;
  artist: string;
  description: string;
  youtubeUrl: string;
  sortOrder: number;
};

export type UseSongFormProps =
  | {
      mode: "create";
      initialData: Partial<SongFormData>;
      onSubmit: (data: SongFormData) => Promise<void>;
    }
  | {
      mode: "update";
      songId: string;
      initialData: Partial<SongFormData>;
      onSubmit: (id: string, data: SongUpdatePayload) => Promise<void>;
    };

interface FormErrors {
  seasonId?: string;
  name?: string;
  artist?: string;
  description?: string;
  youtubeUrl?: string;
  sortOrder?: string;
  _root?: string;
}

export const useSongForm = (props: UseSongFormProps) => {
  const { mode, initialData } = props;

  const [formData, setFormData] = useState<SongFormData>({
    seasonId: initialData.seasonId || "",
    name: initialData.name || "",
    artist: initialData.artist || "",
    description: initialData.description || "",
    youtubeUrl: initialData.youtubeUrl || "",
    sortOrder: initialData.sortOrder || 0,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const validateField = useCallback(
    (field: keyof SongFormData, value: unknown): string | undefined => {
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
      if (mode === "create") {
        // Validate without userId (it's added server-side)
        const { userId: _u, ...schemaShape } = createSongSchema.shape;
        const formSchema = createSongSchema.pick(
          Object.fromEntries(Object.keys(schemaShape).map((k) => [k, true])) as Record<
            string,
            true
          >,
        );
        formSchema.parse(formData);
      } else {
        updateSongSchema.parse(formData);
      }
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
    <K extends keyof SongFormData>(field: K, value: SongFormData[K]) => {
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
        await props.onSubmit(props.songId, formData as SongUpdatePayload);
      } else {
        await props.onSubmit(formData);
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
