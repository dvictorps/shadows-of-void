import { useCallback } from "react";
import { playSound } from "@/utils/soundUtils";
import { enemyTypes } from "@/types/gameData";

export const useSoundEffects = () => {
  /**
   * Plays the configured death sound for a given enemy type id (if any).
   */
  const playEnemyDeathSound = useCallback((enemyTypeId: string) => {
    const enemyType = enemyTypes.find((e) => e.id === enemyTypeId);
    if (enemyType?.deathSoundPath) {
      playSound(enemyType.deathSoundPath);
    }
  }, []);

  // Future sound helpers (hit effects, spell cast, etc.) can be added here.

  return {
    playEnemyDeathSound,
  };
}; 