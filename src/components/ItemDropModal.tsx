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
} from "../utils/itemUtils";

interface ItemDropModalProps {
  isOpen: boolean;
  onClose: () => void;
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
  onPickUpItem,
  onDiscardItem,
  onPickUpAll,
  onDiscardAll,
  droppedItems,
  isViewOnly = false, // NEW: Default to false
}) => {
  if (!isOpen || droppedItems.length === 0) return null;

  const handleItemAction = (
    item: EquippableItem,
    action: "pickup" | "discard"
  ) => {
    // Restore switch logic
    switch (action) {
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
