"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
// Remove map-specific icons from here
// import { FaHome, FaMapMarkerAlt, FaArrowLeft } from "react-icons/fa";
import {
  Character,
  MapLocation,
  act1Locations,
  enemyTypes,
} from "../../types/gameData";
import {
  loadCharacters,
  saveCharacters,
  loadOverallData,
  saveOverallData,
} from "../../utils/localStorage";
// import { createCharacter } from "../../utils/characterUtils";
import CharacterStats from "../../components/CharacterStats";
// Import MapArea component
import MapArea from "../../components/MapArea";
// Import location data
import InventoryPlaceholder from "../../components/InventoryPlaceholder";
// Import AreaView
import AreaView from "../../components/AreaView";

// Restore constants
const BASE_TRAVEL_TIME_MS = 5000;
const MIN_TRAVEL_TIME_MS = 500;

// Rename XP Calculation function
const calculateXPToNextLevel = (level: number): number => {
  return Math.floor(100 * Math.pow(1.15, level - 1));
};

export default function WorldMapPage() {
  const router = useRouter();
  const [textBoxContent, setTextBoxContent] = useState("...");
  const [activeCharacter, setActiveCharacter] = useState<Character | null>(
    null
  );
  const [currentArea, setCurrentArea] = useState<MapLocation | null>(null);
  const [currentView, setCurrentView] = useState<"worldMap" | "areaView">(
    "worldMap"
  );

  // Restore Travel State
  const [isTraveling, setIsTraveling] = useState(false);
  const [travelProgress, setTravelProgress] = useState(0);
  const [travelTargetAreaId, setTravelTargetAreaId] = useState<string | null>(
    null
  );
  const travelTimerRef = useRef<NodeJS.Timeout | null>(null);
  const travelStartTimeRef = useRef<number | null>(null);
  const travelTargetIdRef = useRef<string | null>(null); // Ref for target ID

  // --- Save Character Helper ---
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

  // Load character and set initial view
  useEffect(() => {
    const charIdStr = localStorage.getItem("selectedCharacterId");
    console.log("[Load Check] localStorage selectedCharacterId:", charIdStr);
    if (!charIdStr) {
      console.log("[Load Check] No ID found, redirecting...");
      router.push("/characters");
      return;
    }
    const charId = parseInt(charIdStr, 10);
    if (isNaN(charId)) {
      console.error("[Load Check] Failed to parse character ID:", charIdStr);
      router.push("/characters");
      return;
    }
    console.log("[Load Check] Attempting load for ID:", charId);
    const characters = loadCharacters();
    // console.log("[Load Check] Loaded characters:", characters); // Avoid logging potentially large array
    const char = characters.find((c) => c.id === charId);

    if (!char) {
      console.error(
        "[Load Check] Character not found for ID:",
        charId,
        "Redirecting..."
      );
      router.push("/characters");
      return;
    }
    console.log("[Load Check] Character found:", char.name);

    // ---> SAVE LAST PLAYED ID HERE <-----
    try {
      const overallData = loadOverallData();
      if (overallData.lastPlayedCharacterId !== char.id) {
        console.log(
          `[Load Check] Updating lastPlayedCharacterId to ${char.id}`
        );
        saveOverallData({ ...overallData, lastPlayedCharacterId: char.id });
      }
    } catch (error) {
      console.error("Error saving last played character ID:", error);
    }
    // ---> END SAVE <-----

    setActiveCharacter(char);
    console.log("[Load Check] Searching for area ID:", char.currentAreaId);
    const areaData = act1Locations.find((loc) => loc.id === char.currentAreaId);
    if (areaData) {
      console.log("[Load Check] Area data found:", areaData.name);
      setCurrentArea(areaData);
      setCurrentView("worldMap");
      setTextBoxContent("...");
    } else {
      console.error(
        `[Load Check] Area data not found for ID: ${char.currentAreaId}, falling back to map.`
      );
      setCurrentView("worldMap");
      setCurrentArea(null); // Explicitly set null if area not found
      setTextBoxContent("...");
      // NOTE: Not redirecting here, but map might fail later if currentArea is needed
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // Restore timer cleanup
  useEffect(() => {
    return () => {
      if (travelTimerRef.current) {
        clearInterval(travelTimerRef.current);
      }
    };
  }, []);

  // Restore Travel Calculation
  const calculateTravelTime = (
    baseTime: number,
    movementSpeed: number
  ): number => {
    const speedMultiplier = 1 - movementSpeed / 100;
    const calculatedTime = baseTime * speedMultiplier;
    return Math.max(calculatedTime, MIN_TRAVEL_TIME_MS);
  };

  // Restore Initiate Travel function (will be called by map click)
  const handleTravel = (targetAreaId: string) => {
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
    const targetLocation = act1Locations.find((loc) => loc.id === targetAreaId);
    console.log(
      `Starting travel to ${targetAreaId}, duration: ${travelDuration}ms`
    );
    if (travelTimerRef.current) clearInterval(travelTimerRef.current);
    setTravelTargetAreaId(targetAreaId);
    setIsTraveling(true);
    setTravelProgress(0);
    travelStartTimeRef.current = Date.now();
    travelTargetIdRef.current = targetAreaId; // Set the ref before starting interval
    setTextBoxContent(
      `Viajando para ${targetLocation?.name ?? targetAreaId}...`
    );
    // Switch to map view immediately to show travel progress
    setCurrentView("worldMap");
    setCurrentArea(null);

    travelTimerRef.current = setInterval(() => {
      const startTime = travelStartTimeRef.current;
      if (!startTime) {
        console.warn("Travel interval running without start time.");
        return; // Exit if start time is missing
      }
      const elapsedTime = Date.now() - startTime;
      const progress = Math.min((elapsedTime / travelDuration) * 100, 100);
      setTravelProgress(progress);
      if (progress >= 100) {
        clearInterval(travelTimerRef.current!);
        travelTimerRef.current = null;
        // Get target ID from the ref
        const finalTargetId = travelTargetIdRef.current;
        if (!finalTargetId) {
          console.error("Travel finished but target ID ref was null!");
          setIsTraveling(false); // Still reset travel state
          setTravelProgress(0);
          setTravelTargetAreaId(null);
          travelStartTimeRef.current = null;
          setTextBoxContent("Error na chegada.");
          return;
        }
        const finalNewLocation = act1Locations.find(
          (loc) => loc.id === finalTargetId
        );

        setActiveCharacter((prevChar) => {
          if (!prevChar || !finalNewLocation) {
            console.error(
              "Missing data for arrival state update (using ref values)."
            );
            return prevChar;
          }
          // Use finalTargetId for the update
          const updatedChar = { ...prevChar, currentAreaId: finalTargetId };

          // Call save within the callback to use the most up-to-date character
          saveUpdatedCharacter(updatedChar);

          // Call handleEnterAreaView using finalNewLocation
          handleEnterAreaView(finalNewLocation, updatedChar);

          return updatedChar;
        });

        // Reset state AFTER initiating the character update
        setIsTraveling(false);
        setTravelProgress(0);
        setTravelTargetAreaId(null);
        travelTargetIdRef.current = null; // Clear the ref
        travelStartTimeRef.current = null;

        // Reset the textbox content upon arrival
        setTextBoxContent("...");
      }
    }, 50);
  };

  // --- View Change Handlers ---
  const handleReturnToMap = () => {
    setCurrentView("worldMap");
    setCurrentArea(null);
    setTextBoxContent("...");
  };

  const handleReEnterAreaView = () => {
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
  };

  // Handles entering AreaView (e.g., after travel)
  const handleEnterAreaView = (area: MapLocation, characterData: Character) => {
    console.log(
      `Entering Area View for: ${area.name} | Character: ${characterData.name}`
    ); // DEBUG LOG
    setCurrentArea(area);
    // Ensure active character is updated IF the characterData passed is different
    // This might happen if level up occurred during save callback
    if (
      activeCharacter?.id !== characterData.id ||
      activeCharacter?.level !== characterData.level ||
      activeCharacter?.currentXP !== characterData.currentXP
    ) {
      setActiveCharacter(characterData);
    }
    setCurrentView("areaView");
    setTextBoxContent(area.description);
  };

  // --- Event Handlers for Textbox ---
  const handleMouseEnterLocation = (description: string) => {
    if (currentView === "worldMap" && !isTraveling)
      setTextBoxContent(description);
  };
  const handleMouseLeaveLocation = () => {
    if (currentView === "worldMap" && !isTraveling) setTextBoxContent("...");
  };
  const handleBackToCharacters = () => {
    router.push("/characters");
  };

  // --- Combat Handlers wrapped in useCallback ---
  const handlePlayerTakeDamage = useCallback(
    (damage: number) => {
      setActiveCharacter((prevChar) => {
        if (!prevChar) return prevChar;
        const mitigatedDamage = Math.max(1, Math.round(damage));
        const newHealth = Math.max(0, prevChar.currentHealth - mitigatedDamage);
        console.log(
          `Player took ${mitigatedDamage} damage. New health: ${newHealth}`
        );
        let updatedChar = { ...prevChar, currentHealth: newHealth };
        if (newHealth === 0) {
          console.log("Player died!");
          // Calculate XP penalty (10% of current XP)
          const xpPenalty = Math.floor(prevChar.currentXP * 0.1);
          const newXP = Math.max(0, prevChar.currentXP - xpPenalty);
          updatedChar = {
            ...updatedChar,
            currentHealth: prevChar.maxHealth, // Restore full health
            currentAreaId: "cidade_principal", // Return to starting city
            currentXP: newXP,
            // Reset potions on death? Optional, keeping them for now.
            // healthPotions: 0,
          };
          setCurrentView("worldMap");
          setCurrentArea(
            act1Locations.find((loc) => loc.id === "cidade_principal") || null
          );
          setTextBoxContent(
            `Você morreu! Retornando para a cidade inicial. Perdeu ${xpPenalty} XP.`
          );
          // Clear travel state just in case player died during travel glitch
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
      ) {
        return prevChar;
      }
      const healAmount = Math.floor(prevChar.maxHealth * 0.25);
      const newHealth = Math.min(
        prevChar.maxHealth,
        prevChar.currentHealth + healAmount
      );
      const newPotionCount = prevChar.healthPotions - 1;
      console.log(
        `Used potion. Healed for ${healAmount}. New health: ${newHealth}. Potions left: ${newPotionCount}`
      );
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

        const levelDiff = enemyLevel - prevChar.level;
        const enemyType = enemyTypes.find((t) => t.id === enemyTypeId);
        let xpGain = enemyType?.baseXP ?? 5;

        if (levelDiff > 0) {
          xpGain *= 1 + levelDiff * 0.2;
        } else if (levelDiff < -2) {
          xpGain *= 0.5;
        }
        xpGain = Math.max(1, Math.round(xpGain));

        let newXP = prevChar.currentXP + xpGain;
        let xpNeeded = calculateXPToNextLevel(prevChar.level);
        let updatedChar = { ...prevChar, currentXP: newXP };
        let accumulatedStatGains = { maxHealth: 0 }; // Track accumulated gains

        console.log(
          `Killed ${
            enemyType?.name ?? "enemy"
          } (Lvl ${enemyLevel}). Gained ${xpGain} XP. Current XP: ${newXP}/${xpNeeded}`
        );

        // Handle potential multiple level ups
        while (newXP >= xpNeeded && updatedChar.level < 100) {
          const newLevel = updatedChar.level + 1;
          const remainingXP = newXP - xpNeeded;
          console.log(`LEVEL UP! Reached level ${newLevel}`);
          accumulatedStatGains.maxHealth += 10;

          updatedChar = {
            ...updatedChar,
            level: newLevel,
            currentXP: remainingXP,
            maxHealth: updatedChar.maxHealth + 10,
            currentHealth: updatedChar.maxHealth + 10,
          };
          newXP = remainingXP;
          xpNeeded = calculateXPToNextLevel(newLevel);
        }

        saveUpdatedCharacter(updatedChar);
        return updatedChar;
      });
    },
    [saveUpdatedCharacter]
  );

  // --- Loading State ---
  if (!activeCharacter && loadCharacters().length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        Loading or redirecting...
      </div>
    );
  }
  if (activeCharacter && !currentArea && currentView === "areaView") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        Error: Current area data not found.{" "}
        <button onClick={handleReturnToMap}>Return to Map</button>
      </div>
    );
  }

  // Calculate XP Needed for the active character AFTER loading checks
  const xpToNextLevel = activeCharacter
    ? calculateXPToNextLevel(activeCharacter.level)
    : 0;

  return (
    <div className="p-4 bg-black min-h-screen">
      <div className="flex flex-col md:flex-row min-h-[calc(100vh-2rem)] bg-black text-white gap-x-2">
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
              xpToNextLevel={xpToNextLevel}
            />
          )}

          {/* Text Box Area - Content updates based on context */}
          <div className="h-[100px] md:h-[150px] border border-white p-1 bg-black mt-2">
            {" "}
            {/* Added mt-2 */}
            <div className="ring-1 ring-inset ring-white ring-offset-1 ring-offset-black h-full w-full p-3 font-sans overflow-y-auto">
              {textBoxContent}
            </div>
          </div>
        </div>

        {/* Right Sidebar (Inventory + Stats) */}
        <div className="w-full md:w-1/3 flex flex-col">
          {/* REMOVE Conditionally render Sidebar content based on view */}
          {/* {currentView === "worldMap" && activeCharacter && ( */}
          <>
            {" "}
            {/* Use Fragment to group elements */}
            <div className="h-full flex flex-col">
              <InventoryPlaceholder />
              <div className="mt-2">
                {/* Ensure character exists before rendering stats */}
                {activeCharacter && (
                  <CharacterStats
                    character={activeCharacter}
                    xpToNextLevel={xpToNextLevel}
                  />
                )}
              </div>
            </div>
          </>
          {/* )} */}
          {/* Sidebar content is now always rendered (if character exists) */}
        </div>
      </div>
    </div>
  );
}
