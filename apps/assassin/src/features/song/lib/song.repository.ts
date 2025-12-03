import { supabase } from "@libs/supabase/client"
import { CreateSongInput, UpdateSongInput } from "../schemas/song"


export async function getAllSongs() {
  const { data, error } = await supabase
    .from("song")
    .select("*")
    .order("createdAt", { ascending: false })

  if (error) {
    throw error
  }

  return data;
}

export async function getSongById(id: string) {
  const { data, error } = await supabase
    .from("song")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    throw error
  }

  return data;
}

export async function createSong(input: CreateSongInput) {
  const { data, error } = await supabase
    .from("song")
    .insert([input])
    .select()
    .single()

  if (error) {
    throw error
  }

  return data;
}

export async function updateSong(id: string, input: UpdateSongInput) {
  const { data, error } = await supabase
    .from("song")
    .update(input)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data;
}

export async function deleteSong(id: string) {
  const { error } = await supabase
    .from("song")
    .delete()
    .eq("id", id)

  if (error) {
    throw error
  }
}