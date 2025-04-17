import React, { useEffect } from 'react';
import { 
    Character, 
    EnemyInstance, 
    MapLocation, 
    act1Locations, 
    EquippableItem
} from '../types/gameData';
import { AreaViewHandles } from '../components/AreaView'; // Assuming AreaViewHandles is exported
import {
    applyPlayerTakeDamage,
    spawnEnemy,
    handleEnemyRemoval,
    PlayerTakeDamageResult
} from '../utils/combatUtils';
import { EffectiveStats } from '../utils/statUtils'; // <<< IMPORT EffectiveStats from statUtils

// <<< DEFINE PROPS INTERFACE >>>
interface UseGameLoopProps {
    currentView: 'worldMap' | 'areaView';
    activeCharacter: Character | null;
    currentArea: MapLocation | null;
    effectiveStats: EffectiveStats | null;
    currentEnemy: EnemyInstance | null;
    enemiesKilledCount: number;
    areaViewRef: React.RefObject<AreaViewHandles | null>;
    // State Setters
    setCurrentEnemy: (enemy: EnemyInstance | null) => void;
    setEnemiesKilledCount: (count: number) => void;
    setBarrierZeroTimestamp: (timestamp: number | null) => void;
    setCurrentView: (view: 'worldMap' | 'areaView') => void;
    setCurrentArea: (area: MapLocation | null) => void;
    setIsTraveling: (traveling: boolean) => void;
    setTravelProgress: (progress: number) => void;
    setTravelTargetAreaId: (id: string | null) => void;
    // Refs (Internal to the page, passed down)
    gameLoopIntervalRef: React.MutableRefObject<NodeJS.Timeout | null>;
    lastUpdateTimeRef: React.MutableRefObject<number>;
    nextPlayerAttackTimeRef: React.MutableRefObject<number>;
    nextEnemyAttackTimeRef: React.MutableRefObject<number>;
    enemySpawnCooldownRef: React.MutableRefObject<number>;
    enemyDeathAnimEndTimeRef: React.MutableRefObject<number>;
    travelTimerRef: React.MutableRefObject<NodeJS.Timeout | null>; // For stopping travel on death
    travelStartTimeRef: React.MutableRefObject<number | null>; // For stopping travel on death
    travelTargetIdRef: React.MutableRefObject<string | null>; // For stopping travel on death
    // Callbacks / Utils
    handlePlayerHeal: (amount: number) => void;
    updateCharacterStore: (updates: Partial<Character>) => void;
    saveCharacterStore: () => void;
    displayPersistentMessage: (message: string | React.ReactNode) => void;
    displayTemporaryMessage: (message: string | React.ReactNode, duration?: number) => void;
    clearPendingDrops: () => void;
    handleItemDropped: (item: EquippableItem) => void; // <<< USE EquippableItem type
}

