"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Character,
  MapLocation,
  EnemyInstance,
  enemyTypes,
  calculateEnemyStats,
  EnemyDamageType,
} from "../types/gameData"; // Adjust path if needed
import {
  FaArrowLeft,
  FaHeart,
  FaShoppingBag,
  FaStore,
  FaMagic,
} from "react-icons/fa"; // Potion icon and FaShoppingBag, FaStore, FaMagic
import {
  EffectiveStats,
  calculateSingleWeaponSwingDamage, // <<< ADD IMPORT
} from "../utils/statUtils"; // Remove unused EffectiveStats type import
import { ONE_HANDED_WEAPON_TYPES } from "../utils/itemUtils"; // <<< ADD IMPORT
import { useCharacterStore } from "../stores/characterStore"; // Import useCharacterStore
import * as Tooltip from "@radix-ui/react-tooltip"; // <<< IMPORT RADIX TOOLTIP

interface AreaViewProps {
  character: Character | null;
  area: MapLocation | null;
  effectiveStats: EffectiveStats | null;
  onReturnToMap: (areaWasCompleted: boolean) => void;
  onTakeDamage: (
    rawDamage: number,
    damageType: EnemyDamageType,
    displayDamageCallback: (
      finalDamage: number,
      damageType: EnemyDamageType
    ) => void
  ) => void;
  onEnemyKilled: (
    enemyTypeId: string,
    enemyLevel: number,
    enemyName: string
  ) => void;
  xpToNextLevel: number;
  pendingDropCount: number; // NEW prop
  onOpenDropModalForViewing: () => void; // NEW prop
  onOpenVendor: () => void; // <<< ADD PROP TYPE
  onUseTeleportStone: () => void; // <<< ADD PROP TYPE
  windCrystals: number; // <<< ADD WIND CRYSTALS PROP >>>
}

// Type for the last player damage state
interface LastPlayerDamage {
  value: number;
  timestamp: number; // To trigger re-renders even if value is the same
  id: string; // Unique ID for key prop
  isCritical: boolean; // ADDED: Flag for critical hit
}

// NEW: Type for the last life leech display
interface LastLifeLeech {
  value: number;
  timestamp: number;
  id: string;
}

// NEW: Type for the last thorns damage display
interface LastEnemyThornsDamage {
  value: number;
  timestamp: number;
  id: string;
}

// --- Enemy Damage Number Type (with damage type) ---
interface EnemyDamageNumber {
  id: string;
  value: number;
  x: number;
  y: number;
  type: EnemyDamageType; // <<< ADDED damage type
}
// ----------------------------------------------------

// <<< NEW: Floating Text Type (for MISS) >>>
interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
}
// ----------------------------------------

// --- Helper to get display name for damage type ---
const getDamageTypeDisplayName = (type: EnemyDamageType): string => {
  switch (type) {
    case "physical":
      return "Físico";
    case "cold":
      return "Frio";
    case "void":
      return "Vazio";
    default:
      return type; // Fallback to the internal name
  }
};
// ---------------------------------------------------

