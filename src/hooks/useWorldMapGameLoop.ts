import { RefObject } from "react";
import { useGameLoop } from "./useGameLoop";
import { usePassiveRegen } from "./usePassiveRegen";
import { useBarrierRecharge } from "./useBarrierRecharge";
import { useLowHealthWarning } from "./useLowHealthWarning";
import {
  Character,
  MapLocation,
  EnemyInstance,
  EquippableItem,
} from "@/types/gameData";
import { EffectiveStats } from "@/utils/statUtils";
import { AreaViewHandles } from "@/components/AreaView";

interface Params {
  // Core state
  currentView: "worldMap" | "areaView";
  activeCharacter: Character | null;
  currentArea: MapLocation | null;
  effectiveStatsRef: React.MutableRefObject<EffectiveStats | null>;
  currentEnemy: EnemyInstance | null;
  enemiesKilledCount: number;
  areaViewRef: RefObject<AreaViewHandles | null>;
  // Setters / refs
  setCurrentEnemy: (enemy: EnemyInstance | null) => void;
  setEnemiesKilledCount: (value: number) => void;
  setBarrierZeroTimestamp: (value: number | null) => void;
  setCurrentView: (view: "worldMap" | "areaView") => void;
  setCurrentArea: (loc: MapLocation | null) => void;
  setIsTraveling: (v: boolean) => void;
  setTravelProgress: (v: number) => void;
  setTravelTargetAreaId: (id: string | null) => void;
  gameLoopIntervalRef: React.MutableRefObject<NodeJS.Timeout | null>;
  lastUpdateTimeRef: React.MutableRefObject<number>;
  nextPlayerAttackTimeRef: React.MutableRefObject<number>;
  nextEnemyAttackTimeRef: React.MutableRefObject<number>;
  enemySpawnCooldownRef: React.MutableRefObject<number>;
  enemyDeathAnimEndTimeRef: React.MutableRefObject<number>;
  travelTimerRef: React.MutableRefObject<NodeJS.Timeout | null>;
  travelStartTimeRef: React.MutableRefObject<number | null>;
  travelTargetIdRef: React.MutableRefObject<string | null>;
  // Utilities
  handlePlayerHeal: (amount: number) => void;
  updateCharacterStore: (updates: Partial<Character>) => void;
  saveCharacterStore: () => void;
  displayPersistentMessage: (msg: string | React.ReactNode) => void;
  displayTemporaryMessage: (msg: string | React.ReactNode, duration?: number) => void;
  handleItemDropped: (item: EquippableItem) => void;
  clearPendingDrops: () => void;
  isNextAttackMainHand: boolean;
  setIsNextAttackMainHand: (v: boolean) => void;
  isBossSpawning: boolean;
  // For barrier recharge & low health warning
  barrierZeroTimestamp: number | null;
  textBoxContent: React.ReactNode;
}

export function useWorldMapGameLoop(params: Params) {
  const {
    currentView,
    activeCharacter,
    currentArea,
    effectiveStatsRef,
    currentEnemy,
    enemiesKilledCount,
    areaViewRef,
    setCurrentEnemy,
    setEnemiesKilledCount,
    setBarrierZeroTimestamp,
    setCurrentView,
    setCurrentArea,
    setIsTraveling,
    setTravelProgress,
    setTravelTargetAreaId,
    gameLoopIntervalRef,
    lastUpdateTimeRef,
    nextPlayerAttackTimeRef,
    nextEnemyAttackTimeRef,
    enemySpawnCooldownRef,
    enemyDeathAnimEndTimeRef,
    travelTimerRef,
    travelStartTimeRef,
    travelTargetIdRef,
    handlePlayerHeal,
    updateCharacterStore,
    saveCharacterStore,
    displayPersistentMessage,
    displayTemporaryMessage,
    handleItemDropped,
    clearPendingDrops,
    isNextAttackMainHand,
    setIsNextAttackMainHand,
    isBossSpawning,
    barrierZeroTimestamp,
    textBoxContent,
  } = params;

  // --- Main game loop ---
  useGameLoop({
    currentView,
    activeCharacter,
    currentArea,
    effectiveStatsRef,
    currentEnemy,
    enemiesKilledCount,
    areaViewRef,
    setCurrentEnemy,
    setEnemiesKilledCount,
    setBarrierZeroTimestamp,
    setCurrentView,
    setCurrentArea,
    setIsTraveling,
    setTravelProgress,
    setTravelTargetAreaId,
    gameLoopIntervalRef,
    lastUpdateTimeRef,
    nextPlayerAttackTimeRef,
    nextEnemyAttackTimeRef,
    enemySpawnCooldownRef,
    enemyDeathAnimEndTimeRef,
    travelTimerRef,
    travelStartTimeRef,
    travelTargetIdRef,
    handlePlayerHeal,
    updateCharacterStore,
    saveCharacterStore,
    displayPersistentMessage,
    displayTemporaryMessage,
    handleItemDropped,
    clearPendingDrops,
    isNextAttackMainHand,
    setIsNextAttackMainHand,
    isBossSpawning,
  });

  // Passive regen
  usePassiveRegen({
    activeCharacter,
    effectiveStats: effectiveStatsRef.current,
    handlePlayerHeal,
  });

  // Barrier recharge
  useBarrierRecharge({
    barrierZeroTimestamp,
    setBarrierZeroTimestamp,
    updateCharacterStore,
    saveCharacterStore,
  });

  // Low health warning
  useLowHealthWarning({
    activeCharacter,
    effectiveStats: effectiveStatsRef.current,
    textBoxContent,
    currentView,
    currentArea,
    displayPersistentMessage,
  });
} 