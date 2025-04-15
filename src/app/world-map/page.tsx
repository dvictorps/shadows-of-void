"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import {
  Character,
  MapLocation,
  act1Locations,
  enemyTypes,
  EquippableItem,
} from "../../types/gameData";
import {
  loadCharacters,
  loadOverallData,
  saveOverallData,
} from "../../utils/localStorage";
import CharacterStats from "../../components/CharacterStats";
import MapArea from "../../components/MapArea";
import InventoryDisplay from "../../components/InventoryDisplay";
import AreaView from "../../components/AreaView";
import { generateDrop } from "../../utils/itemUtils";
import ItemDropModal from "../../components/ItemDropModal";
import InventoryModal from "../../components/InventoryModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import PendingDropsModal from "../../components/PendingDropsModal";
import Modal from "../../components/Modal";
import Button from "../../components/Button";
import {
  calculateTotalStrength,
  calculateTotalDexterity,
  calculateTotalIntelligence,
  calculateEffectiveStats,
  EffectiveStats,
} from "../../utils/statUtils";
import { useCharacterStore } from "../../stores/characterStore";
import { useInventoryManager } from "../../hooks/useInventoryManager";
import { useMessageBox } from "../../hooks/useMessageBox";

console.log("--- world-map/page.tsx MODULE LOADED ---");

// Restore constants and helpers
const BASE_TRAVEL_TIME_MS = 5000;
const MIN_TRAVEL_TIME_MS = 500;
const calculateXPToNextLevel = (level: number): number => {
  return Math.floor(100 * Math.pow(1.15, level - 1));
};

// --- XP Scaling Constants ---
const XP_REDUCTION_BASE = 0.8; // Lower value = faster XP drop-off (e.g., 0.7)
const XP_LEVEL_DIFF_THRESHOLD = 6; // Levels above enemy before XP reduction starts

