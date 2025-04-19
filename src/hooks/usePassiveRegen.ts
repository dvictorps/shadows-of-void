import { useEffect, useRef } from 'react';
import { Character } from '../types/gameData';
import { EffectiveStats } from '../utils/statUtils';
import { useCharacterStore } from '../stores/characterStore';
import { calculateEffectiveStats } from '../utils/statUtils';

interface UsePassiveRegenProps {
  activeCharacter: Character | null;
  effectiveStats: EffectiveStats | null;
  handlePlayerHeal: (amount: number) => void;
}

export const usePassiveRegen = ({ 
  activeCharacter, 
  effectiveStats, 
  handlePlayerHeal 
}: UsePassiveRegenProps) => {
  
  const regenerationTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.log("[Passive Regen Hook - START]"); 

    if (regenerationTimerRef.current) {
      console.log(
        `[Passive Regen Hook] Clearing previous timer ID: ${regenerationTimerRef.current}`
      );
      clearInterval(regenerationTimerRef.current);
      regenerationTimerRef.current = null;
    }

    const initialRegenRate = effectiveStats?.finalLifeRegenPerSecond ?? 0;
    const initialHp = activeCharacter?.currentHealth ?? 0;
    const initialMaxHp = effectiveStats?.maxHealth ?? 0;

    console.log(
      `[Passive Regen Hook - Check] Rate: ${initialRegenRate}, HP: ${initialHp}/${initialMaxHp}`
    ); 

    if (initialRegenRate > 0 && initialHp < initialMaxHp && initialHp > 0) {
      console.log(`[Passive Regen Hook] Conditions MET. Starting setInterval...`);

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

        console.log(
          `[Passive Regen Hook Tick - Check] TimerID: ${regenerationTimerRef.current}, HP: ${latestHp}/${latestMaxHp}, Rate: ${latestRegenRate}`
        ); 

        if (latestHp > 0 && latestHp < latestMaxHp && latestRegenRate > 0) {
          const healthHealAmount = Math.max(1, Math.floor(latestRegenRate));
          console.log(
            `[Passive Regen Hook Tick - HEAL] Applying health heal: ${healthHealAmount}`
          );
          handlePlayerHeal(healthHealAmount);
        }
        
        const shouldStopHealthRegen =
          latestHp >= latestMaxHp || latestRegenRate <= 0;

        if (
          !latestCharState ||
          latestHp <= 0 || 
          shouldStopHealthRegen 
        ) {
          console.log(
            `[Passive Regen Hook Tick - STOP] Conditions met. Clearing timer ${regenerationTimerRef.current}.`
          );
          if (regenerationTimerRef.current) {
            clearInterval(regenerationTimerRef.current);
            regenerationTimerRef.current = null;
          }
          return; 
        }
      }, 1000);

      console.log(
        `[Passive Regen Hook] Timer STARTED with ID: ${regenerationTimerRef.current}`
      );
    } else {
      const reason = [];
      if (initialRegenRate <= 0) reason.push("Rate <= 0");
      if (initialHp <= 0) reason.push("HP <= 0");
      if (initialHp >= initialMaxHp) reason.push("HP >= MaxHP");
      console.log(
        `[Passive Regen Hook] Conditions NOT MET (${reason.join(", ")}). Timer not started.`
      );
    }

    return () => {
      console.log(
        `[Passive Regen Hook - CLEANUP] Clearing timer ID: ${regenerationTimerRef.current}`
      );
      if (regenerationTimerRef.current) {
        clearInterval(regenerationTimerRef.current);
        regenerationTimerRef.current = null;
      }
      console.log("[Passive Regen Hook - CLEANUP] Finished.");
    };
  }, [ 
    activeCharacter?.id,
    activeCharacter?.currentHealth,
    effectiveStats?.finalLifeRegenPerSecond,
    effectiveStats?.maxHealth,
    handlePlayerHeal
  ]);

}; 