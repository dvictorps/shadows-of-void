"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  MapLocation,
  EquippableItem,
  defaultOverallData,
  EnemyInstance,
  act1Locations,
} from "../../types/gameData";
import { AreaViewHandles } from "../../components/AreaView";
import WorldMapModals from "./WorldMapModals";
import { EffectiveStats } from "../../utils/statUtils";
import { useCharacterStore } from "../../stores/characterStore";
import { useInventoryManager } from "../../hooks/useInventoryManager";
import { useMessageBox } from "../../hooks/useMessageBox";
import { useFloatingRubyText } from "../../hooks/useFloatingRubyText";
import { useVendorActions } from "../../hooks/useVendorActions";
import { useStashHandlers } from "../../hooks/useStashHandlers";
import { useWorldMapGameLoop } from "../../hooks/useWorldMapGameLoop";
import RenderMapView from "./RenderMapView";
import RenderAreaView from "./RenderAreaView";
import { useWorldMapInitialization } from "../../hooks/useWorldMapInitialization";
import { useTravelHandlers } from "../../hooks/useTravelHandlers";
import { useCalculatedStats } from "../../hooks/useCalculatedStats";
import { v4 as uuidv4 } from "uuid";
import RightSidebar from "./RightSidebar";
import TextBox from "./TextBox";

console.log("--- world-map/page.tsx MODULE LOADED ---");

// <<< Define RenderMapView Props >>>
/*
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
*/

// <<< Define RenderAreaView Props >>>
// ... existing block now commented
// RenderAreaView.displayName = "RenderAreaView";

// Restore constants and helpers
// const BASE_TRAVEL_TIME_MS = 5000; // <<< REMOVE CONSTANT
// const MIN_TRAVEL_TIME_MS = 500; // <<< REMOVE CONSTANT
// const calculateXPToNextLevel = (level: number): number => { // <<< Already imported
//   return Math.floor(100 * Math.pow(1.15, level - 1));
// };

// <<< Define type for floating text state >>>