export default function WorldMapPage() {
  const router = useRouter();

  // --- Get State/Actions from Zustand Store ---
  const activeCharacter = useCharacterStore((state) => state.activeCharacter);
  const setActiveCharacterStore = useCharacterStore(
    (state) => state.setActiveCharacter
  );
  const updateCharacterStore = useCharacterStore(
    (state) => state.updateCharacter
  );
  const saveCharacterStore = useCharacterStore((state) => state.saveCharacter);

  // --- Initialize the Message Box Hook ---
  const {
    message: textBoxContent,
    displayPersistentMessage,
    displayTemporaryMessage,
  } = useMessageBox("Mapa - Ato 1");

  // --- Local State (to keep for now) ---
  const [currentArea, setCurrentArea] = useState<MapLocation | null>(null);
  const [currentView, setCurrentView] = useState<"worldMap" | "areaView">(
    "worldMap"
  );
  const [isTraveling, setIsTraveling] = useState(false);
  const [travelProgress, setTravelProgress] = useState(0);
  const [travelTargetAreaId, setTravelTargetAreaId] = useState<string | null>(
    null
  );
  const travelTimerRef = useRef<NodeJS.Timeout | null>(null);
  const travelStartTimeRef = useRef<number | null>(null);
  const travelTargetIdRef = useRef<string | null>(null);

  // --- ADD State for Modals previously in Hook ---
  const [isConfirmDiscardOpen, setIsConfirmDiscardOpen] = useState(false);
  const [itemToDiscard, setItemToDiscard] = useState<EquippableItem | null>(
    null
  );
  const [isRequirementFailModalOpen, setIsRequirementFailModalOpen] =
    useState(false);
  const [itemFailedRequirements, setItemFailedRequirements] =
    useState<EquippableItem | null>(null);
  // ----------------------------------------------

  // --- Use the Inventory Manager Hook --- CORRECTED CALL
  const {
    // Destructure only what the page itself needs
    isDropModalOpen,
    itemsToShowInModal,
    isPendingDropsModalOpen,
    isInventoryOpen,
    handleOpenDropModalForCollection,
    handleCloseDropModal,
    handleDiscardItemFromDrop,
    handleDiscardAllFromDrop,
    clearPendingDrops,
    handleOpenPendingDropsModal,
    handleClosePendingDropsModal,
    handleOpenInventory,
    handleCloseInventory,
    handleCloseDiscardConfirm,
    handleConfirmDiscard,
    handlePickUpItem,
    handlePickUpAll,
    handleEquipItem,
    handleItemDropped,
    handleCloseRequirementFailModal,
    handleOpenDiscardConfirm,
    handleSwapWeapons,
    handleUnequipItem,
  } = useInventoryManager({
    // PASS ALL REQUIRED PROPS TO THE HOOK
    setIsConfirmDiscardOpen,
    setItemToDiscard,
    setIsRequirementFailModalOpen,
    setItemFailedRequirements,
  });

  // --- Calculate Stats based on Store's activeCharacter ---
  const totalStrength = useMemo(() => {
    if (!activeCharacter) return 0;
    return calculateTotalStrength(activeCharacter);
  }, [activeCharacter]);

  const totalDexterity = useMemo(() => {
    if (!activeCharacter) return 0;
    return calculateTotalDexterity(activeCharacter);
  }, [activeCharacter]);

  const totalIntelligence = useMemo(() => {
    if (!activeCharacter) return 0;
    return calculateTotalIntelligence(activeCharacter);
  }, [activeCharacter]);

  // --- Calculate Effective Stats Here ---
  const effectiveStats: EffectiveStats | null = useMemo(() => {
    if (!activeCharacter) return null;
    try {
      return calculateEffectiveStats(activeCharacter);
    } catch (e) {
      console.error("[WorldMapPage] Error calculating effective stats:", e);
      return null;
    }
  }, [activeCharacter]);

  // --- Update Initial Load useEffect ---
  useEffect(() => {
    try {
      const charIdStr = localStorage.getItem("selectedCharacterId");
      if (!charIdStr) {
        router.push("/characters");
        return;
      }
      const charId = parseInt(charIdStr, 10);
      if (isNaN(charId)) {
        router.push("/characters");
        return;
      }
      let characters: Character[];
      try {
        characters = loadCharacters();
      } catch (error) {
        console.error("Error loading characters:", error);
        router.push("/characters");
        return;
      }
      const char = characters.find((c) => c.id === charId);
      if (!char) {
        console.error(`Character not found for ID: ${charId}`);
        router.push("/characters");
        return;
      }

      // Save last played ID
      try {
        const overallData = loadOverallData();
        if (overallData.lastPlayedCharacterId !== char.id) {
          saveOverallData({ ...overallData, lastPlayedCharacterId: char.id });
        }
      } catch (error) {
        console.error("Error saving last played character ID:", error);
      }

      // <<< ADD HEALING LOGIC ON LOAD >>>
      const initialUpdates: Partial<Character> = {};
      // Calculate max health dynamically for healing check
      const currentStatsOnLoad = calculateEffectiveStats(char);
      const actualMaxHealthOnLoad = currentStatsOnLoad.maxHealth;

      if (
        char.currentAreaId === "cidade_principal" &&
        char.currentHealth < actualMaxHealthOnLoad // Use calculated max health
      ) {
        console.log(
          `[Initial Load] Character loaded in safe zone. Healing ${char.currentHealth} -> ${actualMaxHealthOnLoad}.`
        );
        initialUpdates.currentHealth = actualMaxHealthOnLoad; // Heal to calculated max
      }
      // <<< ADD POTION REFILL LOGIC ON LOAD >>>
      if (char.currentAreaId === "cidade_principal" && char.healthPotions < 3) {
        console.log(
          "[Initial Load] Character loaded in safe zone with < 3 potions. Refilling to 3."
        );
        initialUpdates.healthPotions = 3;
      }

      // <<< ADD RETROACTIVE AREA UNLOCK LOGIC >>>
      if (
        char.level >= 3 &&
        !char.unlockedAreaIds.includes("colinas_ecoantes")
      ) {
        console.log(
          `[Initial Load] Character level ${char.level} >= 3. Retroactively unlocking 'colinas_ecoantes'.`
        );
        // Make sure unlockedAreaIds exists before spreading
        const currentUnlocked = char.unlockedAreaIds || [];
        initialUpdates.unlockedAreaIds = [
          ...currentUnlocked,
          "colinas_ecoantes",
        ];
      }
      // <<< END RETROACTIVE AREA UNLOCK LOGIC >>>

      // --- Apply updates and set character ---
      let finalCharToSet = char;
      if (Object.keys(initialUpdates).length > 0) {
        // If we made changes, merge them and save
        finalCharToSet = { ...char, ...initialUpdates };
        console.log("[Initial Load] Applying updates: ", initialUpdates);
        setActiveCharacterStore(finalCharToSet);
        setTimeout(() => saveCharacterStore(), 50);
      } else {
        // If no updates, just set the initially loaded character
        setActiveCharacterStore(finalCharToSet);
      }
      // <<< END HEALING/POTION/UNLOCK LOGIC >>>

      const areaData = act1Locations.find(
        (loc) => loc.id === finalCharToSet.currentAreaId // Use final character data
      );
      if (areaData) {
        setCurrentArea(areaData);
        setCurrentView("worldMap");
      } else {
        console.error(
          `Area data NOT found for ID: ${finalCharToSet.currentAreaId}.`
        );
        setCurrentArea(null);
        setCurrentView("worldMap");
      }
    } catch (error) {
      console.error("Error in initial load useEffect:", error);
      // Potentially redirect on generic error too
      // router.push("/characters");
    }

    // Cleanup function
    return () => {
      if (travelTimerRef.current) {
        clearInterval(travelTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, setActiveCharacterStore]); // <<< ADD eslint-disable comment

  useEffect(() => {
    // Restore timer cleanup
    return () => {
      if (travelTimerRef.current) {
        clearInterval(travelTimerRef.current);
      }
    };
  }, []);

  const calculateTravelTime = (
    baseTime: number,
    movementSpeed: number
  ): number => {
    const speedMultiplier = 1 - movementSpeed / 100;
    const calculatedTime = baseTime * speedMultiplier;
    return Math.max(calculatedTime, MIN_TRAVEL_TIME_MS);
  };

  // Function defined inside handleEnterAreaView moved outside/restored here
  const handleEnterAreaView = useCallback(
    (area: MapLocation) => {
      const currentChar = useCharacterStore.getState().activeCharacter; // Get current state
      if (!currentChar) return;
      console.log(
        `Entering Area View for: ${area.name} | Character: ${currentChar.name}`
      );
      // Display the area description persistently BEFORE changing view/area state
      displayPersistentMessage(area.description);
      setCurrentArea(area);
      setCurrentView("areaView");
    },
    [displayPersistentMessage] // Dependency updated
  );

  const handleTravel = useCallback(
    (targetAreaId: string) => {
      const currentChar = useCharacterStore.getState().activeCharacter;
      if (
        isTraveling ||
        !currentChar ||
        currentChar.currentAreaId === targetAreaId
      ) {
        return;
      }
      const travelDuration = calculateTravelTime(
        BASE_TRAVEL_TIME_MS,
        currentChar.movementSpeed // Use state from store
      );
      const targetLocation = act1Locations.find(
        (loc) => loc.id === targetAreaId
      );
      if (!targetLocation) return;

      if (travelTimerRef.current) clearInterval(travelTimerRef.current);
      setTravelTargetAreaId(targetAreaId);
      setIsTraveling(true);
      setTravelProgress(0);
      travelStartTimeRef.current = Date.now();
      travelTargetIdRef.current = targetAreaId;
      displayPersistentMessage(`Viajando para ${targetLocation.name}...`);
      setCurrentView("worldMap");
      setCurrentArea(null);

      travelTimerRef.current = setInterval(() => {
        const startTime = travelStartTimeRef.current;
        if (!startTime) return;
        const elapsedTime = Date.now() - startTime;
        const progress = Math.min((elapsedTime / travelDuration) * 100, 100);
        setTravelProgress(progress);

        if (progress >= 100) {
          clearInterval(travelTimerRef.current!); // Non-null assertion
          travelTimerRef.current = null;
          const finalTargetId = travelTargetIdRef.current;
          if (!finalTargetId) {
            setIsTraveling(false);
            return;
          }
          const finalNewLocation = act1Locations.find(
            (loc) => loc.id === finalTargetId
          );
          if (!finalNewLocation) {
            setIsTraveling(false);
            return;
          }

          const updates: Partial<Character> = { currentAreaId: finalTargetId };

          // <<< ADD HEALING LOGIC >>>
          if (finalNewLocation.id === "cidade_principal") {
            const latestChar = useCharacterStore.getState().activeCharacter;
            if (latestChar) {
              // Calculate max health dynamically for healing
              const currentStatsOnTravelEnd =
                calculateEffectiveStats(latestChar);
              const actualMaxHealthOnTravelEnd =
                currentStatsOnTravelEnd.maxHealth;

              // Heal to full (using calculated max)
              if (latestChar.currentHealth < actualMaxHealthOnTravelEnd) {
                console.log(
                  `[Travel Complete] Arrived at safe zone (${finalNewLocation.name}). Healing ${latestChar.currentHealth} -> ${actualMaxHealthOnTravelEnd}.`
                );
                updates.currentHealth = actualMaxHealthOnTravelEnd; // Heal to calculated max
              }
              // Refill potions if needed
              if (latestChar.healthPotions < 3) {
                console.log(
                  `[Travel Complete] Arrived at safe zone (${finalNewLocation.name}) with < 3 potions. Refilling to 3.`
                );
                updates.healthPotions = 3;
              }
            }
          }
          // <<< END HEALING LOGIC >>>

          // Update character in store and save
          updateCharacterStore(updates);
          setTimeout(() => saveCharacterStore(), 50);

          handleEnterAreaView(finalNewLocation);

          // Reset local travel state
          setIsTraveling(false);
          setTravelProgress(0);
          setTravelTargetAreaId(null);
          travelTargetIdRef.current = null;
          travelStartTimeRef.current = null;

          // Clear pending drops on death
          clearPendingDrops();
        }
      }, 50);
    },
    [
      isTraveling,
      updateCharacterStore,
      saveCharacterStore,
      handleEnterAreaView,
      clearPendingDrops,
    ] // Dependencies updated
  );

  const handleReturnToMap = useCallback(
    (enemiesKilled?: number) => {
      const dropsFromRun = itemsToShowInModal;
      console.log(
        `Returned to map. Enemies killed: ${enemiesKilled}. Drops collected in hook state: ${dropsFromRun.length}`
      );
      setCurrentView("worldMap");
      setCurrentArea(null);
      displayPersistentMessage("Mapa - Ato 1");
      handleOpenDropModalForCollection();
    },
    [
      itemsToShowInModal,
      handleOpenDropModalForCollection,
      displayPersistentMessage,
    ]
  );

  const handleReEnterAreaView = useCallback(() => {
    const currentChar = useCharacterStore.getState().activeCharacter;
    if (!isTraveling && currentChar) {
      const currentLoc = act1Locations.find(
        (loc) => loc.id === currentChar.currentAreaId
      );
      if (currentLoc) {
        // Restore the call to re-enter the area view
        handleEnterAreaView(currentLoc);
        // displayPersistentMessage("..."); // Don't reset message on failed re-enter
      }
    }
  }, [isTraveling, handleEnterAreaView]); // Keep handleEnterAreaView dependency

  const handleMouseEnterLocation = useCallback(
    (description: string) => {
      if (currentView === "worldMap" && !isTraveling)
        displayPersistentMessage(description);
    },
    [currentView, isTraveling, displayPersistentMessage]
  );

  const handleMouseLeaveLocation = useCallback(() => {
    if (currentView === "worldMap" && !isTraveling)
      displayPersistentMessage("Mapa - Ato 1");
  }, [currentView, isTraveling, displayPersistentMessage]);

  const handleBackToCharacters = useCallback(() => {
    router.push("/characters");
  }, [router]);

  const handlePlayerTakeDamage = useCallback(
    (damage: number, damageType: string) => {
      const currentChar = useCharacterStore.getState().activeCharacter;
      if (!currentChar) return;

      const currentStats = calculateEffectiveStats(currentChar);
      let finalDamage = damage; // Start with base damage

      console.log(`[Damage Calc Start] Base: ${damage}, Type: ${damageType}`);

      // Apply Damage Type Specific Mitigation
      switch (damageType) {
        case "physical": {
          const armor = currentStats?.totalArmor ?? 0;
          const physTakenAsElePercent =
            currentStats?.totalPhysTakenAsElementPercent ?? 0;
          const reducedPhysTakenPercent =
            currentStats?.totalReducedPhysDamageTakenPercent ?? 0;
          let unconvertedDamage = damage;
          let elementalDamageTaken = 0;

          // 1. Convert portion to Elemental (if applicable)
          if (physTakenAsElePercent > 0) {
            const amountToConvert = damage * (physTakenAsElePercent / 100);
            unconvertedDamage -= amountToConvert;

            // Choose a random element (Fire, Cold, Lightning)
            const elements = ["fire", "cold", "lightning"] as const;
            const chosenElement =
              elements[Math.floor(Math.random() * elements.length)];
            let elementResistance = 0;
            switch (chosenElement) {
              case "fire":
                elementResistance = currentStats.finalFireResistance;
                break;
              case "cold":
                elementResistance = currentStats.finalColdResistance;
                break;
              case "lightning":
                elementResistance = currentStats.finalLightningResistance;
                break;
            }
            const mitigationFromResistance = elementResistance / 100;
            elementalDamageTaken = Math.max(
              0,
              Math.round(amountToConvert * (1 - mitigationFromResistance))
            );
            console.log(
              ` -> Converted ${amountToConvert.toFixed(
                1
              )} to ${chosenElement}, Res: ${elementResistance}%, Mitigated Ele Dmg: ${elementalDamageTaken}`
            );
          }

          // 2. Apply Armor Mitigation to remaining physical portion
          let armorMitigation = 0;
          if (armor > 0 && unconvertedDamage > 0) {
            armorMitigation = armor / (armor + 10 * unconvertedDamage);
          }
          let mitigatedPhysDamage = Math.max(
            0,
            Math.round(unconvertedDamage * (1 - armorMitigation))
          );
          console.log(
            ` -> Unconverted Phys: ${unconvertedDamage.toFixed(
              1
            )}, Armor: ${armor}, Armor Mit: ${(armorMitigation * 100).toFixed(
              1
            )}%, Mitigated Phys Dmg: ${mitigatedPhysDamage}`
          );

          // 3. Apply Flat Physical Damage Reduction (after armor)
          const flatReduction = reducedPhysTakenPercent / 100;
          mitigatedPhysDamage = Math.max(
            0,
            Math.round(mitigatedPhysDamage * (1 - flatReduction))
          );
          console.log(
            ` -> Flat Phys Reduction: ${reducedPhysTakenPercent}%, Final Mitigated Phys Dmg: ${mitigatedPhysDamage}`
          );

          // 4. Sum mitigated physical and elemental parts
          finalDamage = mitigatedPhysDamage + elementalDamageTaken;
          break;
        }
        case "fire": {
          const resistance = currentStats.finalFireResistance;
          const mitigation = resistance / 100;
          finalDamage = Math.max(0, Math.round(damage * (1 - mitigation)));
          break;
        }
        case "cold": {
          const resistance = currentStats.finalColdResistance;
          const mitigation = resistance / 100;
          finalDamage = Math.max(0, Math.round(damage * (1 - mitigation)));
          break;
        }
        case "void": {
          const resistance = currentStats.finalVoidResistance;
          const mitigation = resistance / 100;
          finalDamage = Math.max(0, Math.round(damage * (1 - mitigation)));
          break;
        }
        // NOTE: Lightning is handled by the 'taken as' mechanic for now
        default: // Unknown damage type - no mitigation?
          console.warn(`Unknown damage type received: ${damageType}`);
          break;
      }

      console.log(`[Damage Calc End] Final Damage Taken: ${finalDamage}`);

      const newHealth = Math.max(0, currentChar.currentHealth - finalDamage);
      let updates: Partial<Character> = { currentHealth: newHealth };

      // Check for low health AFTER calculating new health
      const maxHp = effectiveStats?.maxHealth ?? 1; // Use effectiveStats from page scope
      if (newHealth > 0 && newHealth / maxHp < 0.3) {
        // Update the message text here
        displayTemporaryMessage(
          <span className="text-red-500 font-bold">
            Vida Baixa! Use uma poção!
          </span>,
          3000
        ); // Show temporary low health warning
      }

      if (newHealth === 0) {
        console.log("Player died!");
        const xpPenalty = Math.floor(currentChar.currentXP * 0.1);
        // Calculate base health correctly - should come from class/level definition
        // For now, just using maxHealth - THIS IS LIKELY WRONG
        const baseHealth = currentChar.maxHealth; // Placeholder - needs proper base calculation
        updates = {
          ...updates,
          currentHealth: baseHealth, // Reset health to base/max
          currentAreaId: "cidade_principal",
          currentXP: Math.max(0, currentChar.currentXP - xpPenalty),
        };
        // Reset view state locally
        setCurrentView("worldMap");
        setCurrentArea(
          act1Locations.find((loc) => loc.id === "cidade_principal") || null
        );
        displayPersistentMessage(
          `Você morreu! Retornando para a cidade inicial. Perdeu ${xpPenalty} XP.`
        );
        setIsTraveling(false);
        setTravelProgress(0);
        setTravelTargetAreaId(null);
        if (travelTimerRef.current) clearInterval(travelTimerRef.current);
        travelStartTimeRef.current = null;
        travelTargetIdRef.current = null;

        // Clear pending drops on death
        clearPendingDrops();
      }

      updateCharacterStore(updates);
      setTimeout(() => saveCharacterStore(), 50);
    },
    [
      effectiveStats,
      updateCharacterStore,
      saveCharacterStore,
      displayPersistentMessage,
      displayTemporaryMessage,
      clearPendingDrops,
    ]
  );

  // --- Update handlePlayerHeal ---
  const handlePlayerHeal = useCallback(
    (healAmount: number) => {
      const currentChar = useCharacterStore.getState().activeCharacter;
      const currentMaxHp = effectiveStats?.maxHealth ?? 0;
      if (
        !currentChar ||
        healAmount <= 0 ||
        currentChar.currentHealth >= currentMaxHp
      ) {
        return;
      }
      const newHealth = Math.min(
        currentMaxHp,
        currentChar.currentHealth + healAmount
      );
      if (newHealth !== currentChar.currentHealth) {
        updateCharacterStore({ currentHealth: newHealth });
        setTimeout(() => saveCharacterStore(), 50);
      }
    },
    [updateCharacterStore, saveCharacterStore, effectiveStats]
  );

  // --- Update handleEnemyKilled ---
  const handleEnemyKilled = useCallback(
    (enemyTypeId: string, enemyLevel: number, enemyName: string) => {
      const charBeforeUpdate = useCharacterStore.getState().activeCharacter;
      if (!charBeforeUpdate) return;

      let finalUpdates: Partial<Character> = {};
      let potionDropped = false;

      // Calculate XP
      const enemyType = enemyTypes.find((t) => t.id === enemyTypeId);
      const baseEnemyXP = enemyType?.baseXP ?? 5;
      const playerLevel = charBeforeUpdate.level;
      const levelDiff = playerLevel - enemyLevel;
      let xpMultiplier = 1;
      if (levelDiff > XP_LEVEL_DIFF_THRESHOLD) {
        xpMultiplier = Math.pow(
          XP_REDUCTION_BASE,
          levelDiff - XP_LEVEL_DIFF_THRESHOLD
        );
      }
      const xpGained = Math.max(1, Math.round(baseEnemyXP * xpMultiplier));

      // Display enemy defeated message
      displayTemporaryMessage(`${enemyName} derrotado! +${xpGained} XP`, 2500);

      // Check if XP changed
      if (xpGained > 0) {
        finalUpdates.currentXP = charBeforeUpdate.currentXP + xpGained;
      }
      let currentLevelXP = finalUpdates.currentXP ?? charBeforeUpdate.currentXP;

      // Level Up Logic
      let tempLevel = charBeforeUpdate.level;
      let xpNeeded = calculateXPToNextLevel(tempLevel);

      while (currentLevelXP >= xpNeeded && tempLevel < 100) {
        const newLevel = tempLevel + 1;
        const remainingXP = currentLevelXP - xpNeeded;
        const defenseGain = 1;

        // Calculate new BASE max health
        const newBaseMaxHealth =
          (finalUpdates.baseMaxHealth ?? charBeforeUpdate.baseMaxHealth) + 12;

        finalUpdates = {
          ...finalUpdates,
          level: newLevel,
          currentXP: remainingXP,
          baseMaxHealth: newBaseMaxHealth,
          armor: (finalUpdates.armor ?? charBeforeUpdate.armor) + defenseGain,
          currentHealth:
            finalUpdates.currentHealth ?? charBeforeUpdate.currentHealth,
        };

        // --- ADD AREA UNLOCK LOGIC ---
        if (
          newLevel === 3 &&
          !(
            finalUpdates.unlockedAreaIds ?? charBeforeUpdate.unlockedAreaIds
          ).includes("colinas_ecoantes")
        ) {
          const currentUnlocked =
            finalUpdates.unlockedAreaIds ?? charBeforeUpdate.unlockedAreaIds;
          finalUpdates.unlockedAreaIds = [
            ...currentUnlocked,
            "colinas_ecoantes",
          ];
          console.log(
            `[Level Up] Area 'colinas_ecoantes' unlocked at level 3.`
          );
          // Display a message about the unlock?
          // displayTemporaryMessage("Nova área desbloqueada: Colinas Ecoantes!", 4000);
        }
        // --- END AREA UNLOCK LOGIC ---

        // --- Full Heal on Level Up --- NEW
        // Recalculate effective stats based on the *updated* character state to get the new MAX health
        const tempCharForStatCalc = { ...charBeforeUpdate, ...finalUpdates }; // Merge current changes
        const statsAfterLevelUp = calculateEffectiveStats(tempCharForStatCalc);
        finalUpdates.currentHealth = statsAfterLevelUp.maxHealth; // Set current health to the NEW max health
        // ---------------------------

        // Update temps for next loop iteration
        tempLevel = newLevel;
        currentLevelXP = remainingXP;
        xpNeeded = calculateXPToNextLevel(newLevel);
        console.log(
          `Level Up! Reached level ${newLevel}. BaseMaxHealth: ${newBaseMaxHealth}`
        ); // Update log
      }

      // Potion Drop
      let currentPotions =
        finalUpdates.healthPotions ?? charBeforeUpdate.healthPotions;
      if (Math.random() < 0.1) {
        currentPotions += 1;
        potionDropped = true;
        finalUpdates.healthPotions = currentPotions;
        console.log("Potion dropped! Current potions:", currentPotions);
      }

      // Apply updates if any changes occurred
      if (Object.keys(finalUpdates).length > 0) {
        updateCharacterStore(finalUpdates);
        setTimeout(() => saveCharacterStore(), 50);
      }

      // Potion Message Handling
      if (potionDropped) {
        displayTemporaryMessage(
          <span className="text-green-400">Encontrou uma Poção de Vida!</span>,
          1500 // Optional: specify duration
        );
      }

      // Item Drop Logic - Moved back here
      const dropChance = 0.3;
      if (Math.random() < dropChance) {
        const droppedItem = generateDrop(enemyLevel);
        if (droppedItem) {
          handleItemDropped(droppedItem); // Call hook's handler
        }
      }
    },
    [
      updateCharacterStore,
      saveCharacterStore,
      displayPersistentMessage,
      displayTemporaryMessage,
      handleItemDropped,
    ]
  );

  // --- UPDATE triggerConfirmDiscard to pass item ---
  const triggerConfirmDiscard = () => {
    if (itemToDiscard) {
      console.log(
        "[WorldMapPage] Calling handleConfirmDiscard from hook with item:",
        itemToDiscard.name
      );
      handleConfirmDiscard(itemToDiscard); // Pass the item from page state
    } else {
      console.error(
        "[WorldMapPage] triggerConfirmDiscard called but itemToDiscard is null."
      );
    }
  };
  // -----------------------------------------------

  // --- MOVED: Passive Regeneration Effect ---
  const regenerationTimerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (regenerationTimerRef.current) {
      clearInterval(regenerationTimerRef.current);
      regenerationTimerRef.current = null;
    }

    const regenRate = effectiveStats?.finalLifeRegenPerSecond ?? 0;
    const currentHp = activeCharacter?.currentHealth ?? 0;
    const maxHp = effectiveStats?.maxHealth ?? 0;

    if (regenRate > 0 && currentHp < maxHp && currentHp > 0) {
      regenerationTimerRef.current = setInterval(() => {
        const latestCharState = useCharacterStore.getState().activeCharacter;
        const latestStatsState = effectiveStats;

        if (
          !latestCharState ||
          !latestStatsState ||
          latestCharState.currentHealth <= 0 ||
          latestCharState.currentHealth >= latestStatsState.maxHealth
        ) {
          if (regenerationTimerRef.current) {
            clearInterval(regenerationTimerRef.current);
            regenerationTimerRef.current = null;
          }
          return;
        }

        const healAmount = Math.max(1, Math.floor(regenRate));
        handlePlayerHeal(healAmount);
      }, 1000);
    }

    return () => {
      if (regenerationTimerRef.current) {
        clearInterval(regenerationTimerRef.current);
        regenerationTimerRef.current = null;
      }
    };
  }, [
    activeCharacter?.currentHealth,
    effectiveStats,
    activeCharacter,
    handlePlayerHeal,
    currentView,
  ]);

  // --- Effect to clear Low Health warning when health recovers ---
  useEffect(() => {
    if (!activeCharacter || !effectiveStats) return; // Need character and stats

    const healthPercentage =
      (activeCharacter.currentHealth / effectiveStats.maxHealth) * 100;

    // Check if health is no longer low AND the current message is the low health warning
    // Type-safe check for the specific React element structure
    let isLowHealthWarningVisible = false;
    if (
      React.isValidElement(textBoxContent) &&
      typeof textBoxContent.type === "string" &&
      textBoxContent.type === "span" && // Check if it's specifically a span
      textBoxContent.props && // Check if props exist
      typeof textBoxContent.props === "object" && // Check if props is an object
      "children" in textBoxContent.props && // Check if children prop exists
      // Update the text check here
      textBoxContent.props.children === "Vida Baixa! Use uma poção!"
    ) {
      isLowHealthWarningVisible = true;
    }

    if (healthPercentage >= 30 && isLowHealthWarningVisible) {
      console.log(
        "[Effect Health Check] Health recovered, clearing low health warning."
      );
      // Determine the correct persistent message to restore
      let persistentMessageToShow: React.ReactNode = "Mapa - Ato 1"; // Default
      if (currentView === "areaView" && currentArea) {
        persistentMessageToShow = currentArea.description;
      }
      displayPersistentMessage(persistentMessageToShow);
    }
  }, [
    activeCharacter?.currentHealth, // Trigger on health change
    effectiveStats?.maxHealth, // Needed for calculation
    textBoxContent, // Needed to check current message
    currentView, // Needed to determine correct persistent message
    currentArea, // Needed for area description
    displayPersistentMessage, // Action to revert message
  ]);

  // --- Loading / Error Checks ---
  if (!activeCharacter) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        Loading Character...
      </div>
    );
  }
  // Keep the check for missing area data if view is areaView
  if (!currentArea && currentView === "areaView") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        Error: Current area data not found.{" "}
        <button onClick={() => handleReturnToMap()}>Return to Map</button>
      </div>
    );
  }

  const xpToNextLevel = calculateXPToNextLevel(activeCharacter.level); // Use non-null char

  // --- Render JSX ---
  return (
    <div className="p-4 bg-black min-h-screen">
      <div className="flex flex-col md:flex-row min-h-[calc(100vh-2rem)] bg-black text-white gap-x-2">
        {/* Left Section */}
        <div className="flex flex-col w-full md:w-2/3">
          {currentView === "worldMap" ? (
            <MapArea
              character={activeCharacter}
              locations={act1Locations}
              onHoverLocation={handleMouseEnterLocation}
              onLeaveLocation={handleMouseLeaveLocation}
              onBackClick={handleBackToCharacters}
              onAreaClick={handleTravel}
              onCurrentAreaClick={handleReEnterAreaView}
              isTraveling={isTraveling}
              travelProgress={travelProgress}
              travelTargetAreaId={travelTargetAreaId}
            />
          ) : (
            <AreaView
              character={activeCharacter}
              area={currentArea}
              effectiveStats={effectiveStats}
              onReturnToMap={handleReturnToMap}
              onTakeDamage={(damage, type) =>
                handlePlayerTakeDamage(damage, type)
              }
              onEnemyKilled={handleEnemyKilled}
              xpToNextLevel={xpToNextLevel}
              pendingDropCount={itemsToShowInModal.length}
              onOpenDropModalForViewing={handleOpenPendingDropsModal}
            />
          )}
          {/* Text Box Area */}
          <div className="h-[100px] md:h-[150px] border border-white p-1 bg-black mt-2">
            <div className="ring-1 ring-inset ring-white ring-offset-1 ring-offset-black h-full w-full p-3 font-sans overflow-y-auto">
              {textBoxContent}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-full md:w-1/3 flex flex-col">
          <div className="h-full flex flex-col">
            <InventoryDisplay onOpenInventory={handleOpenInventory} />
            <div className="mt-2">
              <CharacterStats
                xpToNextLevel={xpToNextLevel}
                totalStrength={totalStrength}
                totalDexterity={totalDexterity}
                totalIntelligence={totalIntelligence}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modals (Use placeholder state/handlers) */}
      <ItemDropModal
        isOpen={isDropModalOpen}
        onClose={handleCloseDropModal}
        onEquip={handleEquipItem}
        onPickUpItem={handlePickUpItem}
        onDiscardItem={handleDiscardItemFromDrop}
        onPickUpAll={handlePickUpAll}
        onDiscardAll={handleDiscardAllFromDrop}
        droppedItems={itemsToShowInModal}
      />
      <InventoryModal
        isOpen={isInventoryOpen}
        onClose={handleCloseInventory}
        handleEquipItem={handleEquipItem}
        handleOpenDiscardConfirm={handleOpenDiscardConfirm}
        handleSwapWeapons={handleSwapWeapons}
        handleUnequipItem={handleUnequipItem}
      />
      <ConfirmationModal
        isOpen={isConfirmDiscardOpen}
        onClose={handleCloseDiscardConfirm}
        onConfirm={triggerConfirmDiscard}
        title="Descartar Item?"
        message={`Tem certeza que deseja descartar ${
          itemToDiscard?.name ?? "este item"
        } permanentemente?`}
      />
      <PendingDropsModal
        isOpen={isPendingDropsModalOpen}
        onClose={handleClosePendingDropsModal}
        pendingItems={itemsToShowInModal}
      />

      {/* --- NEW: Requirement Failure Modal --- */}
      <Modal
        isOpen={isRequirementFailModalOpen}
        onClose={handleCloseRequirementFailModal}
        title="Requisitos Não Atendidos"
        actions={<Button onClick={handleCloseRequirementFailModal}>Ok</Button>}
      >
        {itemFailedRequirements && activeCharacter && (
          <div className="my-4 text-center">
            <p className="mb-2">
              Você não atende aos requisitos para equipar &quot;
              {itemFailedRequirements.name}&quot;:
            </p>
            <ul className="list-disc list-inside text-left inline-block text-red-400">
              {itemFailedRequirements.requirements?.level &&
                activeCharacter.level <
                  itemFailedRequirements.requirements.level && (
                  <li>
                    Nível {itemFailedRequirements.requirements.level} (Você tem{" "}
                    {activeCharacter.level})
                  </li>
                )}
              {itemFailedRequirements.requirements?.strength &&
                totalStrength <
                  itemFailedRequirements.requirements.strength && (
                  <li>
                    Força {itemFailedRequirements.requirements.strength} (Você
                    tem {totalStrength})
                  </li>
                )}
              {itemFailedRequirements.requirements?.dexterity &&
                totalDexterity <
                  itemFailedRequirements.requirements.dexterity && (
                  <li>
                    Destreza {itemFailedRequirements.requirements.dexterity}{" "}
                    (Você tem {totalDexterity})
                  </li>
                )}
              {itemFailedRequirements.requirements?.intelligence &&
                totalIntelligence <
                  itemFailedRequirements.requirements.intelligence && (
                  <li>
                    Inteligência{" "}
                    {itemFailedRequirements.requirements.intelligence} (Você tem{" "}
                    {totalIntelligence})
                  </li>
                )}
            </ul>
          </div>
        )}
      </Modal>
      {/* ------------------------------------- */}
    </div>
  );
}
