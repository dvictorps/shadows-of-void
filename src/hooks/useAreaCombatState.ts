import { useState, useRef } from "react";
import { EnemyInstance } from "../types/gameData";
import { AreaViewHandles } from "../components/AreaView";

export default function useAreaCombatState() {
  const [currentEnemy, setCurrentEnemy] = useState<EnemyInstance | null>(null);
  const [enemiesKilledCount, setEnemiesKilledCount] = useState(0);

  const gameLoopIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateTimeRef = useRef<number>(Date.now());
  const nextPlayerAttackTimeRef = useRef<number>(0);
  const nextEnemyAttackTimeRef = useRef<number>(0);
  const enemySpawnCooldownRef = useRef<number>(0);
  const enemyDeathAnimEndTimeRef = useRef<number>(0);
  const areaViewRef = useRef<AreaViewHandles | null>(null);

  const [isNextAttackMainHand, setIsNextAttackMainHand] = useState(true);
  const [isBossSpawning, setIsBossSpawning] = useState(false);

  return {
    // Entity State
    currentEnemy,
    setCurrentEnemy,
    enemiesKilledCount,
    setEnemiesKilledCount,
    // Timers & Refs
    gameLoopIntervalRef,
    lastUpdateTimeRef,
    nextPlayerAttackTimeRef,
    nextEnemyAttackTimeRef,
    enemySpawnCooldownRef,
    enemyDeathAnimEndTimeRef,
    areaViewRef,
    // Dual-wield / Boss flags
    isNextAttackMainHand,
    setIsNextAttackMainHand,
    isBossSpawning,
    setIsBossSpawning,
  } as const;
} 