import { useCallback, useState } from "react";
import { CommentUpdatePayload, createCommentSchema, updateCommentSchema } from "../schema";

export type CommentFormData = {
  songId: string;
  content: string;
};

export type UseCommentFormProps =
  | {
      mode: "create";
      initialData: Partial<CommentFormData>;
      onSubmit: (data: CommentFormData) => Promise<void>;
    }
  | {
      mode: "update";
      commentId: string;
      initialData: Partial<CommentFormData>;
      onSubmit: (id: string, data: CommentUpdatePayload) => Promise<void>;
    };

interface FormErrors {
  songId?: string;
  content?: string;
  _root?: string;
}

export const useCommentForm = (props: UseCommentFormProps) => {
  const { mode, initialData } = props;

  const [formData, setFormData] = useState<CommentFormData>({
    songId: initialData.songId || "",
    content: initialData.content || "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const validateField = useCallback(
    (field: keyof CommentFormData, value: unknown): string | undefined => {
      const schema = mode === "create" ? createCommentSchema : updateCommentSchema;
      const fieldSchema = schema.shape[field as keyof typeof schema.shape];
      if (!fieldSchema) return undefined;

      const result = fieldSchema.safeParse(value);
      return result.success ? undefined : result.error.issues[0]?.message;
    },
    [mode],
  );

  const validateForm = useCallback((): { isValid: boolean; errors: FormErrors } => {
    let result;
    if (mode === "create") {
      // Validate without userId (it's added server-side)
      const { userId: _u, ...schemaShape } = createCommentSchema.shape;
      const formSchema = createCommentSchema.pick(
        Object.fromEntries(Object.keys(schemaShape).map((k) => [k, true])) as Record<string, true>,
      );
      result = formSchema.safeParse(formData);
    } else {
      result = updateCommentSchema.safeParse(formData);
    }

    if (result.success) return { isValid: true, errors: {} };

    const formErrors: FormErrors = {};
    result.error.issues.forEach((err) => {
      const field = err.path[0] as keyof FormErrors;
      if (field && typeof field === "string") {
        formErrors[field] = err.message;
      }
    });

    return { isValid: false, errors: formErrors };
  }, [formData, mode]);

  const updateField = useCallback(
    <K extends keyof CommentFormData>(field: K, value: CommentFormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setIsDirty(true);

      const fieldError = validateField(field, value);
      setErrors((prev) => ({ ...prev, [field]: fieldError }));
    },
    [validateField],
  );

  const resetForm = useCallback(() => {
    setFormData({
      songId: initialData.songId || "",
      content: initialData.content || "",
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
        await props.onSubmit(props.commentId, formData as CommentUpdatePayload);
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
