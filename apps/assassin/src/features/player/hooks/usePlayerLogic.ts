import { useCallback, useMemo } from "react";
import { usePlayersBySong } from "../queries/usePlayersBySong";
import type { Player } from "../schema";

const INSTRUMENT_ORDER = ["DRUM", "GUITAR", "BASS", "KEYBOARD", "VOCAL"] as const;

export const usePlayerLogic = (songId: string) => {
  const { data: rawPlayers = [] } = usePlayersBySong(songId);

  const players = useMemo(
    () =>
      [...rawPlayers].sort(
        (a, b) => INSTRUMENT_ORDER.indexOf(a.instrument) - INSTRUMENT_ORDER.indexOf(b.instrument),
      ),
    [rawPlayers],
  );

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
