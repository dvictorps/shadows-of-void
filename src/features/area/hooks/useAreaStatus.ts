import { useEffect, useState } from "react";
import { MapLocation, EnemyInstance } from "@/types/gameData";
import { isTown, isAreaComplete } from "@/utils/areaUtils";

interface Params {
  area: MapLocation | null;
  currentEnemy: EnemyInstance | null;
  enemiesKilledCount: number;
  killsToComplete: number;
}

interface AreaStatus {
  isTown: boolean;
  areaComplete: boolean;
}

/**
 * Determines whether the current area is a town and whether it has been completed.
 * Handles the special case for boss encounters (delay after boss death).
 */
export const useAreaStatus = ({
  area,
  currentEnemy,
  enemiesKilledCount,
  killsToComplete,
}: Params): AreaStatus => {
  const [showBossAreaComplete, setShowBossAreaComplete] = useState(false);

  // Track boss death to show completion text after a short delay
  useEffect(() => {
    if (currentEnemy?.isBoss && currentEnemy.isDying) {
      const timer = setTimeout(() => setShowBossAreaComplete(true), 1200);
      return () => clearTimeout(timer);
    }
    setShowBossAreaComplete(false);
  }, [currentEnemy?.isBoss, currentEnemy?.isDying, currentEnemy?.instanceId]);

  const town = isTown(area);
  const areaComplete = isAreaComplete(area, currentEnemy, enemiesKilledCount, killsToComplete, showBossAreaComplete);

  return { isTown: !!town, areaComplete };
}; 