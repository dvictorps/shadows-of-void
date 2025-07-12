import { useEffect, useRef } from 'react';
import { Character } from '../types/gameData';
import { useCharacterStore } from '../stores/characterStore';
import { EffectiveStats, calculateEffectiveStats } from '../utils/statUtils/weapon';

interface UseBarrierRechargeProps {
  barrierZeroTimestamp: number | null;
  setBarrierZeroTimestamp: (timestamp: number | null) => void;
  updateCharacterStore: (updates: Partial<Character>) => void;
  saveCharacterStore: () => void;
  isHardcoreDeath?: boolean;
}

const BARRIER_RECHARGE_DELAY_MS = 7000; // 7 seconds

export const useBarrierRecharge = ({
  barrierZeroTimestamp,
  setBarrierZeroTimestamp,
  updateCharacterStore,
  saveCharacterStore,
  isHardcoreDeath,
}: UseBarrierRechargeProps) => {
  const barrierRechargeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isHardcoreDeath) {
      if (barrierRechargeTimeoutRef.current) {
        clearTimeout(barrierRechargeTimeoutRef.current);
        barrierRechargeTimeoutRef.current = null;
      }
      return;
    }
    // Clear any existing recharge timeout when dependencies change
    if (barrierRechargeTimeoutRef.current) {
      clearTimeout(barrierRechargeTimeoutRef.current);
      barrierRechargeTimeoutRef.current = null;
    }

    // Only proceed if the timestamp is set (meaning barrier hit zero)
    if (barrierZeroTimestamp !== null) {
      barrierRechargeTimeoutRef.current = setTimeout(() => {
        // Get latest state and stats inside timeout
        const latestCharState = useCharacterStore.getState().activeCharacter;
        let latestStats: EffectiveStats | null = null;
        try {
          if (latestCharState)
            latestStats = calculateEffectiveStats(latestCharState);
        } catch (e) {
          console.error(
            "[Barrier Recharge Hook Timeout] Error recalculating stats:",
            e
          );
        }

        const latestCurrentBarrier = latestCharState?.currentBarrier ?? 0;
        const latestMaxBarrier = latestStats?.totalBarrier ?? 0;

        // Recharge only if:
        // 1. Character and stats exist
        // 2. The barrier is still zero or negative
        // 3. Max barrier is positive
        if (
          latestCharState &&
          latestStats &&
          (latestCurrentBarrier === 0 || latestCurrentBarrier < 0) &&
          latestMaxBarrier > 0
        ) {
          updateCharacterStore({ currentBarrier: latestMaxBarrier });
          setTimeout(() => saveCharacterStore(), 50);
          // Reset the timestamp after successful recharge
          setBarrierZeroTimestamp(null);
          console.log('[BarrierRecharge] Barrier recharged to max:', latestMaxBarrier);
        } else {
          const reason = [];
          if (!latestCharState || !latestStats)
            reason.push("Char/Stats missing");
          if (latestCurrentBarrier > 0) reason.push("Barrier > 0");
          if (latestMaxBarrier <= 0) reason.push("Max Barrier <= 0");
          console.log('[BarrierRecharge] Skipped recharge:', reason.join(', '), { latestCurrentBarrier, latestMaxBarrier });
          // If timestamp was reset, we don't need to manually set it to null here
          // If barrier became > 0 somehow, also reset the timestamp logic
          if (latestCurrentBarrier > 0) {
            setBarrierZeroTimestamp(null);
          }
        }
        barrierRechargeTimeoutRef.current = null; // Clear ref after timeout runs
      }, BARRIER_RECHARGE_DELAY_MS);
    }

    // Cleanup function (already included in the hook structure)
    return () => {
      if (barrierRechargeTimeoutRef.current) {
        clearTimeout(barrierRechargeTimeoutRef.current);
        barrierRechargeTimeoutRef.current = null;
      }
    };
  }, [barrierZeroTimestamp, updateCharacterStore, saveCharacterStore, setBarrierZeroTimestamp
    ,isHardcoreDeath
  ]);
}; 