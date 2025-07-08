import React from "react";
import ItemDropModal from "../ItemDropModal";
import InventoryModal from "../InventoryModal";
import ConfirmationModal from "../ConfirmationModal";
import PendingDropsModal from "../PendingDropsModal";
import OverCapacityModal from "../OverCapacityModal";
import Modal from "../Modal";
import Button from "../Button";
import VendorModal from "../VendorModal";
import StashModal from "../StashModal";
import { Character, OverallGameData, EquippableItem, EquipmentSlotId } from "@/types/gameData";

interface RequirementFailInfo {
  item: EquippableItem | null;
  totalStrength: number;
  totalDexterity: number;
  totalIntelligence: number;
}

interface Props {
  /* Character & overall data */
  activeCharacter: Character | null;
  overallData: OverallGameData | null;

  /* Drop modal */
  isDropModalOpen: boolean;
  itemsToShowInModal: EquippableItem[];
  handleCloseDropModal: () => void;
  handlePickUpSelectedItems: (ids: string[]) => void;
  handleDiscardSelectedItems: (ids: string[]) => void;
  handlePickUpAll: () => void;
  handleDiscardAllFromDrop: () => void;

  /* Inventory modal */
  isInventoryOpen: boolean;
  handleCloseInventory: () => void;
  handleEquipItem: (
    itemToEquip: EquippableItem,
    preferredSlot?: "weapon1" | "weapon2" | "ring1" | "ring2"
  ) => void;
  handleOpenDiscardConfirm: (item: EquippableItem) => void;
  handleSwapWeapons: () => void;
  handleUnequipItem: (slotId: EquipmentSlotId) => void;

  /* Confirm discard */
  isConfirmDiscardOpen: boolean;
  handleCloseDiscardConfirm: () => void;
  triggerConfirmDiscard: () => void;
  itemToDiscard: EquippableItem | null;

  /* Pending drops */
  isPendingDropsModalOpen: boolean;
  handleClosePendingDropsModal: () => void;

  /* Over capacity */
  isOverCapacityModalOpen: boolean;
  handleCloseOverCapacityModal: () => void;
  handleConfirmOverCapacityDiscard: (inventoryItemIdsToDiscard: string[]) => void;
  itemsPendingPickup: EquippableItem[];
  requiredSpaceToFree: number;

  /* Requirement fail */
  requirementFailInfo: RequirementFailInfo;
  isRequirementFailModalOpen: boolean;
  handleCloseRequirementFailModal: () => void;

  /* Vendor */
  isVendorModalOpen: boolean;
  handleCloseVendorModal: () => void;
  handleSellItems: (itemsToSell: EquippableItem[]) => void;
  handleBuyPotion: () => void;
  handleBuyTeleportStone: () => void;
  handleBuyWindCrystal: () => void;

  /* Stash */
  isStashOpen: boolean;
  handleCloseStash: () => void;
  handleMoveItemToStash: (id: string) => void;
  handleMoveItemToInventory: (id: string) => void;
  handleMoveSelectedToStash: (ids: string[]) => void;
  handleMoveSelectedToInventory: (ids: string[]) => void;
  handleMoveAllToStash: () => void;
}

