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
import {
  calculateTotalStrength,
  calculateTotalDexterity,
  calculateTotalIntelligence,
} from "../../utils/statUtils";
import { useCharacterStore } from "../../stores/characterStore";
import { useInventoryManager } from "../../hooks/useInventoryManager";

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

  // --- Local State (to keep for now) ---
  const [textBoxContent, setTextBoxContent] = useState<React.ReactNode>("...");
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
  const messageTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- Use the Inventory Manager Hook ---
  const {
    isDropModalOpen,
    itemsToShowInModal,
    isInventoryOpen,
    isConfirmDiscardOpen,
    itemToDiscard,
    handleOpenDropModalForCollection,
    handleCloseDropModal,
    handleDiscardItemFromDrop,
    handleDiscardAllFromDrop,
    clearPendingDrops,
    handleOpenInventory,
    handleCloseInventory,
    handleOpenDiscardConfirm,
    handleCloseDiscardConfirm,
    handleConfirmDiscard,
    handlePickUpItem,
    handlePickUpAll,
    handleEquipItem,
    handleItemDropped,
    isPendingDropsModalOpen,
    handleOpenPendingDropsModal,
    handleClosePendingDropsModal,
  } = useInventoryManager({
    activeCharacter,
    updateCharacter: updateCharacterStore,
    saveUpdatedCharacter: saveCharacterStore,
    setTextBoxContent,
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

  // --- Update Initial Load useEffect ---
  useEffect(() => {
    let isMounted = true; // Flag to prevent state update on unmounted component
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

      // Set character in Zustand store
      if (isMounted) {
        setActiveCharacterStore(char);

        const areaData = act1Locations.find(
          (loc) => loc.id === char.currentAreaId
        );
        if (areaData) {
          setCurrentArea(areaData);
          setCurrentView("worldMap");
          setTextBoxContent("...");
        } else {
          console.error(`Area data NOT found for ID: ${char.currentAreaId}.`);
          setCurrentArea(null);
          setCurrentView("worldMap");
          setTextBoxContent("...");
        }
      }
    } catch (error) {
      console.error("Error in initial load useEffect:", error);
      // Potentially redirect on generic error too
      // router.push("/characters");
    }

    // Cleanup function
    return () => {
      isMounted = false; // Prevent state updates after unmount
      if (travelTimerRef.current) {
        clearInterval(travelTimerRef.current);
      }
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
    };
  }, [router, setActiveCharacterStore]); // Dependency array updated

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
      setCurrentArea(area);
      setCurrentView("areaView");
      setTextBoxContent(area.description);
    },
    [] // No dependency on activeCharacter prop anymore
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
      setTextBoxContent(`Viajando para ${targetLocation.name}...`);
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

          // Update character in store and save
          updateCharacterStore({ currentAreaId: finalTargetId });
          setTimeout(() => saveCharacterStore(), 50);

          handleEnterAreaView(finalNewLocation);

          // Reset local travel state
          setIsTraveling(false);
          setTravelProgress(0);
          setTravelTargetAreaId(null);
          travelTargetIdRef.current = null;
          travelStartTimeRef.current = null;
          setTextBoxContent("...");

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
      // Open modal for COLLECTION when returning to map
      handleOpenDropModalForCollection();
    },
    [itemsToShowInModal, handleOpenDropModalForCollection]
  );

  const handleReEnterAreaView = useCallback(() => {
    const currentChar = useCharacterStore.getState().activeCharacter;
    if (!isTraveling && currentChar) {
      const currentLoc = act1Locations.find(
        (loc) => loc.id === currentChar.currentAreaId
      );
      if (currentLoc) {
        handleEnterAreaView(currentLoc); // Reuse enter logic
      }
    }
  }, [isTraveling, handleEnterAreaView]); // Dependency updated

  const handleMouseEnterLocation = useCallback(
    (description: string) => {
      if (currentView === "worldMap" && !isTraveling)
        setTextBoxContent(description);
    },
    [currentView, isTraveling]
  );

  const handleMouseLeaveLocation = useCallback(() => {
    if (currentView === "worldMap" && !isTraveling) setTextBoxContent("...");
  }, [currentView, isTraveling]);

  const handleBackToCharacters = useCallback(() => {
    router.push("/characters");
  }, [router]);

  const handlePlayerTakeDamage = useCallback(
    (damage: number) => {
      const currentChar = useCharacterStore.getState().activeCharacter;
      if (!currentChar) return;

      const mitigatedDamage = Math.max(1, Math.round(damage)); // TODO: Use armor/resists
      const newHealth = Math.max(
        0,
        currentChar.currentHealth - mitigatedDamage
      );
      let updates: Partial<Character> = { currentHealth: newHealth };

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
        setTextBoxContent(
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
      updateCharacterStore,
      saveCharacterStore,
      setTextBoxContent,
      clearPendingDrops,
    ]
  );

  const handlePlayerUsePotion = useCallback(() => {
    const currentChar = useCharacterStore.getState().activeCharacter;
    if (
      !currentChar ||
      currentChar.healthPotions <= 0 ||
      currentChar.currentHealth >= currentChar.maxHealth
    ) {
      return;
    }
    const healAmount = Math.floor(currentChar.maxHealth * 0.25);
    const newHealth = Math.min(
      currentChar.maxHealth,
      currentChar.currentHealth + healAmount
    );
    const newPotionCount = currentChar.healthPotions - 1;

    updateCharacterStore({
      currentHealth: newHealth,
      healthPotions: newPotionCount,
    });
    setTimeout(() => saveCharacterStore(), 50);
  }, [updateCharacterStore, saveCharacterStore]);

  // --- Update handlePlayerHeal ---
  const handlePlayerHeal = useCallback(
    (healAmount: number) => {
      const currentChar = useCharacterStore.getState().activeCharacter;
      if (!currentChar || healAmount <= 0) return;

      const newHealth = Math.min(
        currentChar.maxHealth,
        currentChar.currentHealth + healAmount
      );

      if (newHealth !== currentChar.currentHealth) {
        updateCharacterStore({ currentHealth: newHealth });
        setTimeout(() => saveCharacterStore(), 50);
      }
    },
    [updateCharacterStore, saveCharacterStore]
  );

  // --- Update handleEnemyKilled ---
  const handleEnemyKilled = useCallback(
    (enemyTypeId: string, enemyLevel: number) => {
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

      // Check if XP changed
      if (xpGained > 0) {
        finalUpdates.currentXP = charBeforeUpdate.currentXP + xpGained;
      }
      let currentLevelXP = finalUpdates.currentXP ?? charBeforeUpdate.currentXP;

      // Level Up Logic
      let tempLevel = charBeforeUpdate.level;
      let tempMaxHealth = charBeforeUpdate.maxHealth; // Start with potentially modified max health
      let tempArmor = charBeforeUpdate.armor;
      let xpNeeded = calculateXPToNextLevel(tempLevel);

      while (currentLevelXP >= xpNeeded && tempLevel < 100) {
        const newLevel = tempLevel + 1;
        const remainingXP = currentLevelXP - xpNeeded;
        const hpGain = 10;
        const defenseGain = 1;
        // Need to recalculate total strength to accurately calculate new max health if base health changes
        // This adds complexity - simpler to just add flat HP gain for now.
        const newMaxHealthWithGain = tempMaxHealth + hpGain;

        finalUpdates = {
          ...finalUpdates,
          level: newLevel,
          currentXP: remainingXP,
          maxHealth: newMaxHealthWithGain,
          armor: tempArmor + defenseGain,
          currentHealth: newMaxHealthWithGain, // Full heal
        };
        // Update temps for next loop iteration
        tempLevel = newLevel;
        currentLevelXP = remainingXP;
        tempMaxHealth = newMaxHealthWithGain;
        tempArmor = finalUpdates.armor ?? tempArmor;
        xpNeeded = calculateXPToNextLevel(newLevel);
        console.log(`Level Up! Reached level ${newLevel}.`);
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
        if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
        setTextBoxContent(
          <span className="text-green-400">Encontrou uma Poção de Vida!</span>
        );
        messageTimeoutRef.current = setTimeout(() => {
          setTextBoxContent("...");
          messageTimeoutRef.current = null;
        }, 1000);
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
      setTextBoxContent,
      handleItemDropped,
    ]
  );

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

  // --- Update JSX to use store state and remove props ---
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
              onReturnToMap={handleReturnToMap}
              onTakeDamage={handlePlayerTakeDamage}
              onUsePotion={handlePlayerUsePotion}
              onEnemyKilled={handleEnemyKilled}
              onPlayerHeal={handlePlayerHeal}
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
        onEquipItem={handleEquipItem}
        onOpenDiscardConfirm={handleOpenDiscardConfirm}
      />
      <ConfirmationModal
        isOpen={isConfirmDiscardOpen}
        onClose={handleCloseDiscardConfirm}
        onConfirm={handleConfirmDiscard}
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
    </div>
  );
}
