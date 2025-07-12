"use client";

import React, { useState, useRef } from "react";
import { defaultOverallData } from "@/types/gameData";
import { act1Locations } from "@/data/act1Locations";
import WorldMapModals from "./WorldMapModals";
import { useCharacterStore } from "@/stores/characterStore";
import { useInventoryManager } from "@/hooks/useInventoryManager";
import { useMessageBox } from "@/hooks/useMessageBox";
import { useFloatingRubyText } from "@/hooks/useFloatingRubyText";
import { useVendorActions } from "@/hooks/useVendorActions";
import { useStashHandlers } from "@/hooks/useStashHandlers";
import { useWorldMapLoop } from "../hooks/useWorldMapLoop";
import RenderMapView from "./RenderMapView";
import RenderAreaView from "./RenderAreaView";
import { useWorldMapInitialization } from "@/hooks/useWorldMapInitialization";
import { useWorldMapTravel } from "../hooks/useWorldMapTravel";
import { useCalculatedStats } from "@/hooks/useCalculatedStats";
import { v4 as uuidv4 } from "uuid";
import RightSidebar from "./RightSidebar";
import TextBox from "./TextBox";
import useWorldMapUIState from "@/hooks/useWorldMapUIState";
import useDisableContextMenu from "@/hooks/useDisableContextMenu";
import { useWorldMapContext } from "../context/WorldMapContext";
import Modal from "@/components/Modal";
import Button from "@/components/Button";
import { loadCharacters, saveCharacters } from "@/utils/localStorage";

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

  // --- Consume global WorldMap context ---
  const {
    currentArea,
    setCurrentArea,
    currentView,
    setCurrentView,
    isTraveling,
    travelProgress,
    travelTargetAreaId,
    effectiveStatsRef,
    combat,
  } = useWorldMapContext();

  // Local refs for travel timing (not yet global)
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
  // Combat state from context
  const {
    currentEnemy,
    setCurrentEnemy,
    enemiesKilledCount,
    setEnemiesKilledCount,
    enemySpawnCooldownRef,
    areaViewRef,
    isBossSpawning,
    setIsBossSpawning,
    barrierZeroTimestamp,
  } = combat;
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
  const { overallData, saveOverallDataState, isHardcore } = useWorldMapInitialization({
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
    isHardcore,
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
    isHardcore,
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
  } = useWorldMapTravel({
    displayPersistentMessage,
    handleConfirmDiscard,
    itemToDiscard,
    effectiveStats: effectiveStats ?? null,
    updateCharacterStore,
    saveCharacterStore,
    activeCharacter,
    setCurrentEnemy,
    setEnemiesKilledCount,
    enemySpawnCooldownRef,
    pendingDropCount: itemsToShowInModal.length,
    openDropModalForCollection: handleOpenDropModalForCollection,
    travelTimerRef,
    travelStartTimeRef,
    travelTargetIdRef,
  });

  // Estado para modal de fim de jornada hardcore
  const [showHardcoreDeathModal, setShowHardcoreDeathModal] = useState(false);
  // Estado para pausar todos os loops ao morrer hardcore
  const [isHardcoreDeath, setIsHardcoreDeath] = useState(false);

  // Ref para armazenar o último personagem hardcore removido
  const lastHardcoreIdRef = useRef<number | null>(null);

  // Função para ser chamada ao detectar morte hardcore
  const handleHardcoreDeath = () => {
    if (activeCharacter) {
      lastHardcoreIdRef.current = activeCharacter.id;
      // Atualizar personagem para isDead: true
      const chars = loadCharacters(true);
      const idx = chars.findIndex((c) => c.id === activeCharacter.id);
      if (idx !== -1) {
        chars[idx] = { ...chars[idx], isDead: true };
        saveCharacters(chars, true);
      }
      useCharacterStore.getState().setActiveCharacter({ ...activeCharacter, isDead: true });
    }
    setShowHardcoreDeathModal(true);
    setIsHardcoreDeath(true);
  };

  // Exemplo de integração: (isso deve ser chamado pelo loop de combate ao detectar morte hardcore)
  // if (activeCharacter?.isHardcore && morreu) handleHardcoreDeath();

  // --- World Map game loop via context wrapper ---
  useWorldMapLoop({
    activeCharacter,
    handlePlayerHeal,
    updateCharacterStore,
    saveCharacterStore,
    displayPersistentMessage,
    displayTemporaryMessage,
    handleItemDropped,
    clearPendingDrops,
    barrierZeroTimestamp,
    textBoxContent,
    onHardcoreDeath: handleHardcoreDeath,
    isHardcoreDeath,
  });

  // --- Loading / Error Checks ---
  if (showHardcoreDeathModal) {
    return (
      <div className="p-4 bg-black min-h-screen relative">
        <Modal
          isOpen={showHardcoreDeathModal}
          onClose={() => {}}
          title="Sua jornada termina aqui"
          actions={
            <Button onClick={() => {
              setShowHardcoreDeathModal(false);
              window.location.href = "/";
            }}>Menu Principal</Button>
          }
        >
          <div className="text-center text-red-500 font-bold text-lg py-4">
            Seu personagem hardcore morreu e foi removido para sempre.
          </div>
        </Modal>
      </div>
    );
  }
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
        Error: Current area data not found. {" "}
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
              isBossSpawning={isBossSpawning}
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