export default function WorldMapModals(props: Props) {
  const {
    activeCharacter,
    overallData,
    // Drop
    isDropModalOpen,
    itemsToShowInModal,
    handleCloseDropModal,
    handlePickUpSelectedItems,
    handleDiscardSelectedItems,
    handlePickUpAll,
    handleDiscardAllFromDrop,
    // Inventory
    isInventoryOpen,
    handleCloseInventory,
    handleEquipItem,
    handleOpenDiscardConfirm,
    handleSwapWeapons,
    handleUnequipItem,
    // Confirm discard
    isConfirmDiscardOpen,
    handleCloseDiscardConfirm,
    triggerConfirmDiscard,
    itemToDiscard,
    // Pending drops
    isPendingDropsModalOpen,
    handleClosePendingDropsModal,
    // Over capacity
    isOverCapacityModalOpen,
    handleCloseOverCapacityModal,
    handleConfirmOverCapacityDiscard,
    itemsPendingPickup,
    requiredSpaceToFree,
    // Requirement fail
    requirementFailInfo,
    isRequirementFailModalOpen,
    handleCloseRequirementFailModal,
    // Vendor
    isVendorModalOpen,
    handleCloseVendorModal,
    handleSellItems,
    handleBuyPotion,
    handleBuyTeleportStone,
    handleBuyWindCrystal,
    // Stash
    isStashOpen,
    handleCloseStash,
    handleMoveItemToStash,
    handleMoveItemToInventory,
    handleMoveSelectedToStash,
    handleMoveSelectedToInventory,
    handleMoveAllToStash,
  } = props;

  return (
    <>
      {/* Drop modal */}
      <ItemDropModal
        isOpen={isDropModalOpen}
        onClose={handleCloseDropModal}
        onPickUpSelected={handlePickUpSelectedItems}
        onDiscardSelected={handleDiscardSelectedItems}
        onPickUpAll={handlePickUpAll}
        onDiscardAll={handleDiscardAllFromDrop}
        droppedItems={itemsToShowInModal}
      />

      {/* Inventory */}
      <InventoryModal
        isOpen={isInventoryOpen}
        onClose={handleCloseInventory}
        handleEquipItem={handleEquipItem}
        handleOpenDiscardConfirm={handleOpenDiscardConfirm}
        handleSwapWeapons={handleSwapWeapons}
        handleUnequipItem={handleUnequipItem}
        currencies={overallData?.currencies ?? null}
      />

      {/* Confirm discard */}
      <ConfirmationModal
        isOpen={isConfirmDiscardOpen}
        onClose={handleCloseDiscardConfirm}
        onConfirm={triggerConfirmDiscard}
        title="Descartar Item?"
        message={`Tem certeza que deseja descartar ${
          itemToDiscard?.name ?? "este item"
        } permanentemente?`}
      />

      {/* Pending Drops */}
      <PendingDropsModal
        isOpen={isPendingDropsModalOpen}
        onClose={handleClosePendingDropsModal}
        pendingItems={itemsToShowInModal}
      />

      {/* Over capacity */}
      <OverCapacityModal
        isOpen={isOverCapacityModalOpen}
        onClose={handleCloseOverCapacityModal}
        onConfirm={handleConfirmOverCapacityDiscard}
        itemsPendingPickup={itemsPendingPickup}
        requiredSpaceToFree={requiredSpaceToFree}
        currentInventory={activeCharacter?.inventory || []}
      />

      {/* Requirement fail */}
      <Modal
        isOpen={isRequirementFailModalOpen}
        onClose={handleCloseRequirementFailModal}
        title="Requisitos Não Atendidos"
        actions={<Button onClick={handleCloseRequirementFailModal}>Ok</Button>}
      >
        {requirementFailInfo.item && activeCharacter && (
          <div className="my-4 text-center">
            <p className="mb-2">
              Você não atende aos requisitos para equipar &quot;{requirementFailInfo.item.name}&quot;:
            </p>
            <ul className="list-disc list-inside text-left inline-block text-red-400">
              {requirementFailInfo.item.requirements?.level &&
                activeCharacter.level < requirementFailInfo.item.requirements.level && (
                  <li>
                    Nível {requirementFailInfo.item.requirements.level} (Você tem {
                      activeCharacter.level
                    })
                  </li>
                )}
              {requirementFailInfo.item.requirements?.strength &&
                requirementFailInfo.totalStrength <
                  requirementFailInfo.item.requirements.strength && (
                  <li>
                    Força {requirementFailInfo.item.requirements.strength} (Você tem {
                      requirementFailInfo.totalStrength
                    })
                  </li>
                )}
              {requirementFailInfo.item.requirements?.dexterity &&
                requirementFailInfo.totalDexterity <
                  requirementFailInfo.item.requirements.dexterity && (
                  <li>
                    Destreza {requirementFailInfo.item.requirements.dexterity} (Você tem {
                      requirementFailInfo.totalDexterity
                    })
                  </li>
                )}
              {requirementFailInfo.item.requirements?.intelligence &&
                requirementFailInfo.totalIntelligence <
                  requirementFailInfo.item.requirements.intelligence && (
                  <li>
                    Inteligência {requirementFailInfo.item.requirements.intelligence} (Você tem {
                      requirementFailInfo.totalIntelligence
                    })
                  </li>
                )}
            </ul>
          </div>
        )}
      </Modal>

      {/* Vendor */}
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

      {/* Stash */}
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
    </>
  );
} 