import React, { useEffect } from 'react';
import { 
    Character, 
    EnemyInstance, 
    MapLocation, 
    act1Locations, 
    EquippableItem} from '../types/gameData';
import { AreaViewHandles, HitEffectType } from '@/features/area/components/AreaView';
import {
    applyPlayerTakeDamage,
    spawnEnemy,
    handleEnemyRemoval,
    PlayerTakeDamageResult
} from '../utils/combatUtils';
import { EffectiveStats } from '../utils/statUtils/weapon'; // <<< IMPORT EffectiveStats from statUtils
import { ONE_HANDED_WEAPON_TYPES, TWO_HANDED_WEAPON_TYPES } from '../utils/itemUtils'; // <<< IMPORT
import { playSound } from '../utils/soundUtils';
import { useElementalInstanceStore } from '@/stores/elementalInstanceStore';
import { calculateEffectiveStats } from '../utils/statUtils/weapon';

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
    barrierZeroTimestamp: number | null;
    onHardcoreDeath?: () => void;
    isHardcoreDeath?: boolean;
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
    barrierZeroTimestamp,
    onHardcoreDeath,
    isHardcoreDeath,
}: UseGameLoopProps) => {
  
  // <<< MOVE useEffect LOGIC HERE >>>
  useEffect(() => {
    if (isHardcoreDeath) {
      if (gameLoopIntervalRef.current) {
        clearInterval(gameLoopIntervalRef.current);
        gameLoopIntervalRef.current = null;
      }
      return;
    }
    if (currentView !== 'areaView' || !activeCharacter || !currentArea) {
      if (gameLoopIntervalRef.current) {
        clearInterval(gameLoopIntervalRef.current);
        gameLoopIntervalRef.current = null;
      }
      return;
    }

    if (gameLoopIntervalRef.current) {
      return; 
    }

    lastUpdateTimeRef.current = Date.now();

    gameLoopIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const deltaTime = now - lastUpdateTimeRef.current;
      lastUpdateTimeRef.current = now;

      // ---- PAUSE COMBAT DURING BOSS SPAWN ----
      if (isBossSpawning) {
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
        return;
      }

      // <<< Introduce variable to track health after player attack in this interval >>>
      let enemyHealthAfterPlayerAttackThisInterval = loopEnemy?.currentHealth ?? 0;

      // 1. Enemy Spawning
      if (!loopEnemy && !loopAreaComplete) {
        enemySpawnCooldownRef.current -= deltaTime;
        if (enemySpawnCooldownRef.current <= 0) {
          // Add a small delay before spawning the enemy to allow sprite fade-in
          setTimeout(() => {
          spawnEnemy(
            loopArea, // Pass currentArea from hook scope
            loopEnemy, // Pass currentEnemy from hook scope
            enemiesKilledCount, // Pass state from props
            setCurrentEnemy, // Pass setter from props
            nextEnemyAttackTimeRef, // Pass ref from props
            nextPlayerAttackTimeRef // Pass ref from props
          );
          }, 400); // 400ms delay for fade-in effect
          enemySpawnCooldownRef.current = Infinity;
        }
      }

      // 2. Enemy Death Animation/Removal
      if (loopEnemy?.isDying) {
        if (now >= enemyDeathAnimEndTimeRef.current) {
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
        // Restore hitAnimType logic before player attack logic
        let hitAnimType: HitEffectType = { id: 'default_hit', type: 'hit' };
        const weapon1 = loopChar.equipment.weapon1;
        const weapon2 = loopChar.equipment.weapon2;
        if (weapon1) {
          if (TWO_HANDED_WEAPON_TYPES.has(weapon1.itemType)) {
            hitAnimType = { id: '2h_hit', type: 'hit' };
          } else if (ONE_HANDED_WEAPON_TYPES.has(weapon1.itemType)) {
            const isDualWieldingWeapons = weapon2 && ONE_HANDED_WEAPON_TYPES.has(weapon2.itemType);
            hitAnimType = isDualWieldingWeapons ? { id: '1h_hit', type: 'hit' } : { id: '1h_hit', type: 'hit' };
          }
        }

        // 3. Player Attack
        if (now >= nextPlayerAttackTimeRef.current) {
          let attackStats = loopStats;
          const isMage = loopChar.class === 'Mago';
          const isSpellWeapon = loopChar.equipment.weapon1?.classification === 'Spell';
          const isMeleeWeapon = loopChar.equipment.weapon1?.classification === 'Melee';
          let instanceBonusActive = false;
          let manaCost = 0;
          let selectedInstance = null;
          let hasManaForBonus = false;
          if (isMage && (isSpellWeapon || isMeleeWeapon)) {
            try {
              selectedInstance = useElementalInstanceStore.getState().selectedInstance || 'gelo';
            } catch {
              selectedInstance = 'gelo';
            }
            if (selectedInstance === 'gelo' || selectedInstance === 'fogo') {
              manaCost = 10;
            } else if (selectedInstance === 'raio') {
              manaCost = 5;
            }
            hasManaForBonus = loopChar.currentMana >= manaCost && manaCost > 0;
            instanceBonusActive = hasManaForBonus;
            attackStats = calculateEffectiveStats(loopChar, selectedInstance as 'fogo' | 'gelo' | 'raio', hasManaForBonus);
          }
          const attackInterval = 1000 / (attackStats.attackSpeed || 1);
          nextPlayerAttackTimeRef.current = now + attackInterval;

          let damageDealt = 0;
          const isDualWielding = loopChar.equipment.weapon1 && loopChar.equipment.weapon2 && 
                                 ONE_HANDED_WEAPON_TYPES.has(loopChar.equipment.weapon1.itemType) && 
                                 ONE_HANDED_WEAPON_TYPES.has(loopChar.equipment.weapon2.itemType);

          if (isDualWielding) {
              let swingMinPhys, swingMaxPhys, swingMinEle, swingMaxEle;
              if (isNextAttackMainHand) {
                  swingMinPhys = attackStats.weaponBaseMinPhys ?? 0;
                  swingMaxPhys = attackStats.weaponBaseMaxPhys ?? 0;
                  swingMinEle = attackStats.weaponBaseMinEle ?? 0;
                  swingMaxEle = attackStats.weaponBaseMaxEle ?? 0;
              } else {
                  swingMinPhys = attackStats.weapon2CalcMinPhys ?? 0;
                  swingMaxPhys = attackStats.weapon2CalcMaxPhys ?? 0;
                  swingMinEle = attackStats.weapon2CalcMinEle ?? 0;
                  swingMaxEle = attackStats.weapon2CalcMaxEle ?? 0;
              }
              const globalFlatMinP = attackStats.globalFlatMinPhys;
              const globalFlatMaxP = attackStats.globalFlatMaxPhys;
              const globalFlatMinE = attackStats.globalFlatMinFire + attackStats.globalFlatMinCold + attackStats.globalFlatMinLightning + attackStats.globalFlatMinVoid;
              const globalFlatMaxE = attackStats.globalFlatMaxFire + attackStats.globalFlatMaxCold + attackStats.globalFlatMaxLightning + attackStats.globalFlatMaxVoid;
              const incPhysP = attackStats.increasePhysDamagePercent;
              const incEleP = attackStats.increaseEleDamagePercent;
              let finalMinPhys = (swingMinPhys + globalFlatMinP) * (1 + incPhysP / 100);
              let finalMaxPhys = (swingMaxPhys + globalFlatMaxP) * (1 + incPhysP / 100);
              let finalMinEle = (swingMinEle + globalFlatMinE) * (1 + incEleP / 100);
              let finalMaxEle = (swingMaxEle + globalFlatMaxE) * (1 + incEleP / 100);
              finalMinPhys = Math.max(0, finalMinPhys);
              finalMaxPhys = Math.max(finalMinPhys, finalMaxPhys);
              finalMinEle = Math.max(0, finalMinEle);
              finalMaxEle = Math.max(finalMinEle, finalMaxEle);
              const totalMin = finalMinPhys + finalMinEle;
              const totalMax = finalMaxPhys + finalMaxEle;
              damageDealt = Math.max(1, Math.round(totalMin + Math.random() * (totalMax - totalMin)));
              setIsNextAttackMainHand(!isNextAttackMainHand);
          } else {
              const minDamage = attackStats.minDamage;
              const maxDamage = attackStats.maxDamage;
              damageDealt = Math.max(1, Math.round(minDamage + Math.random() * (maxDamage - minDamage)));
          }

          let isCriticalHit = false;
          if (Math.random() * 100 < attackStats.critChance) {
            isCriticalHit = true;
            damageDealt = Math.round(damageDealt * (attackStats.critMultiplier / 100));
          }

          if (damageDealt > 0) {
              playSound('/sounds/combat/hit.wav');
              areaViewRef.current?.triggerEnemyShake();
              areaViewRef.current?.triggerHitEffect(hitAnimType);
              areaViewRef.current?.displayPlayerDamage(damageDealt, isCriticalHit);
              const lifeLeechPercent = attackStats.lifeLeechPercent;
              if (lifeLeechPercent > 0) {
                let lifeLeeched = Math.floor(damageDealt * (lifeLeechPercent / 100));
                // Aplica redução de recuperação de leech, se houver
                const reducedLeech = (attackStats as unknown as { modifiers?: { type: string; value: number }[] })?.modifiers?.find?.((m: { type: string; value: number }) => m.type === 'ReducedLifeLeechRecovery')?.value ?? 0;
                // Ou, se o stat já existir, some todos os mods desse tipo
                const reducedLeechTotal = (loopChar.equipment ? Object.values(loopChar.equipment).flatMap(item => (item?.modifiers ?? []) as unknown as { type: string; value: number }[]).filter((m: { type: string; value: number }) => m.type === 'ReducedLifeLeechRecovery').reduce((acc: number, m: { value: number }) => acc + (m.value ?? 0), 0) : 0);
                const reduction = Math.max(reducedLeech, reducedLeechTotal);
                if (reduction > 0) {
                  lifeLeeched = Math.floor(lifeLeeched * (1 - reduction / 100));
                }
                if (lifeLeeched > 0) {
                  handlePlayerHeal(lifeLeeched);
                  areaViewRef.current?.displayLifeLeech(lifeLeeched);
                }
              }
              const healthBefore = loopEnemy.currentHealth;
              const newHealth = Math.max(0, healthBefore - damageDealt);
              enemyHealthAfterPlayerAttackThisInterval = newHealth;
              const updatedEnemyData: Partial<EnemyInstance> = { currentHealth: newHealth };
              if (newHealth <= 0) {
                areaViewRef.current?.playEnemyDeathSound(loopEnemy.typeId);
                updatedEnemyData.isDying = true;
                updatedEnemyData.currentHealth = 0;
                enemyDeathAnimEndTimeRef.current = now + 500;
                nextPlayerAttackTimeRef.current = Infinity;
                nextEnemyAttackTimeRef.current = Infinity;
                enemyHealthAfterPlayerAttackThisInterval = 0;
              }
              const finalUpdatedEnemy = { ...loopEnemy, ...updatedEnemyData };
              setCurrentEnemy(finalUpdatedEnemy);
              if (isMage && (isSpellWeapon || isMeleeWeapon) && manaCost > 0 && instanceBonusActive) {
                updateCharacterStore({ currentMana: Math.max(0, loopChar.currentMana - manaCost) });
                setTimeout(() => saveCharacterStore(), 50);
              }
          } else {
              // Handle zero damage case if needed (e.g., display "Blocked" or "Immune" text?)
              // For now, do nothing if damage is 0 or less.
          }
          // --- End Applying Damage & Animations ---
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

            if (takeDamageResult.barrierBroken && !barrierZeroTimestamp) {
                setBarrierZeroTimestamp(Date.now());
            }
            if (takeDamageResult.isLowHealth) {
                displayTemporaryMessage(
                    "Vida Baixa! Use uma poção!", 
                    3000
                );
            }

            if (takeDamageResult.isDead) {
              // Se for hardcore, aciona callback de morte hardcore
              if (loopChar.isHardcore && typeof onHardcoreDeath === 'function') {
                onHardcoreDeath();
                // Não continue lógica normal de morte
                if (gameLoopIntervalRef.current) {
                  clearInterval(gameLoopIntervalRef.current);
                  gameLoopIntervalRef.current = null;
                }
                return;
              }
              // Se for mago, restaura a mana total ao morrer
              if (loopChar.class === 'Mago') {
                updateCharacterStore({ currentMana: loopChar.maxMana });
                setTimeout(() => saveCharacterStore(), 50);
              }
              setCurrentView("worldMap");
              setCurrentArea(
                act1Locations.find((loc) => loc.id === "cidade_principal") || null
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
                    }
                }
            } // End if thornsDmg > 0
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

      // --- Barrier Regen Trigger (robust) ---
      if (
        (loopStats?.totalBarrier ?? 0) > 0 &&
        loopChar.currentBarrier <= 0 &&
        !barrierZeroTimestamp
      ) {
        setBarrierZeroTimestamp(Date.now());
      }
      if (
        (loopStats?.totalBarrier ?? 0) > 0 &&
        loopChar.currentBarrier > 0 &&
        barrierZeroTimestamp
      ) {
        setBarrierZeroTimestamp(null);
      }
    }, 1000 / 60);

    return () => {
      if (gameLoopIntervalRef.current) {
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
    barrierZeroTimestamp,
    onHardcoreDeath,
    isHardcoreDeath,
  ]);
}; 