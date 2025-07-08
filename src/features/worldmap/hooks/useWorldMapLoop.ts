import { useWorldMapContext } from "@/features/worldmap/context/WorldMapContext";
import { useWorldMapGameLoop } from "@/hooks/useWorldMapGameLoop";
import { Character, EquippableItem } from "@/types/gameData";
import React from "react";

interface Params {
  activeCharacter: Character | null;
  handlePlayerHeal: (amount: number) => void;
  updateCharacterStore: (u: Partial<Character>) => void;
  saveCharacterStore: () => void;
  displayPersistentMessage: (msg: string | React.ReactNode) => void;
  displayTemporaryMessage: (msg: string | React.ReactNode, duration?: number) => void;
  handleItemDropped: (item: EquippableItem) => void;
  clearPendingDrops: () => void;
  barrierZeroTimestamp: number | null;
  textBoxContent: React.ReactNode;
}

export function useWorldMapLoop(params: Params) {
  const ctx = useWorldMapContext();
  const {
    currentView,
    currentArea,
    effectiveStatsRef,
    combat,
    setCurrentView,
    setCurrentArea,
    setIsTraveling,
    setTravelProgress,
    setTravelTargetAreaId,
  } = ctx;

  const {
    currentEnemy,
    enemiesKilledCount,
    setCurrentEnemy,
    setEnemiesKilledCount,
    gameLoopIntervalRef,
    lastUpdateTimeRef,
    nextPlayerAttackTimeRef,
    nextEnemyAttackTimeRef,
    enemySpawnCooldownRef,
    enemyDeathAnimEndTimeRef,
    areaViewRef,
    isNextAttackMainHand,
    setIsNextAttackMainHand,
    isBossSpawning,
  } = combat;

  useWorldMapGameLoop({
    currentView,
    activeCharacter: params.activeCharacter,
    currentArea,
    effectiveStatsRef,
    currentEnemy,
    enemiesKilledCount,
    areaViewRef,
    setCurrentEnemy,
    setEnemiesKilledCount,
    setBarrierZeroTimestamp: () => {}, // No context setter yet
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
    travelTimerRef: { current: null }, // Not needed for now
    travelStartTimeRef: { current: null },
    travelTargetIdRef: { current: null },
    handlePlayerHeal: params.handlePlayerHeal,
    updateCharacterStore: params.updateCharacterStore,
    saveCharacterStore: params.saveCharacterStore,
    displayPersistentMessage: params.displayPersistentMessage,
    displayTemporaryMessage: params.displayTemporaryMessage,
    handleItemDropped: params.handleItemDropped,
    clearPendingDrops: params.clearPendingDrops,
    isNextAttackMainHand,
    setIsNextAttackMainHand,
    isBossSpawning,
    barrierZeroTimestamp: params.barrierZeroTimestamp,
    textBoxContent: params.textBoxContent,
  });
} 