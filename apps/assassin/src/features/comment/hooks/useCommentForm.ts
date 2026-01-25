import { useCallback, useState } from "react";
import type { ZodError } from "zod";
import {
  CommentPayload,
  CommentUpdatePayload,
  createCommentSchema,
  updateCommentSchema,
} from "../schema";

export type UseCommentFormProps =
  | {
      mode: "create";
      initialData: Partial<CommentPayload>;
      onSubmit: (data: CommentPayload) => Promise<void>;
    }
  | {
      mode: "update";
      commentId: string;
      initialData: Partial<CommentPayload>;
      onSubmit: (id: string, data: CommentUpdatePayload, pw: string) => Promise<void>;
    };

interface FormErrors {
  songId?: string;
  content?: string;
  writer?: string;
  password?: string;
  _root?: string;
}

export const useCommentForm = (props: UseCommentFormProps) => {
  const { mode, initialData } = props;

  const [formData, setFormData] = useState<Partial<CommentPayload>>({
    songId: initialData.songId || "",
    content: initialData.content || "",
    writer: initialData.writer || "",
    password: mode === "create" ? initialData.password || "" : initialData.password || undefined,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const validateField = useCallback(
    (field: keyof CommentPayload, value: unknown): string | undefined => {
      try {
        const schema = mode === "create" ? createCommentSchema : updateCommentSchema;
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
      const schema = mode === "create" ? createCommentSchema : updateCommentSchema;
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
    <K extends keyof CommentPayload>(field: K, value: CommentPayload[K]) => {
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
      writer: initialData.writer || "",
      password: mode === "create" ? initialData.password || "" : initialData.password || undefined,
    });
    setErrors({});
    setIsDirty(false);
  }, [initialData, mode]);

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
        await props.onSubmit(
          props.commentId,
          formData as CommentUpdatePayload,
          formData.password || "",
        );
      } else {
        await props.onSubmit(formData as CommentPayload);
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
