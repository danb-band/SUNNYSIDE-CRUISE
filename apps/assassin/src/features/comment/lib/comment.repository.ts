import { supabase } from "@libs/supabase/client"
import { commentSchema, CreateCommentInput, UpdateCommentInput } from "../schemas/comment"

export async function getAllComments() {
  const { data, error } = await supabase
    .from("comment")
    .select("*")
    .order("createdAt", { ascending: false })

  if (error) {
    throw error
  }

  return commentSchema.parse(data)
}

export async function getCommentById(id: string) {
  const { data, error } = await supabase
    .from("comment")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    throw error
  }

  return commentSchema.parse(data)
}

export async function createComment(input: CreateCommentInput) {
  const { data, error } = await supabase
    .from("comment")
    .insert([input])
    .select()
    .single()

  if (error) {
    throw error
  }

  return commentSchema.parse(data)
}

export async function updateComment(id: string, input: UpdateCommentInput) {
  const { data, error } = await supabase
    .from("comment")
    .update(input)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    throw error
  }

  return commentSchema.parse(data)
}

export async function deleteComment(id: string) {
  const { error } = await supabase
    .from("comment")
    .delete()
    .eq("id", id)

  if (error) {
    throw error
  }
}