"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
  saveCharacters,
  loadOverallData,
  saveOverallData,
} from "../../utils/localStorage";
import { useInventoryManager } from "../../hooks/useInventoryManager";
import CharacterStats from "../../components/CharacterStats";
import MapArea from "../../components/MapArea";
import InventoryDisplay from "../../components/InventoryDisplay";
import AreaView from "../../components/AreaView";
import { generateDrop } from "../../utils/itemUtils";
import ItemDropModal from "../../components/ItemDropModal";
import InventoryModal from "../../components/InventoryModal";
import ConfirmationModal from "../../components/ConfirmationModal";

// Restore constants and helpers
const BASE_TRAVEL_TIME_MS = 5000;
const MIN_TRAVEL_TIME_MS = 500;
const calculateXPToNextLevel = (level: number): number => {
  return Math.floor(100 * Math.pow(1.15, level - 1));
};

export default function WorldMapPage() {
  const router = useRouter();
  // Keep all state variables restored
  const [activeCharacter, setActiveCharacter] = useState<Character | null>(
    null
  );
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
  const [areaRunDrops, setAreaRunDrops] = useState<EquippableItem[]>([]);

  // --- Define saveUpdatedCharacter FIRST ---
  const saveUpdatedCharacter = useCallback((updatedChar: Character) => {
    const allCharacters = loadCharacters();
    const charIndex = allCharacters.findIndex((c) => c.id === updatedChar.id);
    if (charIndex !== -1) {
      allCharacters[charIndex] = updatedChar;
      saveCharacters(allCharacters);
      console.log(`Character ${updatedChar.name} saved.`);
    } else {
      console.error("Could not find character in list to save update.");
    }
  }, []);

  // --- Initialize the Inventory Manager Hook (AFTER saveUpdatedCharacter) ---
  const {
    // States from hook
    isDropModalOpen,
    itemsToShowInModal,
    isInventoryOpen,
    isConfirmDiscardOpen,
    itemToDiscard, // Get itemToDiscard for ConfirmationModal

    // Handlers from hook
    handleOpenDropModal,
    handleDiscardItemFromDrop,
    handleDiscardAllFromDrop,
    handleOpenInventory,
    handleCloseInventory,
    handleOpenDiscardConfirm,
    handleCloseDiscardConfirm,
    handleConfirmDiscard,
    handlePickUpItem,
    handlePickUpAll,
    handleEquipItem,
  } = useInventoryManager({
    activeCharacter,
    setActiveCharacter,
    saveUpdatedCharacter, // Pass the defined function
    setTextBoxContent,
  });

  // Keep full initial useEffect logic
  useEffect(() => {
    try {
      console.log("[WorldMap Init - Handlers Restored] useEffect running..."); // Update tag
      const charIdStr = localStorage.getItem("selectedCharacterId");
      console.log(
        "[WorldMap Init - Handlers Restored] localStorage selectedCharacterId:",
        charIdStr
      );

      if (!charIdStr) {
        console.log(
          "[WorldMap Init - Handlers Restored] No ID found, redirecting..."
        );
        router.push("/characters");
        return;
      }

      const charId = parseInt(charIdStr, 10);
      if (isNaN(charId)) {
        console.error(
          "[WorldMap Init - Handlers Restored] Failed to parse character ID:",
          charIdStr,
          "Redirecting..."
        );
        router.push("/characters");
        return;
      }
      console.log(
        "[WorldMap Init - Handlers Restored] Parsed Character ID:",
        charId
      );

      let characters: Character[];
      try {
        characters = loadCharacters();
        console.log(
          `[WorldMap Init - Handlers Restored] Loaded ${characters.length} characters.`
        );
      } catch (error) {
        console.error(
          "[WorldMap Init - Handlers Restored] Error loading characters:",
          error
        );
        router.push("/characters");
        return;
      }

      const char = characters.find((c) => c.id === charId);

      if (!char) {
        console.error(
          "[WorldMap Init - Handlers Restored] Character not found for ID:",
          charId,
          "Redirecting..."
        );
        router.push("/characters");
        return;
      }
      console.log(
        "[WorldMap Init - Handlers Restored] Character found:",
        char.name,
        "(ID:",
        char.id,
        ")"
      );

      // Save last played ID
      try {
        const overallData = loadOverallData();
        if (overallData.lastPlayedCharacterId !== char.id) {
          console.log(
            `[WorldMap Init - Handlers Restored] Updating lastPlayedCharacterId to ${char.id}`
          );
          saveOverallData({ ...overallData, lastPlayedCharacterId: char.id });
        } else {
          console.log(
            "[WorldMap Init - Handlers Restored] lastPlayedCharacterId already up-to-date."
          );
        }
      } catch (error) {
        console.error(
          "[WorldMap Init - Handlers Restored] Error saving last played character ID:",
          error
        );
      }

      console.log(
        "[WorldMap Init - Handlers Restored] Setting active character state..."
      );
      setActiveCharacter(char);

      console.log(
        "[WorldMap Init - Handlers Restored] Finding area data for ID:",
        char.currentAreaId
      );
      // Use act1Locations here
      const areaData = act1Locations.find(
        (loc) => loc.id === char.currentAreaId
      );

      if (areaData) {
        console.log(
          "[WorldMap Init - Handlers Restored] Area data found:",
          areaData.name
        );
        console.log(
          "[WorldMap Init - Handlers Restored] Setting currentArea and currentView states..."
        );
        setCurrentArea(areaData);
        setCurrentView("worldMap");
        setTextBoxContent("...");
      } else {
        console.error(
          `[WorldMap Init - Handlers Restored] Area data NOT found for ID: ${char.currentAreaId}. Defaulting to map view.`
        );
        setCurrentArea(null);
        setCurrentView("worldMap");
        setTextBoxContent("...");
      }
      console.log(
        "[WorldMap Init - Handlers Restored] useEffect finished successfully."
      );
    } catch (error) {
      console.error(
        "[WorldMap Init - Handlers Restored] UNEXPECTED ERROR in useEffect:",
        error
      );
    }
  }, [router]);

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
    (area: MapLocation, characterData: Character) => {
      console.log(
        `Entering Area View for: ${area.name} | Character: ${characterData.name}`
      );
      setCurrentArea(area);
      if (
        activeCharacter?.id !== characterData.id ||
        activeCharacter?.level !== characterData.level ||
        activeCharacter?.currentXP !== characterData.currentXP
      ) {
        setActiveCharacter(characterData);
      }
      setCurrentView("areaView");
      setTextBoxContent(area.description);
    },
    [activeCharacter]
  ); // Added activeCharacter dependency

  const handleTravel = useCallback(
    (targetAreaId: string) => {
      if (
        isTraveling ||
        !activeCharacter ||
        activeCharacter.currentAreaId === targetAreaId
      ) {
        return;
      }
      const travelDuration = calculateTravelTime(
        BASE_TRAVEL_TIME_MS,
        activeCharacter.movementSpeed
      );
      const targetLocation = act1Locations.find(
        (loc) => loc.id === targetAreaId
      );
      if (!targetLocation) return;
      console.log(
        `Starting travel to ${targetAreaId}, duration: ${travelDuration}ms`
      );
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
          clearInterval(travelTimerRef.current!);
          travelTimerRef.current = null;
          const finalTargetId = travelTargetIdRef.current;
          if (!finalTargetId) {
            /* error handling */ setIsTraveling(false);
            return;
          }
          const finalNewLocation = act1Locations.find(
            (loc) => loc.id === finalTargetId
          );
          if (!finalNewLocation) {
            /* error handling */ setIsTraveling(false);
            return;
          }

          setActiveCharacter((prevChar) => {
            if (!prevChar) return prevChar;
            const updatedChar = { ...prevChar, currentAreaId: finalTargetId };
            saveUpdatedCharacter(updatedChar);
            handleEnterAreaView(finalNewLocation, updatedChar);
            return updatedChar;
          });

          setIsTraveling(false);
          setTravelProgress(0);
          setTravelTargetAreaId(null);
          travelTargetIdRef.current = null;
          travelStartTimeRef.current = null;
          setTextBoxContent("...");
        }
      }, 50);
    },
    [isTraveling, activeCharacter, saveUpdatedCharacter, handleEnterAreaView]
  );

  const handleReturnToMap = useCallback(
    (enemiesKilled?: number) => {
      console.log(
        `Returned to map. Enemies killed: ${enemiesKilled}, Drops: ${areaRunDrops.length}`
      );
      setCurrentView("worldMap");
      setCurrentArea(null);
      handleOpenDropModal(areaRunDrops);
      setAreaRunDrops([]);
    },
    [areaRunDrops, handleOpenDropModal]
  );

  const handleReEnterAreaView = useCallback(() => {
    if (!isTraveling && activeCharacter) {
      const currentLoc = act1Locations.find(
        (loc) => loc.id === activeCharacter.currentAreaId
      );
      if (currentLoc) {
        setCurrentArea(currentLoc);
        setTextBoxContent(currentLoc.description);
        setCurrentView("areaView");
      }
    }
  }, [isTraveling, activeCharacter]);

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
      setActiveCharacter((prevChar) => {
        if (!prevChar) return prevChar;
        const mitigatedDamage = Math.max(1, Math.round(damage));
        const newHealth = Math.max(0, prevChar.currentHealth - mitigatedDamage);
        let updatedChar = { ...prevChar, currentHealth: newHealth };
        if (newHealth === 0) {
          console.log("Player died!");
          const xpPenalty = Math.floor(prevChar.currentXP * 0.1);
          const newXP = Math.max(0, prevChar.currentXP - xpPenalty);
          updatedChar = {
            ...prevChar,
            currentHealth: prevChar.maxHealth,
            currentAreaId: "cidade_principal",
            currentXP: newXP,
          };
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
        }
        saveUpdatedCharacter(updatedChar);
        return updatedChar;
      });
    },
    [saveUpdatedCharacter]
  );

  const handlePlayerUsePotion = useCallback(() => {
    setActiveCharacter((prevChar) => {
      if (
        !prevChar ||
        prevChar.healthPotions <= 0 ||
        prevChar.currentHealth >= prevChar.maxHealth
      )
        return prevChar;
      const healAmount = Math.floor(prevChar.maxHealth * 0.25);
      const newHealth = Math.min(
        prevChar.maxHealth,
        prevChar.currentHealth + healAmount
      );
      const newPotionCount = prevChar.healthPotions - 1;
      const updatedChar = {
        ...prevChar,
        currentHealth: newHealth,
        healthPotions: newPotionCount,
      };
      saveUpdatedCharacter(updatedChar);
      return updatedChar;
    });
  }, [saveUpdatedCharacter]);

  const handleEnemyKilled = useCallback(
    (enemyTypeId: string, enemyLevel: number) => {
      setActiveCharacter((prevChar) => {
        if (!prevChar) return prevChar;
        const enemyType = enemyTypes.find((t) => t.id === enemyTypeId);
        const xpGain = enemyType?.baseXP ?? 5;
        let newXP = prevChar.currentXP + xpGain;
        let xpNeeded = calculateXPToNextLevel(prevChar.level);
        let updatedChar = { ...prevChar, currentXP: newXP };

        // Accumulate gains if multiple levels are achieved
        const accumulatedStatGains = { maxHp: 0, attack: 0, defense: 0 };

        while (newXP >= xpNeeded && updatedChar.level < 100) {
          const newLevel = updatedChar.level + 1;
          const remainingXP = newXP - xpNeeded;

          // Define stat gains per level (example values)
          const hpGain = 10;
          const attackGain = 2;
          const defenseGain = 1;

          accumulatedStatGains.maxHp += hpGain;
          accumulatedStatGains.attack += attackGain;
          accumulatedStatGains.defense += defenseGain;

          // Apply accumulated stats
          updatedChar = {
            ...updatedChar,
            level: newLevel,
            currentXP: remainingXP,
            // Apply base stat updates plus accumulated gains
            maxHealth: updatedChar.maxHealth + hpGain,
            armor: updatedChar.armor + defenseGain,
            // Reset currentHealth to new maxHealth on level up
            currentHealth: updatedChar.maxHealth + hpGain,
          };

          // Update loop variables
          newXP = remainingXP;
          xpNeeded = calculateXPToNextLevel(newLevel);
          console.log(`Level Up! Reached level ${newLevel}.`);
        }

        // Only save if the character actually changed (level up or just XP gain)
        if (
          updatedChar.currentXP !== prevChar.currentXP ||
          updatedChar.level !== prevChar.level
        ) {
          saveUpdatedCharacter(updatedChar);
        }
        return updatedChar;
      });

      // --- Item Drop Logic (Accumulate Only) ---
      const dropChance = 0.3; // Example drop chance
      if (Math.random() < dropChance) {
        const droppedItem = generateDrop(enemyLevel);
        if (droppedItem) {
          setAreaRunDrops((prevDrops) => [...prevDrops, droppedItem]);
        }
      }
    },
    [setActiveCharacter, saveUpdatedCharacter]
  );

  // Keep loading check
  if (!activeCharacter) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        Loading... (Fully Restored)
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

  const xpToNextLevel = calculateXPToNextLevel(activeCharacter?.level ?? 1);

  // Restore full JSX structure
  return (
    <div className="p-4 bg-black min-h-screen">
      <div className="flex flex-col md:flex-row min-h-[calc(100vh-2rem)] bg-black text-white gap-x-2">
        {/* Left Section (Map/Area View + Text Box) */}
        <div className="flex flex-col w-full md:w-2/3">
          {currentView === "worldMap" ? (
            <MapArea
              character={activeCharacter}
              locations={act1Locations}
              onHoverLocation={handleMouseEnterLocation}
              onLeaveLocation={handleMouseLeaveLocation}
              onBackClick={handleBackToCharacters}
              onAreaClick={handleTravel} // Use handleTravel for area clicks
              onCurrentAreaClick={handleReEnterAreaView} // Handle clicking the current area
              isTraveling={isTraveling}
              travelProgress={travelProgress}
              travelTargetAreaId={travelTargetAreaId}
            />
          ) : (
            <AreaView
              character={activeCharacter}
              area={currentArea}
              onReturnToMap={(kills: number | undefined) =>
                handleReturnToMap(kills)
              }
              onTakeDamage={handlePlayerTakeDamage}
              onUsePotion={handlePlayerUsePotion}
              onEnemyKilled={handleEnemyKilled}
              xpToNextLevel={xpToNextLevel}
            />
          )}

          {/* Text Box Area */}
          <div className="h-[100px] md:h-[150px] border border-white p-1 bg-black mt-2">
            <div className="ring-1 ring-inset ring-white ring-offset-1 ring-offset-black h-full w-full p-3 font-sans overflow-y-auto">
              {textBoxContent}
            </div>
          </div>
        </div>

        {/* Right Sidebar (Inventory + Stats) */}
        <div className="w-full md:w-1/3 flex flex-col">
          <div className="h-full flex flex-col">
            <InventoryDisplay
              equipment={activeCharacter?.equipment || null}
              onOpenInventory={handleOpenInventory}
            />
            <div className="mt-2">
              {activeCharacter && (
                <CharacterStats
                  character={activeCharacter}
                  xpToNextLevel={xpToNextLevel}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Drop Modal */}
      <ItemDropModal
        isOpen={isDropModalOpen}
        onClose={handleDiscardAllFromDrop}
        onEquip={handleEquipItem}
        onPickUpItem={handlePickUpItem}
        onDiscardItem={handleDiscardItemFromDrop}
        onPickUpAll={handlePickUpAll}
        droppedItems={itemsToShowInModal}
      />

      {/* Inventory Modal */}
      <InventoryModal
        isOpen={isInventoryOpen}
        onClose={handleCloseInventory}
        inventory={activeCharacter?.inventory || []}
        onEquipItem={handleEquipItem}
        onOpenDiscardConfirm={handleOpenDiscardConfirm}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmDiscardOpen}
        onClose={handleCloseDiscardConfirm}
        onConfirm={handleConfirmDiscard}
        title="Descartar Item?"
        message={`Tem certeza que deseja descartar ${
          itemToDiscard?.name ?? "este item"
        } permanentemente? Esta ação não pode ser desfeita.`}
      />
    </div>
  );
}
