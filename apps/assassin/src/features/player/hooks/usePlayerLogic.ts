import { useCallback } from "react";
import { usePlayersBySong } from "../queries/usePlayersBySong";
import type { Player } from "../schema";

export const usePlayerLogic = (songId: string) => {
  const { data: players = [] } = usePlayersBySong(songId);

  const playersByInstrument = useCallback((): Record<string, Player[]> => {
    return players.reduce(
      (acc, player) => {
        if (!acc[player.instrument]) {
          acc[player.instrument] = [];
        }
        acc[player.instrument].push(player);
        return acc;
      },
      {} as Record<string, Player[]>,
    );
  }, [players]);

  const getPlayerStats = useCallback(() => {
    const byInstrument = playersByInstrument();
    const totalPlayers = players.length;

    return {
      total: totalPlayers,
      byInstrument: Object.entries(byInstrument).map(([instrument, playerList]) => ({
        instrument,
        count: playerList.length,
        players: playerList,
      })),
    };
  }, [players, playersByInstrument]);

  return {
    playersByInstrument,
    getPlayerStats,

    players,
  };
};
