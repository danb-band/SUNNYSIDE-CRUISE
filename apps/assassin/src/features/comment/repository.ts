import { supabase } from "@libs/supabase/client";
import { CreateCommentInput, UpdateCommentInput } from "./schemas/comment";

async function getAllComments() {
  const { data, error } = await supabase
    .from("comment")
    .select("*")
    .order("createdAt", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

async function getCommentById(id: string) {
  const { data, error } = await supabase.from("comment").select("*").eq("id", id).single();

  if (error) {
    throw error;
  }

  return data;
}

async function getCommentsBySongId(songId: string) {
  const { data, error } = await supabase.from("comment").select("*").eq("songId", songId);

  if (error) {
    throw error;
  }

  return data;
}

async function createComment(input: CreateCommentInput) {
  const { data, error } = await supabase.from("comment").insert([input]).select("*").single();

  if (error) {
    throw error;
  }

  return data;
}

async function updateComment(id: string, input: UpdateCommentInput) {
  const { data, error } = await supabase
    .from("comment")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function deleteComment(id: string) {
  const { error } = await supabase.from("comment").delete().eq("id", id);

  if (error) {
    throw error;
  }
}

const CommentRepository = {
  getAllComments,
  getCommentById,
  getCommentsBySongId,
  createComment,
  updateComment,
  deleteComment,
};

export default CommentRepository;