function AreaView({
  character,
  area,
  effectiveStats,
  onReturnToMap,
  onTakeDamage,
  onEnemyKilled,
  xpToNextLevel,
  pendingDropCount,
  onOpenDropModalForViewing,
  onOpenVendor,
  onUseTeleportStone,
  windCrystals, // <<< Destructure windCrystals >>>
}: AreaViewProps): React.ReactElement | null {
  // Add initial props log
  console.log(
    "[AreaView Props Check] Character:",
    character?.name,
    "Area:",
    area?.name
  );

  const [currentEnemy, setCurrentEnemy] = useState<EnemyInstance | null>(null);
  const [enemiesKilledCount, setEnemiesKilledCount] = useState(0);
  // --- Update state to use new type ---
  const [playerDamageTakenNumbers, setPlayerDamageTakenNumbers] = useState<
    EnemyDamageNumber[]
  >([]);
  // ------------------------------------
  // Player damage state
  const [lastPlayerDamage, setLastPlayerDamage] =
    useState<LastPlayerDamage | null>(null);
  // NEW state for life leech display
  const [lastLifeLeech, setLastLifeLeech] = useState<LastLifeLeech | null>(
    null
  );
  // NEW state for thorns damage display
  const [lastEnemyThornsDamage, setLastEnemyThornsDamage] =
    useState<LastEnemyThornsDamage | null>(null);
  // <<< ADD State for MISS text >>>
  const [floatingMissTexts, setFloatingMissTexts] = useState<FloatingText[]>(
    []
  );
  // -------------------------------

  const enemyAttackTimer = useRef<NodeJS.Timeout | null>(null);
  const playerAttackTimer = useRef<NodeJS.Timeout | null>(null);
  const spawnTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const areaComplete = enemiesKilledCount >= 30;
  const usePotionAction = useCharacterStore((state) => state.usePotion); // Get action

  const latestEffectiveStatsRef = useRef<EffectiveStats | null>(null); // Ref for latest stats
  const nextAttackWeaponSlotRef = useRef<"weapon1" | "weapon2">("weapon1"); // NEW: Ref for dual wield tracking

  // Keep the effect to update the ref based on the prop
  useEffect(() => {
    latestEffectiveStatsRef.current = effectiveStats;
  }, [effectiveStats]);

  // --- <<< Callback to show damage number (passed from WorldMapPage) >>> ---
  const showPlayerDamageTakenNumber = useCallback(
    (value: number, type: EnemyDamageType) => {
      const damageId = crypto.randomUUID();
      const xPos = 15 + (Math.random() * 10 - 5); // Position for incoming damage
      const yPos = 75 + (Math.random() * 10 - 5);
      setPlayerDamageTakenNumbers((prev) => [
        ...prev,
        { id: damageId, value: value, x: xPos, y: yPos, type: type },
      ]);
      setTimeout(() => {
        setPlayerDamageTakenNumbers((prev) =>
          prev.filter((dn) => dn.id !== damageId)
        );
      }, 800); // Display duration
    },
    []
  );
  // ----------------------------------------------------------------------

  // <<< ADD Function to show MISS text >>>
  const showMissText = useCallback(() => {
    const missId = crypto.randomUUID();
    const xPos = 15 + (Math.random() * 10 - 5); // Same position as damage numbers
    const yPos = 75 + (Math.random() * 10 - 5);
    setFloatingMissTexts((prev) => [
      ...prev,
      { id: missId, text: "MISS", x: xPos, y: yPos },
    ]);
    setTimeout(() => {
      setFloatingMissTexts((prev) => prev.filter((mt) => mt.id !== missId));
    }, 800); // Same duration
  }, []);
  // -----------------------------------

  // Define spawnEnemy LAST (as it's used by death sequence)
  const spawnEnemy = useCallback(() => {
    console.log("[spawnEnemy] Function called."); // Log entry
    if (spawnTimeoutRef.current) {
      clearTimeout(spawnTimeoutRef.current);
      spawnTimeoutRef.current = null;
    }
    if (currentEnemy) {
      console.warn("[spawnEnemy] Aborted: An enemy already exists.");
      return;
    }
    if (
      !area ||
      !area.possibleEnemies ||
      area.possibleEnemies.length === 0 ||
      areaComplete
    ) {
      console.log("[Spawn] Aborted due to area conditions or completion.");
      return;
    }
    const randomEnemyTypeId =
      area.possibleEnemies[
        Math.floor(Math.random() * area.possibleEnemies.length)
      ];
    const enemyTypeData = enemyTypes.find((t) => t.id === randomEnemyTypeId);
    if (!enemyTypeData) {
      console.error(
        `[spawnEnemy] Enemy type data not found for ID: ${randomEnemyTypeId}`
      );
      return;
    }
    const levelVariation = Math.floor(Math.random() * 3) - 1;
    const enemyLevel = Math.max(1, area.level + levelVariation);
    const stats = calculateEnemyStats(enemyTypeData, enemyLevel);
    const newInstance: EnemyInstance = {
      instanceId: crypto.randomUUID(),
      typeId: enemyTypeData.id,
      name: enemyTypeData.name,
      emoji: enemyTypeData.emoji,
      level: enemyLevel,
      maxHealth: stats.health,
      currentHealth: stats.health,
      damage: stats.damage,
      attackSpeed: enemyTypeData.attackSpeed,
      damageType: enemyTypeData.damageType,
      accuracy: stats.accuracy, // <<< Pass accuracy
    };
    console.log(
      `[Spawn] Proceeding to spawn new enemy. Instance Data:`,
      newInstance
    ); // Log instance data
    setCurrentEnemy(newInstance);
    console.log(
      "[spawnEnemy] Finished. Waiting for useEffect to start timers."
    );
  }, [area, areaComplete, currentEnemy]);

  // --- Separate function for removal logic ---
  const handleEnemyRemoval = useCallback(
    (killedEnemy: EnemyInstance) => {
      console.log(`[Enemy Removal] Handling removal for ${killedEnemy.name}`);
      onEnemyKilled(killedEnemy.typeId, killedEnemy.level, killedEnemy.name);

      const newKillCount = enemiesKilledCount + 1;
      setEnemiesKilledCount(newKillCount);

      if (newKillCount < 30) {
        const randomDelay = Math.random() * 1000 + 1000; // 1-2 second delay
        console.log(
          `[Enemy Removal] Scheduling next spawn in ${randomDelay.toFixed(0)}ms`
        );
        if (spawnTimeoutRef.current) {
          clearTimeout(spawnTimeoutRef.current);
          console.log("[Enemy Removal] Cleared previous spawn timeout ref.");
        }
        console.log(`[Enemy Removal] Scheduling spawnEnemy.`);
        spawnTimeoutRef.current = setTimeout(spawnEnemy, randomDelay);
      } else {
        console.log("[Enemy Removal] Area Complete! No spawn scheduled.");
        if (spawnTimeoutRef.current) {
          clearTimeout(spawnTimeoutRef.current);
          spawnTimeoutRef.current = null;
          console.log(
            "[Enemy Removal] Cleared spawn timeout ref on area complete."
          );
        }
      }
    },
    [enemiesKilledCount, onEnemyKilled, spawnEnemy]
  );
  // -----------------------------------------------

  // <<< PASTE displayPlayerDamage and displayLifeLeech definitions here >>>
  const displayPlayerDamage = useCallback(
    (value: number, isCritical: boolean) => {
      setLastPlayerDamage({
        value,
        timestamp: Date.now(),
        id: crypto.randomUUID(),
        isCritical,
      });
    },
    []
  );

  const displayLifeLeech = useCallback((value: number) => {
    setLastLifeLeech({
      value,
      timestamp: Date.now(),
      id: crypto.randomUUID(),
    });
  }, []);

  // NEW: Function to display thorns damage on enemy
  const displayEnemyThornsDamage = useCallback((value: number) => {
    setLastEnemyThornsDamage({
      value,
      timestamp: Date.now(),
      id: crypto.randomUUID(),
    });
  }, []);

  // Define startPlayerAttackTimer FOURTH
  const startPlayerAttackTimer = useCallback(
    (enemy: EnemyInstance) => {
      console.log(
        `[startPlayerAttackTimer] Called for enemy: ${enemy.name} (${enemy.instanceId})`
      );

      // Get the stats available *now* when starting the timer
      const currentStats = latestEffectiveStatsRef.current;
      if (!currentStats) {
        // Check if stats are available to start
        console.error(
          "[startPlayerAttackTimer] Cannot start: currentStats is null."
        );
        return;
      }
      console.log("[startPlayerAttackTimer] Stats used for interval:", {
        attackSpeed: currentStats.attackSpeed,
        minDmg: currentStats.minDamage,
        maxDmg: currentStats.maxDamage,
      });

      // Clear previous player timer if it exists
      if (playerAttackTimer.current) {
        clearInterval(playerAttackTimer.current);
        playerAttackTimer.current = null;
      }

      const attackInterval = 1000 / currentStats.attackSpeed;
      const targetedEnemyInstanceId = enemy.instanceId; // Capture target ID at timer start
      console.log(
        `[Player Attack] Starting timer for enemy ${targetedEnemyInstanceId} with interval: ${attackInterval.toFixed(
          0
        )}ms`
      );

      playerAttackTimer.current = setInterval(() => {
        // Get latest character and stats inside interval from ref
        const latestCharacter = character; // Use character prop
        const latestStats = latestEffectiveStatsRef.current;

        console.log(
          // Simplified log
          `[Player Attack Tick] Checking conditions... Char: ${!!latestCharacter}, Stats: ${!!latestStats}`
        );

        if (!latestCharacter || !latestStats) {
          console.log(
            "[Player Attack Tick] latestCharacter or latestStats null inside interval, stopping timer."
          );
          if (playerAttackTimer.current)
            clearInterval(playerAttackTimer.current);
          playerAttackTimer.current = null;
          return;
        }

        // Use setCurrentEnemy's callback to safely check the latest enemy state
        setCurrentEnemy((latestEnemyState) => {
          console.log(
            // Log enemy state inside setter
            `[Player Attack Tick] Inside setCurrentEnemy. Current Enemy State: ${
              latestEnemyState?.name ?? "null"
            } (${
              latestEnemyState?.instanceId ?? "N/A"
            }), Target ID: ${targetedEnemyInstanceId}`
          );
          // Check if the enemy we are targeting still exists and is the correct one
          if (
            !latestEnemyState ||
            latestEnemyState.instanceId !== targetedEnemyInstanceId || // Compare with the ID captured when timer started
            latestEnemyState.currentHealth <= 0
          ) {
            console.log(
              `[Player Attack Tick] Target enemy ${targetedEnemyInstanceId} no longer valid or alive. Stopping timer.`
            );
            if (playerAttackTimer.current)
              clearInterval(playerAttackTimer.current);
            playerAttackTimer.current = null;
            return latestEnemyState; // Return current state without changes
          }

          // --- Determine attacking weapon and calculate swing stats ---
          // (Existing logic for dual wield and damage calculation...)
          let swingMinDamage = latestStats.minDamage;
          let swingMaxDamage = latestStats.maxDamage;
          let swingPhysMinDamage = latestStats.minPhysDamage;
          let swingPhysMaxDamage = latestStats.maxPhysDamage;
          const weapon1 = latestCharacter.equipment.weapon1;
          const weapon2 = latestCharacter.equipment.weapon2;
          const isTrueDualWielding =
            weapon1 &&
            ONE_HANDED_WEAPON_TYPES.has(weapon1.itemType) &&
            weapon2 &&
            ONE_HANDED_WEAPON_TYPES.has(weapon2.itemType);

          if (isTrueDualWielding) {
            const slotToUse = nextAttackWeaponSlotRef.current;
            const weapon = latestCharacter.equipment[slotToUse];
            if (weapon) {
              const swingDamageData = calculateSingleWeaponSwingDamage(
                weapon,
                latestStats
              );
              swingMinDamage = swingDamageData.totalMin;
              swingMaxDamage = swingDamageData.totalMax;
              swingPhysMinDamage = swingDamageData.minPhys;
              swingPhysMaxDamage = swingDamageData.maxPhys;
            }
            nextAttackWeaponSlotRef.current =
              slotToUse === "weapon1" ? "weapon2" : "weapon1";
          }
          // --- Damage Calculation (use SWING stats) ---
          let damageDealt =
            Math.floor(Math.random() * (swingMaxDamage - swingMinDamage + 1)) +
            swingMinDamage;
          const isCritical = Math.random() * 100 <= latestStats.critChance;
          if (isCritical) {
            damageDealt = Math.round(
              damageDealt * (latestStats.critMultiplier / 100)
            );
          }
          damageDealt = Math.max(1, damageDealt);
          // --- Life Leech ---
          if (latestStats.lifeLeechPercent > 0) {
            const avgTotalSwingDmg = (swingMinDamage + swingMaxDamage) / 2;
            const avgPhysSwingDmg =
              (swingPhysMinDamage + swingPhysMaxDamage) / 2;
            const physProportion =
              avgTotalSwingDmg > 0 ? avgPhysSwingDmg / avgTotalSwingDmg : 0;
            const physicalDamageDealt = Math.round(
              damageDealt * physProportion
            );
            if (physicalDamageDealt > 0) {
              // Correct calculation: Divide stored value by 10 first
              const actualLeechPercent = latestStats.lifeLeechPercent / 10; // e.g., 20 -> 2.0
              const healAmount = Math.ceil(
                physicalDamageDealt * (actualLeechPercent / 100)
              ); // e.g. apply 2.0 / 100
              if (healAmount > 0) {
                displayLifeLeech(healAmount);
              }
            }
          }

          // Apply Damage
          const healthBefore = latestEnemyState.currentHealth;
          const newHealth = Math.max(0, healthBefore - damageDealt);
          console.log(
            // Log damage dealt
            `[Player Attack Tick] Dealt ${damageDealt} damage to ${latestEnemyState.name}. Health: ${healthBefore} -> ${newHealth}`
          );
          displayPlayerDamage(damageDealt, isCritical); // Show damage number

          // Check if enemy died
          if (newHealth <= 0) {
            console.log(
              `[Player Attack Tick] Enemy ${latestEnemyState.name} defeated. Setting isDying flag.`
            );
            // Stop player attack timer FIRST
            if (playerAttackTimer.current) {
              clearInterval(playerAttackTimer.current);
              playerAttackTimer.current = null;
              console.log(
                "[Player Attack Tick] Cleared player attack timer on enemy defeat."
              );
            }
            // <<<< ADDED: Stop ENEMY attack timer IMMEDIATELY >>>>
            if (enemyAttackTimer.current) {
              clearInterval(enemyAttackTimer.current);
              enemyAttackTimer.current = null;
              console.log(
                "[Player Attack Tick] Cleared ENEMY attack timer on enemy defeat."
              );
            }
            // Return enemy state marked as dying
            return { ...latestEnemyState, currentHealth: 0, isDying: true };
          } else {
            // Return updated enemy health
            return { ...latestEnemyState, currentHealth: newHealth };
          }
        }); // End of setCurrentEnemy callback
      }, attackInterval);

      console.log(
        `[Player Attack] Timer ${
          playerAttackTimer.current
        } STARTED with interval: ${attackInterval.toFixed(0)}ms`
      );
    },
    // Dependencies needed by the function
    [character, displayPlayerDamage, displayLifeLeech]
  );

  // Define startEnemyAttackTimer FIFTH
  const startEnemyAttackTimer = useCallback(
    (enemy: EnemyInstance) => {
      if (!enemy) return;
      console.log(`[startEnemyAttackTimer] Called for enemy:`, enemy); // Log full enemy object

      const attackInterval = 1000 / enemy.attackSpeed;
      const originalEnemyInstanceId = enemy.instanceId; // Captura o ID que iniciou
      console.log(
        `[startEnemyAttackTimer] Calculated Interval: ${attackInterval} (Based on Attack Speed: ${enemy.attackSpeed})`
      ); // Log interval and speed

      // Limpa timer anterior IMEDIATAMENTE
      if (enemyAttackTimer.current) {
        console.log(
          `[startEnemyAttackTimer] Clearing existing timer ID: ${enemyAttackTimer.current}`
        );
        clearInterval(enemyAttackTimer.current);
        enemyAttackTimer.current = null;
      }

      // Inicia o novo timer APÓS um pequeno delay
      setTimeout(() => {
        // Verifica se o inimigo que deveria iniciar este timer ainda é o inimigo atual
        // E se o timer não foi iniciado por outra chamada nesse meio tempo
        const latestEnemyStateForCheck = currentEnemy; // Check current state when timeout runs
        if (latestEnemyStateForCheck?.instanceId !== originalEnemyInstanceId) {
          console.log(
            `[startEnemyAttackTimer Delayed] Inimigo mudou (${
              latestEnemyStateForCheck?.name ?? "null"
            }) antes do timer ${originalEnemyInstanceId} iniciar. Abortando.`
          );
          return; // Não inicia o timer se o inimigo já mudou
        }
        // ADDED Check: Prevent starting if a timer already exists (e.g., from a rapid previous call)
        if (enemyAttackTimer.current) {
          console.log(
            `[startEnemyAttackTimer Delayed] Timer ID ${enemyAttackTimer.current} já existe para ${originalEnemyInstanceId}. Abortando duplicata.`
          );
          return;
        }

        console.log(
          `[startEnemyAttackTimer Delayed] Iniciando setInterval para ${originalEnemyInstanceId}`
        );
        const newTimerId = setInterval(() => {
          // Store new ID temporarily
          // Get the LATEST enemy state from the component's scope
          const latestEnemyState = currentEnemy;

          console.log(
            // Log with Timer ID
            `[Enemy Attack Tick - Timer ${newTimerId}] Running. Latest State: ${
              latestEnemyState?.name ?? "null"
            } (${latestEnemyState?.instanceId ?? "N/A"}). Checking health: ${
              latestEnemyState?.currentHealth ?? "N/A"
            }, isDying: ${latestEnemyState?.isDying}`
          );

          // Use the LATEST state for checks and actions
          const conditionMet =
            latestEnemyState &&
            !latestEnemyState.isDying && // Check if not dying
            latestEnemyState.instanceId === originalEnemyInstanceId && // Usa o ID original capturado
            latestEnemyState.currentHealth > 0;

          console.log(
            `[Enemy Attack Tick - Timer ${newTimerId}] Condition Result: ${conditionMet}`
          ); // Log condition result

          if (conditionMet) {
            // <<< EVASION CHECK >>>
            const playerEvasion =
              latestEffectiveStatsRef.current?.totalEvasion ?? 0;
            const enemyAccuracy = latestEnemyState.accuracy; // Get from instance

            // PoE Hit Chance Formula
            const accuracyTerm = enemyAccuracy * 1.25;
            const evasionTerm = Math.pow(playerEvasion / 5, 0.9);
            let chanceToHit =
              enemyAccuracy + evasionTerm === 0
                ? 1
                : accuracyTerm / (enemyAccuracy + evasionTerm);
            chanceToHit = Math.max(0.05, Math.min(0.95, chanceToHit)) * 100; // Clamp 5%-95% and convert to percentage

            const hitRoll = Math.random() * 100;
            console.log(
              `[Evasion Check] EnemyAcc: ${enemyAccuracy}, PlayerEva: ${playerEvasion}, ChanceToHit: ${chanceToHit.toFixed(
                1
              )}%, Roll: ${hitRoll.toFixed(1)}`
            );

            if (hitRoll <= chanceToHit) {
              // --- HIT ---
              console.log("[Evasion Check] Result: HIT");
              const damageDealt = Math.max(
                1,
                Math.round(latestEnemyState.damage)
              );
              const damageType = latestEnemyState.damageType;
              // Pass damage type to onTakeDamage
              // onTakeDamage now needs the callback to display the *final* damage
              // <<< Pass the display callback as the third argument >>>
              onTakeDamage(
                damageDealt,
                damageType,
                showPlayerDamageTakenNumber
              );
              // Removed direct call to show number here, will be called via callback from world-map

              // --- APPLY THORNS DAMAGE (if hit) ---
              const currentPlayerStats = latestEffectiveStatsRef.current;
              const thornsDmg = currentPlayerStats?.thornsDamage ?? 0;

              if (thornsDmg > 0) {
                console.log(
                  `[Enemy Attack Tick - Timer ${newTimerId}] Player has ${thornsDmg} Thorns. Applying damage to ${latestEnemyState.name}.`
                );
                // Update enemy state to apply thorns damage
                setCurrentEnemy((prevEnemy) => {
                  // Ensure we are updating the correct enemy that just attacked
                  if (
                    !prevEnemy ||
                    prevEnemy.instanceId !== originalEnemyInstanceId ||
                    prevEnemy.isDying
                  ) {
                    console.warn(
                      `[Thorns] Enemy state changed before thorns damage could be applied to ${originalEnemyInstanceId}.`
                    );
                    return prevEnemy; // Do not update if enemy changed or is dying
                  }

                  const healthBeforeThorns = prevEnemy.currentHealth;
                  const newHealthAfterThorns = Math.max(
                    0,
                    healthBeforeThorns - thornsDmg
                  );
                  console.log(
                    `[Thorns] Enemy ${prevEnemy.name} health: ${healthBeforeThorns} -> ${newHealthAfterThorns} (Thorns: ${thornsDmg})`
                  );
                  displayEnemyThornsDamage(thornsDmg); // Show thorns damage number

                  // Check if thorns killed the enemy
                  if (newHealthAfterThorns <= 0) {
                    console.log(
                      `[Thorns] Enemy ${prevEnemy.name} defeated by Thorns!`
                    );
                    // Clear BOTH timers immediately
                    if (playerAttackTimer.current) {
                      clearInterval(playerAttackTimer.current);
                      playerAttackTimer.current = null;
                    }
                    if (enemyAttackTimer.current === newTimerId) {
                      // Check if it's the current timer
                      clearInterval(enemyAttackTimer.current);
                      enemyAttackTimer.current = null;
                    }
                    // Return enemy state marked as dying
                    return { ...prevEnemy, currentHealth: 0, isDying: true };
                  } else {
                    // Return updated enemy health
                    return {
                      ...prevEnemy,
                      currentHealth: newHealthAfterThorns,
                    };
                  }
                });
              }
              // --- END THORNS DAMAGE ---
            } else {
              // --- EVADE ---
              console.log("[Evasion Check] Result: EVADE (MISS)");
              showMissText(); // <<< Show MISS text
            }
            // <<< END EVASION CHECK >>>
          } else {
            let reason = "Unknown";
            if (!latestEnemyState) reason = "Enemy is null in state";
            else if (latestEnemyState.instanceId !== originalEnemyInstanceId)
              reason = `Enemy instance mismatch (Expected ${originalEnemyInstanceId}, got ${
                latestEnemyState?.instanceId ?? "null"
              })`;
            else if (latestEnemyState.currentHealth <= 0)
              reason = "Enemy health <= 0 in state";
            else if (latestEnemyState.isDying) reason = "Enemy is dying";

            console.log(
              `[Enemy Attack Tick - Timer ${newTimerId}] Condition failed (${reason}). Clearing timer ${newTimerId}.`
            ); // Log clear reason
            // Ensure we are clearing the correct timer reference
            clearInterval(newTimerId); // Clear THIS specific timer
            // Only nullify the ref if this timer is the one currently stored
            if (enemyAttackTimer.current === newTimerId) {
              enemyAttackTimer.current = null;
            }
          }
        }, attackInterval);

        // Assign the new timer ID to the ref *after* setInterval setup
        enemyAttackTimer.current = newTimerId;
        console.log(
          `[startEnemyAttackTimer Delayed] Started Timer ID: ${enemyAttackTimer.current}`
        );
      }, 10); // Delay de 10ms (ajustável)
    },
    [
      onTakeDamage,
      showPlayerDamageTakenNumber,
      currentEnemy,
      displayEnemyThornsDamage,
      showMissText,
    ] // ADD displayEnemyThornsDamage and showMissText
  );

  // Effect to clear the player damage display after a delay
  useEffect(() => {
    if (lastPlayerDamage) {
      const timer = setTimeout(() => {
        setLastPlayerDamage(null);
      }, 800); // Duration to display the number
      return () => clearTimeout(timer);
    }
  }, [lastPlayerDamage]);

  // NEW: Effect to clear life leech display
  useEffect(() => {
    if (lastLifeLeech) {
      const timer = setTimeout(() => {
        setLastLifeLeech(null);
      }, 800); // Same duration
      return () => clearTimeout(timer);
    }
  }, [lastLifeLeech]);

  // NEW: Effect to clear thorns damage display
  useEffect(() => {
    if (lastEnemyThornsDamage) {
      const timer = setTimeout(() => {
        setLastEnemyThornsDamage(null);
      }, 800); // Same duration
      return () => clearTimeout(timer);
    }
  }, [lastEnemyThornsDamage]);

  // --- Effect for Initial Spawn ---
  useEffect(() => {
    console.log("[Effect Initial Spawn] Checking for initial spawn.", {
      character: !!character,
      area: !!area,
      currentEnemy: !!currentEnemy,
    });
    if (character && area && !currentEnemy && !areaComplete) {
      // Also check areaComplete
      console.log(
        "[Effect Initial Spawn] Conditions met. Calling spawnEnemy() directly."
      );
      // Clear any lingering spawn timeout just in case
      if (spawnTimeoutRef.current) {
        clearTimeout(spawnTimeoutRef.current);
        spawnTimeoutRef.current = null;
      }
      spawnEnemy();
    }
  }, [character, area, currentEnemy, areaComplete, spawnEnemy]); // Depend on these to trigger initial check

  // --- Main timer/spawn management effect (now only handles PLAYER timer and RESPAWN) ---
  useEffect(() => {
    console.log("[Effect Player/Respawn] <<< START >>>");
    // --- EXIT EARLY if character or area is missing ---
    // NOTE: Added null check for character/area props as they might be null initially
    if (!character || !area) {
      console.log(
        "[Effect Player/Respawn] Exiting early: No character or area."
      );
      // Ensure cleanup runs if props become null
      if (playerAttackTimer.current) clearInterval(playerAttackTimer.current);
      playerAttackTimer.current = null;
      if (spawnTimeoutRef.current) clearTimeout(spawnTimeoutRef.current);
      spawnTimeoutRef.current = null;
      return;
    }

    console.log(
      `[Effect Player/Respawn] Running. currentEnemy: ${
        currentEnemy?.name ?? "null"
      }. areaComplete: ${areaComplete}`
    );

    if (currentEnemy) {
      console.log(
        `[Effect Player/Respawn] Enemy exists. Starting Player timer...` // <<< LOG 1
      );
      // Start Player Timer (if stats available)
      if (latestEffectiveStatsRef.current) {
        // <<< CHECK 1
        if (!playerAttackTimer.current) {
          // <<< CHECK 2
          console.log(
            `[Effect Player/Respawn] Calling startPlayerAttackTimer.` // <<< LOG 2
          );
          startPlayerAttackTimer(currentEnemy); // <<< CHAMADA
        } else {
          console.log(`[Effect Player/Respawn] Player timer already running.`); // <<< LOG 3
        }
      } else {
        console.log(
          `[Effect Player/Respawn] Stats not ready for player timer.` // <<< LOG 4
        );
      }
    } else {
      // Respawn Logic
      console.log(
        `[Effect Player/Respawn] No enemy. Clearing Player timer and checking respawn...`
      );
      if (playerAttackTimer.current) clearInterval(playerAttackTimer.current);
      playerAttackTimer.current = null;
      if (!areaComplete) {
        console.log(`[Effect Player/Respawn] Scheduling RESPAWN...`);
        const randomDelay = Math.random() * 2000 + 1000;
        if (spawnTimeoutRef.current) clearTimeout(spawnTimeoutRef.current);
        spawnTimeoutRef.current = setTimeout(spawnEnemy, randomDelay);
      }
    }

    // Cleanup for THIS effect: Clear ONLY player timer and spawn timer
    return () => {
      console.log(
        `[Effect Player/Respawn Cleanup] <<< START CLEANUP >>>. Player Timer: ${!!playerAttackTimer.current}, Spawn Timer: ${!!spawnTimeoutRef.current}`
      );
      if (playerAttackTimer.current) {
        console.log("[Effect Player/Respawn Cleanup] Clearing Player Timer.");
        clearInterval(playerAttackTimer.current);
        playerAttackTimer.current = null;
      }
      if (spawnTimeoutRef.current) {
        console.log("[Effect Player/Respawn Cleanup] Clearing Spawn Timer.");
        clearTimeout(spawnTimeoutRef.current);
        spawnTimeoutRef.current = null;
      }
      console.log(`[Effect Player/Respawn Cleanup] <<< END CLEANUP >>>`);
    };
    // Dependencies: Only need currentEnemy to know if we should be attacking/respawning
    // Also need functions it calls and areaComplete.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEnemy, areaComplete, spawnEnemy]); // Keep dependencies minimal
  // -----------------------------------------------------------------------------

  // --- NEW Effect specifically for Enemy Timer ---
  useEffect(() => {
    console.log(
      `[Effect Enemy Timer] Running. currentEnemy: ${
        currentEnemy?.name ?? "null"
      }, isDying: ${currentEnemy?.isDying}`
    );
    // CHECK isDying flag - REMOVED
    if (currentEnemy /* && !currentEnemy.isDying */) {
      // Enemy exists and is not dying, start its timer
      console.log(
        `[Effect Enemy Timer] Enemy detected and alive, calling startEnemyAttackTimer.`
      );
      startEnemyAttackTimer(currentEnemy); // Call the stable function
    } else {
      // No enemy, or enemy is dying, ensure timer is stopped
      if (enemyAttackTimer.current) {
        const reason = currentEnemy ? "enemy is dying" : "no enemy";
        console.log(`[Effect Enemy Timer] Clearing timer because ${reason}.`);
        clearInterval(enemyAttackTimer.current);
        enemyAttackTimer.current = null;
      }
    }

    // Cleanup for THIS effect: Clear ONLY enemy timer
    return () => {
      if (enemyAttackTimer.current) {
        console.log(`[Effect Enemy Timer Cleanup] Clearing Enemy Timer.`);
        clearInterval(enemyAttackTimer.current);
        enemyAttackTimer.current = null;
      }
    };
    // DEPENDENCY change: Now *only* depends on the enemy object itself
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEnemy?.instanceId]); // <<<< ENSURE THIS IS THE ONLY DEPENDENCY HERE

  // --- NEW Effect for handling death animation and removal ---
  useEffect(() => {
    if (currentEnemy?.isDying) {
      console.log(
        `[Effect Death] Enemy ${currentEnemy.name} is dying. Starting removal timer.`
      );
      const enemyToRemove = currentEnemy; // Capture the dying enemy
      const removalTimeout = setTimeout(() => {
        console.log(
          `[Effect Death] Removal timeout finished for ${enemyToRemove.name}.`
        );
        handleEnemyRemoval(enemyToRemove);
        // Only set to null if the *current* enemy is still the one we intended to remove
        setCurrentEnemy((current) =>
          current?.instanceId === enemyToRemove.instanceId ? null : current
        );
      }, 500); // 500ms animation duration

      // Cleanup for this specific death sequence
      return () => clearTimeout(removalTimeout);
    }
  }, [currentEnemy, handleEnemyRemoval]); // Added currentEnemy, handleEnemyRemoval
  // -----------------------------------------------------------

  // Loading check - Return null instead of JSX directly
  if (!character || !area) {
    return null; // Return null if essential props are missing
  }

  // Check if the current area is the starting town
  const isTown = area.id === "cidade_principal";

  // Add log before return
  console.log("[AreaView Render Check] Conditions:", {
    isTown,
    areaComplete,
    currentEnemyName: currentEnemy?.name,
  });

  const enemyHealthPercentage = currentEnemy
    ? (currentEnemy.currentHealth / currentEnemy.maxHealth) * 100
    : 0;

  const xpPercentage =
    xpToNextLevel > 0 ? (character.currentXP / xpToNextLevel) * 100 : 0;
  const playerHealthPercentage =
    ((character?.currentHealth ?? 0) / (effectiveStats?.maxHealth ?? 1)) * 100;

  // <<< Helper function for calculating barrier percentage robustly >>>
  const calculateBarrierPercentage = (
    current: number | null | undefined,
    max: number | null | undefined
  ): number => {
    const currentVal = current ?? 0;
    const maxVal = max ?? 0;
    if (maxVal <= 0 || currentVal <= 0) {
      return 0;
    }
    const percentage = Math.max(0, Math.min(100, (currentVal / maxVal) * 100));
    return isNaN(percentage) ? 0 : percentage; // Extra safety
  };
  const barrierPercentage = calculateBarrierPercentage(
    character?.currentBarrier,
    effectiveStats?.totalBarrier
  );
  // <<< ADD LOG: Check barrier values before render >>>
  console.log("[AreaView Barrier Check]", {
    currentBarrier: character?.currentBarrier,
    totalBarrier: effectiveStats?.totalBarrier,
    calculatedPercentage: barrierPercentage,
    playerHealthPercentage: playerHealthPercentage, // Log health % for comparison
  });
  // -------------------------------------------------------------

  // --- Return JSX ---
  // Add log right before return to check button disable condition
  console.log(
    `[AreaView Potion Check] Potions: ${character.healthPotions}, Current: ${
      character.currentHealth
    }, Max: ${effectiveStats?.maxHealth ?? "N/A"}, Disabled Check Result: ${
      // Use effectiveStats.maxHealth
      !effectiveStats ||
      character.healthPotions <= 0 ||
      character.currentHealth >= effectiveStats.maxHealth
    }`
  );
  // <<< ADD LOG TO CHECK windCrystals VALUE AND TYPE >>>
  // console.log('[AreaView Render] Checking windCrystals:', { value: windCrystals, type: typeof windCrystals });
  // ----------------------------------------------------
  return (
    <div
      className="flex flex-col border border-white flex-grow relative bg-black animate-fade-in opacity-0"
      style={{ minHeight: "70vh" }}
    >
      <button
        // Pass areaComplete to the handler
        onClick={() => onReturnToMap(areaComplete)}
        className="absolute top-2 right-2 p-1 border border-white rounded text-white hover:bg-gray-700 focus:outline-none z-20"
        aria-label="Voltar ao Mapa"
      >
        <FaArrowLeft />
      </button>

      {/* NEW: Pending Drops Button (Top Left) */}
      {pendingDropCount > 0 && !isTown && (
        <button
          onClick={onOpenDropModalForViewing}
          className="absolute top-12 right-2 px-2 py-1 border border-gray-600 bg-gray-800 rounded text-white hover:bg-gray-700 focus:outline-none flex items-center gap-1 z-20"
          aria-label={`Ver ${pendingDropCount} itens pendentes`}
        >
          <FaShoppingBag size={16} />
          <span className="bg-red-600 text-white text-xs font-bold rounded-full px-1.5 py-0.5 relative -top-1 -right-1">
            {pendingDropCount}
          </span>
        </button>
      )}

      {/* Vendor Button (Top Right - Only in Town) */}
      {isTown && (
        <button
          onClick={onOpenVendor}
          className="absolute top-1/2 right-2 transform -translate-y-1/2 px-3 py-2 border border-yellow-400 bg-yellow-900/50 rounded text-yellow-300 hover:bg-yellow-800/50 focus:outline-none flex items-center gap-1.5 z-20"
          aria-label="Abrir Vendedor"
        >
          <FaStore size={18} />
          <span className="hidden sm:inline">Vendedor</span>
        </button>
      )}

      {/* Area Info - Conditional Title */}
      <h2 className="text-xl font-semibold mb-1 text-white pt-8">
        {" "}
        {/* Add padding-top to avoid overlap */}
        {isTown ? area.name : `${area.name} (Nv. ${area.level})`}
      </h2>
      {/* Conditionally render kill count - hide in town */}
      {!isTown && (
        // Add wrapper div to limit width and center
        <div className="mb-3 max-w-xs mx-auto">
          <p className="text-xs text-center text-gray-400 mb-1">
            {" "}
            {/* Restore mb-1 */}
            Inimigos: {enemiesKilledCount} / 30
          </p>
          {/* Restore original height and keep structure */}
          <div className="w-full bg-gray-700 rounded h-2.5 border border-gray-500 overflow-hidden">
            {" "}
            {/* Restore h-2.5 */}
            <div
              className="bg-purple-600 h-full transition-width duration-300 ease-linear"
              style={{ width: `${(enemiesKilledCount / 30) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      <div className="flex-grow flex flex-col items-center justify-center relative min-h-[200px]">
        {/* Damage Numbers Layer */}
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
          {/* --- Update rendering to use conditional colors --- */}
          {playerDamageTakenNumbers.map((dn) => {
            let textColorClass = "text-red-500"; // Default red (physical)
            if (dn.type === "cold") {
              textColorClass = "text-blue-400"; // Blue for cold
            } else if (dn.type === "void") {
              textColorClass = "text-purple-400"; // Purple for void
            }

            return (
              <span
                key={dn.id}
                className={`absolute text-xl font-bold animate-diablo-damage-float ${textColorClass} text-stroke-black`}
                style={{
                  left: `${dn.x}%`,
                  top: `${dn.y}%`,
                  transform: "translateX(-50%)",
                }}
              >
                {dn.value}
              </span>
            );
          })}
          {/* <<< Render Floating MISS Text >>> */}
          {floatingMissTexts.map((mt) => (
            <span
              key={mt.id}
              className="absolute text-xl font-bold animate-float-up-fade text-gray-400" // Style for MISS
              style={{
                left: `${mt.x}%`,
                top: `${mt.y}%`,
                transform: "translateX(-50%)",
              }}
            >
              {mt.text}
            </span>
          ))}
          {/* -------------------------------- */}

          {/* Floating Player Damage Numbers (damage dealt TO enemy) */}
          {lastPlayerDamage && (
            <div
              key={lastPlayerDamage.id}
              className={`
                absolute text-center pointer-events-none
                animate-float-up-fade font-bold
                ${
                  lastPlayerDamage.isCritical
                    ? "text-red-500 text-3xl" // Critical: Red, larger
                    : "text-white text-2xl text-stroke-black" // Normal: White, slightly smaller, black outline
                }
              `}
              style={{
                left: `50%`, // Centered horizontally
                top: `15%`, // Positioned higher for player damage
                transform: "translateX(-50%)",
              }}
            >
              {lastPlayerDamage.value}
              {/* Add 'CRITICO!!!' suffix for critical hits */}
              {lastPlayerDamage.isCritical && " CRITICO!!!"}
            </div>
          )}

          {/* NEW: Floating Life Leech Numbers */}
          {lastLifeLeech && (
            <div
              key={lastLifeLeech.id}
              className="absolute text-center pointer-events-none animate-float-up-fade font-bold text-green-500 text-xl" // Green, slightly smaller than normal damage
              style={{
                left: `55%`, // Position slightly to the right of damage
                top: `25%`, // Position slightly lower than damage
                transform: "translateX(-50%)",
              }}
            >
              +{lastLifeLeech.value}
            </div>
          )}

          {/* NEW: Floating Enemy Thorns Damage Numbers */}
          {lastEnemyThornsDamage && (
            <div
              key={lastEnemyThornsDamage.id}
              // Style similar to player damage, but maybe different color/position?
              className="absolute text-center pointer-events-none animate-float-up-fade font-bold text-purple-400 text-xl" // Purple for thorns?
              style={{
                left: `45%`, // Position slightly to the left of damage
                top: `20%`, // Position slightly higher than leech
                transform: "translateX(-50%)",
              }}
            >
              {lastEnemyThornsDamage.value} (Thorns)
            </div>
          )}
        </div>

        {/* Enemy/Completion/Town Display */}
        {isTown ? (
          // Display safe zone message in town
          <p className="text-lg text-gray-400">Zona Segura.</p>
        ) : areaComplete ? (
          <p className="text-2xl text-green-400 font-bold">Área Concluída!</p>
        ) : currentEnemy ? (
          // --- Wrap with Radix Tooltip components ---
          <Tooltip.Provider delayDuration={100}>
            {" "}
            {/* Optional: Add delay */}
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                {/* Apply fade-out transition if enemy is dying */}
                <div
                  className={`text-center relative z-0 transition-opacity duration-500 ease-out ${
                    currentEnemy.isDying ? "opacity-0" : "opacity-100"
                  }`}
                >
                  <p className="text-lg font-medium text-white mb-1">
                    {currentEnemy.name} (Nv. {currentEnemy.level})
                  </p>
                  <div className="text-6xl my-4">{currentEnemy.emoji}</div>
                  <div className="w-full bg-gray-700 rounded h-4 border border-gray-500 overflow-hidden mb-1">
                    <div
                      className="bg-red-600 h-full transition-width duration-150 ease-linear"
                      style={{ width: `${enemyHealthPercentage}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-300 mb-4">
                    {currentEnemy.currentHealth} / {currentEnemy.maxHealth}
                  </p>
                </div>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content
                  className="bg-gray-900 text-white text-sm px-2 py-1 rounded shadow-lg border border-gray-600 z-50" // Basic styling
                  sideOffset={5}
                >
                  {`Tipo de Dano: ${getDamageTypeDisplayName(
                    currentEnemy.damageType
                  )}`}
                  <Tooltip.Arrow className="fill-gray-900" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>
        ) : (
          // --------------------------------------------
          // Only show "Procurando inimigos..." if not in town
          <p className="text-gray-500">Procurando inimigos...</p>
        )}
      </div>

      {/* Player Stats Display (Health Orb & XP Bar) - Positioned at the bottom */}
      <div className="absolute bottom-8 left-4 right-4 flex items-end justify-between gap-4 px-2">
        {/* Left Side: Health Orb with Text Above */}
        <div className="relative w-20 h-20 flex flex-col items-center">
          {/* <<< ADD Barrier Text Above Health Text >>> */}
          <p className="text-xs text-blue-300 font-semibold mb-0">
            {character.currentBarrier ?? 0}/{effectiveStats?.totalBarrier ?? 0}
          </p>
          {/* Text Above Orb */}
          <p className="text-xs text-white font-semibold mb-0.5">
            {character.currentHealth}/{effectiveStats?.maxHealth}
          </p>
          {/* Orb SVG */}
          <svg
            className="w-16 h-16 overflow-visible orb-glow-red"
            viewBox="0 0 100 100"
          >
            <defs>
              <clipPath id="healthClipPathArea">
                <rect
                  x="0"
                  y={100 - playerHealthPercentage}
                  width="100"
                  height={playerHealthPercentage}
                />
              </clipPath>
              {/* <<< ADD Barrier Clip Path >>> */}
              <clipPath id="barrierClipPathArea">
                <rect
                  x="0"
                  y={100 - barrierPercentage}
                  width="100"
                  height={barrierPercentage}
                />
              </clipPath>
            </defs>
            {/* Background Circle */}
            <circle
              cx="50"
              cy="50"
              r="48"
              fill="#1f2937"
              stroke="white"
              strokeWidth="2"
            />
            {/* <<< REORDER: Barrier Fill FIRST >>> */}
            <circle
              cx="50"
              cy="50"
              r="48"
              fill="#60a5fa" // Light blue
              fillOpacity="0.6"
              clipPath="url(#barrierClipPathArea)"
            />
            {/* <<< REORDER: Health Fill SECOND >>> */}
            <circle
              cx="50"
              cy="50"
              r="48"
              fill="#991b1b"
              clipPath="url(#healthClipPathArea)"
            />
            {/* <<< REORDER: Barrier Fill LAST (On Top) >>> */}
            <circle
              cx="50"
              cy="50"
              r="48"
              fill="#60a5fa" // Light blue
              fillOpacity="0.6"
              clipPath="url(#barrierClipPathArea)"
            />
          </svg>
        </div>

        <div className="flex-grow flex flex-col items-center h-20 justify-end mb-1">
          <span className="text-xs text-gray-300 mb-1">
            XP: {character.currentXP} / {xpToNextLevel} (Nível {character.level}
            )
          </span>
          <div className="w-full bg-gray-700 rounded h-3 border border-gray-500 overflow-hidden">
            <div
              className="bg-yellow-400 h-full transition-width duration-300 ease-linear"
              style={{ width: `${xpPercentage}%` }}
            ></div>
          </div>
        </div>

        <div className="flex justify-center h-20 items-end gap-1">
          <button
            onClick={usePotionAction} // Call the store action
            // Use effectiveStats.maxHealth for the check
            disabled={
              !effectiveStats || // Add null check for effectiveStats
              character.healthPotions <= 0 ||
              character.currentHealth >= effectiveStats.maxHealth // Use calculated max
            }
            className={`flex items-center justify-center gap-1 px-3 py-1 w-16 h-10 bg-red-800 text-white rounded border border-white transition-opacity ${
              // <<< Check this class logic
              // Update the disabled class logic as well
              !effectiveStats ||
              character.healthPotions <= 0 ||
              character.currentHealth >= effectiveStats.maxHealth
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-red-700"
            }`}
            title={`Usar Poção de Vida (${character.healthPotions} restantes)`}
          >
            <FaHeart /> ({character.healthPotions})
          </button>

          <button
            onClick={onUseTeleportStone} // <<< Use the passed prop
            disabled={character.teleportStones <= 0 || isTown} // <<< Disable in town too
            className={`flex items-center justify-center gap-1 px-3 py-1 w-16 h-10 bg-blue-800 text-white rounded border border-white transition-opacity ${
              character.teleportStones <= 0 || isTown
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-blue-700 orb-glow-blue"
            }`}
            title={`Usar Pedra de Teleporte (${character.teleportStones} restantes)`}
          >
            <FaMagic /> ({character.teleportStones})
          </button>

          {/* Wind Crystal Display */}
          <div
            className="flex items-center justify-center gap-1 px-3 py-1 w-16 h-10 bg-gray-700 text-white rounded border border-white transition-opacity"
            title={`Cristais do Vento: ${windCrystals}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 512 512"
              className="w-4 h-4 fill-current"
            >
              <path d="M224 140.1C224 124 239.1 110.8 255.6 110.8C272.9 110.8 288 124 288 140.1V334.9C288 351 272.9 364.2 255.6 364.2C239.1 364.2 224 351 224 334.9V140.1zM128.2 156.3C128.2 140.2 143.3 126.1 160.7 126.1C178 126.1 193 140.2 193 156.3V359.7C193 375.8 178 389.9 160.7 389.9C143.3 389.9 128.2 375.8 128.2 359.7V156.3zM321.1 156.3C321.1 140.2 336.2 126.1 353.5 126.1C370.8 126.1 385.9 140.2 385.9 156.3V359.7C385.9 375.8 370.8 389.9 353.5 389.9C336.2 389.9 321.1 375.8 321.1 359.7V156.3zM85.37 188.5C85.37 172.4 99.54 158.2 116.8 158.2C134.1 158.2 149.2 172.4 149.2 188.5V327.5C149.2 343.6 134.1 357.8 116.8 357.8C99.54 357.8 85.37 343.6 85.37 327.5V188.5zM426.6 188.5C426.6 172.4 412.5 158.2 395.2 158.2C377.9 158.2 362.8 172.4 362.8 188.5V327.5C362.8 343.6 377.9 357.8 395.2 357.8C412.5 357.8 426.6 343.6 426.6 327.5V188.5zM42.67 220.6C42.67 204.5 56.83 190.4 74.17 190.4C91.5 190.4 106.7 204.5 106.7 220.6V295.4C106.7 311.5 91.5 325.6 74.17 325.6C56.83 325.6 42.67 311.5 42.67 295.4V220.6zM469.3 220.6C469.3 204.5 455.2 190.4 437.8 190.4C420.5 190.4 405.3 204.5 405.3 220.6V295.4C405.3 311.5 420.5 325.6 437.8 325.6C455.2 325.6 469.3 311.5 469.3 295.4V220.6z" />
            </svg>{" "}
            ({windCrystals})
          </div>
        </div>
      </div>
    </div>
  );
}

export default AreaView;
