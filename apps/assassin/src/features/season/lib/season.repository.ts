import { supabase } from "@libs/supabase/client"
import { CreateSeasonInput, UpdateSeasonInput } from "../schemas/season"

export async function getAllSeasons() {
  const { data, error } = await supabase
    .from("season")
    .select("*")
    .order("createdAt", { ascending: false })

  if (error) {
    throw error
  }

  return data;
}

export async function getSeasonById(id: string) {
  const { data, error } = await supabase
    .from("season")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    throw error
  }

  return data;
}

export async function createSeason(input: CreateSeasonInput) {
  const { data, error } = await supabase
    .from("season")
    .insert([input])
    .select()
    .single()

  if (error) {
    throw error
  }

  return data;
}

export async function updateSeason(id: string, input: UpdateSeasonInput) {
  const { data, error } = await supabase
    .from("season")
    .update(input)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data;
}

export async function deleteSeason(id: string) {
  const { error } = await supabase
    .from("season")
    .delete()
    .eq("id", id)

  if (error) {
    throw error
  }
}