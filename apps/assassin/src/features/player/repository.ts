import { supabase } from "@libs/supabase/client";
import { CreatePlayerInput, UpdatePlayerInput } from "./schema";

async function getAllPlayers() {
  const { data, error } = await supabase
    .from("player")
    .select("*")
    .order("createdAt", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

async function getPlayerById(id: string) {
  const { data, error } = await supabase.from("player").select("*").eq("id", id).single();

  if (error) {
    throw error;
  }

  return data;
}

async function getPlayersBySongId(songId: string) {
  const { data, error } = await supabase.from("player").select("*").eq("songId", songId);

  if (error) {
    throw error;
  }

  return data;
}

async function createPlayer(input: CreatePlayerInput) {
  const { data, error } = await supabase.from("player").insert([input]).select().single();

  if (error) {
    throw error;
  }

  return data;
}

async function updatePlayer(id: string, input: UpdatePlayerInput) {
  const { data, error } = await supabase
    .from("player")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function deletePlayer(id: string) {
  const { error } = await supabase.from("player").delete().eq("id", id);

  if (error) {
    throw error;
  }
}

const PlayerRepository = {
  getAllPlayers,
  getPlayerById,
  getPlayersBySongId,
  createPlayer,
  updatePlayer,
  deletePlayer,
};

export default PlayerRepository;
