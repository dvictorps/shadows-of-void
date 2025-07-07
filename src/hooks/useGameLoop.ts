import React, { useEffect } from 'react';
import { 
    Character, 
    EnemyInstance, 
    MapLocation, 
    act1Locations, 
    EquippableItem} from '../types/gameData';
import { AreaViewHandles, HitEffectType } from '../components/AreaView'; // <<< ADD HitEffectType IMPORT HERE
import {
    applyPlayerTakeDamage,
    spawnEnemy,
    handleEnemyRemoval,
    PlayerTakeDamageResult
} from '../utils/combatUtils';
import { EffectiveStats } from '../utils/statUtils'; // <<< IMPORT EffectiveStats from statUtils
import { ONE_HANDED_WEAPON_TYPES, TWO_HANDED_WEAPON_TYPES } from '../utils/itemUtils'; // <<< IMPORT
import { playSound } from '../utils/soundUtils';

// <<< DEFINE PROPS INTERFACE >>>
interface UseGameLoopProps {
    currentView: 'worldMap' | 'areaView';
    activeCharacter: Character | null;
    currentArea: MapLocation | null;
    effectiveStatsRef: React.RefObject<EffectiveStats | null>;
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
    // <<< ADD Dual Wield State Props >>>
    isNextAttackMainHand: boolean;
    setIsNextAttackMainHand: (value: boolean) => void;
    isBossSpawning: boolean;
}

