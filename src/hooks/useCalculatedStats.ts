import { useMemo } from "react";
import {
  Character,
} from "@/types/gameData";
import { calculateTotalStrength, calculateTotalDexterity, calculateTotalIntelligence } from "@/utils/statUtils/baseStats";
import { calculateEffectiveStats, EffectiveStats } from "@/utils/statUtils/weapon";
import { calculateXPToNextLevel } from "@/utils/gameLogicUtils";

export function useCalculatedStats(
  activeCharacter: Character | null,
  effectiveStatsRef: React.MutableRefObject<EffectiveStats | null>
) {
  const totalStrength = useMemo(() => {
    if (!activeCharacter) return 0;
    return calculateTotalStrength(activeCharacter);
  }, [activeCharacter]);

  const totalDexterity = useMemo(() => {
    if (!activeCharacter) return 0;
    return calculateTotalDexterity(activeCharacter);
  }, [activeCharacter]);

  const totalIntelligence = useMemo(() => {
    if (!activeCharacter) return 0;
    return calculateTotalIntelligence(activeCharacter);
  }, [activeCharacter]);

  const effectiveStats = useMemo(() => {
    if (activeCharacter) {
      try {
        const newStats = calculateEffectiveStats(activeCharacter);
        effectiveStatsRef.current = newStats;
        return newStats;
      } catch (e) {
        console.error("[useCalculatedStats] Error calculating effective stats:", e);
        return effectiveStatsRef.current;
      }
    }
    return effectiveStatsRef.current;
  }, [activeCharacter, effectiveStatsRef]);

  const xpToNextLevel = activeCharacter
    ? calculateXPToNextLevel(activeCharacter.level)
    : 0;

  return {
    totalStrength,
    totalDexterity,
    totalIntelligence,
    effectiveStats,
    xpToNextLevel,
  } as const;
} 