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
  ItemRarity,
  OverallGameData,
  EnemyDamageType,
  EquipmentSlotId,
  defaultOverallData,
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
import { generateDrop, determineRarity } from "../../utils/itemUtils";
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
import VendorModal from "../../components/VendorModal";
import { v4 as uuidv4 } from "uuid";

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

// <<< Define calculateSellPrice here >>>
const calculateSellPrice = (item: EquippableItem): number => {
  let price = 1; // Base price for Normal
  switch (item.rarity) {
    case "Mágico":
      price = 3;
      break;
    case "Raro":
      price = 7;
      break;
    case "Lendário":
      price = 15;
      break;
  }
  price += (item.modifiers?.length ?? 0) * 1; // Example: +1 Ruby per mod
  return price;
};

// <<< ADD getRandomInt back at the end >>>
function getRandomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// <<< Define type for floating text state >>>
interface FloatingRubyChange {
  value: number;
  type: "gain" | "loss";
  id: string;
}

export default function WorldMapPage() {
  const router = useRouter();

  // --- Disable Context Menu & Text Selection ---
  useEffect(() => {
    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault();
    };
    document.addEventListener("contextmenu", handleContextMenu);

    // Add global style to disable text selection
    document.body.style.userSelect = "none";
    document.body.style.webkitUserSelect = "none"; // For Safari

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      // Reset global style on component unmount
      document.body.style.userSelect = "auto";
      document.body.style.webkitUserSelect = "auto";
    };
  }, []); // Run only once on mount
  // ---------------------------------------------

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
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  // <<< ADD state for floating ruby text >>>
  const [floatingRubyChange, setFloatingRubyChange] =
    useState<FloatingRubyChange | null>(null);
  // <<< ADD State for AreaView key >>>
  const [areaViewKey, setAreaViewKey] = useState<string>(uuidv4());
  // <<< ADD State for barrier zero timestamp >>>
  const [barrierZeroTimestamp, setBarrierZeroTimestamp] = useState<
    number | null
  >(null);
  // ----------------------------------------------

  // --- Use the Inventory Manager Hook ---
  const {
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
    handleItemDropped,
    handleCloseRequirementFailModal,
    handleOpenDiscardConfirm,
    handleSwapWeapons,
    handleUnequipItem,
    handleEquipItem,
  } = useInventoryManager({
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

  // --- ADD Overall Game Data State ---
  const [overallData, setOverallData] = useState<OverallGameData | null>(null);

  // --- Function to Save Overall Data ---
  const saveOverallDataState = useCallback((updatedData: OverallGameData) => {
    try {
      saveOverallData(updatedData);
      setOverallData(updatedData); // Update local state as well
      console.log("[saveOverallDataState] Saved overall data:", updatedData);
    } catch (error) {
      console.error("Error saving overall game data:", error);
    }
  }, []);

  // --- Function to display floating ruby text ---
  const displayFloatingRubyChange = useCallback(
    (value: number, type: "gain" | "loss") => {
      setFloatingRubyChange({ value, type, id: crypto.randomUUID() });
    },
    []
  );

  // --- useEffect to clear floating ruby text ---
  useEffect(() => {
    if (floatingRubyChange) {
      const timer = setTimeout(() => {
        setFloatingRubyChange(null);
      }, 1200); // Display for 1.2 seconds
      return () => clearTimeout(timer);
    }
  }, [floatingRubyChange]);

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

      // <<< LOAD Overall Data >>>
      try {
        const loadedOverallData = loadOverallData();
        setOverallData(loadedOverallData);
        console.log("[Initial Load] Loaded overall data:", loadedOverallData);
        // Save last played ID (using loadedOverallData)
        if (loadedOverallData.lastPlayedCharacterId !== char.id) {
          saveOverallDataState({
            ...loadedOverallData,
            lastPlayedCharacterId: char.id,
          });
        }
      } catch (error) {
        console.error("Error loading or saving overall data:", error);
      }

      // <<< ADD HEALING LOGIC ON LOAD >>>
      const initialUpdates: Partial<Character> = {};
      // Calculate max health dynamically for healing check
      const currentStatsOnLoad = calculateEffectiveStats(char);
      const actualMaxHealthOnLoad = currentStatsOnLoad.maxHealth;
      // <<< Calculate max barrier for initialization >>>
      const actualMaxBarrierOnLoad = currentStatsOnLoad.totalBarrier;

      if (
        char.currentAreaId === "cidade_principal" &&
        char.currentHealth < actualMaxHealthOnLoad // Use calculated max health
      ) {
        console.log(
          `[Initial Load] Character loaded in safe zone. Healing ${char.currentHealth} -> ${actualMaxHealthOnLoad}.`
        );
        initialUpdates.currentHealth = actualMaxHealthOnLoad; // Heal to calculated max
        // <<< Restore barrier in town on load >>>
        initialUpdates.currentBarrier = actualMaxBarrierOnLoad;
        console.log(
          `[Initial Load] Restoring barrier in town: ${actualMaxBarrierOnLoad}`
        );
      }
      // <<< ADD POTION REFILL LOGIC ON LOAD >>>
      if (char.currentAreaId === "cidade_principal" && char.healthPotions < 3) {
        console.log(
          "[Initial Load] Character loaded in safe zone with < 3 potions. Refilling to 3."
        );
        initialUpdates.healthPotions = 3;
      }
      // <<< Initialize currentBarrier if undefined >>>
      if (char.currentBarrier === undefined || char.currentBarrier === null) {
        console.log(
          `[Initial Load] Initializing currentBarrier to max: ${actualMaxBarrierOnLoad}`
        );
        initialUpdates.currentBarrier = actualMaxBarrierOnLoad;
      }
      // ------------------------------------------

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
  }, [
    router,
    setActiveCharacterStore,
    saveCharacterStore,
    saveOverallDataState,
  ]); // <<< ADD saveOverallDataState dependency

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

      // <<< Check if Wind Crystal should be consumed >>>
      const sourceLocation = act1Locations.find(
        (loc) => loc.id === currentChar.currentAreaId
      );
      const isAdjacent = sourceLocation?.connections?.includes(targetAreaId);
      if (
        !isAdjacent &&
        overallData &&
        overallData.currencies.windCrystals > 0
      ) {
        const newOverallData = {
          ...overallData,
          currencies: {
            ...overallData.currencies,
            windCrystals: overallData.currencies.windCrystals - 1,
          },
        };
        saveOverallDataState(newOverallData);
        displayTemporaryMessage("Cristal do Vento consumido.", 1500);
        console.log("[Travel] Consumed 1 Wind Crystal.");
      } else if (
        !isAdjacent &&
        (!overallData || overallData.currencies.windCrystals <= 0)
      ) {
        // This case should ideally be prevented by the MapArea click logic, but added as safety
        console.error(
          "[Travel] Attempted non-adjacent travel without Wind Crystal!"
        );
        // Reset travel state immediately if crystal was required but missing
        setIsTraveling(false);
        setTravelProgress(0);
        setTravelTargetAreaId(null);
        displayPersistentMessage(
          "Erro: Cristal do Vento necessário para esta viagem."
        );
        if (travelTimerRef.current) clearInterval(travelTimerRef.current);
        travelTimerRef.current = null;
        return; // Stop the travel process
      }
      // ----------------------------------------------

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
              // <<< Get max barrier on travel end >>>
              const actualMaxBarrierOnTravelEnd =
                currentStatsOnTravelEnd.totalBarrier;

              // Heal to full (using calculated max)
              if (latestChar.currentHealth < actualMaxHealthOnTravelEnd) {
                console.log(
                  `[Travel Complete] Arrived at safe zone (${finalNewLocation.name}). Healing ${latestChar.currentHealth} -> ${actualMaxHealthOnTravelEnd}.`
                );
                updates.currentHealth = actualMaxHealthOnTravelEnd; // Heal to calculated max
                // <<< Restore barrier on travel end >>>
                updates.currentBarrier = actualMaxBarrierOnTravelEnd;
                console.log(
                  `[Travel Complete] Restoring barrier: ${actualMaxBarrierOnTravelEnd}`
                );
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
    (areaWasCompleted: boolean) => {
      const charBeforeUpdate = useCharacterStore.getState().activeCharacter;
      if (!charBeforeUpdate) return;

      const completedAreaId = charBeforeUpdate.currentAreaId;
      const updates: Partial<Character> = {};

      console.log(
        `Returned to map. Area ${completedAreaId} completed: ${areaWasCompleted}.`
      );

      if (areaWasCompleted) {
        const completedArea = act1Locations.find(
          (loc) => loc.id === completedAreaId
        );
        if (
          completedArea &&
          completedArea.unlocks &&
          completedArea.unlocks.length > 0
        ) {
          const currentUnlocked = new Set(
            charBeforeUpdate.unlockedAreaIds || []
          );
          const newAreasUnlocked: string[] = [];

          completedArea.unlocks.forEach((areaToUnlockId) => {
            if (!currentUnlocked.has(areaToUnlockId)) {
              newAreasUnlocked.push(areaToUnlockId);
              currentUnlocked.add(areaToUnlockId);
            }
          });

          if (newAreasUnlocked.length > 0) {
            console.log(
              `[Area Complete] Unlocking new areas: ${newAreasUnlocked.join(
                ", "
              )}`
            );
            updates.unlockedAreaIds = Array.from(currentUnlocked);
          }
        }
      }

      if (Object.keys(updates).length > 0) {
        console.log("[handleReturnToMap] Applying updates:", updates);
        updateCharacterStore(updates);
        setTimeout(() => saveCharacterStore(), 50);
      }

      setCurrentView("worldMap");
      setCurrentArea(null);
      displayPersistentMessage("Mapa - Ato 1");
      handleOpenDropModalForCollection();
    },
    [
      handleOpenDropModalForCollection,
      displayPersistentMessage,
      updateCharacterStore,
      saveCharacterStore,
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
    (
      rawDamage: number,
      damageType: EnemyDamageType,
      displayDamageCallback: (
        finalDamage: number,
        damageType: EnemyDamageType
      ) => void
    ) => {
      const currentChar = useCharacterStore.getState().activeCharacter;
      // <<< Get LATEST effective stats for mitigation AND barrier >>>
      let currentStats: EffectiveStats | null = null;
      if (currentChar) {
        try {
          currentStats = calculateEffectiveStats(currentChar);
        } catch (e) {
          console.error("[handlePlayerTakeDamage] Error calculating stats:", e);
          return; // Don't proceed if stats fail
        }
      }
      // <<< Abort if no character or stats >>>
      if (!currentChar || !currentStats) return;

      // <<< Get current barrier >>>
      const currentBarrier = currentChar.currentBarrier ?? 0;

      let finalDamage = rawDamage; // Start with base damage

      console.log(
        `[Damage Calc Start] Base: ${rawDamage}, Type: ${damageType}, Current Barrier: ${currentBarrier}`
      );

      // Apply Damage Type Specific Mitigation (Using calculated currentStats)
      if (damageType === "physical") {
        const armor = currentStats?.totalArmor ?? 0;
        const physTakenAsElePercent =
          currentStats?.totalPhysTakenAsElementPercent ?? 0;
        const reducedPhysTakenPercent =
          currentStats?.totalReducedPhysDamageTakenPercent ?? 0;
        let unconvertedDamage = rawDamage;
        let elementalDamageTaken = 0;

        // 1. Convert portion to Elemental (if applicable)
        if (physTakenAsElePercent > 0) {
          const amountToConvert = rawDamage * (physTakenAsElePercent / 100);
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
      } else if (damageType === "cold") {
        // Check cold first
        const resistance = currentStats.finalColdResistance;
        const mitigation = resistance / 100;
        finalDamage = Math.max(0, Math.round(rawDamage * (1 - mitigation)));
      } else if (damageType === "void") {
        // Then check void
        const resistance = currentStats.finalVoidResistance;
        const mitigation = resistance / 100;
        finalDamage = Math.max(0, Math.round(rawDamage * (1 - mitigation)));
        // <<< The 'else' here means damageType MUST be 'fire' if it's a valid EnemyDamageType >>>
        // <<< Or handle potential future damage types / invalid strings >>>
      } else {
        // Assuming 'fire' is the only remaining possibility for EnemyDamageType
        // If other types are added, this needs more checks.
        if (damageType === "fire") {
          // Explicit check for clarity, though maybe redundant with current type
          const resistance = currentStats.finalFireResistance;
          const mitigation = resistance / 100;
          finalDamage = Math.max(0, Math.round(rawDamage * (1 - mitigation)));
        } else {
          // Handle truly unknown/unexpected string values
          console.warn(
            `Unknown or unexpected damage type received: ${damageType}`
          );
          // finalDamage remains unchanged (equal to rawDamage)
        }
      }

      console.log(`[Damage Calc End] Final Damage Taken: ${finalDamage}`);

      // --- Apply Damage to Barrier first, then Health ---
      let newBarrier = currentBarrier;
      let newHealth = currentChar.currentHealth;
      let updates: Partial<Character> = {};

      if (finalDamage > 0) {
        if (currentBarrier > 0) {
          const damageToBarrier = Math.min(currentBarrier, finalDamage);
          newBarrier = currentBarrier - damageToBarrier;
          const remainingDamage = finalDamage - damageToBarrier;

          if (remainingDamage > 0) {
            newHealth = Math.max(
              0,
              currentChar.currentHealth - remainingDamage
            );
          }
          console.log(
            `[Damage Apply] Barrier absorbed ${damageToBarrier}. Remaining damage to health: ${remainingDamage}. New Barrier: ${newBarrier}, New Health: ${newHealth}`
          );
        } else {
          // Barrier is already 0, apply full damage to health
          newHealth = Math.max(0, currentChar.currentHealth - finalDamage);
          console.log(
            `[Damage Apply] Barrier is 0. Applying ${finalDamage} directly to health. New Health: ${newHealth}`
          );
        }
      } else {
        console.log(`[Damage Apply] Final damage is 0 or less. No changes.`);
      }

      // Update barrier and health in the updates object
      updates.currentBarrier = newBarrier;
      updates.currentHealth = newHealth;

      // --- <<< Check if barrier just hit zero >>> ---
      if (currentBarrier > 0 && newBarrier === 0) {
        console.log("[Damage Apply] Barrier reached zero! Setting timestamp.");
        setBarrierZeroTimestamp(Date.now());
      }
      // --------------------------------------------

      // Check for low health AFTER calculating new health
      const maxHp = currentStats.maxHealth ?? 1; // Use effectiveStats from calculation
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
          currentBarrier: 0, // <<< Reset barrier on death
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

      // --- <<< Call display callback with final damage >>> ---
      if (finalDamage > 0) {
        displayDamageCallback(finalDamage, damageType);
      }
      // ----------------------------------------------------
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

      // <<< ADD Log: Received Heal Amount >>>
      console.log(`[handlePlayerHeal] Received healAmount: ${healAmount}`);

      if (
        !currentChar ||
        healAmount <= 0 || // <<< Check: Does it become 0 or negative?
        currentChar.currentHealth >= currentMaxHp // <<< Check: Is health already full?
      ) {
        // <<< ADD Log: Heal skipped >>>
        console.log(
          `[handlePlayerHeal] Skipping heal. Reason: currentChar=${!!currentChar}, healAmount=${healAmount}, currentHealth=${
            currentChar?.currentHealth
          }, maxHealth=${currentMaxHp}`
        );
        return;
      }

      const newHealth = Math.min(
        currentMaxHp,
        currentChar.currentHealth + healAmount
      );

      // <<< ADD Log: Calculated New Health >>>
      console.log(
        `[handlePlayerHeal] Calculated newHealth: ${newHealth} (current: ${currentChar.currentHealth})`
      );

      if (newHealth !== currentChar.currentHealth) {
        // <<< ADD Log: Applying Update >>>
        console.log(
          `[handlePlayerHeal] Applying health update: ${currentChar.currentHealth} -> ${newHealth}`
        );
        updateCharacterStore({ currentHealth: newHealth });
        setTimeout(() => saveCharacterStore(), 50);
      } else {
        // <<< ADD Log: No update needed >>>
        console.log(
          `[handlePlayerHeal] No health update needed (newHealth === currentHealth).`
        );
      }
    },
    [updateCharacterStore, saveCharacterStore, effectiveStats]
  );

  // --- Update handleEnemyKilled ---
  const handleEnemyKilled = useCallback(
    (enemyTypeId: string, enemyLevel: number, enemyName: string) => {
      const charBeforeUpdate = useCharacterStore.getState().activeCharacter;
      if (!charBeforeUpdate) return;

      // <<< Get latest overallData >>>
      const currentOverallData = overallData;
      if (!currentOverallData) return;

      // --- Check if it's the boss ---
      const isBossKill = enemyTypeId === "ice_dragon_boss";

      let finalUpdates: Partial<Character> = {};
      let potionDropped = false;
      let voidCrystalsDropped = 0; // <<< Initialize crystal drop count

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

      // Display enemy defeated message (or special boss message?)
      displayTemporaryMessage(`${enemyName} derrotado! +${xpGained} XP`, 2500);

      // <<< Display Act 1 Completion Message if Boss Kill >>>
      if (isBossKill) {
        displayPersistentMessage("Ato 1 concluído!");
      }

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

      // <<< Void Crystal Drop Logic >>>
      const crystalDropChance = isBossKill ? 0.5 : 0.15; // Higher chance for boss
      if (Math.random() < crystalDropChance) {
        voidCrystalsDropped = getRandomInt(
          1,
          Math.max(2, Math.floor(enemyLevel / 3))
        ); // Drop amount based on level
        console.log(`Dropped ${voidCrystalsDropped} Void Crystals!`);
        // We will update overallData state *after* character state updates
      }

      // <<< Apply Void Crystal Update to overallData >>>
      if (voidCrystalsDropped > 0) {
        const newOverallData = {
          ...currentOverallData,
          currencies: {
            ...currentOverallData.currencies,
            voidCrystals:
              (currentOverallData.currencies.voidCrystals || 0) +
              voidCrystalsDropped,
          },
        };
        saveOverallDataState(newOverallData);
        // Optional: Display temporary message for crystal drop
        displayTemporaryMessage(
          `+${voidCrystalsDropped} Cristais do Vazio!`,
          1500
        );
      }

      // --- Item Drop Logic (Updated for Boss) ---
      const dropChance = isBossKill ? 1.0 : 0.3; // Boss always drops an item, others 30%
      if (Math.random() < dropChance) {
        let forcedDropRarity: ItemRarity | undefined = undefined;

        // Determine rarity specifically for boss kill
        if (isBossKill) {
          const bossRoll = Math.random();
          if (bossRoll < 0.4) {
            // 40% chance for Legendary
            forcedDropRarity = "Lendário";
            console.log("[Boss Kill Drop] Forcing Legendary Rarity!");
          } else {
            // Optional: Guarantee at least Magic/Rare as fallback?
            // forcedDropRarity = Math.random() < 0.5 ? 'Raro' : 'Mágico';
            // For now, let's use standard determination if not Legendary
            // We need determineRarity function available here
            forcedDropRarity = determineRarity(enemyLevel); // Use imported determineRarity
            console.log(
              `[Boss Kill Drop] Legendary fail (Roll: ${bossRoll.toFixed(
                2
              )}), using standard rarity: ${forcedDropRarity}`
            );
          }
        }

        // Call generateDrop with potential forced rarity
        const droppedItem = generateDrop(
          enemyLevel,
          undefined,
          forcedDropRarity
        );

        if (droppedItem) {
          handleItemDropped(droppedItem); // Call hook's handler
        }
      }
      // --- End Item Drop Logic ---
    },
    [
      updateCharacterStore,
      saveCharacterStore,
      displayTemporaryMessage,
      displayPersistentMessage,
      handleItemDropped,
      overallData, // <<< ADD overallData dependency
      saveOverallDataState, // <<< ADD saveOverallDataState dependency
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

  // --- Passive Regeneration Effect (HEALTH + NEW BARRIER LOGIC) ---
  const regenerationTimerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    console.log("[Regen Effect - START]"); // Log effect run start

    // Clear previous timer immediately
    if (regenerationTimerRef.current) {
      console.log(
        `[Regen Effect] Clearing previous timer ID: ${regenerationTimerRef.current}`
      );
      clearInterval(regenerationTimerRef.current);
      regenerationTimerRef.current = null;
    }

    // Get current values for initial check
    const currentRegenRate = effectiveStats?.finalLifeRegenPerSecond ?? 0;
    const currentHp = activeCharacter?.currentHealth ?? 0;
    const currentMaxHp = effectiveStats?.maxHealth ?? 0;

    console.log(
      `[Regen Effect - Check] Rate: ${currentRegenRate}, HP: ${currentHp}/${currentMaxHp}`
    ); // Log values being checked

    // Check if regeneration should be active
    if (currentRegenRate > 0 && currentHp < currentMaxHp && currentHp > 0) {
      console.log(`[Regen Effect] Conditions MET. Starting setInterval...`);

      regenerationTimerRef.current = setInterval(() => {
        // Inside interval: get the absolute latest state directly
        const latestCharState = useCharacterStore.getState().activeCharacter;
        // Recalculate stats based on the VERY latest character state
        let latestStats: EffectiveStats | null = null;
        try {
          if (latestCharState)
            latestStats = calculateEffectiveStats(latestCharState);
        } catch (e) {
          console.error(
            "[Regen Tick] Error recalculating stats inside interval:",
            e
          );
        }

        const latestHp = latestCharState?.currentHealth ?? 0;
        const latestMaxHp = latestStats?.maxHealth ?? 0;
        const latestRegenRate = latestStats?.finalLifeRegenPerSecond ?? 0;

        console.log(
          `[Regen Tick - Check] TimerID: ${regenerationTimerRef.current}, HP: ${latestHp}/${latestMaxHp}, Rate: ${latestRegenRate}`
        ); // Log inside tick

        // --- HEALTH REGEN LOGIC (Check and Apply) ---
        if (latestHp > 0 && latestHp < latestMaxHp && latestRegenRate > 0) {
          // Apply health heal
          const healthHealAmount = Math.max(1, Math.floor(latestRegenRate));
          console.log(
            `[Regen Tick - HEAL] Applying health heal: ${healthHealAmount}`
          );
          handlePlayerHeal(healthHealAmount); // Call the existing heal handler
        }
        // ----------------------------------------

        // Check conditions to continue/stop the MAIN timer
        // Stop if health is full OR rate is zero
        const shouldStopHealthRegen =
          latestHp >= latestMaxHp || latestRegenRate <= 0;

        // The timer should stop only if health cannot regenerate further
        if (
          !latestCharState ||
          latestHp <= 0 || // Stop if dead
          shouldStopHealthRegen // Stop if health is full or no regen rate
        ) {
          console.log(
            `[Regen Tick - STOP] Conditions met. Health Full/NoRate: ${shouldStopHealthRegen}. Clearing timer ${regenerationTimerRef.current}.`
          );
          if (regenerationTimerRef.current) {
            clearInterval(regenerationTimerRef.current);
            regenerationTimerRef.current = null;
          }
          return; // Exit interval callback
        }
      }, 1000); // Run every second

      console.log(
        `[Regen Effect] Timer STARTED with ID: ${regenerationTimerRef.current}`
      );
    } else {
      // <<< Change let to const for reason >>>
      const reason = [];
      if (currentRegenRate <= 0) reason.push("Rate <= 0");
      if (currentHp <= 0) reason.push("HP <= 0");
      if (currentHp >= currentMaxHp) reason.push("HP >= MaxHP");
      console.log(
        `[Regen Effect] Conditions NOT MET (${reason.join(
          ", "
        )}). Timer not started.`
      );
    }

    // Cleanup function: clears the timer when the effect re-runs or component unmounts
    return () => {
      console.log(
        `[Regen Effect - CLEANUP] Clearing timer ID: ${regenerationTimerRef.current}`
      );
      if (regenerationTimerRef.current) {
        clearInterval(regenerationTimerRef.current);
        regenerationTimerRef.current = null;
      }
      console.log("[Regen Effect - CLEANUP] Finished.");
    };
  }, [
    // Dependencies that should trigger a re-evaluation of the timer setup
    activeCharacter?.id, // Change if character changes
    effectiveStats?.finalLifeRegenPerSecond, // Change if regen rate from calculated stats changes
    effectiveStats?.maxHealth, // Change if max health changes
    handlePlayerHeal, // The function itself (should be stable with useCallback)
    updateCharacterStore, // Add store actions used inside
    saveCharacterStore,
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
    activeCharacter, // ADD activeCharacter
    effectiveStats, // ADD effectiveStats
  ]);

  // --- Teleport Stone Handler ---
  const handleUseTeleportStone = useCallback(() => {
    const char = useCharacterStore.getState().activeCharacter;
    let currentStats: EffectiveStats | null = null;
    if (char) {
      try {
        currentStats = calculateEffectiveStats(char);
      } catch (e) {
        console.error(
          "[handleUseTeleportStone] Error calculating stats for healing:",
          e
        );
      }
    }

    if (
      !char ||
      char.teleportStones <= 0 ||
      char.currentAreaId === "cidade_principal" ||
      !currentStats
    ) {
      console.log("[handleUseTeleportStone] Cannot use stone.", {
        stones: char?.teleportStones,
        area: char?.currentAreaId,
        statsOk: !!currentStats,
      });
      return;
    }

    // <<< Check for pending drops BEFORE clearing >>>
    const pendingDropsOnTeleport = [...itemsToShowInModal];

    console.log("[handleUseTeleportStone] Using teleport stone...");

    // --- Update character state: Full Health & Potions & Barrier ---
    const maxHealth = currentStats.maxHealth;
    const maxBarrier = currentStats.totalBarrier;
    const updates: Partial<Character> = {
      teleportStones: char.teleportStones - 1,
      currentAreaId: "cidade_principal",
      currentHealth: maxHealth,
      currentBarrier: maxBarrier,
      healthPotions: 3,
    };
    updateCharacterStore(updates);
    setTimeout(() => saveCharacterStore(), 50);
    // -----------------------------------------------------

    // Reset Area View state (indirectly by changing area)
    const townLocation = act1Locations.find(
      (loc) => loc.id === "cidade_principal"
    );
    if (townLocation) {
      setCurrentArea(townLocation);
      setCurrentView("worldMap"); // Go back to map view first
      setAreaViewKey(uuidv4());

      setTimeout(() => {
        setCurrentView("areaView"); // Enter town AreaView AFTER key update
        displayPersistentMessage("Retornou para a Cidade Principal.");

        // <<< Open modal if there were pending drops >>>
        if (pendingDropsOnTeleport.length > 0) {
          console.log(
            "[handleUseTeleportStone] Opening drop modal for collection after teleport."
          );
          handleOpenDropModalForCollection();
          // NOTE: Don't call clearPendingDrops here, the modal flow handles it.
        } else {
          // If no drops were pending, clear any potentially stale state just in case
          clearPendingDrops();
        }
        // ------------------------------------------
      }, 50); // Short delay
    } else {
      console.error("Could not find town location data for teleport!");
      setCurrentView("worldMap"); // Fallback to map
      displayPersistentMessage("Erro ao teleportar."); // Fallback message
      // <<< Clear drops even on teleport error >>>
      clearPendingDrops();
    }

    // Stop travel if it was happening (edge case)
    if (travelTimerRef.current) clearInterval(travelTimerRef.current);
    setIsTraveling(false);
    setTravelProgress(0);
    setTravelTargetAreaId(null);
  }, [
    updateCharacterStore,
    saveCharacterStore,
    clearPendingDrops,
    displayPersistentMessage,
    itemsToShowInModal, // <<< Add dependency
    handleOpenDropModalForCollection, // <<< Add dependency
    // <<< Keep other existing dependencies like setAreaViewKey etc. if needed >>>
    setCurrentArea,
    setCurrentView,
    setAreaViewKey,
    setIsTraveling,
    setTravelProgress,
    setTravelTargetAreaId, // Add potentially missing state setters
  ]);

  // --- Vendor Modal Handlers (Restore handleOpenVendorModal) ---
  const handleOpenVendorModal = useCallback(() => {
    if (activeCharacter?.currentAreaId === "cidade_principal") {
      setIsVendorModalOpen(true);
    } else {
      displayTemporaryMessage("Vendedor só está disponível na cidade.", 2000);
    }
  }, [activeCharacter?.currentAreaId, displayTemporaryMessage]);

  const handleCloseVendorModal = useCallback(() => {
    setIsVendorModalOpen(false);
  }, []);

  const handleSellItems = useCallback(
    (itemsToSell: EquippableItem[]) => {
      if (!activeCharacter || !overallData || itemsToSell.length === 0) return;
      let totalValue = 0;
      itemsToSell.forEach((item) => {
        totalValue += calculateSellPrice(item);
      });
      const newInventory = activeCharacter.inventory.filter(
        (item) => !itemsToSell.includes(item)
      );
      updateCharacterStore({ inventory: newInventory });
      setTimeout(() => saveCharacterStore(), 50);
      const newOverallData = {
        ...overallData,
        currencies: {
          ...overallData.currencies,
          ruby: (overallData.currencies.ruby || 0) + totalValue,
        },
      };
      saveOverallDataState(newOverallData);

      // <<< Use displayTemporaryMessage instead of/in addition to floating text >>>
      displayTemporaryMessage(
        `Vendeu ${itemsToSell.length} itens por ${totalValue} Rubis!`,
        2000
      );
      if (totalValue > 0) {
        displayFloatingRubyChange(totalValue, "gain");
      }
    },
    [
      activeCharacter,
      overallData,
      updateCharacterStore,
      saveCharacterStore,
      saveOverallDataState,
      displayFloatingRubyChange,
      displayTemporaryMessage,
    ]
  );

  const handleBuyPotion = useCallback(() => {
    if (!activeCharacter || !overallData) return;
    const POTION_COST = 5;
    if (overallData.currencies.ruby >= POTION_COST) {
      // ... update character potions and overallData ...
      updateCharacterStore({
        healthPotions: (activeCharacter.healthPotions || 0) + 1,
      });
      setTimeout(() => saveCharacterStore(), 50);
      const newOverallData = {
        ...overallData,
        currencies: {
          ...overallData.currencies,
          ruby: overallData.currencies.ruby - POTION_COST,
        },
      };
      saveOverallDataState(newOverallData);

      // <<< Use displayTemporaryMessage >>>
      displayTemporaryMessage(
        `Comprou 1 Poção de Vida (-${POTION_COST} Rubis)!`,
        1500
      );
      displayFloatingRubyChange(POTION_COST, "loss");
    } else {
      displayTemporaryMessage(
        `Rubis insuficientes! (${POTION_COST} necessários)`,
        2000
      );
    }
  }, [
    activeCharacter,
    overallData,
    updateCharacterStore,
    saveCharacterStore,
    saveOverallDataState,
    displayFloatingRubyChange,
    displayTemporaryMessage,
  ]);

  const handleBuyTeleportStone = useCallback(() => {
    if (!activeCharacter || !overallData) return;
    const STONE_COST = 10;
    if (overallData.currencies.ruby >= STONE_COST) {
      // ... update character stones and overallData ...
      updateCharacterStore({
        teleportStones: (activeCharacter.teleportStones || 0) + 1,
      });
      setTimeout(() => saveCharacterStore(), 50);
      const newOverallData = {
        ...overallData,
        currencies: {
          ...overallData.currencies,
          ruby: overallData.currencies.ruby - STONE_COST,
        },
      };
      saveOverallDataState(newOverallData);

      // <<< Use displayTemporaryMessage >>>
      displayTemporaryMessage(
        `Comprou 1 Pedra de Teleporte (-${STONE_COST} Rubis)!`,
        1500
      );
      displayFloatingRubyChange(STONE_COST, "loss");
    } else {
      displayTemporaryMessage(
        `Rubis insuficientes! (${STONE_COST} necessários)`,
        2000
      );
    }
  }, [
    activeCharacter,
    overallData,
    updateCharacterStore,
    saveCharacterStore,
    saveOverallDataState,
    displayFloatingRubyChange,
    displayTemporaryMessage,
  ]);

  // --- <<< NEW: Barrier Recharge Effect (6s Delay after Zero) >>> ---
  const barrierRechargeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const BARRIER_RECHARGE_DELAY_MS = 6000; // 6 seconds

  useEffect(() => {
    // Clear any existing recharge timeout when dependencies change
    if (barrierRechargeTimeoutRef.current) {
      clearTimeout(barrierRechargeTimeoutRef.current);
      barrierRechargeTimeoutRef.current = null;
    }

    // Only proceed if the timestamp is set (meaning barrier hit zero)
    if (barrierZeroTimestamp !== null) {
      console.log(
        `[Barrier Recharge Effect] Barrier hit zero at ${barrierZeroTimestamp}. Starting ${
          BARRIER_RECHARGE_DELAY_MS / 1000
        }s recharge timer.`
      );

      barrierRechargeTimeoutRef.current = setTimeout(() => {
        console.log(
          "[Barrier Recharge Timeout] Timer finished. Attempting recharge."
        );
        // Get latest state and stats inside timeout
        const latestCharState = useCharacterStore.getState().activeCharacter;
        let latestStats: EffectiveStats | null = null;
        try {
          if (latestCharState)
            latestStats = calculateEffectiveStats(latestCharState);
        } catch (e) {
          console.error(
            "[Barrier Recharge Timeout] Error recalculating stats:",
            e
          );
        }

        const latestCurrentBarrier = latestCharState?.currentBarrier ?? 0;
        const latestMaxBarrier = latestStats?.totalBarrier ?? 0;

        // Recharge only if:
        // 1. Character and stats exist
        // 2. The barrier is still zero (or somehow went negative?)
        // 3. Max barrier is positive
        if (
          latestCharState &&
          latestStats &&
          latestCurrentBarrier <= 0 &&
          latestMaxBarrier > 0
        ) {
          console.log(
            `[Barrier Recharge Timeout] Recharging barrier to full (${latestMaxBarrier}).`
          );
          updateCharacterStore({ currentBarrier: latestMaxBarrier });
          setTimeout(() => saveCharacterStore(), 50);
          // Reset the timestamp after successful recharge
          setBarrierZeroTimestamp(null);
        } else {
          const reason = [];
          if (!latestCharState || !latestStats)
            reason.push("Char/Stats missing");
          if (latestCurrentBarrier > 0) reason.push("Barrier > 0");
          if (latestMaxBarrier <= 0) reason.push("Max Barrier <= 0");
          console.log(
            `[Barrier Recharge Timeout] Recharge conditions not met (${reason.join(
              ", "
            )}).`
          );
          // If timestamp was reset, we don't need to manually set it to null here
          // If barrier became > 0 somehow, also reset the timestamp logic
          if (latestCurrentBarrier > 0) {
            setBarrierZeroTimestamp(null);
          }
        }
        barrierRechargeTimeoutRef.current = null; // Clear ref after timeout runs
      }, BARRIER_RECHARGE_DELAY_MS);
    }

    // Cleanup function for the effect itself
    return () => {
      if (barrierRechargeTimeoutRef.current) {
        console.log(
          "[Barrier Recharge Effect Cleanup] Clearing active timeout."
        );
        clearTimeout(barrierRechargeTimeoutRef.current);
        barrierRechargeTimeoutRef.current = null;
      }
    };
  }, [
    barrierZeroTimestamp, // Trigger when the timestamp is set or reset
    updateCharacterStore,
    saveCharacterStore,
    // Add setBarrierZeroTimestamp as a dependency
    setBarrierZeroTimestamp,
  ]);
  // --- <<< END: Barrier Recharge Effect >>> ---

  // --- <<< ADD Handler for Buying Wind Crystal >>> ---
  const handleBuyWindCrystal = useCallback(() => {
    if (!activeCharacter || !overallData) return;
    const CRYSTAL_COST = 30; // Reuse cost
    if (overallData.currencies.ruby >= CRYSTAL_COST) {
      const newOverallData = {
        ...overallData,
        currencies: {
          ...overallData.currencies,
          ruby: overallData.currencies.ruby - CRYSTAL_COST,
          windCrystals: (overallData.currencies.windCrystals || 0) + 1,
        },
      };
      saveOverallDataState(newOverallData);

      displayTemporaryMessage(
        `Comprou 1 Cristal do Vento (-${CRYSTAL_COST} Rubis)!`,
        1500
      );
      displayFloatingRubyChange(CRYSTAL_COST, "loss");
    } else {
      displayTemporaryMessage(
        `Rubis insuficientes! (${CRYSTAL_COST} necessários)`,
        2000
      );
    }
  }, [
    activeCharacter, // Need character check? Maybe not directly used but good practice
    overallData,
    saveOverallDataState,
    displayFloatingRubyChange,
    displayTemporaryMessage,
  ]);
  // --------------------------------------------------

  // --- <<< EFFECT TO AUTO-UNEQUIP ITEMS ON REQUIREMENT FAILURE >>> ---
  useEffect(() => {
    if (!activeCharacter || !effectiveStats) {
      return; // Need character and calculated stats
    }

    const itemsToUnequip: { slot: EquipmentSlotId; item: EquippableItem }[] =
      [];
    const currentEquipment = activeCharacter.equipment;

    // <<< Calculate totals directly inside the effect for checking >>>
    const currentTotalStrength = calculateTotalStrength(activeCharacter);
    const currentTotalDexterity = calculateTotalDexterity(activeCharacter);
    const currentTotalIntelligence =
      calculateTotalIntelligence(activeCharacter);
    // -----------------------------------------------------------

    // Check each equipped item
    for (const slot in currentEquipment) {
      const item = currentEquipment[slot as EquipmentSlotId];
      if (item && item.requirements) {
        let meetsRequirements = true;
        if (
          item.requirements.level &&
          activeCharacter.level < item.requirements.level
        ) {
          meetsRequirements = false;
        }
        if (
          item.requirements.strength &&
          currentTotalStrength < item.requirements.strength // <<< Check against calculated total
        ) {
          meetsRequirements = false;
        }
        if (
          item.requirements.dexterity &&
          currentTotalDexterity < item.requirements.dexterity // <<< Check against calculated total
        ) {
          meetsRequirements = false;
        }
        if (
          item.requirements.intelligence &&
          currentTotalIntelligence < item.requirements.intelligence // <<< Check against calculated total
        ) {
          meetsRequirements = false;
        }

        if (!meetsRequirements) {
          console.log(
            `[Auto Unequip Check] Item "${item.name}" no longer meets requirements.`
          );
          itemsToUnequip.push({ slot: slot as EquipmentSlotId, item });
        }
      }
    }

    // If there are items to unequip, update the character state
    if (itemsToUnequip.length > 0) {
      console.log(`[Auto Unequip] Unequipping ${itemsToUnequip.length} items.`);
      const newEquipment = { ...currentEquipment };
      const newInventory = [...activeCharacter.inventory];
      const unequippedMessages: string[] = []; // <<< Change let to const

      itemsToUnequip.forEach(({ slot, item }) => {
        newEquipment[slot] = null; // Remove from equipment
        newInventory.push(item); // Add to inventory
        unequippedMessages.push(item.name);
      });

      updateCharacterStore({
        equipment: newEquipment,
        inventory: newInventory,
      });
      setTimeout(() => saveCharacterStore(), 50);

      // Notify the user
      displayTemporaryMessage(
        `Itens desequipados automaticamente: ${unequippedMessages.join(", ")}`,
        3000
      );
    }
  }, [
    activeCharacter?.equipment, // Re-run when equipment changes
    effectiveStats, // Re-run if stats change (which happens after equipment change)
    activeCharacter?.level, // Re-run if level changes
    updateCharacterStore,
    saveCharacterStore,
    displayTemporaryMessage,
    activeCharacter, // Ensure activeCharacter is a dependency
  ]);
  // --- <<< END AUTO-UNEQUIP EFFECT >>> ---

  // --- Loading / Error Checks ---
  if (!activeCharacter || !overallData) {
    // <<< ADD Check for overallData
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        Loading Character or Game Data...
      </div>
    );
  }
  // Keep the check for missing area data if view is areaView
  if (!currentArea && currentView === "areaView") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        Error: Current area data not found.{" "}
        <button onClick={() => handleReturnToMap(false)}>Return to Map</button>
      </div>
    );
  }

  const xpToNextLevel = calculateXPToNextLevel(activeCharacter.level);

  // --- Render JSX ---
  return (
    <div className="p-4 bg-black min-h-screen relative">
      {/* <<< Render Floating Ruby Text >>> */}
      {floatingRubyChange && (
        <div
          key={floatingRubyChange.id}
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[100] 
                       text-2xl font-bold animate-float-up-fade drop-shadow-lg 
                       ${
                         floatingRubyChange.type === "gain"
                           ? "text-green-400"
                           : "text-red-500"
                       }`}
        >
          {floatingRubyChange.type === "gain" ? "+" : "-"}
          {floatingRubyChange.value} Rubis
        </div>
      )}

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
              windCrystals={overallData?.currencies?.windCrystals ?? 0}
            />
          ) : (
            <AreaView
              key={areaViewKey}
              character={activeCharacter}
              area={currentArea}
              effectiveStats={effectiveStats}
              onReturnToMap={handleReturnToMap}
              onTakeDamage={(
                rawDamage,
                type: EnemyDamageType,
                displayCallback
              ) => handlePlayerTakeDamage(rawDamage, type, displayCallback)}
              onEnemyKilled={handleEnemyKilled}
              xpToNextLevel={xpToNextLevel}
              pendingDropCount={itemsToShowInModal.length}
              onOpenDropModalForViewing={handleOpenPendingDropsModal}
              onOpenVendor={handleOpenVendorModal}
              onUseTeleportStone={handleUseTeleportStone}
              windCrystals={overallData?.currencies?.windCrystals ?? 0}
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
            <InventoryDisplay
              onOpenInventory={handleOpenInventory}
              currencies={
                overallData?.currencies ?? defaultOverallData.currencies
              }
            />
            <div className="mt-2">
              <CharacterStats
                xpToNextLevel={xpToNextLevel}
                totalStrength={totalStrength}
                totalDexterity={totalDexterity}
                totalIntelligence={totalIntelligence}
                onUseTeleportStone={handleUseTeleportStone}
                windCrystals={overallData?.currencies?.windCrystals ?? 0}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modals (Use placeholder state/handlers) */}
      <ItemDropModal
        isOpen={isDropModalOpen}
        onClose={handleCloseDropModal}
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
        currencies={overallData?.currencies ?? null}
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

      {/* <<< Render ACTUAL VendorModal >>> */}
      {isVendorModalOpen && activeCharacter && overallData && (
        <VendorModal
          isOpen={isVendorModalOpen}
          onClose={handleCloseVendorModal}
          characterInventory={activeCharacter.inventory}
          playerRubies={overallData.currencies.ruby}
          onSellItems={handleSellItems}
          onBuyPotion={handleBuyPotion}
          onBuyTeleportStone={handleBuyTeleportStone}
          onBuyWindCrystal={handleBuyWindCrystal}
        />
      )}
    </div>
  );
}
