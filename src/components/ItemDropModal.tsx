"use client";

import React from "react";
import Image from "next/image";
import Modal from "./Modal"; // Assuming Modal component exists
import Button from "./Button"; // Assuming Button component exists
import { FaArrowCircleUp, FaPlusCircle } from "react-icons/fa"; // Re-import the icons
import { EquippableItem } from "../types/gameData";
import ItemTooltipContent from "./ItemTooltipContent"; // Import the new component
import * as Tooltip from "@radix-ui/react-tooltip"; // Import Radix Tooltip

interface ItemDropModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEquip: (item: EquippableItem) => void;
  onPickUpItem: (item: EquippableItem) => void;
  onPickUpAll: () => void;
  droppedItems: EquippableItem[];
}

const ItemDropModal: React.FC<ItemDropModalProps> = ({
  isOpen,
  onClose,
  onEquip,
  onPickUpItem,
  onPickUpAll,
  droppedItems,
}) => {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Itens Encontrados!"
      actions={
        <div className="flex justify-center gap-4 w-full">
          <Button onClick={onPickUpAll}>Pegar Tudo</Button>
          <Button onClick={onClose}>Fechar</Button>
        </div>
      }
    >
      <div className="my-4 flex flex-col items-center gap-4 min-h-[20vh] w-full max-w-xl mx-auto">
        {droppedItems.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {droppedItems.map((item) => {
              // Rarity class logic remains here as it styles the item container
              let rarityBorderClass = "border-gray-500"; // Default Branco
              if (item.rarity === "Mágico") {
                rarityBorderClass = "border-blue-500 ring-2 ring-blue-500";
              } else if (item.rarity === "Raro") {
                rarityBorderClass = "border-yellow-400 ring-2 ring-yellow-400";
              } else if (item.rarity === "Lendário") {
                rarityBorderClass = "border-red-600 ring-2 ring-red-500";
              }

              return (
                <div key={item.id} className="flex flex-col items-center">
                  {/* Item Display with Group Hover for Tooltip */}
                  <div
                    className={`border p-1 flex flex-col items-center aspect-square bg-black bg-opacity-60 hover:bg-opacity-80 transition-all duration-150 ${rarityBorderClass}`}
                  >
                    <Tooltip.Provider delayDuration={100}>
                      <Tooltip.Root>
                        <Tooltip.Trigger asChild>
                          {/* Image becomes the trigger */}
                          <Image
                            src={item.icon}
                            alt={item.name}
                            width={56}
                            height={56}
                            className="object-contain flex-shrink-0 cursor-default" // Added cursor
                            unoptimized
                          />
                        </Tooltip.Trigger>
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
                  </div>
                  {/* Action Buttons: Equip and Pick Up */}
                  <div className="flex gap-1 mt-1">
                    {/* Equip Button */}
                    <div className="relative group/equip">
                      <Button
                        onClick={() => onEquip(item)}
                        className="p-1 text-sm"
                        aria-label="Equipar Item"
                      >
                        <FaArrowCircleUp />
                      </Button>
                      <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover/equip:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 border border-gray-600">
                        Equipar
                      </span>
                    </div>
                    {/* Pick Up Button */}
                    <div className="relative group/pickup">
                      <Button
                        onClick={() => onPickUpItem(item)}
                        className="p-1 text-sm"
                        aria-label="Pegar Item"
                      >
                        <FaPlusCircle />
                      </Button>
                      <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover/pickup:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 border border-gray-600">
                        Pegar
                      </span>
                    </div>
                  </div>
                </div>
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
