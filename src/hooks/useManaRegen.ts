import { useEffect, useRef } from 'react';
import { Character } from '../types/gameData';
import { EffectiveStats } from '../utils/statUtils';
import { useCharacterStore } from '../stores/characterStore';

interface UseManaRegenProps {
  activeCharacter: Character | null;
  effectiveStats: EffectiveStats | null;
  isHardcoreDeath?: boolean;
}

export const useManaRegen = ({
  activeCharacter,
  effectiveStats,
  isHardcoreDeath
}: UseManaRegenProps) => {
  const manaRegenTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isHardcoreDeath) {
      if (manaRegenTimerRef.current) {
        clearInterval(manaRegenTimerRef.current);
        manaRegenTimerRef.current = null;
      }
      return;
    }

    if (manaRegenTimerRef.current) {
      clearInterval(manaRegenTimerRef.current);
      manaRegenTimerRef.current = null;
    }

    const initialRegenRate = effectiveStats?.finalManaRegenPerSecond ?? 0;
    const initialMana = activeCharacter?.currentMana ?? 0;
    const initialMaxMana = activeCharacter?.maxMana ?? 0;

    if (initialRegenRate > 0 && initialMana < initialMaxMana && initialMana >= 0) {
      manaRegenTimerRef.current = setInterval(() => {
        const latestCharState = useCharacterStore.getState().activeCharacter;
        const latestStats: EffectiveStats | null = effectiveStats; // Pode recalcular se necessário
        const latestMana = latestCharState?.currentMana ?? 0;
        const latestMaxMana = latestCharState?.maxMana ?? 0;
        const latestRegenRate = latestStats?.finalManaRegenPerSecond ?? 0;

        if (latestMana < latestMaxMana && latestRegenRate > 0 && latestMana >= 0) {
          const manaHealAmount = Math.max(1, Math.floor(latestRegenRate));
          const newMana = Math.min(latestMaxMana, latestMana + manaHealAmount);
          useCharacterStore.getState().updateCharacter({ currentMana: newMana });
          setTimeout(() => useCharacterStore.getState().saveCharacter(), 50);
        }

        const shouldStopManaRegen = latestMana >= latestMaxMana || latestRegenRate <= 0;
        if (!latestCharState || shouldStopManaRegen) {
          if (manaRegenTimerRef.current) {
            clearInterval(manaRegenTimerRef.current);
            manaRegenTimerRef.current = null;
          }
          return;
        }
      }, 1000);
    }

    return () => {
      if (manaRegenTimerRef.current) {
        clearInterval(manaRegenTimerRef.current);
        manaRegenTimerRef.current = null;
      }
    };
  }, [
    activeCharacter?.id,
    activeCharacter?.currentMana,
    activeCharacter?.maxMana,
    effectiveStats?.finalManaRegenPerSecond,
    isHardcoreDeath
  ]);
}; 