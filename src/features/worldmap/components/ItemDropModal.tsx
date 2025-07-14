"use client";

import React, { useState } from "react";
import Image from "next/image";
import Modal from "@/components/Modal";
import Button from "@/components/Button";
import { EquippableItem } from "@/types/gameData";
import ItemTooltipContent from "@/components/ItemTooltipContent";
import * as Tooltip from "@radix-ui/react-tooltip"; // Import Radix Tooltip
import {
  getRarityBorderClass,
  getRarityInnerGlowClass,
} from "@/utils/itemDisplay";

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
          {/* Row 1: Pick Sel, Discard Sel */}
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

          {/* Row 2: Discard All, Pick All, Close Buttons */}
          <div className="flex flex-wrap justify-center gap-2 w-full">
            <Button
              onClick={onDiscardAll}
              className="text-xs px-3 py-1 border border-red-700 text-red-400 hover:bg-red-900 disabled:opacity-50"
            >
              Descartar Tudo
            </Button>
            <Button
              onClick={onPickUpAll}
              className="text-xs px-3 py-1 border border-green-700 text-green-400 hover:bg-green-900 disabled:opacity-50"
            >
              Pegar Tudo
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
      <div className="flex-grow overflow-y-auto p-2 min-h-[24rem] bg-black bg-opacity-30 rounded-lg">
        <div className="grid grid-cols-8 gap-1.5">
          {droppedItems.map((item) => {
            const isSelected = selectedDropItems.has(item.id);
            const rarityBorder = getRarityBorderClass(item.rarity);
            const rarityGlow = getRarityInnerGlowClass(item.rarity);

            return (
              <Tooltip.Provider key={item.id} delayDuration={200}>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <div
                      onClick={() => handleItemClick(item.id)}
                      className={`relative w-full aspect-square cursor-pointer border-2 transition-all duration-150 ${
                        isSelected
                          ? "border-white scale-105"
                          : rarityBorder
                      } rounded-md bg-black bg-opacity-50 flex items-center justify-center group`}
                    >
                      <Image
                        src={item.icon}
                        alt={item.name}
                        width={48}
                        height={48}
                        className="object-contain transition-transform duration-150 group-hover:scale-110"
                        unoptimized
                      />
                      <div
                        className={`absolute inset-0 rounded-md pointer-events-none ${rarityGlow} ${
                          isSelected ? "shadow-white/50" : ""
                        }`}
                        style={{
                          boxShadow: isSelected
                            ? "0 0 12px 3px var(--tw-shadow-color)"
                            : undefined,
                        }}
                      />
                    </div>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content
                      className="w-max max-w-xs p-2 bg-gray-900 text-white text-xs rounded border border-gray-600 shadow-lg z-50 pointer-events-none"
                      sideOffset={5}
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
