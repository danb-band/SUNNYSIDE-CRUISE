import { useState, useCallback } from "react";
import { updateProfileSchema, UpdateProfilePayload } from "../schema";

export type ProfileFormData = {
  userId: string;
  name: string;
};

interface FormErrors {
  name?: string;
  _root?: string;
}

interface UseProfileFormProps {
  initialData: Partial<ProfileFormData>;
  onSubmit: (data: UpdateProfilePayload) => Promise<void>;
}

export const useProfileForm = ({ initialData, onSubmit }: UseProfileFormProps) => {
  const [formData, setFormData] = useState<ProfileFormData>({
    userId: initialData.userId || "",
    name: initialData.name || "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const validateField = useCallback(
    (field: keyof ProfileFormData, value: unknown): string | undefined => {
      const fieldSchema =
        updateProfileSchema.shape[field as keyof typeof updateProfileSchema.shape];
      if (!fieldSchema) return undefined;

      const result = fieldSchema.safeParse(value);
      return result.success ? undefined : result.error.issues[0]?.message;
    },
    [],
  );

  const validateForm = useCallback((): { isValid: boolean; errors: FormErrors } => {
    const result = updateProfileSchema.safeParse(formData);

    if (result.success) return { isValid: true, errors: {} };

    const formErrors: FormErrors = {};
    result.error.issues.forEach((err) => {
      const field = err.path[0] as keyof FormErrors;
      if (field && typeof field === "string") {
        formErrors[field] = err.message;
      }
    });

    return { isValid: false, errors: formErrors };
  }, [formData]);

  const updateField = useCallback(
    <K extends keyof ProfileFormData>(field: K, value: ProfileFormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setIsDirty(true);

      const fieldError = validateField(field, value);
      setErrors((prev) => ({ ...prev, [field]: fieldError }));
    },
    [validateField],
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
      await onSubmit(formData);
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
  }, [validateForm, onSubmit, formData]);

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
      submitForm,
    },
  };
};
