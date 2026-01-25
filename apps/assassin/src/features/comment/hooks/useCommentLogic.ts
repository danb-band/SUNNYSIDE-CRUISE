import { useCallback } from "react";
import { useCommentsBySong } from "../queries/useCommentsBySong";
import type { Comment, CommentPayload } from "../schema";

export const useCommentLogic = (songId: string) => {
  const { data: comments = [] } = useCommentsBySong(songId);

  const toTime = useCallback((value: Date | string) => new Date(value).getTime(), []);

  const validateCommentData = useCallback((data: CommentPayload) => {
    const errors: string[] = [];

    const trimmedContent = data.content.trim();
    if (!trimmedContent) {
      errors.push("Content cannot be empty");
    } else if (trimmedContent !== data.content) {
      errors.push("Content cannot have leading or trailing spaces");
    }

    const trimmedWriter = data.writer.trim();
    if (!trimmedWriter) {
      errors.push("Writer cannot be empty");
    } else if (trimmedWriter !== data.writer) {
      errors.push("Writer cannot have leading or trailing spaces");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, []);

  const getLatestComment = useCallback((): Comment | undefined => {
    if (comments.length === 0) return undefined;

    return [...comments].sort((a, b) => toTime(b.createdAt) - toTime(a.createdAt))[0];
  }, [comments, toTime]);

  const sortedComments = [...comments].sort((a, b) => toTime(b.createdAt) - toTime(a.createdAt));

  return {
    validateCommentData,
    getLatestComment,

    comments: sortedComments,
  };
};
