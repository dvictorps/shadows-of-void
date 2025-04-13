"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Character,
  MapLocation,
  EnemyInstance,
  enemyTypes,
  calculateEnemyStats,
} from "../types/gameData"; // Adjust path if needed
import { FaArrowLeft, FaHeart } from "react-icons/fa"; // Potion icon
import {
  calculateEffectiveStats /*, EffectiveStats */,
} from "../utils/statUtils"; // Remove unused EffectiveStats type import

interface AreaViewProps {
  character: Character | null;
  area: MapLocation | null;
  onReturnToMap: (enemiesKilled?: number) => void;
  onTakeDamage: (damage: number) => void;
  onUsePotion: () => void;
  onEnemyKilled: (enemyTypeId: string, enemyLevel: number) => void;
  xpToNextLevel: number;
  onPlayerHeal: (healAmount: number) => void;
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

const AreaView: React.FC<AreaViewProps> = ({
  character,
  area,
  onReturnToMap,
  onTakeDamage,
  onUsePotion,
  onEnemyKilled,
  xpToNextLevel,
  onPlayerHeal,
}) => {
  // Add initial props log
  console.log(
    "[AreaView Props Check] Character:",
    character?.name,
    "Area:",
    area?.name
  );

  const [currentEnemy, setCurrentEnemy] = useState<EnemyInstance | null>(null);
  const [enemiesKilledCount, setEnemiesKilledCount] = useState(0);
  // State for ENEMY damage numbers ONLY
  const [enemyDamageNumbers, setEnemyDamageNumbers] = useState<
    Array<{ id: string; value: number; x: number; y: number }>
  >([]);
  // NEW state for last player damage
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

  // --- Intermediate Handler for Back Button ---
  const handleBackButtonClick = () => {
    onReturnToMap(enemiesKilledCount);
  };
  // --- End Intermediate Handler ---

  // Show ENEMY damage numbers
  const showEnemyDamageNumber = (value: number) => {
    const damageId = crypto.randomUUID();
    const xPos = 50 + (Math.random() * 30 - 15);
    const yPos = 80; // Enemy damage appears lower
    setEnemyDamageNumbers((prev) => [
      ...prev,
      { id: damageId, value: value, x: xPos, y: yPos },
    ]);
    setTimeout(() => {
      setEnemyDamageNumbers((prev) => prev.filter((dn) => dn.id !== damageId));
    }, 800);
  };

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

  const startPlayerAttackTimer = (enemy: EnemyInstance) => {
    if (!character) return;
    if (playerAttackTimer.current) {
      clearInterval(playerAttackTimer.current);
      playerAttackTimer.current = null;
      console.log(
        "[Player Attack] Cleared existing timer before starting new one."
      );
    }

    let initialEffectiveStats;
    try {
      initialEffectiveStats = calculateEffectiveStats(character);
    } catch (e) {
      console.error("[Player Attack] Error calculating initial stats:", e);
      return; // Don't start timer if initial calc fails
    }

    const attackInterval = 1000 / initialEffectiveStats.attackSpeed;
    const targetedEnemyInstanceId = enemy.instanceId;
    console.log(
      `[Player Attack] Starting timer for enemy ${targetedEnemyInstanceId} with interval: ${attackInterval.toFixed(
        0
      )}ms`
    );

    playerAttackTimer.current = setInterval(() => {
      console.log("[Player Attack Tick] Interval running..."); // Log each tick
      if (!character) {
        console.log(
          "[Player Attack Tick] Character became null, clearing timer."
        );
        if (playerAttackTimer.current) clearInterval(playerAttackTimer.current);
        playerAttackTimer.current = null;
        return;
      }

      let currentEffectiveStats;
      try {
        currentEffectiveStats = calculateEffectiveStats(character);
      } catch (e) {
        console.error(
          "[Player Attack Tick] Error calculating stats inside interval:",
          e
        );
        if (playerAttackTimer.current) clearInterval(playerAttackTimer.current);
        playerAttackTimer.current = null;
        return; // Stop interval on error
      }

      setCurrentEnemy((latestEnemyState) => {
        console.log(
          `[Player Attack Tick] Checking enemy state. Current health: ${latestEnemyState?.currentHealth}`
        );
        if (
          !latestEnemyState ||
          latestEnemyState.instanceId !== targetedEnemyInstanceId ||
          latestEnemyState.currentHealth <= 0
        ) {
          console.log(
            "[Player Attack Tick] Enemy invalid or dead, clearing timer.",
            {
              exists: !!latestEnemyState,
              idMatch: latestEnemyState?.instanceId === targetedEnemyInstanceId,
              health: latestEnemyState?.currentHealth,
            }
          );
          if (playerAttackTimer.current)
            clearInterval(playerAttackTimer.current);
          playerAttackTimer.current = null;
          return latestEnemyState;
        }

        // Calculate Damage Instance
        let damageDealt =
          Math.floor(
            Math.random() *
              (currentEffectiveStats.maxDamage -
                currentEffectiveStats.minDamage +
                1)
          ) + currentEffectiveStats.minDamage;
        const isCritical =
          Math.random() * 100 <= currentEffectiveStats.critChance;
        let critIndicator = "";
        if (isCritical) {
          critIndicator = " (CRIT!)";
          damageDealt = Math.round(
            damageDealt * (currentEffectiveStats.critMultiplier / 100)
          );
        }
        damageDealt = Math.max(1, damageDealt);
        console.log(
          `[Player Attack Tick] Calculated Damage: ${damageDealt}${critIndicator}`
        );

        // --- RE-ADD Life Leech Logic ---
        if (currentEffectiveStats.lifeLeechPercent > 0) {
          console.log(
            "[Life Leech Check] Leech Percent:",
            currentEffectiveStats.lifeLeechPercent
          );
          const avgTotalDmg =
            (currentEffectiveStats.minDamage +
              currentEffectiveStats.maxDamage) /
            2;
          const avgPhysDmg =
            (currentEffectiveStats.minPhysDamage +
              currentEffectiveStats.maxPhysDamage) /
            2;
          console.log(
            "[Life Leech Check] Avg Total Dmg:",
            avgTotalDmg,
            "Avg Phys Dmg:",
            avgPhysDmg
          );
          const physProportion = avgTotalDmg > 0 ? avgPhysDmg / avgTotalDmg : 0;
          console.log("[Life Leech Check] Phys Proportion:", physProportion);
          const physicalDamageDealt = Math.round(damageDealt * physProportion);
          console.log(
            "[Life Leech Check] Damage Dealt (Base for Leech Calc):",
            damageDealt,
            "Estimated Physical Dealt:",
            physicalDamageDealt
          );

          if (physicalDamageDealt > 0) {
            // Use Math.ceil to ensure at least 1 HP is healed
            const healAmount = Math.ceil(
              physicalDamageDealt *
                (currentEffectiveStats.lifeLeechPercent / 100)
            );
            console.log(
              "[Life Leech Check] Calculated Heal Amount (Ceiled):",
              healAmount
            );
            if (healAmount > 0) {
              console.log(
                `[Player Attack Tick] Applying Life Leech: +${healAmount} HP`
              );
              // Defer the state update using setTimeout
              // Display the leech number BEFORE calling the heal function
              displayLifeLeech(healAmount);
              if (typeof onPlayerHeal === "function") {
                // Safety check
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
          // Log if the initial condition fails
          console.log(
            "[Life Leech Check] Skipping - lifeLeechPercent is 0 or less."
          );
        }
        // --- END Re-added Life Leech Logic ---

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
            "[Player Attack Tick] Enemy health reached 0. Handling death."
          );
          handleEnemyDeathSequence(latestEnemyState);
          return null;
        } else {
          return { ...latestEnemyState, currentHealth: newHealth };
        }
      });
    }, attackInterval);
  };

  const startEnemyAttackTimer = (enemy: EnemyInstance) => {
    if (!character) return;
    if (enemyAttackTimer.current) {
      clearInterval(enemyAttackTimer.current);
      enemyAttackTimer.current = null;
    }

    const attackInterval = 1000 / enemy.attackSpeed;
    enemyAttackTimer.current = setInterval(() => {
      // Check inside interval if enemy still exists
      if (enemy && enemy.currentHealth > 0) {
        const damageDealt = Math.max(1, Math.round(enemy.damage));
        onTakeDamage(damageDealt);
        showEnemyDamageNumber(damageDealt);
      } else {
        // Clear if enemy died between ticks
        if (enemyAttackTimer.current) clearInterval(enemyAttackTimer.current);
        enemyAttackTimer.current = null;
      }
    }, attackInterval);
  };

  const handleEnemyDeathSequence = (killedEnemy: EnemyInstance) => {
    console.log(
      `[Death Sequence] Started for ${killedEnemy.name} (${killedEnemy.instanceId}).`
    );
    console.log(
      `[Death Sequence] Current timers: Player=${!!playerAttackTimer.current}, Enemy=${!!enemyAttackTimer.current}`
    );

    // Clear attack timers FIRST
    if (playerAttackTimer.current) {
      clearInterval(playerAttackTimer.current);
      playerAttackTimer.current = null;
      console.log("[Death Sequence] Cleared player attack timer.");
    }
    if (enemyAttackTimer.current) {
      clearInterval(enemyAttackTimer.current);
      enemyAttackTimer.current = null;
      console.log("[Death Sequence] Cleared enemy attack timer.");
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
  };

  const spawnEnemy = () => {
    console.log("[spawnEnemy] Attempting to spawn...");
    // Clear any pending spawn scheduled by death sequence OR useEffect
    if (spawnTimeoutRef.current) {
      clearTimeout(spawnTimeoutRef.current);
      spawnTimeoutRef.current = null;
    }

    // Check current enemy status before spawning (safety check)
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

    console.log("[spawnEnemy] Proceeding with spawn logic.");
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

    console.log(`[Spawn] Spawning ${newInstance.name}`);
    setCurrentEnemy(newInstance); // Timers will start via useEffect watching this state
    console.log(
      "[spawnEnemy] Finished. Waiting for useEffect to start timers."
    );
  };

  // --- Use Effects ---
  useEffect(() => {
    console.log(
      "[Effect Init/AreaChange] Checking conditions for initial spawn...",
      {
        hasChar: !!character,
        hasArea: !!area,
        hasEnemy: !!currentEnemy,
      }
    );
    if (character && area && !currentEnemy) {
      console.log(
        "[Effect Init/AreaChange] Conditions met. Calling spawnEnemy()."
      );
      spawnEnemy();
    }

    // Cleanup for THIS effect: ONLY clear pending spawn timeout
    return () => {
      console.log(
        "[Effect Cleanup Init/AreaChange] Cleaning up SPAWN timer only."
      );
      if (spawnTimeoutRef.current) {
        clearTimeout(spawnTimeoutRef.current);
        spawnTimeoutRef.current = null;
        console.log(
          "[Effect Cleanup Init/AreaChange] Cleared spawn timeout ref."
        );
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character, area]); // Keep dependencies

  // Effect to start/stop timers based on currentEnemy AND schedule next spawn
  useEffect(() => {
    console.log(
      `[Effect EnemyChange] Running. currentEnemy: ${
        currentEnemy?.name ?? "null"
      } (${
        currentEnemy?.instanceId ?? "null"
      }). Timers: Player=${!!playerAttackTimer.current}, Enemy=${!!enemyAttackTimer.current}`
    );

    // Clear any existing spawn timer first
    if (spawnTimeoutRef.current) {
      clearTimeout(spawnTimeoutRef.current);
      spawnTimeoutRef.current = null;
      console.log("[Effect EnemyChange] Cleared existing spawn timer.");
    }

    if (currentEnemy) {
      // --- ENEMY EXISTS: Start attack timers ---
      // Start timers if they aren't already running
      if (!playerAttackTimer.current) {
        console.log(
          `[Effect EnemyChange] Starting player attack timer for ${currentEnemy.name}.`
        );
        startPlayerAttackTimer(currentEnemy);
      } else {
        console.log(
          `[Effect EnemyChange] Player attack timer already running for ${currentEnemy.name}.`
        );
      }
      if (!enemyAttackTimer.current) {
        console.log(
          `[Effect EnemyChange] Starting enemy attack timer for ${currentEnemy.name}.`
        );
        startEnemyAttackTimer(currentEnemy);
      } else {
        console.log(
          `[Effect EnemyChange] Enemy attack timer already running for ${currentEnemy.name}.`
        );
      }
    } else {
      // --- ENEMY IS NULL: Stop timers and schedule next spawn ---
      console.log(
        "[Effect EnemyChange] Current enemy is null. Ensuring timers are stopped."
      );
      // Stop attack timers (might be redundant, but safe)
      if (playerAttackTimer.current) {
        clearInterval(playerAttackTimer.current);
        playerAttackTimer.current = null;
        console.log(
          "[Effect EnemyChange] Cleared player attack timer (in null check)."
        );
      }
      if (enemyAttackTimer.current) {
        clearInterval(enemyAttackTimer.current);
        enemyAttackTimer.current = null;
        console.log(
          "[Effect EnemyChange] Cleared enemy attack timer (in null check)."
        );
      }

      // Schedule next spawn if area is not complete
      if (!areaComplete) {
        const randomDelay = Math.random() * 2000 + 1000;
        console.log(
          `[Effect EnemyChange] Scheduling next spawn in ${randomDelay.toFixed(
            0
          )}ms`
        );
        spawnTimeoutRef.current = setTimeout(spawnEnemy, randomDelay);
      } else {
        console.log(
          "[Effect EnemyChange] Area complete, not scheduling spawn."
        );
      }
    }

    // Cleanup function for THIS effect (stops attack timers and clears spawn timeout)
    return () => {
      const enemyName = currentEnemy?.name ?? "unknown";
      console.log(
        `[Effect Cleanup EnemyChange] Running cleanup for ${enemyName}. Timers: Player=${!!playerAttackTimer.current}, Enemy=${!!enemyAttackTimer.current}`
      );
      if (playerAttackTimer.current) {
        clearInterval(playerAttackTimer.current);
        playerAttackTimer.current = null;
        console.log(
          `[Effect Cleanup EnemyChange] Cleared player attack timer for ${enemyName}.`
        );
      } else {
        console.log(
          `[Effect Cleanup EnemyChange] Player timer already null for ${enemyName}.`
        );
      }
      if (enemyAttackTimer.current) {
        clearInterval(enemyAttackTimer.current);
        enemyAttackTimer.current = null;
        console.log(
          `[Effect Cleanup EnemyChange] Cleared enemy attack timer for ${enemyName}.`
        );
      } else {
        console.log(
          `[Effect Cleanup EnemyChange] Enemy timer already null for ${enemyName}.`
        );
      }
      // Also clear spawn timeout on cleanup
      if (spawnTimeoutRef.current) {
        clearTimeout(spawnTimeoutRef.current);
        spawnTimeoutRef.current = null;
        console.log(
          `[Effect Cleanup EnemyChange] Cleared spawn timeout ref for ${enemyName}.`
        );
      }
    };
    // Ensure areaComplete is a dependency
  }, [currentEnemy, areaComplete]); // Added areaComplete

  if (!character || !area) {
    return (
      <div className="border border-white flex-grow p-4 relative bg-gray-900 flex flex-col items-center justify-center">
        <p className="text-gray-500">Carregando dados da área...</p>
      </div>
    );
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
    (character.currentHealth / character.maxHealth) * 100;

  return (
    <div className="border border-white flex-grow p-4 relative bg-black flex flex-col">
      <button
        // Use the intermediate handler
        onClick={handleBackButtonClick}
        className="absolute top-2 right-2 p-1 border border-white rounded text-white hover:bg-gray-700 focus:outline-none"
        aria-label="Voltar ao Mapa"
      >
        <FaArrowLeft />
      </button>

      {/* Area Info - Conditional Title */}
      <h2 className="text-xl font-semibold mb-1 text-white">
        {isTown ? area.name : `${area.name} (Nv. ${area.level})`}
      </h2>
      {/* Conditionally render kill count - hide in town */}
      {!isTown && (
        <p className="text-sm text-gray-400 mb-3">
          Inimigos Derrotados: {enemiesKilledCount} / 30
        </p>
      )}

      <div className="flex-grow flex flex-col items-center justify-center relative min-h-[200px]">
        {/* Damage Numbers Layer */}
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
          {/* Render ENEMY damage numbers */}
          {enemyDamageNumbers.map((dn) => (
            <span
              key={dn.id}
              className={`absolute text-lg font-bold animate-diablo-damage-float text-yellow-400`}
              style={{
                left: `${dn.x}%`,
                top: `${dn.y}%`,
                transform: "translateX(-50%)",
              }}
            >
              {dn.value}
            </span>
          ))}

          {/* Floating Player Damage Numbers - Conditionally Styled */}
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
          <div className="text-center relative z-0">
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
};

export default AreaView;
