"use client";

import React from "react";
import Image from "next/image";
import Modal from "./Modal";
import Button from "./Button";
import { EquippableItem } from "../types/gameData";
import ItemTooltipContent from "./ItemTooltipContent";
import * as Tooltip from "@radix-ui/react-tooltip";
import * as Popover from "@radix-ui/react-popover";
import { useCharacterStore } from "../stores/characterStore";
import {
  getRarityBorderClass,
  getRarityInnerGlowClass,
} from "../utils/itemUtils";

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEquipItem: (item: EquippableItem) => void;
  onOpenDiscardConfirm: (item: EquippableItem) => void;
}

const TOTAL_SLOTS = 60;
const COLUMNS = 8;

const InventoryModal: React.FC<InventoryModalProps> = ({
  isOpen,
  onClose,
  onEquipItem,
  onOpenDiscardConfirm,
}) => {
  const character = useCharacterStore((state) => state.activeCharacter);

  if (!isOpen || !character) return null;

  const { inventory = [] } = character;

  const handleEquipClick = (item: EquippableItem) => {
    onEquipItem(item);
  };

  const handleDiscardClick = (item: EquippableItem) => {
    onOpenDiscardConfirm(item);
  };

  const displayItems = inventory.slice(0, TOTAL_SLOTS);
  const emptySlotsCount = TOTAL_SLOTS - displayItems.length;

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
      <div className="my-4 rounded mx-auto scroll-fade bg-black">
        <div
          className={`grid grid-cols-${COLUMNS} gap-2 overflow-y-auto max-h-[70vh] px-4 pt-4 pb-2 custom-scrollbar`}
        >
          {displayItems.map((item) => {
            const borderColorClass = getRarityBorderClass(item.rarity);
            const innerGlowClass = getRarityInnerGlowClass(item.rarity);
            const iconUrl = `${item.icon || "default_icon.png"}`;

            return (
              <Popover.Root key={item.id}>
                <Tooltip.Provider delayDuration={100}>
                  <Tooltip.Root>
                    <Popover.Trigger asChild>
                      <Tooltip.Trigger asChild>
                        <div
                          className={`border ${borderColorClass} ${innerGlowClass} bg-transparent hover:bg-black hover:bg-opacity-30 transition-colors duration-150 flex items-center justify-center p-1 cursor-pointer w-24 h-24 aspect-square rounded`}
                        >
                          <Image
                            src={iconUrl}
                            alt={item.name}
                            width={48}
                            height={48}
                            className="object-contain flex-shrink-0 pointer-events-none filter brightness-110"
                            unoptimized
                          />
                        </div>
                      </Tooltip.Trigger>
                    </Popover.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content
                        className="w-max max-w-xs p-2 bg-gray-900 text-white text-xs rounded border border-gray-600 shadow-lg z-50 pointer-events-none"
                        sideOffset={5}
                        align="center"
                      >
                        <ItemTooltipContent item={item} />
                        <Tooltip.Arrow className="fill-gray-900" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </Tooltip.Provider>
                <Popover.Portal>
                  <Popover.Content
                    className="flex flex-col gap-1 bg-gray-800 border border-gray-600 rounded p-2 shadow-xl z-[70] w-auto"
                    sideOffset={5}
                    align="center"
                  >
                    <Popover.Close asChild>
                      <Button
                        className="text-xs px-2 py-1 cursor-pointer hover:bg-gray-700 w-full justify-center"
                        onClick={() => handleEquipClick(item)}
                      >
                        Equipar
                      </Button>
                    </Popover.Close>
                    <Popover.Close asChild>
                      <Button
                        className="text-xs px-2 py-1 text-red-400 cursor-pointer hover:bg-red-900 hover:text-red-200 w-full justify-center"
                        onClick={() => handleDiscardClick(item)}
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
          {Array.from({ length: emptySlotsCount }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className="border border-gray-700 bg-transparent flex items-center justify-center w-24 h-24 aspect-square rounded"
            ></div>
          ))}
        </div>
      </div>
    </Modal>
  );
};

export default InventoryModal;
