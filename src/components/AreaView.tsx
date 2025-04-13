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

interface AreaViewProps {
  character: Character | null;
  area: MapLocation | null;
  onReturnToMap: (enemiesKilled?: number) => void;
  onTakeDamage: (damage: number) => void;
  onUsePotion: () => void;
  onEnemyKilled: (enemyTypeId: string, enemyLevel: number) => void;
  xpToNextLevel: number;
}

// Type for the last player damage state
interface LastPlayerDamage {
  value: number;
  timestamp: number; // To trigger re-renders even if value is the same
  id: string; // Unique ID for key prop
}

const AreaView: React.FC<AreaViewProps> = ({
  character,
  area,
  onReturnToMap,
  onTakeDamage,
  onUsePotion,
  onEnemyKilled,
  xpToNextLevel,
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

  const enemyAttackTimer = useRef<NodeJS.Timeout | null>(null);
  const playerAttackTimer = useRef<NodeJS.Timeout | null>(null);
  const isSpawnScheduledRef = useRef<boolean>(false);
  // Ref for the spawn timeout ID
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
  const displayPlayerDamage = (value: number) => {
    setLastPlayerDamage({
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

  const startPlayerAttackTimer = (enemy: EnemyInstance) => {
    if (!character) return;
    if (playerAttackTimer.current) {
      clearInterval(playerAttackTimer.current);
      playerAttackTimer.current = null;
    }

    const attackInterval = 1000 / character.attackSpeed;
    const damagePerTick = Math.max(1, Math.round(character.attackDamage));
    const targetedEnemyInstanceId = enemy.instanceId;

    playerAttackTimer.current = setInterval(() => {
      setCurrentEnemy((latestEnemyState) => {
        if (
          !latestEnemyState ||
          latestEnemyState.instanceId !== targetedEnemyInstanceId ||
          latestEnemyState.currentHealth <= 0
        ) {
          if (playerAttackTimer.current)
            clearInterval(playerAttackTimer.current);
          playerAttackTimer.current = null;
          return latestEnemyState;
        }

        const newHealth = Math.max(
          0,
          latestEnemyState.currentHealth - damagePerTick
        );
        // Call new function to display player damage
        displayPlayerDamage(damagePerTick);

        if (newHealth <= 0) {
          handleEnemyDeathSequence(latestEnemyState);
          return null;
        } else {
          return { ...latestEnemyState, currentHealth: newHealth };
        }
      });
    }, attackInterval);
  };

  const spawnEnemy = () => {
    console.log("[spawnEnemy] Attempting to spawn..."); // Log start
    // Clear any pending spawn timeout FIRST
    if (spawnTimeoutRef.current) {
      clearTimeout(spawnTimeoutRef.current);
      spawnTimeoutRef.current = null;
    }
    // Release the spawn lock immediately when attempting to spawn
    isSpawnScheduledRef.current = false;

    // Check other conditions
    if (
      !area ||
      !area.possibleEnemies ||
      area.possibleEnemies.length === 0 ||
      areaComplete
    ) {
      // Don't set currentEnemy to null here, just return if conditions fail
      // isSpawnScheduledRef is already false
      console.log(
        "[Spawn] Aborted due to area conditions or completion.",
        // Adjusted log to safely access length
        {
          areaExists: !!area,
          hasEnemies: !!(
            area &&
            area.possibleEnemies &&
            area.possibleEnemies.length > 0
          ),
          areaComplete,
        }
      );
      return;
    }

    // --- Proceed with spawn ---
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
      isSpawnScheduledRef.current = false; // Release lock on error
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
    setCurrentEnemy(newInstance); // Set the new enemy
    startPlayerAttackTimer(newInstance); // Start player attack
  };

  const handleEnemyDeathSequence = (killedEnemy: EnemyInstance) => {
    console.log(`Handling death sequence for ${killedEnemy.name}`);

    // 1. Call parent handler via setTimeout, passing level
    setTimeout(() => {
      console.log(
        `Calling onEnemyKilled for ${killedEnemy.name} (Lvl: ${killedEnemy.level}) via setTimeout`
      );
      // Pass enemyLevel here
      onEnemyKilled(killedEnemy.typeId, killedEnemy.level);
    }, 0);

    // 2. Clear timers
    if (playerAttackTimer.current) clearInterval(playerAttackTimer.current);
    if (enemyAttackTimer.current) clearInterval(enemyAttackTimer.current);
    playerAttackTimer.current = null;
    enemyAttackTimer.current = null;

    // 3. Schedule next spawn ONLY if not already scheduled
    const newKillCount = enemiesKilledCount + 1;
    setEnemiesKilledCount(newKillCount);

    if (newKillCount < 30) {
      if (!isSpawnScheduledRef.current) {
        isSpawnScheduledRef.current = true; // Set the lock
        const randomDelay = Math.random() * 2000 + 1000;
        console.log(`Scheduling next spawn in ${randomDelay.toFixed(0)}ms`);
        spawnTimeoutRef.current = setTimeout(spawnEnemy, randomDelay);
      } else {
        console.log("Spawn already scheduled, skipping duplicate schedule.");
      }
    } else {
      console.log("Area Complete!");
      if (playerAttackTimer.current) clearInterval(playerAttackTimer.current);
      if (enemyAttackTimer.current) clearInterval(enemyAttackTimer.current);
      playerAttackTimer.current = null;
      enemyAttackTimer.current = null;
      // Also clear pending spawn timeout if area is completed
      if (spawnTimeoutRef.current) {
        clearTimeout(spawnTimeoutRef.current);
        spawnTimeoutRef.current = null;
      }
    }
  };

  const handlePlayerBurstAttack = () => {
    if (!currentEnemy || !character || currentEnemy.currentHealth <= 0) {
      return;
    }
    const burstDamage = Math.max(1, Math.round(character.attackDamage));
    const enemyNewHealth = Math.max(
      0,
      currentEnemy.currentHealth - burstDamage
    );
    displayPlayerDamage(burstDamage);

    if (enemyNewHealth <= 0) {
      const killedEnemyData = { ...currentEnemy };
      handleEnemyDeathSequence(killedEnemyData);
      setCurrentEnemy(null);
    } else {
      setCurrentEnemy({ ...currentEnemy, currentHealth: enemyNewHealth });
    }
  };

  useEffect(() => {
    // Log inside the main useEffect
    console.log(
      "[AreaView useEffect(area)] Running. Area:",
      area?.name,
      "Area Complete:",
      areaComplete,
      "Current Enemy:",
      currentEnemy?.name
    );
    console.log("AreaView: Area changed or component mounted.", area?.name);
    setEnemiesKilledCount(0);
    setCurrentEnemy(null);
    if (enemyAttackTimer.current) clearInterval(enemyAttackTimer.current);
    if (playerAttackTimer.current) clearInterval(playerAttackTimer.current);
    enemyAttackTimer.current = null;
    playerAttackTimer.current = null;
    // Clear Pending Spawn Timeout on Area Change
    if (spawnTimeoutRef.current) {
      clearTimeout(spawnTimeoutRef.current);
      spawnTimeoutRef.current = null;
    }
    isSpawnScheduledRef.current = false; // Reset spawn lock on area change

    if (area && area.level > 1) {
      console.log("[AreaView useEffect(area)] Scheduling initial spawn.");
      const initialSpawnTimeout = setTimeout(() => {
        // Add log inside timeout
        console.log(
          "[AreaView useEffect(area) Timeout] Checking conditions for spawn.",
          {
            areaName: area?.name,
            areaLvl: area?.level,
            areaComplete,
            currentEnemyExists: !!currentEnemy,
          }
        );
        if (area && area.level > 1 && !areaComplete && !currentEnemy) {
          console.log(
            "[AreaView useEffect(area) Timeout] Calling spawnEnemy()."
          );
          spawnEnemy();
        } else {
          console.log(
            "[AreaView useEffect(area) Timeout] Spawn conditions not met."
          );
        }
      }, 2500);

      return () => clearTimeout(initialSpawnTimeout);
    }
    if (playerAttackTimer.current) {
      clearInterval(playerAttackTimer.current);
      playerAttackTimer.current = null;
    }
    // Only depend on the area changing for this setup effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [area]);

  useEffect(() => {
    if (enemyAttackTimer.current) {
      clearInterval(enemyAttackTimer.current);
      enemyAttackTimer.current = null;
    }
    if (currentEnemy && currentEnemy.currentHealth > 0) {
      const attackInterval = 1000 / currentEnemy.attackSpeed;
      enemyAttackTimer.current = setInterval(() => {
        // Check inside interval if enemy still exists
        if (currentEnemy && currentEnemy.currentHealth > 0) {
          const damageDealt = Math.max(1, Math.round(currentEnemy.damage));
          onTakeDamage(damageDealt);
          showEnemyDamageNumber(damageDealt);
        } else {
          // Clear if enemy died between ticks
          if (enemyAttackTimer.current) clearInterval(enemyAttackTimer.current);
          enemyAttackTimer.current = null;
        }
      }, attackInterval);

      return () => {
        if (enemyAttackTimer.current) {
          clearInterval(enemyAttackTimer.current);
          enemyAttackTimer.current = null;
        }
      };
    }
  }, [currentEnemy, onTakeDamage]);

  useEffect(() => {
    return () => {
      if (playerAttackTimer.current) {
        clearInterval(playerAttackTimer.current);
        playerAttackTimer.current = null;
      }
      if (enemyAttackTimer.current) {
        clearInterval(enemyAttackTimer.current);
        enemyAttackTimer.current = null;
      }
      // Clear pending spawn timeout
      if (spawnTimeoutRef.current) {
        clearTimeout(spawnTimeoutRef.current);
        spawnTimeoutRef.current = null;
      }
    };
  }, []); // Empty dependency array means this runs only on unmount

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

          {/* Render LAST PLAYER damage number */}
          {lastPlayerDamage && (
            <span
              key={lastPlayerDamage.id} // Use unique ID for key
              className={`absolute text-lg font-bold animate-diablo-damage-float text-red-500`}
              style={{
                left: `50%`, // Or randomize position if desired
                top: `40%`, // Player damage appears higher
                transform: "translateX(-50%)",
              }}
            >
              {lastPlayerDamage.value}
            </span>
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

            <button
              onClick={handlePlayerBurstAttack}
              className="px-6 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              Ataque Extra
            </button>
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
