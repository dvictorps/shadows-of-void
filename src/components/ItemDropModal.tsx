"use client";

import React from "react";
import Image from "next/image";
import Modal from "./Modal"; // Assuming Modal component exists
import Button from "./Button"; // Assuming Button component exists
import { EquippableItem } from "../types/gameData";
import ItemTooltipContent from "./ItemTooltipContent"; // Import the new component
import * as Tooltip from "@radix-ui/react-tooltip"; // Import Radix Tooltip
import * as Popover from "@radix-ui/react-popover"; // Import Popover

interface ItemDropModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEquip: (item: EquippableItem) => void;
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
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isViewOnly ? "Itens Pendentes" : "Itens Encontrados!"} // NEW: Conditional title
      maxWidthClass="max-w-md md:max-w-4xl" // Apply responsive width
      actions={
        // NEW: Conditionally render action buttons
        !isViewOnly && (
          <div className="flex justify-center gap-4 w-full">
            <Button onClick={onPickUpAll}>Pegar Tudo</Button>
            <Button onClick={onDiscardAll}>Descartar Tudo</Button>
          </div>
        )
      }
    >
      <div className="my-4 rounded mx-auto scroll-fade">
        {droppedItems.length > 0 ? (
          <div className="grid grid-cols-8 gap-2 overflow-y-auto max-h-[70vh] px-4 pt-4 pb-2 custom-scrollbar bg-black bg-opacity-30">
            {droppedItems.map((item) => {
              let rarityBorderClass = "border-gray-500"; // Default Normal
              if (item.rarity === "Mágico") {
                rarityBorderClass = "border-blue-500 ring-1 ring-blue-500"; // Match InventoryModal style
              } else if (item.rarity === "Raro") {
                rarityBorderClass = "border-yellow-400 ring-1 ring-yellow-400";
              } else if (item.rarity === "Lendário") {
                rarityBorderClass = "border-red-600 ring-1 ring-red-500";
              }

              return (
                <Popover.Root key={item.id}>
                  <Tooltip.Provider delayDuration={100}>
                    <Tooltip.Root>
                      <Popover.Trigger asChild>
                        <Tooltip.Trigger asChild>
                          <div
                            className={`border ${rarityBorderClass} bg-black bg-opacity-60 hover:bg-opacity-80 transition-colors duration-150 flex items-center justify-center p-1 cursor-pointer w-24 h-24`} // Slot style from InventoryModal
                          >
                            <Image
                              src={item.icon}
                              alt={item.name}
                              width={48} // Match size used in InventoryModal trigger
                              height={48}
                              className="object-contain flex-shrink-0 pointer-events-none"
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
                      className="flex flex-col gap-1 bg-gray-800 border border-gray-600 rounded p-2 shadow-xl z-[60]"
                      sideOffset={5}
                      align="center"
                    >
                      {isViewOnly ? (
                        // Display message when view-only
                        <p className="text-xs text-gray-400 px-2 py-1">
                          Ações indisponíveis.
                        </p>
                      ) : (
                        // Display buttons when not view-only
                        <>
                          <Popover.Close asChild>
                            <Button
                              className="text-xs px-2 py-1"
                              onClick={() => onEquip(item)}
                            >
                              Equipar
                            </Button>
                          </Popover.Close>
                          <Popover.Close asChild>
                            <Button
                              className="text-xs px-2 py-1"
                              onClick={() => onPickUpItem(item)}
                            >
                              Pegar
                            </Button>
                          </Popover.Close>
                          <Popover.Close asChild>
                            <Button
                              className="text-xs px-2 py-1 text-red-400 hover:bg-red-900"
                              onClick={() => onDiscardItem(item)}
                            >
                              Descartar
                            </Button>
                          </Popover.Close>
                        </>
                      )}
                      <Popover.Arrow className="fill-gray-800" />
                    </Popover.Content>
                  </Popover.Portal>
                </Popover.Root>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-400">Nenhum item encontrado.</p>
        )}
      </div>
    </Modal>
  );
};

export default ItemDropModal;
