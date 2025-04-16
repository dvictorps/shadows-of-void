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
  EnemyInstance,
  calculateEnemyStats,
  EnemyType,
} from "../../types/gameData";
import {
  loadCharacters,
  loadOverallData,
  saveOverallData,
} from "../../utils/localStorage";
import CharacterStats from "../../components/CharacterStats";
import MapArea from "../../components/MapArea";
import InventoryDisplay from "../../components/InventoryDisplay";
import AreaView, { AreaViewHandles } from "../../components/AreaView";
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
  calculateSingleWeaponSwingDamage,
} from "../../utils/statUtils";
import { useCharacterStore } from "../../stores/characterStore";
import { useInventoryManager } from "../../hooks/useInventoryManager";
import { useMessageBox } from "../../hooks/useMessageBox";
import VendorModal from "../../components/VendorModal";
import { v4 as uuidv4 } from "uuid";
import { ALL_ITEM_BASES } from "../../data/items";
import { generateDrop } from "../../utils/itemUtils";

console.log("--- world-map/page.tsx MODULE LOADED ---");

// Restore constants and helpers
const BASE_TRAVEL_TIME_MS = 5000;
const MIN_TRAVEL_TIME_MS = 500;
const calculateXPToNextLevel = (level: number): number => {
  return Math.floor(100 * Math.pow(1.15, level - 1));
};