export const useGameLoop = ({ /* Destructure props */
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
    clearPendingDrops,
    handleItemDropped,
    // <<< Destructure Dual Wield Props >>>
    isNextAttackMainHand,
    setIsNextAttackMainHand,
    isBossSpawning,
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

      // ---- PAUSE COMBAT DURING BOSS SPAWN ----
      if (isBossSpawning) {
        console.log("[Game Loop] Paused for boss spawn animation.");
        // We still need to set the next attack time to prevent an instant attack
        // once the animation is over. We add the deltaTime to keep it in sync.
        nextPlayerAttackTimeRef.current += deltaTime;
        nextEnemyAttackTimeRef.current += deltaTime;
        return;
      }
      // ---------------------------------------

      // Use props directly
      const loopChar = activeCharacter; 
      const loopEnemy = currentEnemy; 
      const loopStats = effectiveStatsRef.current; // Read from ref
      const loopArea = currentArea; 
      const loopIsTown = loopArea?.id === 'cidade_principal';
      const killsNeeded = loopArea?.killsToComplete ?? 30;
      const loopAreaComplete = enemiesKilledCount >= killsNeeded && !currentEnemy?.isBoss;

      if (!loopChar || !loopStats || !loopArea || loopIsTown) {
        // Add a log to see why the loop might be exiting early
        console.log("[Game Loop] Exit check:", { hasChar: !!loopChar, hasStats: !!loopStats, hasArea: !!loopArea, isTown: loopIsTown });
        return;
      }

      // <<< Introduce variable to track health after player attack in this interval >>>
      let enemyHealthAfterPlayerAttackThisInterval = loopEnemy?.currentHealth ?? 0;

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

          // --- BOSS DEFEATED LOGIC ---
          if (loopEnemy.isBoss) {
            console.log(`[Game Loop] BOSS DEFEATED: ${loopEnemy.name}. Area complete.`);
            // A boss area might not have `killsToComplete`, so we set kills to 1 to satisfy any check.
            // The main completion logic relies on the boss flag.
            setEnemiesKilledCount(loopArea.killsToComplete ?? 1);
          }
          // --------------------------

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
      if (loopEnemy && !loopEnemy.isDying) {
        // 3. Player Attack
        if (now >= nextPlayerAttackTimeRef.current) {
          const attackInterval = 1000 / loopStats.attackSpeed;
          nextPlayerAttackTimeRef.current = now + attackInterval;
          
          // <<< Determine Weapon Type for Animation >>>
          // Initialize with a default HitEffectType object
          let hitAnimType: HitEffectType = { id: 'default_hit', type: 'hit' }; 
          const weapon1 = loopChar.equipment.weapon1;
          const weapon2 = loopChar.equipment.weapon2; // Restore declaration as it's used below
          if (weapon1) {
              if (TWO_HANDED_WEAPON_TYPES.has(weapon1.itemType)) {
                  // Assign a valid HitEffectType object for 2H
                  hitAnimType = { id: '2h_hit', type: 'hit' };
              } else if (ONE_HANDED_WEAPON_TYPES.has(weapon1.itemType)) {
                  // Check if truly dual wielding or just single 1H
                  const isDualWieldingWeapons = weapon2 && ONE_HANDED_WEAPON_TYPES.has(weapon2.itemType);
                  hitAnimType = isDualWieldingWeapons ? { id: '1h_hit', type: 'hit' } : { id: '1h_hit', type: 'hit' }; // Treat single 1H and dual wield 1H the same for hit effect for now
              }
          }
          // <<< End Determine Weapon Type >>>

          let damageDealt = 0;
          const isDualWielding = loopChar.equipment.weapon1 && loopChar.equipment.weapon2 && 
                                 ONE_HANDED_WEAPON_TYPES.has(loopChar.equipment.weapon1.itemType) && 
                                 ONE_HANDED_WEAPON_TYPES.has(loopChar.equipment.weapon2.itemType);

          if (isDualWielding) {
              // Alternating Swing Calculation
              let swingMinPhys: number, swingMaxPhys: number, swingMinEle: number, swingMaxEle: number;

              if (isNextAttackMainHand) {
                  // Use Weapon 1 (main hand) stats
                  swingMinPhys = loopStats.weaponBaseMinPhys ?? 0;
                  swingMaxPhys = loopStats.weaponBaseMaxPhys ?? 0;
                  swingMinEle = loopStats.weaponBaseMinEle ?? 0;
                  swingMaxEle = loopStats.weaponBaseMaxEle ?? 0;
                  console.log(`[Player Attack] DW Swing: Main Hand (Base Phys: ${swingMinPhys}-${swingMaxPhys}, Base Ele: ${swingMinEle}-${swingMaxEle})`);
              } else {
                  // Use Weapon 2 (off hand) stats - check for undefined
                  swingMinPhys = loopStats.weapon2CalcMinPhys ?? 0;
                  swingMaxPhys = loopStats.weapon2CalcMaxPhys ?? 0;
                  swingMinEle = loopStats.weapon2CalcMinEle ?? 0;
                  swingMaxEle = loopStats.weapon2CalcMaxEle ?? 0;
                  console.log(`[Player Attack] DW Swing: Off Hand (Base Phys: ${swingMinPhys}-${swingMaxPhys}, Base Ele: ${swingMinEle}-${swingMaxEle})`);
              }

              // Apply global flat and percent increases from loopStats
              const globalFlatMinP = loopStats.globalFlatMinPhys;
              const globalFlatMaxP = loopStats.globalFlatMaxPhys;
              const globalFlatMinE = loopStats.globalFlatMinFire + loopStats.globalFlatMinCold + loopStats.globalFlatMinLightning + loopStats.globalFlatMinVoid;
              const globalFlatMaxE = loopStats.globalFlatMaxFire + loopStats.globalFlatMaxCold + loopStats.globalFlatMaxLightning + loopStats.globalFlatMaxVoid;
              const incPhysP = loopStats.increasePhysDamagePercent;
              const incEleP = loopStats.increaseEleDamagePercent; // Use combined ele % for now

              // Calculate final swing damage for THIS hand
              let finalMinPhys = (swingMinPhys + globalFlatMinP) * (1 + incPhysP / 100);
              let finalMaxPhys = (swingMaxPhys + globalFlatMaxP) * (1 + incPhysP / 100);
              let finalMinEle = (swingMinEle + globalFlatMinE) * (1 + incEleP / 100);
              let finalMaxEle = (swingMaxEle + globalFlatMaxE) * (1 + incEleP / 100);

              finalMinPhys = Math.max(0, finalMinPhys); // Prevent negative damage
              finalMaxPhys = Math.max(finalMinPhys, finalMaxPhys);
              finalMinEle = Math.max(0, finalMinEle);
              finalMaxEle = Math.max(finalMinEle, finalMaxEle);

              const totalMin = finalMinPhys + finalMinEle;
              const totalMax = finalMaxPhys + finalMaxEle;

              damageDealt = Math.max(1, Math.round(totalMin + Math.random() * (totalMax - totalMin)));
              
              // Toggle hand for next attack
              setIsNextAttackMainHand(!isNextAttackMainHand);

          } else {
              // Single Weapon or Unarmed: Use average damage from loopStats (previous fix)
              const minDamage = loopStats.minDamage;
              const maxDamage = loopStats.maxDamage;
              damageDealt = Math.max(1, Math.round(minDamage + Math.random() * (maxDamage - minDamage)));
              console.log(`[Player Attack] Single/Unarmed Swing (Avg Damage: ${minDamage}-${maxDamage})`);
          }

          console.log(`[Player Attack] Calculated damageDealt: ${damageDealt}`);

          // --- Apply Damage & Trigger Animations/Effects ---
          let isCriticalHit = false;
          if (Math.random() * 100 < loopStats.critChance) {
            isCriticalHit = true;
            damageDealt = Math.round(damageDealt * (loopStats.critMultiplier / 100));
          }

          // Apply damage only if it's positive
          if (damageDealt > 0) {
              playSound('/sounds/combat/hit.wav');
              // <<< Trigger Animations FIRST >>>
              console.log("[Game Loop] Attempting to trigger animations. Ref available?", !!areaViewRef.current);
              areaViewRef.current?.triggerEnemyShake();
              areaViewRef.current?.triggerHitEffect(hitAnimType); // Pass determined type
              // <<< Trigger Damage Number Display >>>
              areaViewRef.current?.displayPlayerDamage(damageDealt, isCriticalHit);

              // Apply Life Leech
              const lifeLeechPercent = loopStats.lifeLeechPercent;
              if (lifeLeechPercent > 0) {
                const lifeLeeched = Math.floor(damageDealt * (lifeLeechPercent / 100));
                if (lifeLeeched > 0) {
                  handlePlayerHeal(lifeLeeched);
                  areaViewRef.current?.displayLifeLeech(lifeLeeched);
                }
              }

              // Update Enemy Health
              const healthBefore = loopEnemy.currentHealth;
              const newHealth = Math.max(0, healthBefore - damageDealt);
              enemyHealthAfterPlayerAttackThisInterval = newHealth; // Update temp variable

              const updatedEnemyData: Partial<EnemyInstance> = { currentHealth: newHealth };

              if (newHealth <= 0) {
                // Play death sound immediately when enemy dies
                areaViewRef.current?.playEnemyDeathSound(loopEnemy.typeId);
                updatedEnemyData.isDying = true;
                updatedEnemyData.currentHealth = 0;
                enemyDeathAnimEndTimeRef.current = now + 500;
                nextPlayerAttackTimeRef.current = Infinity;
                nextEnemyAttackTimeRef.current = Infinity;
                enemyHealthAfterPlayerAttackThisInterval = 0; // Ensure death reflected
              }
              const finalUpdatedEnemy = { ...loopEnemy, ...updatedEnemyData };
              setCurrentEnemy(finalUpdatedEnemy);
          } else {
              // Handle zero damage case if needed (e.g., display "Blocked" or "Immune" text?)
              // For now, do nothing if damage is 0 or less.
          }
          // --- End Applying Damage & Animations ---
        }

        // 4. Enemy Attack
        if (now >= nextEnemyAttackTimeRef.current) {
          console.log(`[Game Loop] Enemy attack tick. EffectiveStats available: ${!!loopStats}`);

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
              baseEnemyDamage,
              enemyDamageType,
              loopChar,
              loopStats // Now reading from the ref
            );

            if (takeDamageResult.finalDamage > 0) {
              areaViewRef.current?.displayEnemyDamage(
                takeDamageResult.finalDamage,
                enemyDamageType
              );
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
              setCurrentArea(
                act1Locations.find((loc) => loc.id === "cidade_principal") ||
                  null
              );
              displayPersistentMessage(takeDamageResult.deathMessage);
              setIsTraveling(false);
              setTravelProgress(0);
              setTravelTargetAreaId(null);
              if (travelTimerRef.current) clearInterval(travelTimerRef.current);
              travelStartTimeRef.current = null;
              travelTargetIdRef.current = null;
              clearPendingDrops(); 

              if (gameLoopIntervalRef.current) {
                console.log(
                  "[Game Loop Hook] Clearing loop interval due to player death."
                );
                clearInterval(gameLoopIntervalRef.current);
                gameLoopIntervalRef.current = null;
              }
              return; 
            }

            // --- Thorns Damage Application --- 
            const thornsDmg = loopStats?.thornsDamage ?? 0;
            if (thornsDmg > 0) {
                // <<< Only trigger visual effect if enemy is alive BEFORE thorns >>>
                if (enemyHealthAfterPlayerAttackThisInterval > 0) {
                    areaViewRef.current?.displayEnemyThornsDamage(thornsDmg);
                }
                // Check if enemy is still alive *after* player potentially hit it
                if (enemyHealthAfterPlayerAttackThisInterval > 0) { 
                const newHealthAfterThorns = Math.max(
                  0,
                  enemyHealthAfterPlayerAttackThisInterval - thornsDmg
                );
                const updatedEnemyDataThorns: Partial<EnemyInstance> = {
                  currentHealth: newHealthAfterThorns,
                };
                if (newHealthAfterThorns <= 0 && !loopEnemy.isDying) {
                  // Check if not already marked dying
                  // Play death sound immediately when enemy dies from thorns
                  areaViewRef.current?.playEnemyDeathSound(loopEnemy.typeId);
                        updatedEnemyDataThorns.isDying = true;
                        updatedEnemyDataThorns.currentHealth = 0;
                        enemyDeathAnimEndTimeRef.current = now + 500; 
                        nextPlayerAttackTimeRef.current = Infinity; 
                        nextEnemyAttackTimeRef.current = Infinity; 
                    }
                    // Apply thorns update - CRITICAL: Use loopEnemy state potentially updated by player attack
                    const enemyStateBeforeThornsUpdate = currentEnemy; // Get the *most recent* state set by player attack
                if (
                  enemyStateBeforeThornsUpdate &&
                  enemyStateBeforeThornsUpdate.instanceId === loopEnemy.instanceId
                ) {
                  const finalEnemyStateAfterThorns = {
                    ...enemyStateBeforeThornsUpdate,
                    ...updatedEnemyDataThorns,
                  };
                      setCurrentEnemy(finalEnemyStateAfterThorns); 
                      // Update the temp variable as well in case something else uses it this interval
                      enemyHealthAfterPlayerAttackThisInterval = newHealthAfterThorns;
                    } else {
                  console.warn(
                    "[Game Loop] Thorns: Enemy state mismatch, couldn't apply thorns damage."
                  );
                    }
                } // End if healthBeforeThorns > 0
            } // End if thornsDmg > 0
            // --- End Thorns --- 
          } else {
            areaViewRef.current?.displayMissText();
          }
        }
      }

      // 5. Barrier Recharge Logic (NEW)
      if (
        (loopStats?.totalBarrier ?? 0) > 0 &&
        loopChar.currentBarrier < (loopStats?.totalBarrier ?? 0)
      ) {
        // Find a way to get barrierZeroTimestamp here
      }
    }, 1000 / 60);

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
    isNextAttackMainHand,
    setIsNextAttackMainHand,
    isBossSpawning,
    effectiveStatsRef,
  ]);
}; 