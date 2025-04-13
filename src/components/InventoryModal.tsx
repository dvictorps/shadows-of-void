"use client";

import React from "react";
import Image from "next/image";
import Modal from "./Modal"; // Assuming Modal component exists
import Button from "./Button"; // Assuming Button component exists
import { EquippableItem } from "../types/gameData";
import ItemTooltipContent from "./ItemTooltipContent";
import * as Tooltip from "@radix-ui/react-tooltip";
import * as Popover from "@radix-ui/react-popover";

// Simple Slot placeholder for empty inventory spaces
// TODO: Potentially move Slot to a shared file if used elsewhere without border/glow logic
const Slot = ({ className = "" }: { className?: string }) => (
  <div
    className={`
      border border-gray-600 
      bg-black bg-opacity-40
      flex items-center justify-center
      text-[10px] text-gray-500
      ${className}
    `}
  />
);

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: EquippableItem[]; // Items in the backpack
  onEquipItem: (item: EquippableItem) => void; // Placeholder for future use
  onOpenDiscardConfirm: (item: EquippableItem) => void; // Placeholder for future use
}

const TOTAL_SLOTS = 60;

const InventoryModal: React.FC<InventoryModalProps> = ({
  isOpen,
  onClose,
  inventory,
  onEquipItem, // Not used yet
  onOpenDiscardConfirm, // Not used yet
}) => {
  if (!isOpen) return null;

  const emptySlotsCount = Math.max(0, TOTAL_SLOTS - inventory.length);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Inventário"
      maxWidthClass="max-w-md md:max-w-4xl"
      actions={
        <div className="flex justify-center w-full">
          <Button onClick={onClose}>Fechar</Button>
        </div>
      }
    >
      <div className="my-4 rounded mx-auto scroll-fade">
        <div className="grid grid-cols-8 gap-2 overflow-y-auto max-h-[70vh] px-4 pt-4 pb-2 custom-scrollbar bg-black bg-opacity-30">
          {/* Render Inventory Items */}
          {inventory.map((item) => {
            // TODO: Add click handler later for equip/discard menu
            // Determine border/ring class based on rarity (similar to ItemDropModal)
            let rarityBorderClass = "border-gray-500";
            if (item.rarity === "Mágico") {
              rarityBorderClass = "border-blue-500 ring-1 ring-blue-500"; // Adjusted ring size
            } else if (item.rarity === "Raro") {
              rarityBorderClass = "border-yellow-400 ring-1 ring-yellow-400";
            } else if (item.rarity === "Lendário") {
              rarityBorderClass = "border-red-600 ring-1 ring-red-500";
            }

            return (
              <Popover.Root key={item.id}>
                {/* Tooltip remains attached to the item display div */}
                <Tooltip.Provider delayDuration={100}>
                  <Tooltip.Root>
                    {/* Popover Trigger wraps the Tooltip Trigger and its content */}
                    <Popover.Trigger asChild>
                      <Tooltip.Trigger asChild>
                        <div
                          className={`border ${rarityBorderClass} bg-black bg-opacity-60 hover:bg-opacity-80 transition-colors duration-150 flex items-center justify-center p-1 cursor-pointer w-24 h-24`} // Applied helm size, removed aspect-square
                        >
                          <Image
                            src={item.icon}
                            alt={item.name}
                            width={48}
                            height={48}
                            className="object-contain flex-shrink-0 pointer-events-none" // Remove pointer events from image
                            unoptimized
                          />
                        </div>
                      </Tooltip.Trigger>
                    </Popover.Trigger>
                    {/* Tooltip Content (still shown on hover) */}
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

                {/* Popover Content (shown on click) */}
                <Popover.Portal>
                  <Popover.Content
                    className="flex flex-col gap-1 bg-gray-800 border border-gray-600 rounded p-2 shadow-xl z-[60]" // Higher z-index than tooltip
                    sideOffset={5}
                    align="center"
                  >
                    <Popover.Close asChild>
                      <Button
                        className="text-xs px-2 py-1"
                        onClick={() => onEquipItem(item)}
                      >
                        Equipar
                      </Button>
                    </Popover.Close>
                    <Popover.Close asChild>
                      <Button
                        className="text-xs px-2 py-1 text-red-400 hover:bg-red-900"
                        onClick={() => onOpenDiscardConfirm(item)}
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
          {/* Render Empty Slots */}
          {Array.from({ length: emptySlotsCount }).map((_, index) => (
            <Slot
              key={`empty-${index}`}
              className="w-24 h-24" // Apply size to empty slots as well
            />
          ))}
        </div>
      </div>
    </Modal>
  );
};

export default InventoryModal;