export const useGameLoop = ({ /* Destructure props */
    currentView,
    activeCharacter,
    currentArea,
    effectiveStats,
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
    clearPendingDrops,
    handleItemDropped,
}: UseGameLoopProps) => {
  
  // <<< MOVE useEffect LOGIC HERE >>>
  useEffect(() => {
    if (currentView !== 'areaView' || !activeCharacter || !currentArea) {
      if (gameLoopIntervalRef.current) {
        console.log("[Game Loop Hook] Clearing loop due to view/data change.");
        clearInterval(gameLoopIntervalRef.current);
        gameLoopIntervalRef.current = null;
      }
      return;
    }

    if (gameLoopIntervalRef.current) {
      return; 
    }

    console.log("[Game Loop Hook] Starting main game loop interval.");
    lastUpdateTimeRef.current = Date.now();

    gameLoopIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const deltaTime = now - lastUpdateTimeRef.current;
      lastUpdateTimeRef.current = now;

      // Use props directly
      const loopChar = activeCharacter; 
      const loopEnemy = currentEnemy; 
      const loopStats = effectiveStats; 
      const loopArea = currentArea; 
      const loopIsTown = loopArea?.id === 'cidade_principal';
      const killsNeeded = loopArea?.killsToComplete ?? 30;
      const loopAreaComplete = enemiesKilledCount >= killsNeeded;

      if (!loopChar || !loopStats || !loopArea || loopIsTown) {
        return;
      }

      // 1. Enemy Spawning
      if (!loopEnemy && !loopAreaComplete) {
        enemySpawnCooldownRef.current -= deltaTime;
        if (enemySpawnCooldownRef.current <= 0) {
          console.log(
            `[Game Loop Hook] Spawn cooldown finished (Kills: ${enemiesKilledCount}/${killsNeeded}), attempting spawn.`
          );
          spawnEnemy(
            loopArea, // Pass currentArea from hook scope
            loopEnemy, // Pass currentEnemy from hook scope
            enemiesKilledCount, // Pass state from props
            setCurrentEnemy, // Pass setter from props
            nextEnemyAttackTimeRef, // Pass ref from props
            nextPlayerAttackTimeRef // Pass ref from props
          );
          enemySpawnCooldownRef.current = Infinity;
        }
      }

      // 2. Enemy Death Animation/Removal
      if (loopEnemy?.isDying) {
        if (now >= enemyDeathAnimEndTimeRef.current) {
          console.log("[Game Loop Hook] Death animation ended, removing enemy.");
          handleEnemyRemoval(
            loopEnemy, 
            loopArea, // Pass currentArea from hook scope
            enemiesKilledCount, 
            setEnemiesKilledCount, 
            setCurrentEnemy, 
            enemyDeathAnimEndTimeRef, 
            enemySpawnCooldownRef, 
            handleItemDropped, 
            updateCharacterStore, 
            saveCharacterStore, 
            displayTemporaryMessage 
          );
        }
        return; 
      }

      // --- Combat Logic ---
      if (loopEnemy) {
        // 3. Player Attack
        if (now >= nextPlayerAttackTimeRef.current) {
          const attackInterval = 1000 / loopStats.attackSpeed;
          nextPlayerAttackTimeRef.current = now + attackInterval;
          
          const weapon1 = loopChar.equipment.weapon1;
          let minDamage = 0;
          let maxDamage = 0;

          if (weapon1) {
            // ... (calculate swing damage - needs ALL_ITEM_BASES import)
            // const weapon1Template = ALL_ITEM_BASES.find(t => t.baseId === weapon1.baseId);
            // if (weapon1Template) { ... }
            // For now, use basic stats (will need to pass/import bases)
             minDamage = loopStats.minDamage;
             maxDamage = loopStats.maxDamage;
          } else {
            minDamage = loopStats.minDamage;
            maxDamage = loopStats.maxDamage;
          }

          let damageDealt = Math.max(1, Math.round(minDamage + Math.random() * (maxDamage - minDamage)));

          let isCriticalHit = false;
          if (Math.random() * 100 < loopStats.critChance) {
            isCriticalHit = true;
            damageDealt = Math.round(damageDealt * (loopStats.critMultiplier / 100));
          }

          const lifeLeechPercent = loopStats.lifeLeechPercent;
          if (lifeLeechPercent > 0) {
            const lifeLeeched = Math.floor(damageDealt * (lifeLeechPercent / 100));
            if (lifeLeeched > 0) {
              handlePlayerHeal(lifeLeeched); 
              areaViewRef.current?.displayLifeLeech(lifeLeeched);
            }
          }

          const healthBefore = loopEnemy.currentHealth;
          const newHealth = Math.max(0, healthBefore - damageDealt);
          areaViewRef.current?.displayPlayerDamage(damageDealt, isCriticalHit);

          const updatedEnemyData: Partial<EnemyInstance> = { currentHealth: newHealth };

          if (newHealth <= 0) {
            updatedEnemyData.isDying = true;
            updatedEnemyData.currentHealth = 0;
            enemyDeathAnimEndTimeRef.current = now + 500;
            nextPlayerAttackTimeRef.current = Infinity;
            nextEnemyAttackTimeRef.current = Infinity;
          }
          const finalUpdatedEnemy = currentEnemy ? { ...currentEnemy, ...updatedEnemyData } : null;
          setCurrentEnemy(finalUpdatedEnemy);
        }

        // 4. Enemy Attack
        if (now >= nextEnemyAttackTimeRef.current) {
          const attackInterval = 1000 / loopEnemy.attackSpeed;
          nextEnemyAttackTimeRef.current = now + attackInterval;
          
          const playerEvasion = loopStats.totalEvasion ?? 0;
          const enemyAccuracy = loopEnemy.accuracy;
          const accuracyTerm = enemyAccuracy * 1.25;
          const evasionTerm = Math.pow(playerEvasion / 5, 0.9);
          let chanceToHit = enemyAccuracy + evasionTerm === 0 ? 1 : accuracyTerm / (enemyAccuracy + evasionTerm);
          chanceToHit = Math.max(0.05, Math.min(0.95, chanceToHit)) * 100;
          const hitRoll = Math.random() * 100;

          if (hitRoll <= chanceToHit) {
            const baseEnemyDamage = Math.max(1, Math.round(loopEnemy.damage));
            const enemyDamageType = loopEnemy.damageType;

            const takeDamageResult: PlayerTakeDamageResult = applyPlayerTakeDamage(
              baseEnemyDamage, enemyDamageType, loopChar, loopStats
            );

            if (takeDamageResult.finalDamage > 0) {
              areaViewRef.current?.displayEnemyDamage(takeDamageResult.finalDamage, enemyDamageType);
            }

            if (Object.keys(takeDamageResult.updates).length > 0) {
              updateCharacterStore(takeDamageResult.updates);
              setTimeout(() => saveCharacterStore(), 100);
            }

            if (takeDamageResult.barrierBroken) {
                setBarrierZeroTimestamp(Date.now());
            }
            if (takeDamageResult.isLowHealth) {
                displayTemporaryMessage(
                    "Vida Baixa! Use uma poção!", 
                    3000
                );
            }

            if (takeDamageResult.isDead) {
              console.log("[Game Loop Hook] Player died. Resetting view.");
              setCurrentView("worldMap");
              setCurrentArea(act1Locations.find((loc) => loc.id === "cidade_principal") || null);
              displayPersistentMessage(takeDamageResult.deathMessage);
              setIsTraveling(false);
              setTravelProgress(0);
              setTravelTargetAreaId(null);
              if (travelTimerRef.current) clearInterval(travelTimerRef.current);
              travelStartTimeRef.current = null;
              travelTargetIdRef.current = null;
              clearPendingDrops(); 

              if (gameLoopIntervalRef.current) {
                console.log("[Game Loop Hook] Clearing loop interval due to player death.");
                clearInterval(gameLoopIntervalRef.current);
                gameLoopIntervalRef.current = null;
              }
              return; 
            }

            const thornsDmg = loopStats.thornsDamage ?? 0;
            if (thornsDmg > 0) {
              areaViewRef.current?.displayEnemyThornsDamage(thornsDmg);
              const enemyBeforeThorns = currentEnemy;
              if (enemyBeforeThorns && !enemyBeforeThorns.isDying && enemyBeforeThorns.instanceId === loopEnemy.instanceId) {
                const healthBeforeThorns = enemyBeforeThorns.currentHealth;
                const newHealthAfterThorns = Math.max(0, healthBeforeThorns - thornsDmg);
                const updatedEnemyDataThorns: Partial<EnemyInstance> = { currentHealth: newHealthAfterThorns };
                if (newHealthAfterThorns <= 0) {
                    updatedEnemyDataThorns.isDying = true;
                    updatedEnemyDataThorns.currentHealth = 0;
                    enemyDeathAnimEndTimeRef.current = now + 500; 
                    nextPlayerAttackTimeRef.current = Infinity; 
                    nextEnemyAttackTimeRef.current = Infinity; 
                }
                const finalEnemyStateAfterThorns = { ...enemyBeforeThorns, ...updatedEnemyDataThorns };
                setCurrentEnemy(finalEnemyStateAfterThorns); 
              }
            }
          } else {
            areaViewRef.current?.displayMissText();
          }
        }
      }
    }, 100);

    return () => {
      if (gameLoopIntervalRef.current) {
        console.log("[Game Loop Hook] Clearing loop interval on cleanup.");
        clearInterval(gameLoopIntervalRef.current);
        gameLoopIntervalRef.current = null;
      }
    };
  }, [
    // List all dependencies passed in props
    currentView,
    activeCharacter,
    currentArea,
    effectiveStats,
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
    clearPendingDrops,
    handleItemDropped
  ]);
}; 