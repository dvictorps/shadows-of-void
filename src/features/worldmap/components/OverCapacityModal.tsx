"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Modal from "@/components/Modal";
import Button from "@/components/Button";
import { EquippableItem } from "@/types/gameData";
import ItemTooltipContent from "@/components/ItemTooltipContent";
import * as Tooltip from "@radix-ui/react-tooltip";
import {
  getRarityBorderClass,
  getRarityInnerGlowClass,
} from "@/utils/itemUtils";

interface OverCapacityModalProps {
  isOpen: boolean;
  onClose: () => void; // Cancels the pickup attempt
  onConfirm: (inventoryItemIdsToDiscard: string[]) => void; // Confirms discarding selected inventory items to pick up pending ones
  itemsPendingPickup: EquippableItem[]; // Items player wants to pick up
  requiredSpaceToFree: number; // Number of inventory slots needed
  currentInventory: EquippableItem[]; // Player's current inventory to select from
}

const OverCapacityModal: React.FC<OverCapacityModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  itemsPendingPickup,
  requiredSpaceToFree,
  currentInventory,
}) => {
  const [selectedDiscardIds, setSelectedDiscardIds] = useState<Set<string>>(
    new Set()
  );

  // Reset selection when modal opens/closes or required space changes
  useEffect(() => {
    if (isOpen) {
      setSelectedDiscardIds(new Set());
    }
  }, [isOpen]);

  const handleItemClick = (itemId: string) => {
    setSelectedDiscardIds((prev) => {
      const newSelection = new Set(prev);
      if (newSelection.has(itemId)) {
        newSelection.delete(itemId);
      } else {
        newSelection.add(itemId);
      }
      return newSelection;
    });
  };

  const handleConfirmClick = () => {
    if (selectedDiscardIds.size >= requiredSpaceToFree) {
      onConfirm(Array.from(selectedDiscardIds));
      // Don't clear state here, let the parent handle it via onClose/state update
    }
  };

  const handleCancelClick = () => {
    onClose(); // Just close, player gives up picking up these items
  };

  if (!isOpen) return null;

  const canConfirm = selectedDiscardIds.size >= requiredSpaceToFree;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancelClick} // Clicking overlay cancels
      title="Inventário Cheio!"
      maxWidthClass="max-w-4xl" // Allow wider modal for inventory display
      actions={
        <div className="flex flex-wrap justify-center gap-4 w-full">
          <Button
            onClick={handleConfirmClick}
            disabled={!canConfirm}
            className={`text-white ${
              canConfirm
                ? "bg-green-700 hover:bg-green-800"
                : "bg-gray-500 cursor-not-allowed"
            }`}
          >
            Descartar ({selectedDiscardIds.size}/{requiredSpaceToFree}) e Pegar
            Itens
          </Button>
          <Button
            onClick={handleCancelClick}
            className="bg-red-700 hover:bg-red-800"
          >
            Cancelar Coleta
          </Button>
        </div>
      }
    >
      {/* Section to show items player WANTS to pick up */}
      <div className="mb-4 border-b border-gray-600 pb-3">
        <h4 className="text-sm font-semibold text-yellow-400 mb-2">
          Itens para pegar ({itemsPendingPickup.length}):
        </h4>
        <div className="flex flex-wrap justify-center gap-1 max-h-24 overflow-y-auto px-2 custom-scrollbar-thin">
          {itemsPendingPickup.map((item) => (
            <Tooltip.Provider key={`pending-${item.id}`} delayDuration={100}>
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <div
                    className={`border ${getRarityBorderClass(
                      item.rarity
                    )} ${getRarityInnerGlowClass(
                      item.rarity
                    )} bg-black bg-opacity-40 p-0.5 w-12 h-12`}
                  >
                    <Image
                      src={item.icon || "/sprites/default_icon.png"}
                      alt={item.name}
                      width={32}
                      height={32}
                      className="object-contain pointer-events-none filter brightness-110 mx-auto"
                      unoptimized
                    />
                  </div>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content
                    className="w-max max-w-xs p-2 bg-gray-900 text-white text-xs rounded border border-gray-600 shadow-lg z-[60]" // Ensure z-index is high enough
                    sideOffset={5}
                    align="center"
                  >
                    <ItemTooltipContent item={item} />
                    <Tooltip.Arrow className="fill-gray-900" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </Tooltip.Provider>
          ))}
        </div>
      </div>

      {/* Section to show current inventory for selection */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-300 mb-2">
          Selecione itens do inventário para descartar (Necessário:{" "}
          {requiredSpaceToFree}):
        </h4>
        <div className="max-h-[45vh] overflow-y-auto custom-scrollbar border border-gray-700 rounded bg-black bg-opacity-20 p-2">
          <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
            {currentInventory.map((item) => {
              const borderColorClass = getRarityBorderClass(item.rarity);
              const innerGlowClass = getRarityInnerGlowClass(item.rarity);
              const isSelected = selectedDiscardIds.has(item.id);

              return (
                <Tooltip.Provider key={`inv-${item.id}`} delayDuration={100}>
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <div
                        onClick={() => handleItemClick(item.id)}
                        className={`border ${
                          isSelected
                            ? "border-white border-2 ring-2 ring-red-500 ring-offset-1 ring-offset-black" // Highlight selected for discard
                            : borderColorClass
                        } ${innerGlowClass} bg-black bg-opacity-60 hover:bg-opacity-80 transition-colors duration-150 flex items-center justify-center p-1 cursor-pointer w-16 h-16 md:w-20 md:h-20`} // Slightly smaller items
                      >
                        <Image
                          src={item.icon || "/sprites/default_icon.png"}
                          alt={item.name}
                          width={40} // Adjusted size
                          height={40} // Adjusted size
                          className="object-contain flex-shrink-0 pointer-events-none filter brightness-110"
                          unoptimized
                        />
                      </div>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content
                        className="w-max max-w-xs p-2 bg-gray-900 text-white text-xs rounded border border-gray-600 shadow-lg z-[60]" // Ensure z-index is high enough
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
            {currentInventory.length === 0 && (
              <p className="text-gray-500 italic col-span-full text-center py-4">
                Inventário vazio.
              </p>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default OverCapacityModal;
