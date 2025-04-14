"use client";

import React from "react";
import Image from "next/image";
import Modal from "./Modal"; // Assuming Modal component exists
import Button from "./Button"; // Assuming Button component exists
import { EquippableItem } from "../types/gameData";
import ItemTooltipContent from "./ItemTooltipContent"; // Import the new component
import * as Tooltip from "@radix-ui/react-tooltip"; // Import Radix Tooltip
import * as Popover from "@radix-ui/react-popover"; // Import Popover
import {
  getRarityBorderClass,
  getRarityInnerGlowClass,
  ONE_HANDED_WEAPON_TYPES, // Import Set
  OFF_HAND_TYPES, // Import OFF_HAND_TYPES
} from "../utils/itemUtils";
import { useCharacterStore } from "../stores/characterStore"; // Import store

interface ItemDropModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEquip: (
    item: EquippableItem,
    preferredSlot?: "weapon1" | "weapon2"
  ) => void; // Add optional param
  onPickUpItem: (item: EquippableItem) => void;
  onDiscardItem: (item: EquippableItem) => void;
  onPickUpAll: () => void;
  onDiscardAll: () => void;
  droppedItems: EquippableItem[];
  isViewOnly?: boolean; // NEW: Optional prop for view-only mode
}

const ItemDropModal: React.FC<ItemDropModalProps> = ({
  isOpen,
  onClose,
  onEquip,
  onPickUpItem,
  onDiscardItem,
  onPickUpAll,
  onDiscardAll,
  droppedItems,
  isViewOnly = false, // NEW: Default to false
}) => {
  const character = useCharacterStore((state) => state.activeCharacter);

  if (!isOpen || droppedItems.length === 0) return null;

  // Get current character equipment to check dual wield status
  const equipment = character?.equipment ?? {};
  const weapon1 = equipment.weapon1;
  const weapon2 = equipment.weapon2;
  const isWieldingOneHander =
    weapon1 && ONE_HANDED_WEAPON_TYPES.has(weapon1.itemType);
  const isDualWieldingOneHanders =
    isWieldingOneHander &&
    weapon2 &&
    ONE_HANDED_WEAPON_TYPES.has(weapon2.itemType);
  const isWieldingOneHanderAndShield =
    isWieldingOneHander && weapon2 && OFF_HAND_TYPES.has(weapon2.itemType);

  // --- Action handler for Popover ---
  const handleItemAction = (
    item: EquippableItem,
    action: "equip1" | "equip2" | "equipDefault" | "pickup" | "discard"
  ) => {
    switch (action) {
      case "equip1":
        onEquip(item, "weapon1");
        break;
      case "equip2":
        onEquip(item, "weapon2");
        break;
      case "equipDefault":
        onEquip(item); // No preference
        break;
      case "pickup":
        onPickUpItem(item);
        break;
      case "discard":
        onDiscardItem(item);
        break;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isViewOnly ? "Itens Pendentes" : "Itens Encontrados!"} // NEW: Conditional title
      maxWidthClass="max-w-md md:max-w-4xl" // Apply responsive width
      actions={
        <div className="flex flex-wrap justify-center gap-2 w-full">
          {/* Add Pick Up All and Discard All buttons */}
          <Button
            onClick={onPickUpAll}
            className="bg-green-600 hover:bg-green-700"
          >
            Pegar Tudo
          </Button>
          <Button
            onClick={onDiscardAll}
            className="bg-red-600 hover:bg-red-700"
          >
            Descartar Tudo
          </Button>
          <Button onClick={onClose}>Fechar</Button>
        </div>
      }
    >
      <div className="my-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 px-4">
          {droppedItems.map((item) => {
            const borderColorClass = getRarityBorderClass(item.rarity);
            const innerGlowClass = getRarityInnerGlowClass(item.rarity);
            const isClickedItemOneHanded = ONE_HANDED_WEAPON_TYPES.has(
              item.itemType
            );
            const showWeaponOptions =
              isClickedItemOneHanded &&
              (isDualWieldingOneHanders || isWieldingOneHanderAndShield);

            return (
              <Popover.Root key={item.id}>
                <Tooltip.Provider delayDuration={100}>
                  <Tooltip.Root>
                    <Popover.Trigger asChild>
                      <Tooltip.Trigger asChild>
                        <div
                          className={`border ${borderColorClass} ${innerGlowClass} bg-black bg-opacity-60 hover:bg-opacity-80 transition-colors duration-150 flex items-center justify-center p-1 cursor-pointer w-24 h-24`} // Slot style from InventoryModal
                        >
                          <Image
                            src={item.icon || "/sprites/default_icon.png"}
                            alt={item.name}
                            width={48} // Match size used in InventoryModal trigger
                            height={48}
                            className="object-contain flex-shrink-0 pointer-events-none filter brightness-110"
                            unoptimized
                          />
                        </div>
                      </Tooltip.Trigger>
                    </Popover.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content
                        className="w-max max-w-xs p-2 bg-gray-900 text-white text-xs rounded border border-gray-600 shadow-lg z-50"
                        sideOffset={5}
                        align="center"
                      >
                        <ItemTooltipContent item={item} />
                        <Tooltip.Arrow className="fill-gray-900" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </Tooltip.Provider>

                {/* Keep Portal, conditionally render content *inside* Popover.Content */}
                <Popover.Portal>
                  <Popover.Content
                    className="flex flex-col gap-1 bg-gray-800 border border-gray-600 rounded p-2 shadow-xl z-[70] w-auto"
                    sideOffset={5}
                    align="center"
                  >
                    {/* --- Conditional Actions --- */}
                    {showWeaponOptions ? (
                      <>
                        <Popover.Close asChild>
                          <Button
                            className="text-xs px-2 py-1 cursor-pointer hover:bg-gray-700 w-full justify-center"
                            onClick={() => handleItemAction(item, "equip1")}
                          >
                            Equipar Mão Principal
                          </Button>
                        </Popover.Close>
                        <Popover.Close asChild>
                          <Button
                            className="text-xs px-2 py-1 cursor-pointer hover:bg-gray-700 w-full justify-center"
                            onClick={() => handleItemAction(item, "equip2")}
                          >
                            Equipar Mão Secundária
                          </Button>
                        </Popover.Close>
                      </>
                    ) : (
                      <Popover.Close asChild>
                        <Button
                          className="text-xs px-2 py-1 cursor-pointer hover:bg-gray-700 w-full justify-center"
                          onClick={() => handleItemAction(item, "equipDefault")}
                        >
                          Equipar
                        </Button>
                      </Popover.Close>
                    )}
                    {/* ------------------------- */}
                    <Popover.Close asChild>
                      <Button
                        className="text-xs px-2 py-1 cursor-pointer hover:bg-gray-700 w-full justify-center"
                        onClick={() => handleItemAction(item, "pickup")}
                      >
                        Pegar
                      </Button>
                    </Popover.Close>
                    <Popover.Close asChild>
                      <Button
                        className="text-xs px-2 py-1 text-red-400 cursor-pointer hover:bg-red-900 hover:text-red-200 w-full justify-center"
                        onClick={() => handleItemAction(item, "discard")}
                      >
                        Descartar
                      </Button>
                    </Popover.Close>
                    <Popover.Arrow className="fill-gray-800" />
                  </Popover.Content>
                </Popover.Portal>
              </Popover.Root>
            );
          })}
        </div>
      </div>
    </Modal>
  );
};

export default ItemDropModal;
