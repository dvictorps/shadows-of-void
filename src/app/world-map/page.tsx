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
  EquippableItem,
  OverallGameData,
  defaultOverallData,
  EnemyInstance,
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
import OverCapacityModal from "../../components/OverCapacityModal";
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
import { useGameLoop } from "../../hooks/useGameLoop";
import { usePassiveRegen } from "../../hooks/usePassiveRegen";
import { useBarrierRecharge } from "../../hooks/useBarrierRecharge";
import { useLowHealthWarning } from "../../hooks/useLowHealthWarning";
import { calculateSellPrice } from "../../utils/itemUtils";
import {
  calculateXPToNextLevel,
  calculateTravelTime,
  BASE_TRAVEL_TIME_MS,
} from "../../utils/gameLogicUtils";
import StashModal from "../../components/StashModal";

console.log("--- world-map/page.tsx MODULE LOADED ---");

// --- Interfaces and Helper Components ---

// <<< Define RenderMapView Props >>>
interface RenderMapViewProps {
  character: Character;
  locations: MapLocation[];
  onHoverLocation: (description: string) => void;
  onLeaveLocation: () => void;
  onBackClick: () => void;
  onAreaClick: (targetAreaId: string) => void;
  onCurrentAreaClick: () => void;
  isTraveling: boolean;
  travelProgress: number;
  travelTargetAreaId: string | null;
  windCrystals: number;
}

// <<< Define RenderMapView Component >>>
const RenderMapView: React.FC<RenderMapViewProps> = ({
  character,
  locations,
  onHoverLocation,
  onLeaveLocation,
  onBackClick,
  onAreaClick,
  onCurrentAreaClick,
  isTraveling,
  travelProgress,
  travelTargetAreaId,
  windCrystals,
}) => {
  return (
    <MapArea
      character={character}
      locations={locations}
      onHoverLocation={onHoverLocation}
      onLeaveLocation={onLeaveLocation}
      onBackClick={onBackClick}
      onAreaClick={onAreaClick}
      onCurrentAreaClick={onCurrentAreaClick}
      isTraveling={isTraveling}
      travelProgress={travelProgress}
      travelTargetAreaId={travelTargetAreaId}
      windCrystals={windCrystals}
    />
  );
};

// <<< Define RenderAreaView Props >>>
interface RenderAreaViewProps {
  areaViewRef: React.RefObject<AreaViewHandles | null>; // <<< Allow null
  areaViewKey: string;
  character: Character;
  area: MapLocation | null;
  effectiveStats: EffectiveStats | null;
  onReturnToMap: (areaWasCompleted: boolean) => void;
  xpToNextLevel: number;
  pendingDropCount: number;
  onOpenDropModalForViewing: () => void;
  onOpenVendor: () => void;
  onOpenStash: () => void;
  onUseTeleportStone: () => void;
  windCrystals: number;
  currentEnemy: EnemyInstance | null;
  enemiesKilledCount: number;
  killsToComplete: number;
}

// <<< Define RenderAreaView Component (Remove React.FC) >>>
const RenderAreaView = React.forwardRef<AreaViewHandles, RenderAreaViewProps>(
  (
    {
      areaViewKey,
      character,
      area,
      effectiveStats,
      onReturnToMap,
      xpToNextLevel,
      pendingDropCount,
      onOpenDropModalForViewing,
      onOpenVendor,
      onOpenStash,
      onUseTeleportStone,
      windCrystals,
      currentEnemy,
      enemiesKilledCount,
      killsToComplete,
    },
    ref // Receive the ref from forwardRef
  ) => {
    return (
      <AreaView
        ref={ref} // Pass the ref down to AreaView
        key={areaViewKey}
        character={character}
        area={area}
        effectiveStats={effectiveStats}
        onReturnToMap={onReturnToMap}
        xpToNextLevel={xpToNextLevel}
        pendingDropCount={pendingDropCount}
        onOpenDropModalForViewing={onOpenDropModalForViewing}
        onOpenVendor={onOpenVendor}
        onOpenStash={onOpenStash}
        onUseTeleportStone={onUseTeleportStone}
        windCrystals={windCrystals}
        currentEnemy={currentEnemy}
        enemiesKilledCount={enemiesKilledCount}
        killsToComplete={killsToComplete}
      />
    );
  }
);
// Ensure display name for DevTools
RenderAreaView.displayName = "RenderAreaView";

