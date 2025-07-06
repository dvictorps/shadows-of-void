// Utility functions related to combat calculations, damage application, etc.
import { Character, EnemyDamageType, MapLocation, EnemyType, EnemyInstance, enemyTypes, calculateEnemyStats } from "../types/gameData"; // Combined imports
import { EffectiveStats, calculateEffectiveStats } from "./statUtils"; 
import { v4 as uuidv4 } from "uuid";
import { useCharacterStore } from "../stores/characterStore"; // Needed for player attack timer reset
import { calculateXPToNextLevel } from "./gameLogicUtils"; // <<< ADD Import
import { generateDrop } from "./itemUtils"; // <<< ADD Import
import { EquippableItem, ItemRarity } from "../types/gameData"; // <<< ADD Imports

// <<< DEFINE Result Type (Restored) >>>
export interface PlayerTakeDamageResult {
  updates: Partial<Character>;
  finalDamage: number;
  isDead: boolean;
  deathMessage: string;
  barrierBroken: boolean;
  isLowHealth: boolean;
}

export const applyPlayerTakeDamage = (
    rawDamage: number,
    damageType: EnemyDamageType,
    playerChar: Character,
    playerStats: EffectiveStats | null
): PlayerTakeDamageResult => {
    // --- Defensive Guard ---
    if (!playerStats) {
      console.error("[applyPlayerTakeDamage] CRITICAL: playerStats is null. Aborting damage calculation.");
      // Return a "no-op" result to prevent a crash.
      return {
        updates: {},
        finalDamage: 0,
        isDead: false,
        deathMessage: "",
        barrierBroken: false,
        isLowHealth: false,
      };
    }
    // -----------------------

    const currentBarrier = playerChar.currentBarrier ?? 0;
    let finalDamage = rawDamage;
    let barrierBroken = false; 
    let isLowHealth = false; 

    console.log(
      `[applyPlayerTakeDamage] Base: ${rawDamage}, Type: ${damageType}, Barrier: ${currentBarrier}`
    );

    // --- Mitigation Logic --- 
    if (damageType === "physical") {
        const armor = playerStats?.totalArmor ?? 0;
        const physTakenAsElePercent = playerStats?.totalPhysTakenAsElementPercent ?? 0;
        const reducedPhysTakenPercent = playerStats?.totalReducedPhysDamageTakenPercent ?? 0;
        let unconvertedDamage = rawDamage;
        let elementalDamageTaken = 0;
        if (physTakenAsElePercent > 0) {
            const amountToConvert = rawDamage * (physTakenAsElePercent / 100);
            unconvertedDamage -= amountToConvert;
            const elements = ["fire", "cold", "lightning"] as const;
            const chosenElement = elements[Math.floor(Math.random() * elements.length)];
            let elementResistance = 0;
            switch (chosenElement) {
                case "fire": elementResistance = playerStats.finalFireResistance; break;
                case "cold": elementResistance = playerStats.finalColdResistance; break;
                case "lightning": elementResistance = playerStats.finalLightningResistance; break;
            }
            const mitigationFromResistance = elementResistance / 100;
            elementalDamageTaken = Math.max(0, Math.round(amountToConvert * (1 - mitigationFromResistance)));
        }
        let armorMitigation = 0;
        if (armor > 0 && unconvertedDamage > 0) {
            armorMitigation = armor / (armor + 10 * unconvertedDamage);
        }
        let mitigatedPhysDamage = Math.max(0, Math.round(unconvertedDamage * (1 - armorMitigation)));
        const flatReduction = reducedPhysTakenPercent / 100;
        mitigatedPhysDamage = Math.max(0, Math.round(mitigatedPhysDamage * (1 - flatReduction)));
        finalDamage = mitigatedPhysDamage + elementalDamageTaken;
    } else if (damageType === "cold") {
        const resistance = playerStats.finalColdResistance;
        const mitigation = resistance / 100;
        finalDamage = Math.max(0, Math.round(rawDamage * (1 - mitigation)));
    } else if (damageType === "void") {
        const resistance = playerStats.finalVoidResistance;
        const mitigation = resistance / 100;
        finalDamage = Math.max(0, Math.round(rawDamage * (1 - mitigation)));
    } else if (damageType === "fire") {
        const resistance = playerStats.finalFireResistance;
        const mitigation = resistance / 100;
        finalDamage = Math.max(0, Math.round(rawDamage * (1 - mitigation)));
    } else if (damageType === "lightning") {
        const resistance = playerStats.finalLightningResistance;
        const mitigation = resistance / 100;
        finalDamage = Math.max(0, Math.round(rawDamage * (1 - mitigation)));
    } else {
      console.warn(
        `Unknown damage type in applyPlayerTakeDamage: ${damageType}`
      );
    }

    console.log(`[applyPlayerTakeDamage] Final Damage After Mitigation: ${finalDamage}`);

    // --- Damage Application Calculation --- 
    let newBarrier = currentBarrier;
    let newHealth = playerChar.currentHealth;
    const updates: Partial<Character> = {};
    let isDead = false;
    let deathMessage = "";

    if (finalDamage > 0) {
      if (currentBarrier > 0) {
        const damageToBarrier = Math.min(currentBarrier, finalDamage);
        newBarrier = currentBarrier - damageToBarrier;
        const remainingDamage = finalDamage - damageToBarrier;
        if (remainingDamage > 0) {
          newHealth = Math.max(0, playerChar.currentHealth - remainingDamage);
        }
      } else {
        newHealth = Math.max(0, playerChar.currentHealth - finalDamage);
      }
      updates.currentBarrier = newBarrier;
      updates.currentHealth = newHealth;

      if (currentBarrier > 0 && newBarrier === 0) {
        console.log("[applyPlayerTakeDamage] Barrier reached zero!");
        barrierBroken = true; 
      }
    }

    // --- Check for Low Health & set flag ---
    const maxHp = playerStats.maxHealth ?? 1;
    if (newHealth > 0 && newHealth / maxHp < 0.3) {
        isLowHealth = true; 
    }

    // --- Check for Death --- 
    if (newHealth <= 0) {
      console.log("[applyPlayerTakeDamage] Player died!");
      isDead = true;
      const xpPenalty = Math.floor(playerChar.currentXP * 0.1);
      const baseHealth = playerChar.baseMaxHealth;
      updates.currentHealth = baseHealth; 
      updates.currentBarrier = 0;
      updates.currentAreaId = "cidade_principal";
      updates.currentXP = Math.max(0, playerChar.currentXP - xpPenalty);
      deathMessage = `Você morreu! Retornando para a cidade inicial. Perdeu ${xpPenalty} XP.`;
    }

    return { updates, finalDamage, isDead, deathMessage, barrierBroken, isLowHealth };
};

