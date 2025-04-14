"use client";

import React from "react";
import Image from "next/image";
import Modal from "./Modal"; // Reuse existing Modal base
import Button from "./Button"; // Reuse existing Button base
import { EquippableItem } from "../types/gameData";
import ItemTooltipContent from "./ItemTooltipContent"; // Reuse tooltip content
import * as Tooltip from "@radix-ui/react-tooltip";
import {
  getRarityBorderClass,
  getRarityInnerGlowClass,
} from "../utils/itemUtils";

interface PendingDropsModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingItems: EquippableItem[];
}

const PendingDropsModal: React.FC<PendingDropsModalProps> = ({
  isOpen,
  onClose,
  pendingItems,
}) => {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Itens Pendentes na Área"
      maxWidthClass="max-w-md md:max-w-4xl" // Consistent width
      actions={null} // Pass null for actions prop
    >
      <div className="my-4 rounded mx-auto scroll-fade">
        {pendingItems.length > 0 ? (
          <div className="grid grid-cols-8 gap-2 overflow-y-auto max-h-[70vh] px-4 pt-4 pb-2 custom-scrollbar bg-black bg-opacity-30">
            {pendingItems.map((item) => {
              const borderColorClass = getRarityBorderClass(item.rarity);
              const innerGlowClass = getRarityInnerGlowClass(item.rarity);

              return (
                <Tooltip.Provider key={item.id} delayDuration={100}>
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      {/* Use Slot-like div for display */}
                      <div
                        className={`relative border ${borderColorClass} ${innerGlowClass} bg-black bg-opacity-60 flex items-center justify-center p-1 w-24 h-24 cursor-default`} // Removed hover effects, cursor-default
                      >
                        <Image
                          src={item.icon}
                          alt={item.name}
                          width={48}
                          height={48}
                          className="object-contain flex-shrink-0 pointer-events-none"
                          unoptimized
                        />
                      </div>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content
                        className="w-max max-w-xs p-2 bg-gray-900 text-white text-xs rounded border border-gray-600 shadow-lg z-[60]" // Ensure high z-index
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
        ) : (
          <p className="text-gray-400 text-center py-4">
            Nenhum item pendente.
          </p>
        )}
      </div>
      {/* Explicit Close Button in Footer */}
      <div className="mt-4 flex justify-center">
        <Button onClick={onClose}>Fechar</Button>
      </div>
    </Modal>
  );
};

export default PendingDropsModal;
