"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  Character,
  MapLocation,
  EnemyInstance,
  enemyTypes,
  calculateEnemyStats,
} from "../types/gameData"; // Adjust path if needed
import { FaArrowLeft, FaHeart, FaShoppingBag } from "react-icons/fa"; // Potion icon and FaShoppingBag
import {
  calculateEffectiveStats, // Import calculateEffectiveStats
  EffectiveStats, // Import EffectiveStats type
  calculateSingleWeaponSwingDamage, // <<< ADD IMPORT
} from "../utils/statUtils"; // Remove unused EffectiveStats type import
import { ONE_HANDED_WEAPON_TYPES } from "../utils/itemUtils"; // <<< ADD IMPORT

interface AreaViewProps {
  character: Character | null;
  area: MapLocation | null;
  onReturnToMap: (enemiesKilled?: number) => void;
  onTakeDamage: (damage: number, damageType: string) => void;
  onUsePotion: () => void;
  onEnemyKilled: (enemyTypeId: string, enemyLevel: number) => void;
  xpToNextLevel: number;
  onPlayerHeal: (healAmount: number) => void;
  pendingDropCount: number; // NEW prop
  onOpenDropModalForViewing: () => void; // NEW prop
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

function AreaView({
  character,
  area,
  onReturnToMap,
  onTakeDamage,
  onUsePotion,
  onEnemyKilled,
  xpToNextLevel,
  onPlayerHeal,
  pendingDropCount,
  onOpenDropModalForViewing,
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
  // Restore state for ENEMY damage numbers
  const [enemyDamageNumbers, setEnemyDamageNumbers] = useState<
    Array<{ id: string; value: number; x: number; y: number }>
  >([]);
  // Player damage state
  const [lastPlayerDamage, setLastPlayerDamage] =
    useState<LastPlayerDamage | null>(null);
  // NEW state for life leech display
  const [lastLifeLeech, setLastLifeLeech] = useState<LastLifeLeech | null>(
    null
  );

  const enemyAttackTimer = useRef<NodeJS.Timeout | null>(null);
  const playerAttackTimer = useRef<NodeJS.Timeout | null>(null);
  const spawnTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const areaComplete = enemiesKilledCount >= 30;

  const regenerationTimerRef = useRef<NodeJS.Timeout | null>(null); // Ref for regen timer
  const latestEffectiveStatsRef = useRef<EffectiveStats | null>(null); // Ref for latest stats
  const nextAttackWeaponSlotRef = useRef<"weapon1" | "weapon2">("weapon1"); // NEW: Ref for dual wield tracking

  // Calculate effective stats including regeneration
  const effectiveStats: EffectiveStats | null = useMemo(() => {
    if (!character) return null;
    try {
      const stats = calculateEffectiveStats(character);
      console.log("[AreaView useMemo] Calculated effectiveStats:", stats); // Log calculated stats
      return stats;
    } catch (e) {
      console.error("[AreaView] Error calculating effective stats:", e);
      return null;
    }
  }, [character]);

  // Effect to keep latestEffectiveStatsRef updated
  useEffect(() => {
    latestEffectiveStatsRef.current = effectiveStats;
  }, [effectiveStats]);

  // Restore showEnemyDamageNumber function definition FIRST
  const showEnemyDamageNumber = (value: number) => {
    const damageId = crypto.randomUUID();
    // Adjust position to appear near player health orb (e.g., bottom-left area)
    const xPos = 15 + (Math.random() * 10 - 5); // Near left side
    const yPos = 75 + (Math.random() * 10 - 5); // Near bottom
    setEnemyDamageNumbers((prev) => [
      ...prev,
      { id: damageId, value: value, x: xPos, y: yPos },
    ]);
    setTimeout(() => {
      setEnemyDamageNumbers((prev) => prev.filter((dn) => dn.id !== damageId));
    }, 800); // Keep duration
  };

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
    };
    console.log(
      `[Spawn] Proceeding to spawn new enemy. Instance Data:`,
      newInstance
    ); // Log instance data
    setCurrentEnemy(newInstance);
    console.log(
      "[spawnEnemy] Finished. Waiting for useEffect to start timers."
    );
  }, [area, areaComplete]);

  // Define handleEnemyDeathSequence THIRD
  const handleEnemyDeathSequence = useCallback(
    (killedEnemy: EnemyInstance) => {
      console.log(`[Death Sequence] Started for ${killedEnemy.name}`);
      console.log(
        `[Death Sequence] Current timers: Player=${!!playerAttackTimer.current}, Enemy=${!!enemyAttackTimer.current}`
      );

      // Clear attack timers FIRST
      if (playerAttackTimer.current) {
        clearInterval(playerAttackTimer.current);
        playerAttackTimer.current = null;
        console.log("[Death Sequence] Cleared player attack timer.");
      }

      // Set enemy state to null immediately
      console.log("[Death Sequence] Setting currentEnemy to null.");
      setCurrentEnemy(null); // This will trigger the useEffect[currentEnemy] cleanup/logic

      // Schedule the rest after a minimal delay to allow state update and effect cleanup
      setTimeout(() => {
        console.log(
          `[Death Sequence Delayed] Calling onEnemyKilled for ${killedEnemy.name}.`
        );
        onEnemyKilled(killedEnemy.typeId, killedEnemy.level);

        const newKillCount = enemiesKilledCount + 1;
        setEnemiesKilledCount(newKillCount);

        if (newKillCount < 30) {
          const randomDelay = Math.random() * 2000 + 1000;
          console.log(
            `[Death Sequence Delayed] Scheduling next spawn in ${randomDelay.toFixed(
              0
            )}ms`
          );
          if (spawnTimeoutRef.current) {
            clearTimeout(spawnTimeoutRef.current);
            console.log(
              "[Death Sequence Delayed] Cleared previous spawn timeout ref."
            );
          }
          console.log(`[Death Sequence Delayed] Scheduling spawnEnemy.`);
          spawnTimeoutRef.current = setTimeout(spawnEnemy, randomDelay);
        } else {
          console.log(
            "[Death Sequence Delayed] Area Complete! No spawn scheduled."
          );
          // Ensure spawn timeout is cleared if area completes
          if (spawnTimeoutRef.current) {
            clearTimeout(spawnTimeoutRef.current);
            spawnTimeoutRef.current = null;
            console.log(
              "[Death Sequence Delayed] Cleared spawn timeout ref on area complete."
            );
          }
        }
      }, 10); // Small delay (10ms)
    },
    [enemiesKilledCount, onEnemyKilled, spawnEnemy]
  );

  // --- NEW: Separate function for removal logic ---
  const handleEnemyRemoval = useCallback(
    (killedEnemy: EnemyInstance) => {
      console.log(`[Enemy Removal] Handling removal for ${killedEnemy.name}`);
      onEnemyKilled(killedEnemy.typeId, killedEnemy.level);

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
    [enemiesKilledCount, onEnemyKilled, spawnEnemy] // Same dependencies as before
  );
  // -----------------------------------------------

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

      if (playerAttackTimer.current) {
        clearInterval(playerAttackTimer.current);
        playerAttackTimer.current = null;
      }

      const attackInterval = 1000 / currentStats.attackSpeed;
      const targetedEnemyInstanceId = enemy.instanceId;
      console.log(
        `[Player Attack] Starting timer for enemy ${targetedEnemyInstanceId} with interval: ${attackInterval.toFixed(
          0
        )}ms`
      );

      playerAttackTimer.current = setInterval(() => {
        // Get latest character and stats inside interval from ref
        const latestCharacter = character;
        const latestStats = latestEffectiveStatsRef.current;

        // Log the values being checked
        console.log(
          `[Player Attack Tick] Interval Start. Checking conditions...`,
          {
            latestCharacterExists: !!latestCharacter,
            latestStatsExists: !!latestStats,
            latestStatsValue: latestStats, // Log the actual stats object
          }
        );

        if (!latestCharacter || !latestStats) {
          console.log(
            "[Player Attack Tick] latestCharacter or latestStats null inside interval, stopping timer."
          );
          // ... (clear timer and return)
          if (playerAttackTimer.current)
            clearInterval(playerAttackTimer.current);
          playerAttackTimer.current = null;
          return;
        }

        setCurrentEnemy((latestEnemyState) => {
          console.log(
            `[Player Attack Tick] Inside setCurrentEnemy. Latest State: ${
              latestEnemyState?.name ?? "null"
            }, Target ID: ${targetedEnemyInstanceId}`
          );
          if (
            !latestEnemyState ||
            latestEnemyState.instanceId !== targetedEnemyInstanceId ||
            latestEnemyState.currentHealth <= 0
          ) {
            // ... stop timer ...
            return latestEnemyState;
          }

          // --- Determine attacking weapon and calculate swing stats ---
          let swingMinDamage = latestStats.minDamage; // Default to global stats
          let swingMaxDamage = latestStats.maxDamage;
          let swingPhysMinDamage = latestStats.minPhysDamage; // Default for leech calc
          let swingPhysMaxDamage = latestStats.maxPhysDamage; // Default for leech calc
          const weapon1 = latestCharacter.equipment.weapon1;
          const weapon2 = latestCharacter.equipment.weapon2;
          // Check for TRUE dual wielding (two 1H weapons)
          const isTrueDualWielding =
            weapon1 &&
            ONE_HANDED_WEAPON_TYPES.has(weapon1.itemType) &&
            weapon2 &&
            ONE_HANDED_WEAPON_TYPES.has(weapon2.itemType);

          if (isTrueDualWielding) {
            const slotToUse = nextAttackWeaponSlotRef.current;
            const weapon = latestCharacter.equipment[slotToUse];
            console.log(
              `[Player Attack Tick] Dual Wielding - Attacking with: ${slotToUse} (${weapon?.name})`
            );

            if (weapon) {
              // Calculate damage for this specific weapon swing
              const swingDamageData = calculateSingleWeaponSwingDamage(
                weapon,
                latestStats
              );
              swingMinDamage = swingDamageData.totalMin;
              swingMaxDamage = swingDamageData.totalMax;
              swingPhysMinDamage = swingDamageData.minPhys; // Use calculated phys for leech
              swingPhysMaxDamage = swingDamageData.maxPhys;
            }
            // Toggle for next attack
            nextAttackWeaponSlotRef.current =
              slotToUse === "weapon1" ? "weapon2" : "weapon1";
          }
          // --- Damage Calculation (use SWING stats) ---
          let damageDealt =
            Math.floor(Math.random() * (swingMaxDamage - swingMinDamage + 1)) +
            swingMinDamage;
          // Use OVERALL crit multiplier AND OVERALL crit chance (simplification)
          const isCritical = Math.random() * 100 <= latestStats.critChance;
          let critIndicator = "";
          if (isCritical) {
            critIndicator = " (CRIT!)";
            damageDealt = Math.round(
              damageDealt * (latestStats.critMultiplier / 100) // Use global multiplier
            );
          }
          damageDealt = Math.max(1, damageDealt);
          console.log(
            `[Player Attack Tick] Calculated Damage: ${damageDealt}${critIndicator} (Using ${
              isTrueDualWielding
                ? nextAttackWeaponSlotRef.current
                : "Main/Offhand"
            })` // Log which weapon was *just* used
          );

          // --- Life Leech (use SWING stats for damage base, global leech %) ---
          if (latestStats.lifeLeechPercent > 0) {
            // Re-calculate phys proportion based on SWING damages
            const avgTotalSwingDmg = (swingMinDamage + swingMaxDamage) / 2;
            const avgPhysSwingDmg =
              (swingPhysMinDamage + swingPhysMaxDamage) / 2;
            const physProportion =
              avgTotalSwingDmg > 0 ? avgPhysSwingDmg / avgTotalSwingDmg : 0;
            const physicalDamageDealt = Math.round(
              damageDealt * physProportion
            );

            console.log("[Life Leech Check]", {
              leechPercent: latestStats.lifeLeechPercent,
              swingPhysMin: swingPhysMinDamage,
              swingPhysMax: swingPhysMaxDamage,
              dealtDamage: damageDealt,
              physProportion: physProportion.toFixed(2),
              estimatedPhysDealt: physicalDamageDealt,
            });

            if (physicalDamageDealt > 0) {
              const healAmount = Math.ceil(
                physicalDamageDealt * (latestStats.lifeLeechPercent / 100)
              );
              console.log(
                "[Life Leech Check] Calculated Heal Amount (Ceiled):",
                healAmount
              );
              if (healAmount > 0) {
                console.log(
                  `[Player Attack Tick] Applying Life Leech: +${healAmount} HP`
                );
                displayLifeLeech(healAmount);
                if (typeof onPlayerHeal === "function") {
                  setTimeout(() => onPlayerHeal(healAmount), 0);
                } else {
                  console.warn(
                    "[Life Leech] onPlayerHeal prop is not available or not a function."
                  );
                }
              } else {
                console.log(
                  "[Life Leech Check] Heal amount (after ceil) is 0 or less."
                );
              }
            } else {
              console.log(
                "[Life Leech Check] Estimated physical damage dealt is 0 or less."
              );
            }
          } else {
            console.log(
              "[Life Leech Check] Skipping - lifeLeechPercent is 0 or less."
            );
          }

          // Apply Damage
          const healthBefore = latestEnemyState.currentHealth;
          const newHealth = Math.max(0, healthBefore - damageDealt);
          console.log(
            `[Player Attack Tick] Enemy health: ${healthBefore} -> ${newHealth}`
          );
          // Pass isCritical flag here too
          displayPlayerDamage(damageDealt, isCritical);

          if (newHealth <= 0) {
            console.log(
              "[Player Attack Tick] Enemy defeated. Setting isDying flag."
            );
            // Stop player attack timer FIRST
            if (playerAttackTimer.current) {
              clearInterval(playerAttackTimer.current);
              playerAttackTimer.current = null;
              console.log(
                "[Player Attack Tick] Cleared player attack timer on enemy defeat."
              );
            }
            // Set enemy state to dying
            return { ...latestEnemyState, currentHealth: 0, isDying: true };
            // handleEnemyDeathSequence(latestEnemyState); // REMOVED - Handled by useEffect now
            // return null; // Keep the enemy object but mark as dying
          } else {
            return { ...latestEnemyState, currentHealth: newHealth };
          }
        });
      }, attackInterval);
      console.log(
        `[Player Attack] Timer ${
          playerAttackTimer.current
        } STARTED with interval: ${attackInterval.toFixed(0)}ms`
      );
    },
    [onPlayerHeal, handleEnemyDeathSequence, showEnemyDamageNumber]
  );

  // Define startEnemyAttackTimer FIFTH
  const startEnemyAttackTimer = useCallback(
    (enemy: EnemyInstance) => {
      if (!enemy) return;
      console.log(`[startEnemyAttackTimer] Called for enemy:`, enemy); // Log full enemy object
      if (enemyAttackTimer.current) {
        console.log(`[startEnemyAttackTimer] Clearing existing timer.`);
        clearInterval(enemyAttackTimer.current);
        enemyAttackTimer.current = null;
      }
      const attackInterval = 1000 / enemy.attackSpeed;
      console.log(
        `[startEnemyAttackTimer] Calculated Interval: ${attackInterval} (Based on Attack Speed: ${enemy.attackSpeed})`
      ); // Log interval and speed
      console.log(
        `[startEnemyAttackTimer] Setting interval with duration: ${attackInterval.toFixed(
          0
        )}ms`
      );
      enemyAttackTimer.current = setInterval(() => {
        // Add log right at the start
        // console.log(
        //   "[Enemy Attack Tick] Callback Executed! Timer ID:",
        //   enemyAttackTimer.current,
        //   "Enemy Ref:",
        //   enemy // REMOVED: Don't log the closed-over enemy object
        // );

        // Get the LATEST enemy state from the component's scope
        const latestEnemyState = currentEnemy;

        // Log each tick using the LATEST state
        console.log(
          `[Enemy Attack Tick] Running. Latest State: ${
            latestEnemyState?.name ?? "null"
          } (${latestEnemyState?.instanceId ?? "N/A"}). Checking health: ${
            latestEnemyState?.currentHealth ?? "N/A"
          }`
        );

        // Use the LATEST state for checks and actions
        if (
          latestEnemyState &&
          !latestEnemyState.isDying && // Check if not dying
          latestEnemyState.instanceId === enemy.instanceId &&
          latestEnemyState.currentHealth > 0
        ) {
          // Still check instanceId to ensure we attack the *correct* enemy if state changes fast
          const damageDealt = Math.max(1, Math.round(latestEnemyState.damage)); // Use latest damage
          console.log(
            `[Enemy Attack Tick] Condition met for ${latestEnemyState.name}. Dealing ${damageDealt} damage.`
          );
          onTakeDamage(damageDealt, latestEnemyState.damageType); // Use latest damageType
          showEnemyDamageNumber(damageDealt);
        } else {
          let reason = "Unknown";
          if (!latestEnemyState) reason = "Enemy is null in state";
          else if (latestEnemyState.instanceId !== enemy.instanceId)
            reason = "Enemy instance mismatch";
          else if (latestEnemyState.currentHealth <= 0)
            reason = "Enemy health <= 0 in state";
          else if (latestEnemyState.isDying) reason = "Enemy is dying"; // Add reason

          console.log(
            `[Enemy Attack Tick] Condition failed (${reason}). Clearing timer.`
          ); // Log clear reason
          if (enemyAttackTimer.current) clearInterval(enemyAttackTimer.current);
          enemyAttackTimer.current = null;
        }
      }, attackInterval);
    },
    [onTakeDamage, showEnemyDamageNumber]
  );

  // --- Passive Regeneration Effect ---
  useEffect(() => {
    // Clear any existing timer first
    if (regenerationTimerRef.current) {
      clearInterval(regenerationTimerRef.current);
      regenerationTimerRef.current = null;
    }

    // Check if regeneration is needed and possible
    const regenRate = effectiveStats?.finalLifeRegenPerSecond ?? 0;
    const currentHp = character?.currentHealth ?? 0;
    const maxHp = effectiveStats?.maxHealth ?? 0; // Use effective max health

    if (regenRate > 0 && currentHp < maxHp && currentHp > 0) {
      // Only regen if alive and not full
      console.log(`[Regen] Starting timer. Rate: ${regenRate}/s`);
      regenerationTimerRef.current = setInterval(() => {
        // Double-check character still exists and needs healing inside interval
        const latestCharacter = character; // Use the character state available in this scope
        const latestEffectiveStats = effectiveStats; // Use calculated stats
        if (
          !latestCharacter ||
          !latestEffectiveStats ||
          latestCharacter.currentHealth <= 0 ||
          latestCharacter.currentHealth >= latestEffectiveStats.maxHealth
        ) {
          // Stop if character is dead, null, or full health
          if (regenerationTimerRef.current)
            clearInterval(regenerationTimerRef.current);
          regenerationTimerRef.current = null;
          console.log(
            "[Regen Interval] Stopping timer (dead, null, or full health)."
          );
          return;
        }

        // Heal by the regen rate (ensure it's at least 1 if regenRate is small but > 0)
        const healAmount = Math.max(1, Math.floor(regenRate));
        console.log(`[Regen Interval] Applying heal: +${healAmount}`);
        onPlayerHeal(healAmount);
      }, 1000); // Run every second
    }

    // Cleanup function: clear timer when effect reruns or component unmounts
    return () => {
      if (regenerationTimerRef.current) {
        clearInterval(regenerationTimerRef.current);
        regenerationTimerRef.current = null;
        console.log("[Regen Cleanup] Cleared regeneration timer.");
      }
    };
    // Dependencies: character's current health and the calculated regen rate
  }, [
    character?.currentHealth,
    effectiveStats?.finalLifeRegenPerSecond,
    onPlayerHeal,
    character,
    effectiveStats,
  ]);

  // Function to trigger player damage display
  const displayPlayerDamage = (value: number, isCritical: boolean) => {
    setLastPlayerDamage({
      value,
      timestamp: Date.now(),
      id: crypto.randomUUID(),
      isCritical,
    });
  };

  // NEW: Function to trigger life leech display
  const displayLifeLeech = (value: number) => {
    setLastLifeLeech({
      value,
      timestamp: Date.now(),
      id: crypto.randomUUID(),
    });
  };

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
        `[Effect Player/Respawn] Enemy exists. Starting Player timer...`
      );
      // Start Player Timer (if stats available)
      if (latestEffectiveStatsRef.current) {
        if (!playerAttackTimer.current) {
          console.log(
            `[Effect Player/Respawn] Calling startPlayerAttackTimer.`
          );
          startPlayerAttackTimer(currentEnemy);
        } else {
          console.log(`[Effect Player/Respawn] Player timer already running.`);
        }
      } else {
        console.log(
          `[Effect Player/Respawn] Stats not ready for player timer.`
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
  }, [currentEnemy, areaComplete, spawnEnemy]); // REMOVED startPlayerAttackTimer dependency

  // --- NEW Effect specifically for Enemy Timer ---
  useEffect(() => {
    console.log(
      `[Effect Enemy Timer] Running. currentEnemy: ${
        currentEnemy?.name ?? "null"
      }, isDying: ${currentEnemy?.isDying}`
    );
    // CHECK isDying flag
    if (currentEnemy && !currentEnemy.isDying) {
      // Enemy exists and is not dying, start its timer
      console.log(
        `[Effect Enemy Timer] Enemy detected and alive, calling startEnemyAttackTimer.`
      );
      startEnemyAttackTimer(currentEnemy);
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
    // DEPENDENCY change: now also depends on isDying flag
  }, [currentEnemy?.instanceId, currentEnemy?.isDying]);

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
  }, [currentEnemy?.isDying, currentEnemy?.instanceId]); // Depend on isDying and instanceId
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

  // --- Return JSX ---
  return (
    <div className="border border-white flex-grow p-4 relative bg-black flex flex-col">
      <button
        // Use the intermediate handler
        onClick={() => onReturnToMap(enemiesKilledCount)}
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
          {/* Restore Rendering Block for Enemy Damage */}
          {enemyDamageNumbers.map((dn) => (
            <span
              key={dn.id}
              // Change color to red and adjust animation/style if needed
              className={`absolute text-xl font-bold animate-diablo-damage-float text-red-500 text-stroke-black`}
              style={{
                left: `${dn.x}%`,
                top: `${dn.y}%`,
                transform: "translateX(-50%)", // Keep centering
              }}
            >
              {dn.value}
            </span>
          ))}

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
        </div>

        {/* Enemy/Completion/Town Display */}
        {isTown ? (
          // Display safe zone message in town
          <p className="text-lg text-gray-400">Zona Segura.</p>
        ) : areaComplete ? (
          <p className="text-2xl text-green-400 font-bold">Área Concluída!</p>
        ) : currentEnemy ? (
          // Apply fade-out transition if enemy is dying
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
        ) : (
          // Only show "Procurando inimigos..." if not in town
          <p className="text-gray-500">Procurando inimigos...</p>
        )}
      </div>

      {/* Player Stats Display (Health Orb & XP Bar) - Positioned at the bottom */}
      <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4 px-2">
        {/* Left Side: Health Orb with Text Above */}
        <div className="relative w-20 h-20 flex flex-col items-center">
          {/* Text Above Orb */}
          <p className="text-xs text-white font-semibold mb-0.5">
            {character.currentHealth}/{character.maxHealth}
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
            </defs>
            <circle
              cx="50"
              cy="50"
              r="48"
              fill="#1f2937"
              stroke="white"
              strokeWidth="2"
            />
            <circle
              cx="50"
              cy="50"
              r="48"
              fill="#991b1b"
              clipPath="url(#healthClipPathArea)"
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

        <div className="flex justify-center h-20 items-end mb-1">
          <button
            onClick={onUsePotion}
            disabled={
              character.healthPotions <= 0 ||
              character.currentHealth >= character.maxHealth
            }
            className={`flex items-center gap-1 px-3 py-1 bg-red-800 text-white rounded border border-white transition-opacity ${
              character.healthPotions <= 0 ||
              character.currentHealth >= character.maxHealth
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-red-700"
            }`}
          >
            <FaHeart /> ({character.healthPotions})
          </button>
        </div>
      </div>
    </div>
  );
}

export default AreaView;