// <<< ADD SPAWN ENEMY FUNCTION >>>
export const spawnEnemy = (
  currentActiveArea: MapLocation | null,
  currentEnemy: EnemyInstance | null,
  enemiesKilledCount: number,
  setCurrentEnemy: (enemy: EnemyInstance | null) => void,
  nextEnemyAttackTimeRef: React.MutableRefObject<number>,
  nextPlayerAttackTimeRef: React.MutableRefObject<number>
): void => {
  if (!currentActiveArea || currentActiveArea.id === "cidade_principal") return;
  if (currentEnemy) return; // Don't spawn if one exists
  // <<< Use dynamic kills needed from area >>>
  const killsNeeded = currentActiveArea?.killsToComplete ?? 30;
  if (enemiesKilledCount >= killsNeeded) return; // Don't spawn if area complete

  const possibleEnemies = currentActiveArea.possibleEnemies ?? [];
  if (possibleEnemies.length === 0) return;

  const randomEnemyTypeId =
    possibleEnemies[Math.floor(Math.random() * possibleEnemies.length)];
  const enemyTypeData = enemyTypes.find(
    (t: EnemyType) => t.id === randomEnemyTypeId
  );
  if (!enemyTypeData) {
    console.error(`[Spawn Enemy] Type data not found: ${randomEnemyTypeId}`);
    return;
  }

  const levelVariation = Math.floor(Math.random() * 3) - 1;
  const enemyLevel = Math.max(1, currentActiveArea.level + levelVariation);
  const stats = calculateEnemyStats(enemyTypeData, enemyLevel);

  const newInstance: EnemyInstance = {
    instanceId: uuidv4(),
    typeId: enemyTypeData.id,
    name: enemyTypeData.name,
    iconPath: enemyTypeData.iconPath,
    emoji: enemyTypeData.iconPath ? undefined : enemyTypeData.emoji,
    level: enemyLevel,
    maxHealth: stats.health,
    currentHealth: stats.health,
    damage: stats.damage,
    attackSpeed: enemyTypeData.attackSpeed,
    damageType: enemyTypeData.damageType,
    accuracy: stats.accuracy,
    isDying: false,
    isBoss: enemyTypeData.isBoss,
  };

  console.log(
    `[Spawn Enemy] Spawning ${newInstance.name} (Lvl ${newInstance.level})`
  );
  setCurrentEnemy(newInstance);
  const now = Date.now();
  nextEnemyAttackTimeRef.current = now + 1000 / newInstance.attackSpeed;

  // Player attack timer reset
  const latestCharState = useCharacterStore.getState().activeCharacter;
  let currentStats = null;
  if (latestCharState) {
    try {
      currentStats = calculateEffectiveStats(latestCharState);
    } catch (e) {
      console.error(
        "[Spawn Enemy] Error calculating stats for player timer reset:",
        e
      );
    }
  }
  if (currentStats) {
    const playerAttackInterval = 1000 / currentStats.attackSpeed;
    nextPlayerAttackTimeRef.current = now + playerAttackInterval;
    console.log(
      `[Spawn Enemy] Player timer reset SUCCESS. Next attack in ${playerAttackInterval.toFixed(
        0
      )}ms. Ref value: ${nextPlayerAttackTimeRef.current}`
    );
  } else {
    console.warn(
      "[Spawn Enemy] Player timer reset FAILED. Setting ref to Infinity."
    );
    nextPlayerAttackTimeRef.current = Infinity;
  }
};