// --- XP Scaling Constants ---
// const XP_REDUCTION_BASE = 0.8; // REMOVE Unused
// const XP_LEVEL_DIFF_THRESHOLD = 6; // REMOVE Unused

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
  // <<< ADD STATE for current enemy and kill count >>>
  const [currentEnemy, setCurrentEnemy] = useState<EnemyInstance | null>(null);
  const [enemiesKilledCount, setEnemiesKilledCount] = useState(0);
  // <<< ADD Refs for game loop timing >>>
  const gameLoopIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateTimeRef = useRef<number>(Date.now());
  const nextPlayerAttackTimeRef = useRef<number>(0);
  const nextEnemyAttackTimeRef = useRef<number>(0);
  const enemySpawnCooldownRef = useRef<number>(0);
  const enemyDeathAnimEndTimeRef = useRef<number>(0);
  const areaViewRef = useRef<AreaViewHandles>(null); // <<< Create ref for AreaView handles
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
    handleCloseRequirementFailModal,
    handleOpenDiscardConfirm,
    handleSwapWeapons,
    handleUnequipItem,
    handleEquipItem,
    handleItemDropped,
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
      // <<< RESET ENEMY KILL COUNT when entering a non-town area >>>
      if (area.id !== "cidade_principal") {
        console.log(
          `[handleEnterAreaView] Resetting enemy kill count for ${area.name}.`
        );
        setEnemiesKilledCount(0);
      } else {
        console.log(
          `[handleEnterAreaView] Entering town, not resetting kill count.`
        );
      }
      // Reset spawn cooldown ref to ensure spawn check happens if needed
      enemySpawnCooldownRef.current = 0;
    },
    [displayPersistentMessage, setEnemiesKilledCount] // <<< ADD setEnemiesKilledCount dependency >>>
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

  // <<< MOVE xpToNextLevel calculation higher (needs activeCharacter) >>>
  // Ensure activeCharacter is loaded before this point, or handle null
  const xpToNextLevel = activeCharacter
    ? calculateXPToNextLevel(activeCharacter.level)
    : 0; // Default to 0 if no character

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
      }, 1000);

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

  // --- Barrier Recharge Effect (6s Delay after Zero) ---
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

  // --- Buy Wind Crystal Handler ---
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

  // <<< ADD SPAWN ENEMY LOGIC HERE (Before Game Loop useEffect) >>>
  const spawnEnemy = useCallback(() => {
    const currentActiveArea = currentArea; // Use state directly
    if (!currentActiveArea || currentActiveArea.id === "cidade_principal")
      return;
    if (currentEnemy) return; // Don't spawn if one exists
    if (enemiesKilledCount >= 30) return; // Don't spawn if area complete

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
      emoji: enemyTypeData.emoji,
      level: enemyLevel,
      maxHealth: stats.health,
      currentHealth: stats.health,
      damage: stats.damage,
      attackSpeed: enemyTypeData.attackSpeed,
      damageType: enemyTypeData.damageType,
      accuracy: stats.accuracy,
      isDying: false, // Initialize isDying
    };

    console.log(
      `[Spawn Enemy] Spawning ${newInstance.name} (Lvl ${newInstance.level})`
    );
    setCurrentEnemy(newInstance);
    const now = Date.now();
    nextEnemyAttackTimeRef.current = now + 1000 / newInstance.attackSpeed;

    // <<< RESET PLAYER ATTACK TIMER for new enemy >>>
    // Get latest character state and calculate stats directly here
    const latestCharState = useCharacterStore.getState().activeCharacter;
    console.log(
      "[Spawn Enemy] latestCharState obtained:",
      latestCharState ? latestCharState.name : "NULL"
    ); // <<< Log if character state exists
    let currentStats: EffectiveStats | null = null;
    if (latestCharState) {
      try {
        console.log("[Spawn Enemy] Attempting calculateEffectiveStats..."); // <<< Log before calculation
        currentStats = calculateEffectiveStats(latestCharState);
        console.log(
          "[Spawn Enemy] calculateEffectiveStats finished. Result:",
          currentStats
        ); // <<< Log calculation result
      } catch (e) {
        console.error(
          "[Spawn Enemy] Error calculating stats for player timer reset:",
          e
        ); // <<< Log any caught error
      }
    }
    console.log(
      "[Spawn Enemy] Trying to reset player attack. Calculated Stats:",
      currentStats
    );
    if (currentStats) {
      // Use the freshly calculated stats
      const playerAttackInterval = 1000 / currentStats.attackSpeed;
      nextPlayerAttackTimeRef.current = now + playerAttackInterval; // Start attacking after interval
      console.log(
        `[Spawn Enemy] Player timer reset SUCCESS. Next attack in ${playerAttackInterval.toFixed(
          0
        )}ms. Ref value: ${nextPlayerAttackTimeRef.current}`
      );
    } else {
      // <<< Explicitly log that the ELSE block is hit >>>
      console.warn(
        "[Spawn Enemy] Player timer reset FAILED. Setting ref to Infinity. Reason: Stats calculation failed or no character."
      );
      nextPlayerAttackTimeRef.current = Infinity; // Prevent attacking if stats missing
    }
  }, [
    currentArea,
    currentEnemy,
    enemiesKilledCount,
    setCurrentEnemy,
    // effectiveStats // <<< REMOVE effectiveStats dependency - we calculate internally now
  ]);

  // <<< ADD ENEMY REMOVAL LOGIC HERE (Before Game Loop useEffect) >>>
  const handleEnemyRemoval = useCallback(
    (killedEnemy: EnemyInstance | null) => {
      if (!killedEnemy) return;
      console.log(
        `[Enemy Removal] TODO: Grant XP/Drops for ${killedEnemy.name}` // Keep log for now
      );

      // --- XP Gain ---
      const char = useCharacterStore.getState().activeCharacter;
      if (char) {
        const baseXP =
          enemyTypes.find((t) => t.id === killedEnemy.typeId)?.baseXP ?? 0;
        // <<< Use const for earnedXP if not modified by level diff logic >>>
        const earnedXP = baseXP;
        // Optional: Implement XP penalty/bonus based on level difference here
        if (earnedXP > 0) {
          let currentTotalXP = char.currentXP + earnedXP;
          let currentLevel = char.level;
          let xpForNext = calculateXPToNextLevel(currentLevel);
          const updates: Partial<Character> = {};

          while (currentTotalXP >= xpForNext && currentLevel < 100) {
            currentTotalXP -= xpForNext;
            currentLevel++;
            console.log(
              `%c[LEVEL UP!] Reached level ${currentLevel}!`,
              "color: yellow; font-weight: bold"
            );
            // TODO: Add attribute/skill points if applicable
            xpForNext = calculateXPToNextLevel(currentLevel); // Calculate for the *new* level
          }
          updates.currentXP = currentTotalXP;
          if (currentLevel !== char.level) {
            updates.level = currentLevel;
            // Maybe trigger a notification?
            displayTemporaryMessage(
              `Parabéns! Você alcançou o nível ${currentLevel}!`,
              3000
            );
          }
          updateCharacterStore(updates);
          setTimeout(() => saveCharacterStore(), 50);
        }
      }
      // --- End XP Gain ---

      // --- Item Drop ---
      let forcedRarity: ItemRarity | undefined = undefined;
      if (killedEnemy.typeId === "ice_dragon_boss") {
        if (Math.random() < 0.5) {
          // 50% chance for Legendary
          forcedRarity = "Lendário";
          console.log(
            "[Enemy Removal] Boss Kill: 50% Legendary roll SUCCEEDED!"
          );
        }
      }
      // Generate drop attempt (could return null)
      const newItem = generateDrop(killedEnemy.level, undefined, forcedRarity);
      if (newItem) {
        console.log(
          `[Enemy Removal] Generated drop: ${newItem.name} (Rarity: ${newItem.rarity})`
        );
        handleItemDropped(newItem); // <<< Use the function from the hook
      } else {
        console.log("[Enemy Removal] No item dropped.");
      }
      // --- End Item Drop ---

      const newKillCount = enemiesKilledCount + 1;
      setEnemiesKilledCount(newKillCount);
      setCurrentEnemy(null);
      enemyDeathAnimEndTimeRef.current = 0;

      const killsNeeded = currentArea?.killsToComplete ?? 30;
      if (newKillCount < killsNeeded) {
        const randomDelay = Math.random() * 1000 + 1000;
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
    },
    [
      enemiesKilledCount,
      setEnemiesKilledCount,
      setCurrentEnemy,
      currentArea,
      handleItemDropped, // <<< ADD handleItemDropped dependency
      updateCharacterStore, // Needed for XP gain
      saveCharacterStore, // Needed for XP gain
      displayTemporaryMessage, // Needed for level up message
    ]
  );

  // --- Auto-Unequip Effect ---
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

  // <<< MAIN GAME LOOP useEffect - Ensure this is at top level >>>
  useEffect(() => {
    // Conditional return MUST be AFTER all hook calls if any were moved here
    if (currentView !== "areaView" || !activeCharacter || !currentArea) {
      if (gameLoopIntervalRef.current) {
        console.log("[Game Loop] Clearing loop due to view/data change.");
        clearInterval(gameLoopIntervalRef.current);
        gameLoopIntervalRef.current = null;
      }
      return; // Early return is okay here, AFTER potential hook calls
    }

    if (gameLoopIntervalRef.current) {
      return; // Avoid starting multiple loops
    }

    console.log("[Game Loop] Starting main game loop interval.");
    lastUpdateTimeRef.current = Date.now();

    gameLoopIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const deltaTime = now - lastUpdateTimeRef.current;
      lastUpdateTimeRef.current = now;
      // timeAccumulatorRef.current += deltaTime; // Not strictly needed for this logic

      const loopChar = useCharacterStore.getState().activeCharacter;
      const loopEnemy = currentEnemy; // Use state directly
      const loopStats = effectiveStats;
      const loopArea = currentArea;
      const loopIsTown = loopArea?.id === "cidade_principal";
      // <<< Use dynamic kills needed >>>
      const killsNeeded = loopArea?.killsToComplete ?? 30;
      const loopAreaComplete = enemiesKilledCount >= killsNeeded;

      if (!loopChar || !loopStats || !loopArea || loopIsTown) {
        return;
      }

      // 1. Enemy Spawning
      // <<< Use dynamic kills needed >>>
      if (!loopEnemy && !loopAreaComplete) {
        // Check loopAreaComplete directly
        enemySpawnCooldownRef.current -= deltaTime;
        if (enemySpawnCooldownRef.current <= 0) {
          console.log(
            `[Game Loop] Spawn cooldown finished (Kills: ${enemiesKilledCount}/${killsNeeded}), attempting spawn.`
          );
          spawnEnemy();
          enemySpawnCooldownRef.current = Infinity;
        }
      }

      // 2. Enemy Death Animation/Removal
      if (loopEnemy?.isDying) {
        if (now >= enemyDeathAnimEndTimeRef.current) {
          console.log("[Game Loop] Death animation ended, removing enemy.");
          handleEnemyRemoval(loopEnemy);
        }
        return; // Skip attacks if enemy is dying
      }

      // --- Combat Logic (Only if enemy exists and is not dying) ---
      if (loopEnemy) {
        // 3. Player Attack
        // <<< Log Check (Re-enabled) >>>
        console.log(
          `[Game Loop] Player Check: now=${now}, nextAttackTime=${
            nextPlayerAttackTimeRef.current
          }, Ready=${now >= nextPlayerAttackTimeRef.current}`
        );
        if (now >= nextPlayerAttackTimeRef.current) {
          const attackInterval = 1000 / loopStats.attackSpeed;
          // <<< Log Timing >>>
          console.log(
            `[Game Loop] PLAYER ATTACK! Interval: ${attackInterval.toFixed(
              0
            )}ms. Setting next attack time.`
          );
          nextPlayerAttackTimeRef.current = now + attackInterval;
          // console.log("[Game Loop] Player Attack Triggered."); // Redundant with log above

          // --- Start Player Attack Logic ---
          const weapon1 = loopChar.equipment.weapon1;
          let minDamage = 0;
          let maxDamage = 0;
          // let isCritical = false; // REMOVE unused variable declaration

          if (weapon1) {
            const weapon1Template = ALL_ITEM_BASES.find(
              (t) => t.baseId === weapon1.baseId
            );
            if (weapon1Template) {
              const swingDamage = calculateSingleWeaponSwingDamage(
                weapon1,
                weapon1Template,
                loopStats // Pass effective stats
              );
              minDamage = swingDamage.totalMin;
              maxDamage = swingDamage.totalMax;
            } else {
              console.error(
                `[Loop Player Attack] Missing template for ${weapon1.baseId}`
              );
              minDamage = loopStats.minDamage; // Fallback to overall stats
              maxDamage = loopStats.maxDamage;
            }
          } else {
            // Unarmed
            minDamage = loopStats.minDamage;
            maxDamage = loopStats.maxDamage;
          }

          let damageDealt = Math.max(
            1,
            Math.round(minDamage + Math.random() * (maxDamage - minDamage))
          );

          // Crit Check
          let isCriticalHit = false;
          if (Math.random() * 100 < loopStats.critChance) {
            isCriticalHit = true;
            damageDealt = Math.round(
              damageDealt * (loopStats.critMultiplier / 100)
            );
            console.log(
              `[Loop Player Attack] CRITICAL HIT! Final: ${damageDealt}`
            );
          }

          // Life Leech
          const lifeLeechPercent = loopStats.lifeLeechPercent;
          let lifeLeeched = 0;
          if (lifeLeechPercent > 0) {
            lifeLeeched = Math.floor(damageDealt * (lifeLeechPercent / 100));
            if (lifeLeeched > 0) {
              console.log(`[Loop Player Attack] Leeching ${lifeLeeched} life.`);
              handlePlayerHeal(lifeLeeched); // Apply heal directly
              areaViewRef.current?.displayLifeLeech(lifeLeeched); // <<< Call via ref
            }
          }

          // Apply Damage to Enemy State & Display
          const healthBefore = loopEnemy.currentHealth;
          const newHealth = Math.max(0, healthBefore - damageDealt);
          console.log(
            `[Loop Player Attack] Dealt ${damageDealt} to ${loopEnemy.name}. Health: ${healthBefore} -> ${newHealth}`
          );
          areaViewRef.current?.displayPlayerDamage(damageDealt, isCriticalHit); // <<< Call via ref, pass isCriticalHit

          // Create updated enemy object
          const updatedEnemyData: Partial<EnemyInstance> = {
            currentHealth: newHealth,
          };

          // Check for Enemy Death
          if (newHealth <= 0) {
            console.log(
              `[Loop Player Attack] Enemy ${loopEnemy.name} defeated.`
            );
            updatedEnemyData.isDying = true;
            updatedEnemyData.currentHealth = 0;
            enemyDeathAnimEndTimeRef.current = now + 500; // Schedule removal after 500ms animation
            // Stop player attacking this dying enemy immediately
            nextPlayerAttackTimeRef.current = Infinity;
            // Also stop enemy from attacking
            nextEnemyAttackTimeRef.current = Infinity;
          }

          // Update enemy state using the functional form of setState
          setCurrentEnemy((prevEnemy) =>
            prevEnemy ? { ...prevEnemy, ...updatedEnemyData } : null
          );
          // --- End Player Attack Logic ---
        }

        // 4. Enemy Attack
        // <<< Log Check (Re-enabled) >>>
        console.log(
          `[Game Loop] Enemy Check: now=${now}, nextAttackTime=${
            nextEnemyAttackTimeRef.current
          }, Ready=${now >= nextEnemyAttackTimeRef.current}`
        );
        if (now >= nextEnemyAttackTimeRef.current) {
          const attackInterval = 1000 / loopEnemy.attackSpeed;
          // <<< Log Timing >>>
          console.log(
            `[Game Loop] ENEMY ATTACK by ${
              loopEnemy.name
            }! Interval: ${attackInterval.toFixed(
              0
            )}ms. Setting next attack time.`
          );
          nextEnemyAttackTimeRef.current = now + attackInterval;
          // console.log( `[Game Loop] Enemy Attack Triggered by ${loopEnemy.name}.`); // Redundant with log above

          // --- Start Enemy Attack Logic ---
          const playerEvasion = loopStats.totalEvasion ?? 0;
          const enemyAccuracy = loopEnemy.accuracy;
          const accuracyTerm = enemyAccuracy * 1.25;
          const evasionTerm = Math.pow(playerEvasion / 5, 0.9);
          let chanceToHit =
            enemyAccuracy + evasionTerm === 0
              ? 1
              : accuracyTerm / (enemyAccuracy + evasionTerm);
          chanceToHit = Math.max(0.05, Math.min(0.95, chanceToHit)) * 100;
          const hitRoll = Math.random() * 100;

          console.log(
            `[Loop Evasion Check] EnemyAcc: ${enemyAccuracy}, PlayerEva: ${playerEvasion}, ChanceToHit: ${chanceToHit.toFixed(
              1
            )}%, Roll: ${hitRoll.toFixed(1)}`
          );

          if (hitRoll <= chanceToHit) {
            // --- HIT ---
            console.log("[Loop Evasion Check] Result: HIT");
            const baseEnemyDamage = Math.max(1, Math.round(loopEnemy.damage));
            const enemyDamageType = loopEnemy.damageType;

            // Call player take damage logic using the helper function
            const takeDamageResult = applyPlayerTakeDamage(
              baseEnemyDamage,
              enemyDamageType,
              loopChar, // Pass current character state from loop
              loopStats // Pass current stats from loop
            );

            // Trigger visual display for damage taken
            if (takeDamageResult.finalDamage > 0) {
              areaViewRef.current?.displayEnemyDamage(
                takeDamageResult.finalDamage,
                enemyDamageType
              ); // <<< Call via ref
            }

            // Apply character updates from take damage result
            if (Object.keys(takeDamageResult.updates).length > 0) {
              updateCharacterStore(takeDamageResult.updates);
              // Use a slightly longer delay for saving after taking damage?
              setTimeout(() => saveCharacterStore(), 100);
            }

            // Handle player death
            if (takeDamageResult.isDead) {
              console.log("[Game Loop] Player died. Resetting view.");
              // Reset view state locally
              setCurrentView("worldMap");
              setCurrentArea(
                act1Locations.find((loc) => loc.id === "cidade_principal") ||
                  null
              );
              displayPersistentMessage(takeDamageResult.deathMessage);
              setIsTraveling(false); // Ensure travel stops
              setTravelProgress(0);
              setTravelTargetAreaId(null);
              if (travelTimerRef.current) clearInterval(travelTimerRef.current);
              travelStartTimeRef.current = null;
              travelTargetIdRef.current = null;
              clearPendingDrops(); // Clear drops on death

              // Stop the game loop since we left AreaView
              if (gameLoopIntervalRef.current) {
                console.log(
                  "[Game Loop] Clearing loop interval due to player death."
                );
                clearInterval(gameLoopIntervalRef.current);
                gameLoopIntervalRef.current = null;
              }
              return; // Exit loop iteration immediately after death
            }

            // --- Thorns Damage (Only apply if player HIT and didn't die) ---
            const thornsDmg = loopStats.thornsDamage ?? 0;
            if (thornsDmg > 0) {
              console.log(
                `[Loop Enemy Attack] Applying ${thornsDmg} Thorns damage to ${loopEnemy.name}.`
              );
              areaViewRef.current?.displayEnemyThornsDamage(thornsDmg); // <<< Call via ref
              setCurrentEnemy((prevEnemy) => {
                // Double-check enemy hasn't changed or started dying since attack start
                if (
                  !prevEnemy ||
                  prevEnemy.isDying ||
                  prevEnemy.instanceId !== loopEnemy.instanceId
                )
                  return prevEnemy;

                const healthBeforeThorns = prevEnemy.currentHealth;
                const newHealthAfterThorns = Math.max(
                  0,
                  healthBeforeThorns - thornsDmg
                );
                console.log(
                  `[Loop Thorns] Enemy ${prevEnemy.name} health: ${healthBeforeThorns} -> ${newHealthAfterThorns}`
                );

                const updatedEnemyData: Partial<EnemyInstance> = {
                  currentHealth: newHealthAfterThorns,
                };

                // Check if thorns killed the enemy
                if (newHealthAfterThorns <= 0) {
                  console.log(
                    `[Loop Thorns] Enemy ${prevEnemy.name} defeated by Thorns!`
                  );
                  updatedEnemyData.isDying = true;
                  updatedEnemyData.currentHealth = 0;
                  enemyDeathAnimEndTimeRef.current = now + 500; // Schedule removal
                  nextPlayerAttackTimeRef.current = Infinity; // Stop player attacks
                  nextEnemyAttackTimeRef.current = Infinity; // Stop this enemy attacking
                }
                return { ...prevEnemy, ...updatedEnemyData };
              });
            }
            // --- End Thorns ---
          } else {
            // --- EVADE (MISS) ---
            console.log("[Loop Evasion Check] Result: EVADE (MISS)");
            areaViewRef.current?.displayMissText(); // <<< Call via ref
          }
          // --- End Enemy Attack Logic ---
        }
      }

      // 5. Other periodic checks (e.g., buff durations - future)
    }, 100);

    // Cleanup function
    return () => {
      if (gameLoopIntervalRef.current) {
        console.log("[Game Loop] Clearing loop interval on cleanup.");
        clearInterval(gameLoopIntervalRef.current);
        gameLoopIntervalRef.current = null;
      }
    };
  }, [
    // ... dependencies (ensure applyPlayerTakeDamage is not needed here as it's defined outside)
    // ... ensure setIsTraveling, setCurrentView, setCurrentArea etc. used in death are added ...
    currentView,
    activeCharacter?.id,
    currentArea?.id,
    effectiveStats,
    currentEnemy,
    enemiesKilledCount,
    spawnEnemy,
    handleEnemyRemoval,
    handlePlayerHeal,
    updateCharacterStore,
    saveCharacterStore,
    displayPersistentMessage,
    displayTemporaryMessage,
    clearPendingDrops,
    setBarrierZeroTimestamp,
    activeCharacter,
    currentArea,
    setCurrentEnemy,
    setEnemiesKilledCount,
    // Add state setters used in player death handling
    setCurrentView,
    setCurrentArea,
    setIsTraveling,
    setTravelProgress,
    setTravelTargetAreaId,
  ]);
  // <<< END MAIN GAME LOOP >>>

  // <<< ADD applyPlayerTakeDamage HELPER FUNCTION >>>
  const applyPlayerTakeDamage = (
    rawDamage: number,
    damageType: EnemyDamageType,
    playerChar: Character, // Pass current character state
    playerStats: EffectiveStats // Pass current stats
  ): {
    updates: Partial<Character>;
    finalDamage: number;
    isDead: boolean;
    deathMessage: string;
  } => {
    const currentBarrier = playerChar.currentBarrier ?? 0;
    let finalDamage = rawDamage;

    console.log(
      `[applyPlayerTakeDamage] Base: ${rawDamage}, Type: ${damageType}, Barrier: ${currentBarrier}`
    );

    // --- Mitigation Logic ---
    if (damageType === "physical") {
      const armor = playerStats?.totalArmor ?? 0;
      const physTakenAsElePercent =
        playerStats?.totalPhysTakenAsElementPercent ?? 0;
      const reducedPhysTakenPercent =
        playerStats?.totalReducedPhysDamageTakenPercent ?? 0;
      let unconvertedDamage = rawDamage;
      let elementalDamageTaken = 0;
      if (physTakenAsElePercent > 0) {
        const amountToConvert = rawDamage * (physTakenAsElePercent / 100);
        unconvertedDamage -= amountToConvert;
        const elements = ["fire", "cold", "lightning"] as const;
        const chosenElement =
          elements[Math.floor(Math.random() * elements.length)];
        let elementResistance = 0;
        switch (chosenElement) {
          case "fire":
            elementResistance = playerStats.finalFireResistance;
            break;
          case "cold":
            elementResistance = playerStats.finalColdResistance;
            break;
          case "lightning":
            elementResistance = playerStats.finalLightningResistance;
            break;
        }
        const mitigationFromResistance = elementResistance / 100;
        elementalDamageTaken = Math.max(
          0,
          Math.round(amountToConvert * (1 - mitigationFromResistance))
        );
      }
      let armorMitigation = 0;
      if (armor > 0 && unconvertedDamage > 0) {
        armorMitigation = armor / (armor + 10 * unconvertedDamage);
      }
      let mitigatedPhysDamage = Math.max(
        0,
        Math.round(unconvertedDamage * (1 - armorMitigation))
      );
      const flatReduction = reducedPhysTakenPercent / 100;
      mitigatedPhysDamage = Math.max(
        0,
        Math.round(mitigatedPhysDamage * (1 - flatReduction))
      );
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
    } else {
      console.warn(
        `Unknown damage type in applyPlayerTakeDamage: ${damageType}`
      );
    }

    console.log(`[applyPlayerTakeDamage] Final Damage: ${finalDamage}`);

    // --- Damage Application to Barrier/Health ---
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

      // Check for barrier break
      if (currentBarrier > 0 && newBarrier === 0) {
        console.log("[applyPlayerTakeDamage] Barrier reached zero!");
        setBarrierZeroTimestamp(Date.now()); // Set timestamp via state setter
      }
    }

    // --- Check for Low Health Warning ---
    const maxHp = playerStats.maxHealth ?? 1;
    if (newHealth > 0 && newHealth / maxHp < 0.3) {
      displayTemporaryMessage(
        <span className="text-red-500 font-bold">
          Vida Baixa! Use uma poção!
        </span>,
        3000
      );
    }

    // --- Check for Death ---
    if (newHealth <= 0) {
      // Use <= 0 for safety
      console.log("[applyPlayerTakeDamage] Player died!");
      isDead = true;
      const xpPenalty = Math.floor(playerChar.currentXP * 0.1);
      const baseHealth = playerChar.baseMaxHealth; // Use baseMaxHealth from Character
      updates.currentHealth = baseHealth; // Reset to base
      updates.currentBarrier = 0;
      updates.currentAreaId = "cidade_principal";
      updates.currentXP = Math.max(0, playerChar.currentXP - xpPenalty);
      deathMessage = `Você morreu! Retornando para a cidade inicial. Perdeu ${xpPenalty} XP.`;
    }

    return { updates, finalDamage, isDead, deathMessage };
  };
  // <<< END applyPlayerTakeDamage HELPER FUNCTION >>>

  // --- Loading / Error Checks ---
  if (!activeCharacter || !overallData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        Loading Character or Game Data...
      </div>
    );
  }
  if (!currentArea && currentView === "areaView") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        Error: Current area data not found.{" "}
        <button onClick={() => handleReturnToMap(false)}>Return to Map</button>
      </div>
    );
  }

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
              ref={areaViewRef} // <<< Pass ref
              key={areaViewKey}
              character={activeCharacter}
              area={currentArea}
              effectiveStats={effectiveStats}
              onReturnToMap={handleReturnToMap}
              xpToNextLevel={xpToNextLevel}
              pendingDropCount={itemsToShowInModal.length}
              onOpenDropModalForViewing={handleOpenPendingDropsModal}
              onOpenVendor={handleOpenVendorModal}
              onUseTeleportStone={handleUseTeleportStone}
              windCrystals={overallData?.currencies?.windCrystals ?? 0}
              currentEnemy={currentEnemy}
              enemiesKilledCount={enemiesKilledCount}
              killsToComplete={currentArea?.killsToComplete ?? 30} // <<< PASS KILLS TO COMPLETE >>>
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
