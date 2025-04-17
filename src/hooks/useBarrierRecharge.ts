import { useEffect, useRef } from 'react';
import { Character } from '../types/gameData';
import { useCharacterStore } from '../stores/characterStore';
import { EffectiveStats, calculateEffectiveStats } from '../utils/statUtils';

interface UseBarrierRechargeProps {
  barrierZeroTimestamp: number | null;
  setBarrierZeroTimestamp: (timestamp: number | null) => void;
  updateCharacterStore: (updates: Partial<Character>) => void;
  saveCharacterStore: () => void;
}

const BARRIER_RECHARGE_DELAY_MS = 6000; // 6 seconds

export const useBarrierRecharge = ({
  barrierZeroTimestamp,
  setBarrierZeroTimestamp,
  updateCharacterStore,
  saveCharacterStore,
}: UseBarrierRechargeProps) => {
  const barrierRechargeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any existing recharge timeout when dependencies change
    if (barrierRechargeTimeoutRef.current) {
      clearTimeout(barrierRechargeTimeoutRef.current);
      barrierRechargeTimeoutRef.current = null;
    }

    // Only proceed if the timestamp is set (meaning barrier hit zero)
    if (barrierZeroTimestamp !== null) {
      console.log(
        `[Barrier Recharge Hook] Barrier hit zero at ${barrierZeroTimestamp}. Starting ${
          BARRIER_RECHARGE_DELAY_MS / 1000
        }s recharge timer.`
      );

      barrierRechargeTimeoutRef.current = setTimeout(() => {
        console.log(
          "[Barrier Recharge Hook Timeout] Timer finished. Attempting recharge."
        );
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
        // 2. The barrier is still zero (or somehow went negative?)
        // 3. Max barrier is positive
        if (
          latestCharState &&
          latestStats &&
          latestCurrentBarrier <= 0 &&
          latestMaxBarrier > 0
        ) {
          console.log(
            `[Barrier Recharge Hook Timeout] Recharging barrier to full (${latestMaxBarrier}).`
          );
          updateCharacterStore({ currentBarrier: latestMaxBarrier });
          setTimeout(() => saveCharacterStore(), 50);
          // Reset the timestamp after successful recharge
          setBarrierZeroTimestamp(null);
        } else {
          const reason = [];
          if (!latestCharState || !latestStats)
            reason.push("Char/Stats missing");
          if (latestCurrentBarrier > 0) reason.push("Barrier > 0");
          if (latestMaxBarrier <= 0) reason.push("Max Barrier <= 0");
          console.log(
            `[Barrier Recharge Hook Timeout] Recharge conditions not met (${reason.join(
              ", "
            )}).`
          );
          // If timestamp was reset, we don't need to manually set it to null here
          // If barrier became > 0 somehow, also reset the timestamp logic
          if (latestCurrentBarrier > 0) {
            setBarrierZeroTimestamp(null);
          }
        }
        barrierRechargeTimeoutRef.current = null; // Clear ref after timeout runs
      }, BARRIER_RECHARGE_DELAY_MS);
    } else {
      console.log('[Barrier Recharge Hook] Timestamp is null, timer not started.');
    }

    // Cleanup function (already included in the hook structure)
    return () => {
      if (barrierRechargeTimeoutRef.current) {
        console.log(
          "[Barrier Recharge Hook Cleanup] Clearing active timeout."
        );
        clearTimeout(barrierRechargeTimeoutRef.current);
        barrierRechargeTimeoutRef.current = null;
      }
    };
  }, [barrierZeroTimestamp, updateCharacterStore, saveCharacterStore, setBarrierZeroTimestamp]);
}; 