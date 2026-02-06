import type { Instrument } from "@/features/player/schema";

export const INSTRUMENT_LABELS: Record<Instrument, string> = {
  VOCAL: "보컬",
  GUITAR: "기타",
  DRUM: "드럼",
  BASS: "베이스",
  KEYBOARD: "키보드",
};

export const INSTRUMENT_COLORS: Record<Instrument, string> = {
  VOCAL:
    "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/30 dark:hover:bg-blue-900/50",
  GUITAR:
    "bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700/30 dark:hover:bg-orange-900/50",
  DRUM:
    "bg-red-100 text-red-700 hover:bg-red-200 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700/30 dark:hover:bg-red-900/50",
  BASS:
    "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700/30 dark:hover:bg-yellow-900/50",
  KEYBOARD:
    "bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700/30 dark:hover:bg-purple-900/50",
};