// Restore constants and helpers
// const BASE_TRAVEL_TIME_MS = 5000; // <<< REMOVE CONSTANT
// const MIN_TRAVEL_TIME_MS = 500; // <<< REMOVE CONSTANT
// const calculateXPToNextLevel = (level: number): number => { // <<< Already imported
//   return Math.floor(100 * Math.pow(1.15, level - 1));
// };

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
  const areaViewRef = useRef<AreaViewHandles | null>(null); // <<< Create ref for AreaView handles
  // <<< ADD State for tracking next dual wield attack hand >>>
  const [isNextAttackMainHand, setIsNextAttackMainHand] = useState(true);
  // <<< ADD Stash Modal State >>>
  const [isStashOpen, setIsStashOpen] = useState(false);
  // ------------------------------

  // --- Use the Inventory Manager Hook ---
  const {
    isDropModalOpen,
    itemsToShowInModal,
    isPendingDropsModalOpen,
    isInventoryOpen,
    isOverCapacityModalOpen,
    itemsPendingPickup,
    requiredSpaceToFree,
    handleCloseOverCapacityModal,
    handleConfirmOverCapacityDiscard,
    handleOpenDropModalForCollection,
    handleCloseDropModal,
    handleDiscardAllFromDrop,
    clearPendingDrops,
    handleOpenPendingDropsModal,
    handleClosePendingDropsModal,
    handleOpenInventory,
    handleCloseInventory,
    handleOpenDiscardConfirm,
    handleCloseDiscardConfirm,
    handleConfirmDiscard,
    handlePickUpAll,
    handleEquipItem,
    handleItemDropped,
    handleCloseRequirementFailModal,
    handleSwapWeapons,
    handleUnequipItem,
    handlePickUpSelectedItems,
    handleDiscardSelectedItems,
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
      const stats = calculateEffectiveStats(activeCharacter);
      console.log(
        `[WorldMapPage] Calculated Effective Stats - Movement Speed: ${stats?.totalMovementSpeed}%`
      );
      return stats;
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
    [setFloatingRubyChange]
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
      // <<< REMOVE POTION REFILL LOGIC ON LOAD >>>
      // if (char.currentAreaId === "cidade_principal" && char.healthPotions < 3) {
      //   console.log(
      //     "[Initial Load] Character loaded in safe zone with < 3 potions. Refilling to 3."
      //   );
      //   initialUpdates.healthPotions = 3;
      // }
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
  }, [
    router,
    setActiveCharacterStore,
    saveCharacterStore,
    saveOverallDataState,
  ]);

  useEffect(() => {
    // Restore timer cleanup
    return () => {
      if (travelTimerRef.current) {
        clearInterval(travelTimerRef.current);
      }
    };
  }, []);

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
      const initialDelay = Math.random() * 1000 + 1000; // New: 1-2 second initial delay
      enemySpawnCooldownRef.current = initialDelay;
      console.log(
        `[handleEnterAreaView] Set initial enemy spawn delay: ${initialDelay.toFixed(
          0
        )}ms`
      );
    },
    [displayPersistentMessage, setEnemiesKilledCount] // <<< ADD setEnemiesKilledCount dependency >>>
  );

  const handleTravel = useCallback(
    (targetAreaId: string) => {
      if (!activeCharacter) return;

      const destinationArea = act1Locations.find(
        (loc) => loc.id === targetAreaId
      );
      if (!destinationArea) return;

      // <<< Calculate travel duration based on movement speed >>>
      const currentMovementSpeed = effectiveStats?.totalMovementSpeed ?? 0;
      const travelDuration = calculateTravelTime(
        BASE_TRAVEL_TIME_MS,
        currentMovementSpeed
      );
      console.log(`[handleTravel] Calculated Duration: ${travelDuration}ms`);

      // Rest of the travel logic...
      setTravelProgress(0); // Reset progress bar
      setIsTraveling(true);
      if (travelTimerRef.current) clearInterval(travelTimerRef.current);
      travelStartTimeRef.current = Date.now();
      travelTargetIdRef.current = targetAreaId;
      displayPersistentMessage(`Viajando para ${destinationArea.name}...`);
      setCurrentView("worldMap");
      setCurrentArea(null);

      // <<< Check if Wind Crystal should be consumed >>>
      const sourceLocation = act1Locations.find(
        (loc) => loc.id === activeCharacter.currentAreaId
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
        console.error(
          "[Travel] Attempted non-adjacent travel without Wind Crystal!"
        );
        setIsTraveling(false);
        setTravelProgress(0);
        setTravelTargetAreaId(null); // <<< Reset targetAreaId state as well
        displayPersistentMessage(
          "Erro: Cristal do Vento necessário para esta viagem."
        );
        if (travelTimerRef.current) clearInterval(travelTimerRef.current);
        travelTimerRef.current = null;
        return;
      }
      // ----------------------------------------------

      travelTimerRef.current = setInterval(() => {
        const startTime = travelStartTimeRef.current;
        if (!startTime) {
          if (travelTimerRef.current) clearInterval(travelTimerRef.current);
          return;
        }
        const elapsedTime = Date.now() - startTime;
        const progress = Math.min((elapsedTime / travelDuration) * 100, 100); // <<< Use calculated travelDuration
        setTravelProgress(progress);

        if (progress >= 100) {
          if (travelTimerRef.current) clearInterval(travelTimerRef.current!); // Non-null assertion
          travelTimerRef.current = null;
          const finalTargetId = travelTargetIdRef.current;

          // Reset state *before* potentially navigating or changing view
          setIsTraveling(false);
          setTravelProgress(0);
          setTravelTargetAreaId(null);
          travelTargetIdRef.current = null;
          travelStartTimeRef.current = null;

          if (!finalTargetId) {
            console.error(
              "[Travel Complete] Target Area ID was null after reset!"
            );
            setCurrentView("worldMap"); // Fallback to map
            return;
          }
          const finalNewLocation = act1Locations.find(
            (loc) => loc.id === finalTargetId
          );
          if (!finalNewLocation) {
            console.error(
              `[Travel Complete] Could not find location data for ID: ${finalTargetId}`
            );
            setCurrentView("worldMap"); // Fallback to map
            return;
          }

          const updates: Partial<Character> = { currentAreaId: finalTargetId };

          // <<< ADD HEALING LOGIC >>>
          if (finalNewLocation.id === "cidade_principal") {
            const latestChar = useCharacterStore.getState().activeCharacter;
            if (latestChar) {
              const currentStatsOnTravelEnd =
                calculateEffectiveStats(latestChar);
              const actualMaxHealthOnTravelEnd =
                currentStatsOnTravelEnd.maxHealth;
              const actualMaxBarrierOnTravelEnd =
                currentStatsOnTravelEnd.totalBarrier;

              if (latestChar.currentHealth < actualMaxHealthOnTravelEnd) {
                console.log(
                  `[Travel Complete] Arrived at safe zone (${finalNewLocation.name}). Healing ${latestChar.currentHealth} -> ${actualMaxHealthOnTravelEnd}.`
                );
                updates.currentHealth = actualMaxHealthOnTravelEnd;
              }
              updates.currentBarrier = actualMaxBarrierOnTravelEnd;
              // <<< REMOVED Potion refill from here >>>
              // updates.healthPotions = 3;
            }
          }
          // <<< END HEALING LOGIC >>>

          // Update character in store and save
          updateCharacterStore(updates);
          setTimeout(() => saveCharacterStore(), 50);

          handleEnterAreaView(finalNewLocation);
        }
      }, 50);
    },
    [
      activeCharacter,
      overallData,
      effectiveStats,
      saveOverallDataState,
      displayTemporaryMessage,
      displayPersistentMessage,
      updateCharacterStore,
      saveCharacterStore,
      handleEnterAreaView,
      setCurrentView,
      setCurrentArea,
      setIsTraveling,
      setTravelProgress,
      setTravelTargetAreaId,
    ]
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

      // Refill potions to 3 ONLY if current potions are less than 3
      if (charBeforeUpdate.healthPotions < 3) {
        updates.healthPotions = 3;
      }
      
      if (Object.keys(updates).length > 0) {
        console.log("[handleReturnToMap] Applying updates:", updates);
        updateCharacterStore(updates);
        setTimeout(() => saveCharacterStore(), 50);
      }

      // Reset view and enemy states
      setCurrentView("worldMap");
      setCurrentArea(null);
      setCurrentEnemy(null);

      // Add travel state resets
      setIsTraveling(false);
      setTravelProgress(0);
      setTravelTargetAreaId(null);
      if (travelTimerRef.current) {
        clearInterval(travelTimerRef.current);
        travelTimerRef.current = null;
      }
      travelStartTimeRef.current = null;
      travelTargetIdRef.current = null;
      // End travel state resets

      displayPersistentMessage("Mapa - Ato 1");
      handleOpenDropModalForCollection();
    },
    [
      handleOpenDropModalForCollection,
      displayPersistentMessage,
      updateCharacterStore,
      saveCharacterStore,
      setCurrentEnemy,
      setIsTraveling,
      setTravelProgress,
      setTravelTargetAreaId,
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
  const xpToNextLevel = activeCharacter
    ? calculateXPToNextLevel(activeCharacter.level)
    : 0;

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

    // --- Update character state: Full Health & Potions & Barrier ---\n
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
    setCurrentArea,
    setCurrentView,
    setIsTraveling,
    setTravelProgress,
    setTravelTargetAreaId, // Add potentially missing state setters
    setAreaViewKey,
  ]);

  // --- Vendor Modal Handlers (Restore handleOpenVendorModal) ---\n
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
        totalValue += calculateSellPrice(item); // <<< Uses imported function now
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
      // Removed calculateSellPrice from deps as it's imported
    ]
  );

  const handleBuyPotion = useCallback(() => {
    if (!activeCharacter || !overallData) return;

    // <<< ADD Potion Cap Check >>>
    if (activeCharacter.healthPotions >= 20) {
      displayTemporaryMessage("Máximo de poções atingido (20).", 2000);
      return; // Prevent buying more
    }
    // -------------------------

    const POTION_COST = 2;
    if (overallData.currencies.ruby >= POTION_COST) {
      // Limit adding potion if it would exceed cap (should be rare with check above, but safe)
      const newPotionCount = Math.min(
        20,
        (activeCharacter.healthPotions || 0) + 1
      );

      updateCharacterStore({
        healthPotions: newPotionCount, // Use calculated new count
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
    activeCharacter, // <<< Need activeCharacter here
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

  // <<< RESTORE handleBuyWindCrystal callback >>>
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

  // --- Call Custom Hooks ---
  useGameLoop({
    currentView,
    activeCharacter,
    currentArea,
    effectiveStats,
    currentEnemy,
    enemiesKilledCount,
    areaViewRef,
    setCurrentEnemy,
    setEnemiesKilledCount,
    setBarrierZeroTimestamp,
    setCurrentView,
    setCurrentArea,
    setIsTraveling,
    setTravelProgress,
    setTravelTargetAreaId,
    gameLoopIntervalRef,
    lastUpdateTimeRef,
    nextPlayerAttackTimeRef,
    nextEnemyAttackTimeRef,
    enemySpawnCooldownRef,
    enemyDeathAnimEndTimeRef,
    travelTimerRef,
    travelStartTimeRef,
    travelTargetIdRef,
    handlePlayerHeal,
    updateCharacterStore,
    saveCharacterStore,
    displayPersistentMessage,
    displayTemporaryMessage,
    handleItemDropped,
    clearPendingDrops,
    // <<< Pass dual wield state down >>>
    isNextAttackMainHand,
    setIsNextAttackMainHand,
  });
  usePassiveRegen({
    activeCharacter,
    effectiveStats,
    handlePlayerHeal,
  });
  useBarrierRecharge({
    barrierZeroTimestamp,
    setBarrierZeroTimestamp,
    updateCharacterStore,
    saveCharacterStore,
  });
  useLowHealthWarning({
    activeCharacter,
    effectiveStats,
    textBoxContent,
    currentView,
    currentArea,
    displayPersistentMessage,
  });

  // --- Stash Item Movement Handlers ---
  const STASH_SLOTS = 60; // Define constants locally
  const INVENTORY_SLOTS = 60;

  const handleMoveItemToStash = useCallback(
    (itemId: string) => {
      if (!activeCharacter || !overallData) return;

      const currentStash = overallData.stash || [];
      if (currentStash.length >= STASH_SLOTS) {
        displayTemporaryMessage("Baú cheio!", 1500);
        return;
      }

      const currentInventory = activeCharacter.inventory || [];
      const itemIndex = currentInventory.findIndex(
        (item) => item.id === itemId
      );

      if (itemIndex === -1) {
        console.error(
          "Item não encontrado no inventário para mover para o baú:",
          itemId
        );
        return;
      }

      const itemToMove = currentInventory[itemIndex];

      const newInventory = [
        ...currentInventory.slice(0, itemIndex),
        ...currentInventory.slice(itemIndex + 1),
      ];
      updateCharacterStore({ inventory: newInventory });
      setTimeout(() => saveCharacterStore(), 50);

      const newStash = [...currentStash, itemToMove];
      saveOverallDataState({ ...overallData, stash: newStash });

      console.log(`Movido ${itemToMove.name} do inventário para o baú.`);
    },
    [
      activeCharacter,
      overallData,
      updateCharacterStore,
      saveCharacterStore,
      saveOverallDataState,
      displayTemporaryMessage,
    ]
  );

  const handleMoveItemToInventory = useCallback(
    (itemId: string) => {
      if (!activeCharacter || !overallData) return;

      const currentInventory = activeCharacter.inventory || [];
      if (currentInventory.length >= INVENTORY_SLOTS) {
        displayTemporaryMessage("Inventário cheio!", 1500);
        return;
      }

      const currentStash = overallData.stash || [];
      const itemIndex = currentStash.findIndex((item) => item.id === itemId);

      if (itemIndex === -1) {
        console.error(
          "Item não encontrado no baú para mover para o inventário:",
          itemId
        );
        return;
      }

      const itemToMove = currentStash[itemIndex];

      const newStash = [
        ...currentStash.slice(0, itemIndex),
        ...currentStash.slice(itemIndex + 1),
      ];
      saveOverallDataState({ ...overallData, stash: newStash });

      const newInventory = [...currentInventory, itemToMove];
      updateCharacterStore({ inventory: newInventory });
      setTimeout(() => saveCharacterStore(), 50);

      console.log(`Movido ${itemToMove.name} do baú para o inventário.`);
    },
    [
      activeCharacter,
      overallData,
      updateCharacterStore,
      saveCharacterStore,
      saveOverallDataState,
      displayTemporaryMessage,
    ]
  );
  // --- END Stash Item Movement Handlers ---

  // --- <<< NEW: Stash MULTI-Item Movement Handlers >>> ---
  const handleMoveSelectedToStash = useCallback(
    (itemIds: string[]) => {
      if (!activeCharacter || !overallData || itemIds.length === 0) return;

      const currentStash = overallData.stash || [];
      const itemsToMove =
        activeCharacter.inventory?.filter((item) =>
          itemIds.includes(item.id)
        ) || [];

      if (itemsToMove.length !== itemIds.length) {
        console.warn(
          "Discrepância ao mover selecionados para o baú. Alguns IDs não encontrados no inventário."
        );
        // Continue with the items found
      }
      if (itemsToMove.length === 0) return; // Nothing found to move

      const spaceNeeded = itemsToMove.length;
      const availableStashSpace = STASH_SLOTS - currentStash.length;

      if (spaceNeeded > availableStashSpace) {
        displayTemporaryMessage(
          `Baú cheio! Precisa de ${spaceNeeded} espaços, ${availableStashSpace} disponíveis.`,
          2000
        );
        return;
      }

      // Filter player inventory
      const newPlayerInventory =
        activeCharacter.inventory?.filter(
          (item) => !itemIds.includes(item.id)
        ) || [];

      // Add to stash
      const newStash = [...currentStash, ...itemsToMove];

      // Update state
      updateCharacterStore({ inventory: newPlayerInventory });
      saveOverallDataState({ ...overallData, stash: newStash });
      setTimeout(() => saveCharacterStore(), 50);

      console.log(
        `Movidos ${itemsToMove.length} itens selecionados do inventário para o baú.`
      );
    },
    [
      activeCharacter,
      overallData,
      updateCharacterStore,
      saveCharacterStore,
      saveOverallDataState,
      displayTemporaryMessage,
    ]
  );

  const handleMoveSelectedToInventory = useCallback(
    (itemIds: string[]) => {
      if (!activeCharacter || !overallData || itemIds.length === 0) return;

      const currentInventory = activeCharacter.inventory || [];
      const itemsToMove =
        overallData.stash?.filter((item) => itemIds.includes(item.id)) || [];

      if (itemsToMove.length !== itemIds.length) {
        console.warn(
          "Discrepância ao mover selecionados para o inventário. Alguns IDs não encontrados no baú."
        );
      }
      if (itemsToMove.length === 0) return;

      const spaceNeeded = itemsToMove.length;
      const availableInventorySpace = INVENTORY_SLOTS - currentInventory.length;

      if (spaceNeeded > availableInventorySpace) {
        displayTemporaryMessage(
          `Inventário cheio! Precisa de ${spaceNeeded} espaços, ${availableInventorySpace} disponíveis.`,
          2000
        );
        return;
      }

      // Filter stash
      const newStash =
        overallData.stash?.filter((item) => !itemIds.includes(item.id)) || [];

      // Add to player inventory
      const newPlayerInventory = [...currentInventory, ...itemsToMove];

      // Update state
      saveOverallDataState({ ...overallData, stash: newStash });
      updateCharacterStore({ inventory: newPlayerInventory });
      setTimeout(() => saveCharacterStore(), 50);

      console.log(
        `Movidos ${itemsToMove.length} itens selecionados do baú para o inventário.`
      );
    },
    [
      activeCharacter,
      overallData,
      updateCharacterStore,
      saveCharacterStore,
      saveOverallDataState,
      displayTemporaryMessage,
    ]
  );
  // --- <<< END: Stash MULTI-Item Movement Handlers >>> ---

  // --- <<< NEW: Stash Store All Handler >>> ---
  const handleMoveAllToStash = useCallback(() => {
    if (!activeCharacter || !overallData) return;

    const playerInventory = activeCharacter.inventory || [];
    if (playerInventory.length === 0) {
      displayTemporaryMessage("Inventário já está vazio.", 1500);
      return; // Nothing to move
    }

    const currentStash = overallData.stash || [];
    const availableStashSpace = STASH_SLOTS - currentStash.length;

    if (playerInventory.length > availableStashSpace) {
      displayTemporaryMessage(
        `Baú cheio! Precisa de ${playerInventory.length} espaços, ${availableStashSpace} disponíveis.`,
        2000
      );
      return; // Not enough space for ALL items
    }

    // Enough space, proceed with moving all items
    const itemsToMove = [...playerInventory]; // Copy all items
    const newStash = [...currentStash, ...itemsToMove];
    const newPlayerInventory: EquippableItem[] = []; // Empty player inventory

    // Update state
    updateCharacterStore({ inventory: newPlayerInventory });
    saveOverallDataState({ ...overallData, stash: newStash });
    setTimeout(() => saveCharacterStore(), 50);

    displayTemporaryMessage(
      `Movidos ${itemsToMove.length} itens para o baú.`,
      1500
    );
    console.log(
      `Movidos todos os ${itemsToMove.length} itens do inventário para o baú.`
    );
  }, [
    activeCharacter,
    overallData,
    updateCharacterStore,
    saveCharacterStore,
    saveOverallDataState,
    displayTemporaryMessage,
  ]);
  // --- <<< END: Stash Store All Handler >>> ---

  // --- <<< MOVE Stash Handlers here >>> ---
  const handleOpenStash = useCallback(() => {
    if (activeCharacter?.currentAreaId === "cidade_principal") {
      setIsStashOpen(true);
    } else {
      displayTemporaryMessage("O baú só está disponível na cidade.", 2000);
    }
  }, [activeCharacter?.currentAreaId, displayTemporaryMessage]);

  const handleCloseStash = useCallback(() => {
    setIsStashOpen(false);
  }, []);
  // -------------------------------------

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
            <RenderMapView
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
            <RenderAreaView
              ref={areaViewRef}
              areaViewRef={areaViewRef}
              areaViewKey={areaViewKey}
              character={activeCharacter}
              area={currentArea}
              effectiveStats={effectiveStats}
              onReturnToMap={handleReturnToMap}
              xpToNextLevel={xpToNextLevel}
              pendingDropCount={itemsToShowInModal.length}
              onOpenDropModalForViewing={handleOpenPendingDropsModal}
              onOpenVendor={handleOpenVendorModal}
              onOpenStash={handleOpenStash}
              onUseTeleportStone={handleUseTeleportStone}
              windCrystals={overallData?.currencies?.windCrystals ?? 0}
              currentEnemy={currentEnemy}
              enemiesKilledCount={enemiesKilledCount}
              killsToComplete={currentArea?.killsToComplete ?? 30}
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
        onPickUpSelected={handlePickUpSelectedItems}
        onDiscardSelected={handleDiscardSelectedItems}
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
      {/* <<< Add OverCapacityModal Rendering >>> */}
      <OverCapacityModal
        isOpen={isOverCapacityModalOpen}
        onClose={handleCloseOverCapacityModal}
        onConfirm={handleConfirmOverCapacityDiscard}
        itemsPendingPickup={itemsPendingPickup}
        requiredSpaceToFree={requiredSpaceToFree}
        currentInventory={activeCharacter?.inventory || []} // Pass current inventory
      />
      {/* ------------------------------------ */}

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

      {/* <<< Import and Render StashModal >>> */}
      {isStashOpen && (
        <StashModal
          isOpen={isStashOpen}
          onClose={handleCloseStash}
          playerInventory={activeCharacter?.inventory || []}
          stashInventory={overallData?.stash || []}
          onMoveItemToStash={handleMoveItemToStash}
          onMoveItemToInventory={handleMoveItemToInventory}
          onMoveSelectedToStash={handleMoveSelectedToStash}
          onMoveSelectedToInventory={handleMoveSelectedToInventory}
          onMoveAllToStash={handleMoveAllToStash}
        />
      )}
    </div>
  );
}