export default function WorldMapPage() {
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
  // <<< ADD State for AreaView key >>>
  const [areaViewKey] = useState<string>(uuidv4());
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
  // NEW: State to control combat pause for boss animations (restored)
  const [isBossSpawning, setIsBossSpawning] = useState(false);
  // ------------------------------

  // --- Ref for consistently available stats ---
  const effectiveStatsRef = useRef<EffectiveStats | null>(null);

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
    handleOpenDropModalForCollection,
  } = useInventoryManager({
    setIsConfirmDiscardOpen,
    setItemToDiscard,
    setIsRequirementFailModalOpen,
    setItemFailedRequirements,
  });

  // --- Calculated Stats via hook ---
  const {
    totalStrength,
    totalDexterity,
    totalIntelligence,
    effectiveStats,
    xpToNextLevel,
  } = useCalculatedStats(activeCharacter, effectiveStatsRef);

  // --- Overall game data via initialization hook ---
  const { overallData, saveOverallDataState } = useWorldMapInitialization({
    setCurrentArea,
    setCurrentView,
    displayPersistentMessage,
  });

  // --- Use dedicated hooks for vendor modal and floating ruby text ---
  const {
    floatingRubyChange,
    displayFloatingRubyChange,
  } = useFloatingRubyText();

  const {
    isVendorModalOpen,
    handleOpenVendorModal,
    handleCloseVendorModal,
    handleSellItems,
    handleBuyPotion,
    handleBuyTeleportStone,
    handleBuyWindCrystal,
  } = useVendorActions({
    activeCharacter,
    overallData,
    updateCharacterStore,
    saveCharacterStore,
    saveOverallDataState,
    displayTemporaryMessage,
    displayFloatingRubyChange,
  });

  // --- Stash hook ---
  const {
    isStashOpen,
    handleOpenStash,
    handleCloseStash,
    handleMoveItemToStash,
    handleMoveItemToInventory,
    handleMoveSelectedToStash,
    handleMoveSelectedToInventory,
    handleMoveAllToStash,
  } = useStashHandlers({
    activeCharacter,
    overallData,
    updateCharacterStore,
    saveCharacterStore,
    saveOverallDataState,
    displayTemporaryMessage,
  });

  // Stub travel handlers (will be replaced by full logic)
  const {
    handleTravel,
    handleReturnToMap,
    handleReEnterAreaView,
    handleMouseEnterLocation,
    handleMouseLeaveLocation,
    handleBackToCharacters,
    handleUseTeleportStone,
    triggerConfirmDiscard,
    handlePlayerHeal,
  } = useTravelHandlers({
    currentView,
    isTraveling,
    displayPersistentMessage,
    handleConfirmDiscard,
    itemToDiscard,
    effectiveStats: effectiveStats ?? null,
    updateCharacterStore,
    saveCharacterStore,
    setCurrentView,
    activeCharacter,
    setCurrentArea,
    setIsTraveling,
    setTravelProgress,
    setTravelTargetAreaId,
    travelTimerRef,
    travelStartTimeRef,
    travelTargetIdRef,
    setCurrentEnemy,
    setEnemiesKilledCount,
    enemySpawnCooldownRef,
    pendingDropCount: itemsToShowInModal.length,
    openDropModalForCollection: handleOpenDropModalForCollection,
  });

  // --- Use World Map Game Loop Hook ---
  useWorldMapGameLoop({
    currentView,
    activeCharacter,
    currentArea,
    effectiveStatsRef,
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
    isNextAttackMainHand,
    setIsNextAttackMainHand,
    isBossSpawning,
    barrierZeroTimestamp,
    textBoxContent,
  });

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
              setIsBossSpawning={setIsBossSpawning}
            />
          )}
          <TextBox content={textBoxContent} />
        </div>

        {/* Right Sidebar */}
        <RightSidebar
          onOpenInventory={handleOpenInventory}
          currencies={overallData?.currencies ?? defaultOverallData.currencies}
          xpToNextLevel={xpToNextLevel}
          totalStrength={totalStrength}
          totalDexterity={totalDexterity}
          totalIntelligence={totalIntelligence}
          onUseTeleportStone={handleUseTeleportStone}
          windCrystals={overallData?.currencies?.windCrystals ?? 0}
        />
      </div>

      <WorldMapModals
        activeCharacter={activeCharacter}
        overallData={overallData}
        isDropModalOpen={isDropModalOpen}
        itemsToShowInModal={itemsToShowInModal}
        handleCloseDropModal={handleCloseDropModal}
        handlePickUpSelectedItems={handlePickUpSelectedItems}
        handleDiscardSelectedItems={handleDiscardSelectedItems}
        handlePickUpAll={handlePickUpAll}
        handleDiscardAllFromDrop={handleDiscardAllFromDrop}
        isInventoryOpen={isInventoryOpen}
        handleCloseInventory={handleCloseInventory}
        handleEquipItem={handleEquipItem}
        handleOpenDiscardConfirm={handleOpenDiscardConfirm}
        handleSwapWeapons={handleSwapWeapons}
        handleUnequipItem={handleUnequipItem}
        isConfirmDiscardOpen={isConfirmDiscardOpen}
        handleCloseDiscardConfirm={handleCloseDiscardConfirm}
        triggerConfirmDiscard={triggerConfirmDiscard}
        itemToDiscard={itemToDiscard}
        isPendingDropsModalOpen={isPendingDropsModalOpen}
        handleClosePendingDropsModal={handleClosePendingDropsModal}
        isOverCapacityModalOpen={isOverCapacityModalOpen}
        handleCloseOverCapacityModal={handleCloseOverCapacityModal}
        handleConfirmOverCapacityDiscard={handleConfirmOverCapacityDiscard}
        itemsPendingPickup={itemsPendingPickup}
        requiredSpaceToFree={requiredSpaceToFree}
        requirementFailInfo={{
          item: itemFailedRequirements,
          totalStrength,
          totalDexterity,
          totalIntelligence,
        }}
        isRequirementFailModalOpen={isRequirementFailModalOpen}
        handleCloseRequirementFailModal={handleCloseRequirementFailModal}
        isVendorModalOpen={isVendorModalOpen}
        handleCloseVendorModal={handleCloseVendorModal}
        handleSellItems={handleSellItems}
        handleBuyPotion={handleBuyPotion}
        handleBuyTeleportStone={handleBuyTeleportStone}
        handleBuyWindCrystal={handleBuyWindCrystal}
        isStashOpen={isStashOpen}
        handleCloseStash={handleCloseStash}
        handleMoveItemToStash={handleMoveItemToStash}
        handleMoveItemToInventory={handleMoveItemToInventory}
        handleMoveSelectedToStash={handleMoveSelectedToStash}
        handleMoveSelectedToInventory={handleMoveSelectedToInventory}
        handleMoveAllToStash={handleMoveAllToStash}
      />
    </div>
  );
}
