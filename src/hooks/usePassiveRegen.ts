import { useEffect, useRef } from 'react';
import { Character } from '../types/gameData';
import { EffectiveStats } from '../utils/statUtils';
import { useCharacterStore } from '../stores/characterStore';
import { calculateEffectiveStats } from '../utils/statUtils/weapon';

interface UsePassiveRegenProps {
  activeCharacter: Character | null;
  effectiveStats: EffectiveStats | null;
  handlePlayerHeal: (amount: number) => void;
  isHardcoreDeath?: boolean;
}

export const usePassiveRegen = ({ 
  activeCharacter, 
  effectiveStats, 
  handlePlayerHeal,
  isHardcoreDeath
}: UsePassiveRegenProps) => {
  
  const regenerationTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isHardcoreDeath) {
      if (regenerationTimerRef.current) {
        clearInterval(regenerationTimerRef.current);
        regenerationTimerRef.current = null;
      }
      return;
    }

    if (regenerationTimerRef.current) {
      clearInterval(regenerationTimerRef.current);
      regenerationTimerRef.current = null;
    }

    const initialRegenRate = effectiveStats?.finalLifeRegenPerSecond ?? 0;
    const initialHp = activeCharacter?.currentHealth ?? 0;
    const initialMaxHp = effectiveStats?.maxHealth ?? 0;

    if (initialRegenRate > 0 && initialHp < initialMaxHp && initialHp > 0) {
      regenerationTimerRef.current = setInterval(() => {
        const latestCharState = useCharacterStore.getState().activeCharacter;
        let latestStats: EffectiveStats | null = null;
        try {
          if (latestCharState) {
            latestStats = calculateEffectiveStats(latestCharState);
          }
        } catch (e) {
          console.error(
            "[Passive Regen Hook Tick] Error recalculating stats:", e
          );
        }

        const latestHp = latestCharState?.currentHealth ?? 0;
        const latestMaxHp = latestStats?.maxHealth ?? 0;
        const latestRegenRate = latestStats?.finalLifeRegenPerSecond ?? 0;

        if (latestHp > 0 && latestHp < latestMaxHp && latestRegenRate > 0) {
          const healthHealAmount = Math.max(1, Math.floor(latestRegenRate));
          handlePlayerHeal(healthHealAmount);
        }
        
        const shouldStopHealthRegen =
          latestHp >= latestMaxHp || latestRegenRate <= 0;

        if (
          !latestCharState ||
          latestHp <= 0 || 
          shouldStopHealthRegen 
        ) {
          if (regenerationTimerRef.current) {
            clearInterval(regenerationTimerRef.current);
            regenerationTimerRef.current = null;
          }
          return; 
        }
      }, 1000);
    }

    return () => {
      if (regenerationTimerRef.current) {
        clearInterval(regenerationTimerRef.current);
        regenerationTimerRef.current = null;
      }
    };
  }, [ 
    activeCharacter?.id,
    activeCharacter?.currentHealth,
    effectiveStats?.finalLifeRegenPerSecond,
    effectiveStats?.maxHealth,
    handlePlayerHeal
    ,isHardcoreDeath
  ]);

}; 