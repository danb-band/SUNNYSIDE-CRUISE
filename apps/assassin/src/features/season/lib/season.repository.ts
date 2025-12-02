import { supabase } from "@libs/supabase/client"
import { seasonSchema } from "../schemas/season"

export async function getAllSeasons() {
  const { data, error } = await supabase
    .from("season")
    .select("*")
    .order("createdAt", { ascending: false })

  if (error) {
    throw error
  }

  return seasonSchema.parse(data)
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

  return seasonSchema.parse(data)
}