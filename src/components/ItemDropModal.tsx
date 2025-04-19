"use client";

import React, { useState } from "react";
import Image from "next/image";
import Modal from "./Modal"; // Assuming Modal component exists
import Button from "./Button"; // Assuming Button component exists
import { EquippableItem } from "../types/gameData";
import ItemTooltipContent from "./ItemTooltipContent"; // Import the new component
import * as Tooltip from "@radix-ui/react-tooltip"; // Import Radix Tooltip
import {
  getRarityBorderClass,
  getRarityInnerGlowClass,
} from "../utils/itemUtils";

interface ItemDropModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPickUpSelected: (itemIds: string[]) => void;
  onDiscardSelected: (itemIds: string[]) => void;
  onPickUpAll: () => void;
  onDiscardAll: () => void;
  droppedItems: EquippableItem[];
}

const ItemDropModal: React.FC<ItemDropModalProps> = ({
  isOpen,
  onClose,
  onPickUpSelected,
  onDiscardSelected,
  onPickUpAll,
  onDiscardAll,
  droppedItems,
}) => {
  const [selectedDropItems, setSelectedDropItems] = useState<Set<string>>(
    new Set()
  );

  const handleItemClick = (itemId: string) => {
    setSelectedDropItems((prev) => {
      const newSelection = new Set(prev);
      if (newSelection.has(itemId)) {
        newSelection.delete(itemId);
      } else {
        newSelection.add(itemId);
      }
      return newSelection;
    });
  };

  const handleCloseAndClear = () => {
    setSelectedDropItems(new Set());
    onClose();
  };

  if (!isOpen || droppedItems.length === 0) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCloseAndClear}
      title="Itens Encontrados!"
      maxWidthClass="max-w-md md:max-w-4xl" // Apply responsive width
      actions={
        <div className="flex flex-col items-center gap-3 w-full">
          {/* Row 1: Selected Buttons (Centered group) */}
          <div className="flex flex-wrap justify-center gap-2 w-full">
            <Button
              onClick={() => {
                onPickUpSelected(Array.from(selectedDropItems));
              }}
              className="text-xs px-3 py-1 border border-gray-500 text-gray-300 hover:bg-gray-700 disabled:opacity-50"
              disabled={selectedDropItems.size === 0}
            >
              Pegar Selecionados ({selectedDropItems.size})
            </Button>
            <Button
              onClick={() => {
                onDiscardSelected(Array.from(selectedDropItems));
              }}
              className="text-xs px-3 py-1 border border-gray-500 text-gray-300 hover:bg-gray-700 disabled:opacity-50"
              disabled={selectedDropItems.size === 0}
            >
              Descartar Selecionados ({selectedDropItems.size})
            </Button>
          </div>

          {/* Row 2: Pegar Tudo (Centered) */}
          <div className="w-full flex justify-center">
            <Button
              onClick={onPickUpAll}
              className="text-xs px-3 py-1 border border-green-700 text-green-400 hover:bg-green-900 disabled:opacity-50"
            >
              Pegar Tudo
            </Button>
          </div>

          {/* Row 3: Discard All / Close (Centered group) */}
          <div className="flex flex-wrap justify-center gap-2 w-full">
            <Button
              onClick={onDiscardAll}
              className="text-xs px-3 py-1 border border-red-700 text-red-400 hover:bg-red-900 disabled:opacity-50"
            >
              Descartar Tudo
            </Button>
            <Button
              onClick={handleCloseAndClear}
              className="text-xs px-3 py-1 border border-gray-500 text-gray-300 hover:bg-gray-700"
            >
              Fechar
            </Button>
          </div>
        </div>
      }
    >
      <div className="my-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 px-4">
          {droppedItems.map((item) => {
            const borderColorClass = getRarityBorderClass(item.rarity);
            const innerGlowClass = getRarityInnerGlowClass(item.rarity);
            const isSelected = selectedDropItems.has(item.id);

            return (
              <Tooltip.Provider key={item.id} delayDuration={100}>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <div
                      onClick={() => handleItemClick(item.id)}
                      className={`border ${
                        isSelected ? "border-white border-2" : borderColorClass
                      } ${innerGlowClass} bg-black bg-opacity-60 hover:bg-opacity-80 transition-colors duration-150 flex items-center justify-center p-1 cursor-pointer w-24 h-24`}
                    >
                      <Image
                        src={item.icon || "/sprites/default_icon.png"}
                        alt={item.name}
                        width={48}
                        height={48}
                        className="object-contain flex-shrink-0 pointer-events-none filter brightness-110"
                        unoptimized
                      />
                    </div>
                  </Tooltip.Trigger>
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
            );
          })}
        </div>
      </div>
    </Modal>
  );
};

export default ItemDropModal;