// <<< ADD HANDLE ENEMY REMOVAL FUNCTION >>>
export const handleEnemyRemoval = (
  killedEnemy: EnemyInstance | null,
  currentArea: MapLocation | null,
  enemiesKilledCount: number,
  setEnemiesKilledCount: (count: number) => void,
  setCurrentEnemy: (enemy: EnemyInstance | null) => void,
  enemyDeathAnimEndTimeRef: React.MutableRefObject<number>,
  enemySpawnCooldownRef: React.MutableRefObject<number>,
  handleItemDropped: (item: EquippableItem) => void, // From useInventoryManager hook
  updateCharacterStore: (updates: Partial<Character>) => void, // Zustand actions
  saveCharacterStore: () => void,
  displayTemporaryMessage: (message: string | React.ReactNode, duration?: number) => void // From useMessageBox hook
): void => {
  if (!killedEnemy) return;
  console.log(
    `[Enemy Removal] Processing removal for ${killedEnemy.name}` 
  );

  // --- XP Gain ---
  const char = useCharacterStore.getState().activeCharacter;
  if (char) {
    const baseXP =
      enemyTypes.find((t) => t.id === killedEnemy.typeId)?.baseXP ?? 0;
    const earnedXP = baseXP;
    if (earnedXP > 0) {
      let currentTotalXP = char.currentXP + earnedXP;
      let currentLevel = char.level;
      const initialLevel = char.level; // <<< Store initial level
      let xpForNext = calculateXPToNextLevel(currentLevel);
      const updates: Partial<Character> = {};

      while (currentTotalXP >= xpForNext && currentLevel < 100) {
        currentTotalXP -= xpForNext;
        currentLevel++;
        console.log(
          `%c[LEVEL UP!] Reached level ${currentLevel}!%c`,
          "color: yellow; font-weight: bold",
          "color: inherit; font-weight: normal" 
        );
        xpForNext = calculateXPToNextLevel(currentLevel); 
      }
      updates.currentXP = currentTotalXP;

      if (currentLevel !== initialLevel) { // <<< Check if level actually changed
        const levelDifference = currentLevel - initialLevel;
        updates.level = currentLevel;
        // <<< ADD: Increase baseMaxHealth permanently >>>
        updates.baseMaxHealth = char.baseMaxHealth + (12 * levelDifference);
        console.log(`[Level Up] Increased baseMaxHealth by ${12 * levelDifference} to ${updates.baseMaxHealth}`);

        // <<< ADD: Full Heal Logic >>>
        try {
            // Create a temporary character object with the new level and base health
            // to calculate the *correct* new maximums
            const tempUpdatedChar: Character = {
                ...char, // Start with current character state
                level: updates.level, // Apply new level
                baseMaxHealth: updates.baseMaxHealth, // Apply new base health
                // Ensure other stats needed for calculation are present
            };
            const newStats = calculateEffectiveStats(tempUpdatedChar);
            updates.currentHealth = newStats.maxHealth; // Heal to NEW max health
            updates.currentBarrier = newStats.totalBarrier; // Restore barrier to NEW max barrier
            console.log(`[Level Up] Applied full heal: HP=${updates.currentHealth}, Barrier=${updates.currentBarrier}`);
        } catch (e) {
            console.error("[Level Up] Error calculating stats for full heal:", e);
            // Fallback or log error - Decide if partial heal is needed?
            // For now, just log the error. Heal might not be applied if calc fails.
        }
        // -------------------------

        displayTemporaryMessage(
          `Parabéns! Você alcançou o nível ${currentLevel}! Vida e Barreira restauradas!`,
          3000
        );
      }

      // <<< ADD Potion Grant Logic >>>
      const POTION_GRANT_CHANCE = 0.15; // 15% chance to get a potion on kill
      if (Math.random() < POTION_GRANT_CHANCE) {
        const currentPotions = char.healthPotions ?? 0;
        if (currentPotions < 20) {
          updates.healthPotions = currentPotions + 1; // Add potion update
          console.log(`[Enemy Removal] Granted potion! New count: ${updates.healthPotions}`);
          // Add temporary message?
          // displayTemporaryMessage("Poção de Vida encontrada!", 1000);
        } else {
          console.log("[Enemy Removal] Potion grant chance passed, but player already has max potions (20).");
        }
      } else {
          console.log("[Enemy Removal] Potion grant chance failed.");
      }
      // -------------------------

      // <<< ADD Teleport Stone Grant Logic >>>
      const TELEPORT_STONE_GRANT_CHANCE = 0.05; // 5% chance to get a teleport stone on kill
      if (Math.random() < TELEPORT_STONE_GRANT_CHANCE) {
        const currentStones = char.teleportStones ?? 0;
        updates.teleportStones = currentStones + 1; // Add stone update (no cap)
        console.log(`[Enemy Removal] Granted teleport stone! New count: ${updates.teleportStones}`);
        // Optionally show message
        // displayTemporaryMessage("Pedra de Teleporte encontrada!", 1000);
      } else {
        console.log("[Enemy Removal] Teleport stone grant chance failed.");
      }
      // -------------------------

      if (Object.keys(updates).length > 0) {
        updateCharacterStore(updates);
        setTimeout(() => saveCharacterStore(), 50);
      }
    }
  }
  // --- End XP Gain ---

  // --- <<< START Boss Guaranteed Drop Logic >>> ---
  if (killedEnemy.typeId === "ice_dragon_boss") {
    console.log("[Enemy Removal] Processing guaranteed drop for ice_dragon_boss.");
    const isLegendary = Math.random() < 0.30; // 30% chance for Legendary
    const guaranteedRarity: ItemRarity = isLegendary ? "Lendário" : "Raro";
    console.log(`[Enemy Removal] Boss guaranteed rarity determined: ${guaranteedRarity}`);

    const guaranteedItem = generateDrop(killedEnemy.level, undefined, guaranteedRarity);
    if (guaranteedItem) {
      console.log(
        `[Enemy Removal] Boss GUARANTEED drop: ${guaranteedItem.name} (Rarity: ${guaranteedItem.rarity})`
      );
      handleItemDropped(guaranteedItem);
    } else {
      // This would indicate an issue in generateDrop if it happens for a guaranteed drop
      console.error("[Enemy Removal] Failed to generate GUARANTEED boss drop item!");
    }
  }
  // --- <<< END Boss Guaranteed Drop Logic >>> ---

  // --- Item Drop (Normal Chance - Can be additional drop for boss) ---
  const BASE_DROP_CHANCE = 0.30; // 30% base chance for ANY enemy (including boss, as extra)

  if (Math.random() < BASE_DROP_CHANCE) { // Base chance check
    // Generate drop with normal rarity determination (forcedRarity is undefined)
    const newItem = generateDrop(killedEnemy.level); 
    if (newItem) {
      console.log(
        `[Enemy Removal] Generated NORMAL drop: ${newItem.name} (Rarity: ${newItem.rarity})`
      );
      handleItemDropped(newItem);
    } else {
      // This log now indicates a potential issue in generateDrop
      console.log("[Enemy Removal] Failed to generate normal item even though drop chance passed.");
    }
  } else {
    console.log("[Enemy Removal] Normal drop chance failed. No additional item dropped.");
  }
  // --- End Item Drop ---

  const newKillCount = enemiesKilledCount + 1;
  setEnemiesKilledCount(newKillCount);
  setCurrentEnemy(null);
  enemyDeathAnimEndTimeRef.current = 0;

  const killsNeeded = currentArea?.killsToComplete ?? 30;
  if (newKillCount < killsNeeded) {
    const randomDelay = Math.random() * 150 + 100;
    enemySpawnCooldownRef.current = randomDelay;
    console.log(
      `[Enemy Removal] Scheduling next spawn check in ${randomDelay.toFixed(
        0
      )}ms. Kills: ${newKillCount}/${killsNeeded}`
    );
  } else {
    console.log(
      `[Enemy Removal] Area Complete (${newKillCount}/${killsNeeded})! No spawn scheduled.`
    );
    enemySpawnCooldownRef.current = Infinity;
  }
};

// export {}; // Remove empty export 