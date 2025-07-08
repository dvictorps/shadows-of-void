"use client";

import React, { useState, useRef } from "react";
import {
  MapLocation,
  defaultOverallData,
  act1Locations,
} from "../../types/gameData";
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
import useWorldMapUIState from "../../hooks/useWorldMapUIState";
import useAreaCombatState from "../../hooks/useAreaCombatState";
import useDisableContextMenu from "../../hooks/useDisableContextMenu";

// <<< Define type for floating text state >>>

export default function WorldMapPage() {
  // --- Disable Context Menu & Text Selection ---
  useDisableContextMenu();
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
  const {
    isConfirmDiscardOpen,
    setIsConfirmDiscardOpen,
    itemToDiscard,
    setItemToDiscard,
    isRequirementFailModalOpen,
    setIsRequirementFailModalOpen,
    itemFailedRequirements,
    setItemFailedRequirements,
  } = useWorldMapUIState();
  // <<< ADD State for AreaView key >>>
  const [areaViewKey] = useState<string>(uuidv4());
  // <<< ADD State for barrier zero timestamp >>>
  const [barrierZeroTimestamp, setBarrierZeroTimestamp] = useState<
    number | null
  >(null);
  // Combat related state encapsulated in hook
  const {
    currentEnemy,
    setCurrentEnemy,
    enemiesKilledCount,
    setEnemiesKilledCount,
    gameLoopIntervalRef,
    lastUpdateTimeRef,
    nextPlayerAttackTimeRef,
    nextEnemyAttackTimeRef,
    enemySpawnCooldownRef,
    enemyDeathAnimEndTimeRef,
    areaViewRef,
    isNextAttackMainHand,
    setIsNextAttackMainHand,
    isBossSpawning,
    setIsBossSpawning,
  } = useAreaCombatState();
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
